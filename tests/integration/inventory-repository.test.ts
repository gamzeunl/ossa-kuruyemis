/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz. tests/db.ts).
 * `inventory-repository.ts`'in stok artırma/azaltma, negatif koruması,
 * rezervasyon yaşam döngüsü (oluştur/süresi geç/serbest bırak/satışa çevir)
 * ve eşzamanlılık davranışını doğrular. `createDraftOrder`'ın kendi
 * rezervasyon ENTEGRASYONU `create-draft-order.test.ts`'te ayrıca test edilir.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { InvoiceType, ProductStatus, StockReservationStatus } from "@/generated/prisma/client";
import {
  adjustInventory,
  consumeReservationsForOrder,
  createReservation,
  getInventoryForVariant,
  releaseExpiredReservations,
  releaseReservationsForOrder,
} from "@/server/repositories/inventory-repository";
import { prisma as sharedPrisma } from "@/server/db/prisma";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/inventory-repository] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("inventory-repository (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  let variantId: string;
  let productId: string;
  let actorId: string;
  const createdOrderIds: string[] = [];

  async function createTestOrder(): Promise<string> {
    const suffix = randomUUID().slice(0, 8);
    const order = await sharedPrisma.order.create({
      data: {
        orderNumber: `OSSA-TEST-${suffix.toUpperCase()}`,
        email: `test-${suffix}@ossa-test.local`,
        phone: "05551234567",
        invoiceType: InvoiceType.INDIVIDUAL,
        subtotal: "100.00",
        discountTotal: "0",
        shippingTotal: "0",
        shippingPriceStatus: "FREE",
        taxTotal: "0",
        grandTotal: "100.00",
        totalStatus: "FINAL",
        shippingAddressSnapshot: {},
        billingAddressSnapshot: {},
        idempotencyKey: randomUUID(),
        requestFingerprint: randomUUID(),
        resultAccessToken: randomUUID(),
      },
      select: { id: true },
    });
    createdOrderIds.push(order.id);
    return order.id;
  }

  beforeEach(async () => {
    const suffix = randomUUID().slice(0, 8);
    const role = await prisma.role.upsert({
      where: { key: "ADMIN" },
      update: {},
      create: { key: "ADMIN", name: "Yönetici" },
    });
    const admin = await prisma.user.create({
      data: { roleId: role.id, email: `inv-admin-${suffix}@ossa-test.local`, firstName: "Test", lastName: "Admin" },
    });
    actorId = admin.id;

    const product = await prisma.product.create({
      data: { name: `Envanter Test ${suffix}`, slug: `envanter-test-${suffix}`, status: ProductStatus.ACTIVE },
    });
    productId = product.id;
    const variant = await prisma.productVariant.create({
      data: { productId, sku: `INV-TEST-${suffix}`, name: "500 g", price: "100.00", isActive: true },
    });
    variantId = variant.id;
    await prisma.inventory.create({
      data: { variantId, quantityAvailable: 20, quantityReserved: 0, lowStockThreshold: 2 },
    });
  });

  afterAll(async () => {
    await prisma.stockReservation.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.inventoryMovement.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  });

  it("adjustInventory (PURCHASE_IN) stoğu artırır ve InventoryMovement kaydeder", async () => {
    const result = await adjustInventory({ variantId, delta: 20, type: "PURCHASE_IN", actorId, reason: "Yeni sevkiyat" });
    expect(result).toEqual({ ok: true, quantityAvailable: 40 });

    const movements = await prisma.inventoryMovement.findMany({ where: { variantId, type: "PURCHASE_IN" } });
    expect(movements).toHaveLength(1);
    expect(movements[0].quantityDelta).toBe(20);
    expect(movements[0].actorId).toBe(actorId);
    expect(movements[0].reason).toBe("Yeni sevkiyat");
  });

  it("adjustInventory (DAMAGE) stoğu azaltır", async () => {
    const result = await adjustInventory({ variantId, delta: -5, type: "DAMAGE", actorId, reason: "Hasarlı ürün" });
    expect(result).toEqual({ ok: true, quantityAvailable: 15 });
  });

  it("adjustInventory mevcut stoktan fazla azaltmaya İZİN VERMEZ (negatif olmaz)", async () => {
    const result = await adjustInventory({ variantId, delta: -999, type: "DAMAGE", actorId });
    expect(result).toEqual({ ok: false, reason: "WOULD_GO_NEGATIVE" });

    const inventory = await getInventoryForVariant(variantId);
    expect(inventory?.quantityAvailable).toBe(20);
  });

  it("createReservation kullanılabilir stoğu azaltır (quantityReserved artırır, quantityAvailable DEĞİŞMEZ)", async () => {
    const orderId = await createTestOrder();
    await createReservation(sharedPrisma, {
      orderId,
      variantId,
      quantity: 5,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const inventory = await getInventoryForVariant(variantId);
    expect(inventory?.quantityAvailable).toBe(20);
    expect(inventory?.quantityReserved).toBe(5);

    const reservation = await prisma.stockReservation.findFirst({ where: { orderId, variantId } });
    expect(reservation?.status).toBe(StockReservationStatus.ACTIVE);
    expect(reservation?.quantity).toBe(5);
  });

  it("releaseReservationsForOrder ACTIVE rezervasyonu RELEASED yapar, quantityReserved'ı geri düşürür", async () => {
    const orderId = await createTestOrder();
    await createReservation(sharedPrisma, { orderId, variantId, quantity: 5, expiresAt: new Date(Date.now() + 60_000) });

    await releaseReservationsForOrder(orderId, "Test serbest bırakma");

    const inventory = await getInventoryForVariant(variantId);
    expect(inventory?.quantityReserved).toBe(0);
    const reservation = await prisma.stockReservation.findFirst({ where: { orderId, variantId } });
    expect(reservation?.status).toBe(StockReservationStatus.RELEASED);
    expect(reservation?.releasedAt).not.toBeNull();
  });

  it("consumeReservationsForOrder ACTIVE rezervasyonu CONVERTED yapar, quantityAvailable VE quantityReserved birlikte azalır (gerçek satış)", async () => {
    const orderId = await createTestOrder();
    await createReservation(sharedPrisma, { orderId, variantId, quantity: 5, expiresAt: new Date(Date.now() + 60_000) });

    await consumeReservationsForOrder(orderId);

    const inventory = await getInventoryForVariant(variantId);
    expect(inventory?.quantityAvailable).toBe(15);
    expect(inventory?.quantityReserved).toBe(0);
    const reservation = await prisma.stockReservation.findFirst({ where: { orderId, variantId } });
    expect(reservation?.status).toBe(StockReservationStatus.CONVERTED);

    const saleMovement = await prisma.inventoryMovement.findFirst({ where: { orderId, type: "SALE" } });
    expect(saleMovement?.quantityDelta).toBe(-5);
  });

  it("releaseExpiredReservations yalnızca SÜRESİ GEÇMİŞ ACTIVE rezervasyonları serbest bırakır — henüz geçerli olanlara DOKUNMAZ", async () => {
    const expiredOrderId = await createTestOrder();
    const activeOrderId = await createTestOrder();

    await createReservation(sharedPrisma, {
      orderId: expiredOrderId,
      variantId,
      quantity: 3,
      expiresAt: new Date(Date.now() - 1000), // zaten geçmiş
    });
    await createReservation(sharedPrisma, {
      orderId: activeOrderId,
      variantId,
      quantity: 4,
      expiresAt: new Date(Date.now() + 60_000), // hâlâ geçerli
    });

    await sharedPrisma.$transaction(async (tx) => {
      await releaseExpiredReservations(tx, [variantId], new Date());
    });

    const expiredReservation = await prisma.stockReservation.findFirst({ where: { orderId: expiredOrderId } });
    expect(expiredReservation?.status).toBe(StockReservationStatus.EXPIRED);

    const activeReservation = await prisma.stockReservation.findFirst({ where: { orderId: activeOrderId } });
    expect(activeReservation?.status).toBe(StockReservationStatus.ACTIVE);

    // Yalnızca süresi geçenin miktarı (3) geri düştü; hâlâ geçerli olanın (4) tutduğu kalır.
    const inventory = await getInventoryForVariant(variantId);
    expect(inventory?.quantityReserved).toBe(4);
  });

  it("eşzamanlı stok girişleri race condition olmadan doğru toplanır (adjustInventory atomik)", async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, () => adjustInventory({ variantId, delta: 1, type: "ADJUSTMENT", actorId })),
    );
    expect(results.every((r) => r.ok)).toBe(true);

    const inventory = await getInventoryForVariant(variantId);
    expect(inventory?.quantityAvailable).toBe(30);
  });
});
