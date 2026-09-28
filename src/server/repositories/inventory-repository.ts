import { InventoryMovementType, Prisma, StockReservationStatus } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

type Tx = Prisma.TransactionClient;

/**
 * Stok hareket defteri — `Inventory` üzerinde doğrudan sessiz `UPDATE`
 * yapılmaz (bkz. görev gereksinimi + `docs/DATABASE_DESIGN.md` §3), her
 * değişiklik bir `InventoryMovement` satırıyla izlenir. `quantityDelta`
 * anlamı türe göre değişir:
 *  - PURCHASE_IN / RETURN / ADJUSTMENT / DAMAGE → `Inventory.quantityAvailable` deltası
 *  - RESERVATION / RESERVATION_RELEASE → `Inventory.quantityReserved` deltası
 *  - SALE → hem `quantityAvailable` HEM `quantityReserved` aynı miktarda azalır
 *    (rezervasyon gerçek satışa dönüşür — stok fiilen düşer, rezerve tutulan
 *    miktar serbest bırakılır); `quantityDelta` bu ortak miktarı taşır.
 */

async function getOrCreateInventory(tx: Tx, variantId: string) {
  const existing = await tx.inventory.findUnique({ where: { variantId } });
  if (existing) {
    return existing;
  }
  // Ürün oluşturulurken `Inventory` satırı bilinçli olarak yaratılmaz (bkz.
  // `product-repository.ts::createProduct`) — buradaki ilk gerçek stok
  // hareketi satırı lazımı olarak (0'dan başlayarak) oluşturur.
  return tx.inventory.create({ data: { variantId, quantityAvailable: 0, quantityReserved: 0 } });
}

export interface AdjustInventoryInput {
  variantId: string;
  /** PURCHASE_IN/RETURN/ADJUSTMENT(+) için pozitif, DAMAGE/ADJUSTMENT(-) için negatif. */
  delta: number;
  type: Extract<
    InventoryMovementType,
    "PURCHASE_IN" | "RETURN" | "ADJUSTMENT" | "DAMAGE"
  >;
  actorId: string;
  reason?: string;
}

export type AdjustInventoryResult =
  | { ok: true; quantityAvailable: number }
  | { ok: false; reason: "WOULD_GO_NEGATIVE" };

/**
 * Admin'in elle stok girişi/düzeltmesi/hasar kaydı — `quantityAvailable`'ı
 * ATOMİK `increment` ile değiştirir (bkz. dosyanın diğer tüm yazma
 * fonksiyonları ile AYNI desen) — önce oku-sonra-yaz YAPILMAZ, aksi halde
 * eşzamanlı iki admin düzeltmesi birbirini ezebilirdi (lost update). Negatif
 * sonuca ASLA izin verilmez: DB'deki CHECK constraint (bkz. migration) son
 * hakemdir — ihlal edilirse burada yakalanıp anlamlı bir ret olarak döner.
 */
export async function adjustInventory(input: AdjustInventoryInput): Promise<AdjustInventoryResult> {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      await getOrCreateInventory(tx, input.variantId);
      const inventory = await tx.inventory.update({
        where: { variantId: input.variantId },
        data: { quantityAvailable: { increment: input.delta } },
      });
      await tx.inventoryMovement.create({
        data: {
          variantId: input.variantId,
          actorId: input.actorId,
          type: input.type,
          quantityDelta: input.delta,
          reason: input.reason ?? null,
        },
      });
      return inventory;
    });
    return { ok: true, quantityAvailable: updated.quantityAvailable };
  } catch (error) {
    // Bu transaction'daki TEK olası iş-kuralı reddi negatif stok CHECK
    // constraint'idir (girdi zaten Zod ile doğrulanmış, `variantId` var olan
    // bir varyanta ait) — negatif bir delta'da beklenmeyen her hata da
    // güvenli tarafta kalınarak aynı şekilde ele alınır.
    if (input.delta < 0) {
      return { ok: false, reason: "WOULD_GO_NEGATIVE" };
    }
    throw error;
  }
}

/**
 * Süresi geçmiş (`expiresAt < now`) ACTIVE rezervasyonları serbest bırakır —
 * ayrı bir cron/queue YOK, bu fonksiyon her stok kontrolünün başında (bkz.
 * `order-repository.ts::createDraftOrder`) o anki varyant kümesine dar
 * kapsamlı (lazy) olarak çağrılır. Çağıranın transaction'ına (`tx`) katılır.
 */
export async function releaseExpiredReservations(tx: Tx, variantIds: string[], now: Date): Promise<void> {
  if (variantIds.length === 0) {
    return;
  }
  const expired = await tx.stockReservation.findMany({
    where: { variantId: { in: variantIds }, status: StockReservationStatus.ACTIVE, expiresAt: { lt: now } },
    select: { id: true, variantId: true, quantity: true },
  });
  if (expired.length === 0) {
    return;
  }

  for (const reservation of expired) {
    await tx.stockReservation.update({
      where: { id: reservation.id },
      data: { status: StockReservationStatus.EXPIRED, releasedAt: now },
    });
    await tx.inventory.update({
      where: { variantId: reservation.variantId },
      data: { quantityReserved: { decrement: reservation.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        variantId: reservation.variantId,
        type: InventoryMovementType.RESERVATION_RELEASE,
        quantityDelta: -reservation.quantity,
        reason: "Rezervasyon süresi doldu (otomatik serbest bırakma)",
      },
    });
  }
}

/** Bir sipariş kalemi için ACTIVE rezervasyon oluşturur — sipariş oluşturmayla AYNI transaction içinde çağrılmalıdır. */
export async function createReservation(
  tx: Tx,
  input: { orderId: string; variantId: string; quantity: number; expiresAt: Date },
): Promise<void> {
  await getOrCreateInventory(tx, input.variantId);
  await tx.stockReservation.create({
    data: {
      orderId: input.orderId,
      variantId: input.variantId,
      quantity: input.quantity,
      status: StockReservationStatus.ACTIVE,
      expiresAt: input.expiresAt,
    },
  });
  await tx.inventory.update({
    where: { variantId: input.variantId },
    data: { quantityReserved: { increment: input.quantity } },
  });
  await tx.inventoryMovement.create({
    data: {
      variantId: input.variantId,
      orderId: input.orderId,
      type: InventoryMovementType.RESERVATION,
      quantityDelta: input.quantity,
    },
  });
}

/**
 * Bir siparişin TÜM ACTIVE rezervasyonlarını serbest bırakır — sipariş iptal/
 * ödeme başarısız/timeout olduğunda çağrılır. `tx` verilmezse kendi
 * transaction'ını açar (tekil, dış bir transaction'a bağlı olmayan çağrılar
 * için, ör. `cancelOrder`).
 */
export async function releaseReservationsForOrder(orderId: string, reason: string, tx?: Tx): Promise<void> {
  const run = async (client: Tx) => {
    const active = await client.stockReservation.findMany({
      where: { orderId, status: StockReservationStatus.ACTIVE },
      select: { id: true, variantId: true, quantity: true },
    });
    for (const reservation of active) {
      await client.stockReservation.update({
        where: { id: reservation.id },
        data: { status: StockReservationStatus.RELEASED, releasedAt: new Date() },
      });
      await client.inventory.update({
        where: { variantId: reservation.variantId },
        data: { quantityReserved: { decrement: reservation.quantity } },
      });
      await client.inventoryMovement.create({
        data: {
          variantId: reservation.variantId,
          orderId,
          type: InventoryMovementType.RESERVATION_RELEASE,
          quantityDelta: -reservation.quantity,
          reason,
        },
      });
    }
  };

  if (tx) {
    await run(tx);
  } else {
    await prisma.$transaction(run);
  }
}

/**
 * Bir siparişin TÜM ACTIVE rezervasyonlarını kesin satışa çevirir — gerçek
 * stok düşer (`quantityAvailable`), rezerve tutulan miktar serbest kalır
 * (`quantityReserved` de aynı anda azalır). HENÜZ hiçbir yerden ÇAĞRILMIYOR
 * (canlı ödeme entegrasyonu yok) — iyzico callback/webhook geldiğinde
 * ödeme başarı adımına doğrudan bağlanmak üzere provider-bağımsız
 * hazırlandı (bkz. görev gereksinimi §5).
 */
export async function consumeReservationsForOrder(orderId: string, tx?: Tx): Promise<void> {
  const run = async (client: Tx) => {
    const active = await client.stockReservation.findMany({
      where: { orderId, status: StockReservationStatus.ACTIVE },
      select: { id: true, variantId: true, quantity: true },
    });
    for (const reservation of active) {
      await client.stockReservation.update({
        where: { id: reservation.id },
        data: { status: StockReservationStatus.CONVERTED },
      });
      await client.inventory.update({
        where: { variantId: reservation.variantId },
        data: {
          quantityAvailable: { decrement: reservation.quantity },
          quantityReserved: { decrement: reservation.quantity },
        },
      });
      await client.inventoryMovement.create({
        data: {
          variantId: reservation.variantId,
          orderId,
          type: InventoryMovementType.SALE,
          quantityDelta: -reservation.quantity,
        },
      });
    }
  };

  if (tx) {
    await run(tx);
  } else {
    await prisma.$transaction(run);
  }
}

export interface InventoryRow {
  variantId: string;
  quantityAvailable: number;
  quantityReserved: number;
  lowStockThreshold: number;
  updatedAt: Date;
}

export async function getInventoryForVariant(variantId: string): Promise<InventoryRow | null> {
  return prisma.inventory.findUnique({ where: { variantId } });
}

export interface InventoryMovementRow {
  id: string;
  type: InventoryMovementType;
  quantityDelta: number;
  reason: string | null;
  orderId: string | null;
  actorId: string | null;
  createdAt: Date;
}

export async function listInventoryMovementsForVariant(
  variantId: string,
  limit: number,
): Promise<InventoryMovementRow[]> {
  return prisma.inventoryMovement.findMany({
    where: { variantId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      quantityDelta: true,
      reason: true,
      orderId: true,
      actorId: true,
      createdAt: true,
    },
  });
}

const SOLD_OUT_REASON = "Admin tarafından tükendi olarak işaretlendi.";

export type MarkSoldOutResult = { ok: true } | { ok: false; reason: "ALREADY_SOLD_OUT" };

/**
 * Bir varyantı TEK işlemle tükendi yapar — admin'in "kaç adet azaltmalıyım"
 * hesabı yapmasına gerek YOK. Mevcut `adjustInventory` (`ADJUSTMENT` türü,
 * negatif delta = mevcut `quantityAvailable`'ın TAMAMI) reuse edilir — yeni
 * bir "OUT_OF_STOCK" hareket türü İCAT EDİLMEDİ (bkz. görev notu: "mevcut
 * uygun enum"). Zaten 0 ise no-op sayılır (audit log kirletilmez).
 */
export async function markVariantSoldOut(variantId: string, actorId: string): Promise<MarkSoldOutResult> {
  const inventory = await getInventoryForVariant(variantId);
  const quantityAvailable = inventory?.quantityAvailable ?? 0;
  if (quantityAvailable <= 0) {
    return { ok: false, reason: "ALREADY_SOLD_OUT" };
  }
  const result = await adjustInventory({
    variantId,
    delta: -quantityAvailable,
    type: "ADJUSTMENT",
    actorId,
    reason: SOLD_OUT_REASON,
  });
  return result.ok ? { ok: true } : { ok: false, reason: "ALREADY_SOLD_OUT" };
}

/** Bir ürünün TÜM varyantlarını tükendi yapar — çoklu varyantlı ürünlerde toplu aksiyon. */
export async function markAllVariantsSoldOut(productId: string, actorId: string): Promise<{ affected: number }> {
  const variants = await prisma.productVariant.findMany({ where: { productId }, select: { id: true } });
  let affected = 0;
  for (const variant of variants) {
    const result = await markVariantSoldOut(variant.id, actorId);
    if (result.ok) {
      affected += 1;
    }
  }
  return { affected };
}

export interface RecentInventoryMovementRow {
  id: string;
  type: InventoryMovementType;
  quantityDelta: number;
  reason: string | null;
  createdAt: Date;
  variantName: string;
  productName: string;
  productId: string;
}

/** Dashboard "Son Stok Hareketleri" widget'ı — ürün genelinde son N hareket. */
export async function listRecentInventoryMovements(limit: number): Promise<RecentInventoryMovementRow[]> {
  const movements = await prisma.inventoryMovement.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      quantityDelta: true,
      reason: true,
      createdAt: true,
      variant: { select: { name: true, product: { select: { id: true, name: true } } } },
    },
  });
  return movements.map((movement) => ({
    id: movement.id,
    type: movement.type,
    quantityDelta: movement.quantityDelta,
    reason: movement.reason,
    createdAt: movement.createdAt,
    variantName: movement.variant.name,
    productName: movement.variant.product.name,
    productId: movement.variant.product.id,
  }));
}

export interface AdminVariantStockRow {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantityAvailable: number;
  quantityReserved: number;
  sellable: number;
  lastMovementAt: Date | null;
}

export type StockPageFilter = "ALL" | "OUT_OF_STOCK";

/**
 * `/yonetim/stok` ekranı için TÜM ACTIVE ürünlerin ACTIVE varyantlarını
 * tek listede getirir — "Az Stok" filtresi YOK (bkz. görev kuralı), yalnızca
 * "tümü"/"yalnızca tükenenler". Son hareket tarihi ayrı bir sorguda (N+1
 * yerine tek `groupBy`) çözülür.
 */
export async function listVariantStockForAdmin(filter: StockPageFilter): Promise<AdminVariantStockRow[]> {
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true, product: { status: "ACTIVE" } },
    select: {
      id: true,
      name: true,
      sku: true,
      product: { select: { id: true, name: true } },
      inventory: { select: { quantityAvailable: true, quantityReserved: true } },
    },
    orderBy: { product: { name: "asc" } },
  });

  const lastMovements = await prisma.inventoryMovement.groupBy({
    by: ["variantId"],
    _max: { createdAt: true },
  });
  const lastMovementByVariant = new Map(lastMovements.map((row) => [row.variantId, row._max.createdAt]));

  const rows: AdminVariantStockRow[] = variants.map((variant) => {
    const quantityAvailable = variant.inventory?.quantityAvailable ?? 0;
    const quantityReserved = variant.inventory?.quantityReserved ?? 0;
    return {
      variantId: variant.id,
      productId: variant.product.id,
      productName: variant.product.name,
      variantName: variant.name,
      sku: variant.sku,
      quantityAvailable,
      quantityReserved,
      sellable: quantityAvailable - quantityReserved,
      lastMovementAt: lastMovementByVariant.get(variant.id) ?? null,
    };
  });

  return filter === "OUT_OF_STOCK" ? rows.filter((row) => row.sellable <= 0) : rows;
}
