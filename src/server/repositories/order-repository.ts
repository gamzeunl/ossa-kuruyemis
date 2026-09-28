import { randomUUID } from "node:crypto";
import {
  EmailSendStatus,
  InvoiceType,
  OrderEmailType,
  OrderStatus,
  OrderTotalStatus,
  PaymentStatus,
  Prisma,
  ProductStatus,
  ShippingPriceStatus,
} from "@/generated/prisma/client";
import { generateOrderNumber } from "@/lib/order-number";
import { computeOrderFingerprint } from "@/lib/order-fingerprint";
import { canTransitionOrderStatus } from "@/lib/order-status";
import {
  resolveShippingFee,
  type ShippingFeeResult,
  type ShippingSettings,
} from "@/lib/checkout-shipping";
import { resolveBundleCompanionPrice } from "@/lib/bundle-pricing";
import { resolveVariantPricing } from "@/lib/product-pricing";
import { violatesUniqueConstraintOn } from "@/lib/prisma-errors";
import { computeReservationExpiry } from "@/lib/stock-reservation";
import { prisma } from "@/server/db/prisma";
import {
  createReservation,
  releaseExpiredReservations,
  releaseReservationsForOrder,
} from "@/server/repositories/inventory-repository";

/**
 * "Gerçekten tamamlanmış/ödenmiş" sayılan sipariş durumları — Çok Satan hesabına
 * yalnızca bunlar girer. İptal/başarısız/iade akışındaki durumlar (PENDING,
 * PAYMENT_PROCESSING, PAYMENT_FAILED, CANCELLATION_REQUESTED, CANCELLED, EXPIRED,
 * RETURN_REQUESTED, RETURNED, RETURN_REJECTED) kasıtlı olarak dışarıda bırakılır.
 */
export const COMPLETED_SALE_STATUSES: OrderStatus[] = [
  OrderStatus.PAID,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export interface ListBestSellingProductIdsParams {
  windowDays: number;
  minUnits: number;
  limit: number;
  categorySlug?: string;
}

/**
 * Gerçek sipariş verisinden (yalnızca `COMPLETED_SALE_STATUSES`, son `windowDays`
 * gün, en az `minUnits` adet), satış adedine göre azalan sırada ürün id'lerini
 * döner. Tek `groupBy` sorgusu — çağıran taraf (`catalog-service.ts`) bu id
 * listesini istek başına bir kez hesaplayıp tüm kart/liste render'larında yeniden
 * kullanır; kart başına ayrı sorgu YOKTUR. Gerçek sipariş yoksa boş dizi döner —
 * hiçbir ürün otomatik "Çok Satan" sayılmaz.
 */
export interface BestSellingProductQuantityRow {
  productId: string;
  unitsSold: number;
}

/**
 * `listBestSellingProductIds`'in de TEK kaynağı olarak kullandığı asıl
 * `groupBy` sorgusu — satılan adet dahil. Admin "En Çok Satanlar" salt-okunur
 * ekranı bu adet bilgisine ihtiyaç duyar; `listBestSellingProductIds` yalnızca
 * id listesi döndürdüğü için AYRI bir sorgu YAZMAK yerine bu fonksiyona
 * delege eder — iki farklı "çok satan" tanımı oluşmasın diye.
 */
export async function listBestSellingProductsWithQuantity(
  params: ListBestSellingProductIdsParams,
): Promise<BestSellingProductQuantityRow[]> {
  const since = new Date(Date.now() - params.windowDays * 86_400_000);

  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    where: {
      productId: { not: null },
      order: {
        status: { in: COMPLETED_SALE_STATUSES },
        createdAt: { gte: since },
      },
      ...(params.categorySlug
        ? {
            product: {
              productCategories: {
                some: { category: { slug: params.categorySlug, isActive: true } },
              },
            },
          }
        : {}),
    },
    _sum: { quantity: true },
    having: { quantity: { _sum: { gte: params.minUnits } } },
    orderBy: { _sum: { quantity: "desc" } },
    take: params.limit,
  });

  return grouped
    .filter((entry): entry is typeof entry & { productId: string } => entry.productId !== null)
    .map((entry) => ({ productId: entry.productId, unitsSold: entry._sum.quantity ?? 0 }));
}

/**
 * Gerçek sipariş verisinden (yalnızca `COMPLETED_SALE_STATUSES`, son `windowDays`
 * gün, en az `minUnits` adet), satış adedine göre azalan sırada ürün id'lerini
 * döner. Çağıran taraf (`catalog-service.ts`) bu id listesini istek başına bir
 * kez hesaplayıp tüm kart/liste render'larında yeniden kullanır; kart başına
 * ayrı sorgu YOKTUR. Gerçek sipariş yoksa boş dizi döner — hiçbir ürün otomatik
 * "Çok Satan" sayılmaz.
 */
export async function listBestSellingProductIds(
  params: ListBestSellingProductIdsParams,
): Promise<string[]> {
  const rows = await listBestSellingProductsWithQuantity(params);
  return rows.map((row) => row.productId);
}

/**
 * Kullanıcının bir ürünü gerçekten (`COMPLETED_SALE_STATUSES`) satın alıp
 * almadığını sunucuda kontrol eder — yorum gönderiminde `verifiedPurchase`
 * bunun dışında hiçbir yolla (elle, client'tan) belirlenmez. Sipariş sistemi
 * henüz veri üretmiyorsa her zaman `false` döner; sahte veri üretilmez.
 */
export async function hasCompletedPurchase(userId: string, productId: string): Promise<boolean> {
  const count = await prisma.orderItem.count({
    where: {
      productId,
      order: { userId, status: { in: COMPLETED_SALE_STATUSES } },
    },
  });
  return count > 0;
}

// ==================== Sipariş taslağı oluşturma ====================

export interface DraftOrderItemInput {
  variantId: string;
  quantity: number;
}

export interface DraftOrderAddress {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  addressLine: string;
  addressLabel: string;
}

export type DraftOrderInvoice =
  | { invoiceType: typeof InvoiceType.INDIVIDUAL }
  | {
      invoiceType: typeof InvoiceType.CORPORATE;
      companyName: string;
      taxOffice: string;
      taxNumber: string;
    };

export interface CreateDraftOrderInput {
  userId: string | null;
  email: string;
  phone: string;
  items: DraftOrderItemInput[];
  shippingAddress: DraftOrderAddress;
  /** Çağıran taraf "aynı" seçiliyse `shippingAddress` ile AYNI referansı geçirir — repository burada dallanma yapmaz. */
  billingAddress: DraftOrderAddress;
  invoice: DraftOrderInvoice;
  /** Client'ta üretilen, tahmin edilemez tekrar-gönderim anahtarı — fiyat/güvenlik kararı için KULLANILMAZ. */
  idempotencyKey: string;
}

export type CreateDraftOrderFailureReason =
  | "EMPTY_CART"
  | "INVALID_QUANTITY"
  | "ITEM_NOT_FOUND"
  | "PRODUCT_UNAVAILABLE"
  | "INSUFFICIENT_STOCK"
  | "FINGERPRINT_MISMATCH";

export type CreateDraftOrderResult =
  | { ok: true; orderId: string; orderNumber: string; resultAccessToken: string }
  | { ok: false; reason: CreateDraftOrderFailureReason };

/** Transaction içi beklenen iş-kuralı reddi — sistem hatasından ayrı ele alınır. */
class DraftOrderRejection extends Error {
  constructor(public readonly reason: CreateDraftOrderFailureReason) {
    super(reason);
  }
}

const MAX_ORDER_NUMBER_ATTEMPTS = 5;

interface ShippingOutcome {
  shippingPriceStatus: ShippingPriceStatus;
  shippingTotal: Prisma.Decimal | null;
  totalStatus: OrderTotalStatus;
  grandTotal: Prisma.Decimal;
}

/**
 * Bir `ShippingFeeResult`ten (bkz. `checkout-shipping.ts`) siparişe yazılacak
 * kargo/toplam alanlarını türetir — TEK kaynak. Bilinmeyen kargo ücreti asla
 * 0 (ücretsiz) ile karıştırılmaz; `totalStatus=PENDING` iken `grandTotal`
 * yalnızca ara toplamı taşır, kesin tahsilat tutarı DEĞİLDİR.
 */
function resolveShippingOutcome(
  subtotal: Prisma.Decimal,
  shippingResult: ShippingFeeResult,
): ShippingOutcome {
  if (shippingResult.status === "free") {
    return {
      shippingPriceStatus: ShippingPriceStatus.FREE,
      shippingTotal: new Prisma.Decimal(0),
      totalStatus: OrderTotalStatus.FINAL,
      grandTotal: subtotal,
    };
  }
  if (shippingResult.status === "fee") {
    const shippingTotal = new Prisma.Decimal(shippingResult.amount);
    return {
      shippingPriceStatus: ShippingPriceStatus.FIXED,
      shippingTotal,
      totalStatus: OrderTotalStatus.FINAL,
      grandTotal: subtotal.add(shippingTotal),
    };
  }
  return {
    shippingPriceStatus: ShippingPriceStatus.PENDING,
    shippingTotal: null,
    totalStatus: OrderTotalStatus.PENDING,
    grandTotal: subtotal,
  };
}

/**
 * Gerçek bir sipariş TASLAĞI oluşturur (`status: PENDING`) — canlı ödeme
 * entegrasyonu olmadığından asla `PAID` işaretlenmez, `Payment`/`PaymentAttempt`
 * satırı YARATILMAZ (henüz gerçek bir ödeme denemesi yok). Client'tan gelen
 * fiyat/toplam/kargo/indirim hiçbir şekilde okunmaz: her varyant DB'den
 * yeniden okunur, ürünün yayında + varyantın aktif olduğu doğrulanır, fiyat
 * `resolveVariantPricing()` ile sunucuda yeniden hesaplanır. Stok kontrolü +
 * rezervasyon (`StockReservation`, bkz. `inventory-repository.ts`) AYNI
 * transaction içinde atomik yapılır — eşzamanlı iki checkout aynı son birimi
 * satın alamaz (overselling engellenir). Rezervasyon `RESERVATION_TTL_MS`
 * (bkz. `stock-reservation.ts`) sonra kendiliğinden askıya alınabilir hale
 * gelir; süresi geçmiş rezervasyonlar bir sonraki stok kontrolünde lazy
 * olarak serbest bırakılır (ayrı bir cron YOK).
 *
 * Çift gönderim koruması artık `idempotencyKey` (DB unique) üzerinden —
 * "önce findUnique sonra create" YOK: doğrudan `create` denenir, unique
 * ihlalinde mevcut sipariş bulunup `requestFingerprint` karşılaştırılır.
 * Aynı anahtar farklı içerikle gelirse `FINGERPRINT_MISMATCH` reddedilir.
 */
export async function createDraftOrder(
  input: CreateDraftOrderInput,
  shippingSettings: ShippingSettings,
): Promise<CreateDraftOrderResult> {
  if (input.items.length === 0) {
    return { ok: false, reason: "EMPTY_CART" };
  }
  for (const item of input.items) {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      return { ok: false, reason: "INVALID_QUANTITY" };
    }
  }

  const quantityByVariantId = new Map<string, number>();
  for (const item of input.items) {
    quantityByVariantId.set(
      item.variantId,
      (quantityByVariantId.get(item.variantId) ?? 0) + item.quantity,
    );
  }
  const variantIds = [...quantityByVariantId.keys()];

  const addressSnapshot: Prisma.InputJsonObject = { ...input.shippingAddress };
  const billingAddressSnapshot: Prisma.InputJsonObject = { ...input.billingAddress };

  // Fingerprint SUNUCUDA doğrulanmış girdilerden hesaplanır (client'tan gelen
  // hiçbir fiyat/toplam dahil edilmez) — aynı idempotencyKey'in farklı sepet/
  // adres/fatura içeriğiyle yeniden kullanımını tespit etmek için.
  const fingerprint = computeOrderFingerprint({
    identityKey: input.userId ?? input.email,
    items: [...quantityByVariantId.entries()].map(([variantId, quantity]) => ({
      variantId,
      quantity,
    })),
    address: input.shippingAddress,
    billingAddress: input.billingAddress,
    invoice: input.invoice,
  });

  for (let attempt = 1; attempt <= MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
    try {
      const order = await prisma.$transaction(async (tx) => {
        // KRİTİK: bu varyantların `Inventory` satırlarını `SELECT ... FOR UPDATE`
        // ile kilitler — yalnızca atomik `increment` YETMEZ, çünkü "önce oku
        // (available var mı?) sonra yaz (rezervasyon oluştur)" iki AYRI adımdır;
        // kilit olmadan iki eşzamanlı istek AYNI ANDA "available" okuyup ikisi de
        // geçip son birimi satabilirdi (TOCTOU race — canlı testte doğrulandı).
        // Bu kilit, aynı varyanta eşzamanlı ikinci isteği BİRİNCİ commit/rollback
        // edene kadar bekletir; ikinci istek o an GÜNCEL quantityReserved'ı görür.
        if (variantIds.length > 0) {
          await tx.$queryRaw`SELECT "id" FROM "Inventory" WHERE "variantId" IN (${Prisma.join(variantIds)}) FOR UPDATE`;
        }

        // Stok kontrolünden ÖNCE bu varyantlara ait süresi geçmiş rezervasyonlar
        // serbest bırakılır (lazy cleanup, ayrı bir cron YOK) — aksi halde ödemesi
        // hiç tamamlanmamış eski bir sipariş, stoğu sonsuza kadar kilitli tutardı.
        await releaseExpiredReservations(tx, variantIds, new Date());

        const variants = await tx.productVariant.findMany({
          where: { id: { in: variantIds } },
          select: {
            id: true,
            sku: true,
            name: true,
            price: true,
            discountPrice: true,
            discountStartsAt: true,
            discountEndsAt: true,
            isDiscountActive: true,
            isActive: true,
            product: { select: { id: true, name: true, status: true } },
            inventory: { select: { quantityAvailable: true, quantityReserved: true } },
          },
        });

        if (variants.length !== variantIds.length) {
          throw new DraftOrderRejection("ITEM_NOT_FOUND");
        }

        // "Birlikte Daha Güzel" — client'ın gönderdiği TEK veri {variantId,quantity}
        // olduğu için (bkz. `delivery-form.tsx`), bundle eşleşmesi TAMAMEN sunucuda,
        // sepetteki (yukarıdaki) DB'den taze okunmuş varyantlar üzerinden kurulur.
        // Ana varyant sepette yoksa (`primaryQty=0`) veya doğru tamamlayıcı sepette
        // yoksa (`variants.find` boş döner) aday sessizce elenir — istisna atılmaz,
        // yalnızca o kalem normal (bağımsız) fiyatla işlenir.
        const bundleCandidates =
          variantIds.length > 0
            ? await tx.bundleOffer.findMany({
                where: { isActive: true, primaryVariantId: { in: variantIds } },
                orderBy: { sortOrder: "asc" },
                select: {
                  primaryVariantId: true,
                  companionVariantId: true,
                  companionPrice: true,
                  startsAt: true,
                  endsAt: true,
                  isActive: true,
                },
              })
            : [];

        const remainingCompanionQty = new Map(quantityByVariantId);
        const bundleSegmentsByVariantId = new Map<string, { quantity: number; unitPrice: Prisma.Decimal }[]>();

        for (const bundle of bundleCandidates) {
          const primaryQty = quantityByVariantId.get(bundle.primaryVariantId) ?? 0;
          const remaining = remainingCompanionQty.get(bundle.companionVariantId) ?? 0;
          const companionVariant = variants.find((v) => v.id === bundle.companionVariantId);
          if (primaryQty <= 0 || remaining <= 0 || !companionVariant) {
            continue;
          }

          const companionPricing = resolveVariantPricing(companionVariant);
          const resolved = resolveBundleCompanionPrice(companionPricing.effectivePrice, bundle);
          if (!resolved.isBundleApplied) {
            continue;
          }

          const eligiblePairs = Math.min(primaryQty, remaining);
          if (eligiblePairs <= 0) {
            continue;
          }

          const segments = bundleSegmentsByVariantId.get(bundle.companionVariantId) ?? [];
          segments.push({ quantity: eligiblePairs, unitPrice: resolved.effectivePrice });
          bundleSegmentsByVariantId.set(bundle.companionVariantId, segments);
          remainingCompanionQty.set(bundle.companionVariantId, remaining - eligiblePairs);
        }

        const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
        let subtotal = new Prisma.Decimal(0);

        for (const variant of variants) {
          const quantity = quantityByVariantId.get(variant.id) ?? 0;

          if (!variant.isActive || variant.product.status !== ProductStatus.ACTIVE) {
            throw new DraftOrderRejection("PRODUCT_UNAVAILABLE");
          }

          const available =
            (variant.inventory?.quantityAvailable ?? 0) - (variant.inventory?.quantityReserved ?? 0);
          if (available < quantity) {
            throw new DraftOrderRejection("INSUFFICIENT_STOCK");
          }

          const pricing = resolveVariantPricing(variant);
          const bundleSegments = bundleSegmentsByVariantId.get(variant.id) ?? [];
          const bundleQuantity = bundleSegments.reduce((sum, segment) => sum + segment.quantity, 0);
          const remainderQuantity = quantity - bundleQuantity;

          for (const segment of bundleSegments) {
            const lineTotal = segment.unitPrice.mul(segment.quantity);
            subtotal = subtotal.add(lineTotal);
            orderItemsData.push({
              productId: variant.product.id,
              variantId: variant.id,
              productName: variant.product.name,
              variantName: variant.name,
              sku: variant.sku,
              quantity: segment.quantity,
              regularUnitPrice: pricing.regularPrice,
              unitPrice: segment.unitPrice,
              lineTotal,
            });
          }

          if (remainderQuantity > 0) {
            const lineTotal = pricing.effectivePrice.mul(remainderQuantity);
            subtotal = subtotal.add(lineTotal);
            orderItemsData.push({
              productId: variant.product.id,
              variantId: variant.id,
              productName: variant.product.name,
              variantName: variant.name,
              sku: variant.sku,
              quantity: remainderQuantity,
              regularUnitPrice: pricing.regularPrice,
              unitPrice: pricing.effectivePrice,
              lineTotal,
            });
          }
        }

        const shippingResult = resolveShippingFee(shippingSettings, subtotal.toNumber());
        const { shippingPriceStatus, shippingTotal, totalStatus, grandTotal } =
          resolveShippingOutcome(subtotal, shippingResult);

        const orderNumberAttempt = generateOrderNumber();
        const resultAccessToken = randomUUID();

        const createdOrder = await tx.order.create({
          data: {
            orderNumber: orderNumberAttempt,
            userId: input.userId,
            email: input.email,
            phone: input.phone,
            status: OrderStatus.PENDING,
            invoiceType: input.invoice.invoiceType,
            invoiceCompanyName: input.invoice.invoiceType === InvoiceType.CORPORATE ? input.invoice.companyName : null,
            invoiceTaxOffice: input.invoice.invoiceType === InvoiceType.CORPORATE ? input.invoice.taxOffice : null,
            invoiceTaxNumber: input.invoice.invoiceType === InvoiceType.CORPORATE ? input.invoice.taxNumber : null,
            subtotal,
            discountTotal: new Prisma.Decimal(0),
            shippingTotal,
            shippingPriceStatus,
            taxTotal: new Prisma.Decimal(0),
            grandTotal,
            totalStatus,
            currency: "TRY",
            shippingAddressSnapshot: addressSnapshot,
            billingAddressSnapshot,
            idempotencyKey: input.idempotencyKey,
            requestFingerprint: fingerprint,
            resultAccessToken,
            items: { createMany: { data: orderItemsData } },
          },
          select: { id: true, orderNumber: true, resultAccessToken: true },
        });

        // Stok kontrolü ve rezervasyon AYNI transaction'da, atomik — ödeme
        // tamamlanana kadar (veya süre dolana kadar) bu miktar başka bir
        // siparişe satılamaz (bkz. `computeReservationExpiry`, lazy cleanup yukarıda).
        const reservationExpiresAt = computeReservationExpiry();
        for (const [variantId, quantity] of quantityByVariantId) {
          await createReservation(tx, {
            orderId: createdOrder.id,
            variantId,
            quantity,
            expiresAt: reservationExpiresAt,
          });
        }

        return createdOrder;
      });

      return {
        ok: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        resultAccessToken: order.resultAccessToken,
      };
    } catch (error) {
      if (error instanceof DraftOrderRejection) {
        return { ok: false, reason: error.reason };
      }

      if (violatesUniqueConstraintOn(error, "idempotencyKey")) {
        // Aynı anahtar zaten var — bu YENİ bir çakışma değil, gerçek bir tekrar
        // gönderim (veya eşzamanlı çift istek). DB unique constraint tek
        // koruma; burada yalnızca sonucu deterministik hâle getiriyoruz.
        const existing = await prisma.order.findUnique({
          where: { idempotencyKey: input.idempotencyKey },
          select: { id: true, orderNumber: true, requestFingerprint: true, resultAccessToken: true },
        });
        if (!existing) {
          throw error;
        }
        if (existing.requestFingerprint !== fingerprint) {
          return { ok: false, reason: "FINGERPRINT_MISMATCH" };
        }
        return {
          ok: true,
          orderId: existing.id,
          orderNumber: existing.orderNumber,
          resultAccessToken: existing.resultAccessToken,
        };
      }

      if (violatesUniqueConstraintOn(error, "orderNumber") && attempt < MAX_ORDER_NUMBER_ATTEMPTS) {
        continue;
      }
      throw error;
    }
  }

  // Buraya yalnızca tüm deneme hakları tükenirse ulaşılır (istatistiksel olarak
  // gerçekleşmesi beklenmez) — sistem hatası olarak yukarı fırlatılır.
  throw new Error("Sipariş numarası üretilemedi.");
}

// ==================== Müşteri sipariş erişimi ====================

/**
 * Müşteri/liste/detay sipariş görünümlerinin (aşağıdaki üç select) ortak
 * temel alanları — `product-repository.ts`'teki `productListArgs`→
 * `productDetailArgs` yayma (spread) deseniyle aynı: her görünüm yalnızca
 * kendi ihtiyacı olanı EKLER, ortak alan listesi tek yerde yaşar.
 */
const orderCoreSelect = {
  id: true,
  orderNumber: true,
  email: true,
  status: true,
  subtotal: true,
  shippingTotal: true,
  shippingPriceStatus: true,
  grandTotal: true,
  totalStatus: true,
  createdAt: true,
} satisfies Prisma.OrderSelect;

/**
 * En son kargo satırı — TEK yerden paylaşılır (admin liste/detay, müşteri
 * görünümü, public takip hepsi AYNI şekli okur). `orderId` üzerinde unique
 * kısıt yok (şema kasıtlı minimal tutuldu), bu yüzden "en güncel" satır
 * `createdAt desc` ile seçilir.
 */
const latestShipmentSelect = {
  orderBy: { createdAt: "desc" as const },
  take: 1,
  select: { carrier: true, trackingNumber: true, trackingUrl: true, status: true },
};

const customerOrderViewSelect = {
  ...orderCoreSelect,
  userId: true,
  discountTotal: true,
  taxTotal: true,
  currency: true,
  shippingAddressSnapshot: true,
  invoiceType: true,
  invoiceCompanyName: true,
  invoiceTaxOffice: true,
  invoiceTaxNumber: true,
  shipments: latestShipmentSelect,
  items: {
    select: {
      id: true,
      productName: true,
      variantName: true,
      quantity: true,
      regularUnitPrice: true,
      unitPrice: true,
      lineTotal: true,
    },
  },
} satisfies Prisma.OrderSelect;

export type CustomerOrderViewRow = Prisma.OrderGetPayload<{ select: typeof customerOrderViewSelect }>;

/**
 * Sipariş sonucu sayfası için (misafir + girişli) — `resultAccessToken` DB
 * sorgusunun İÇİNDE karşılaştırılır (önce sipariş çekip sonra JS'te karşılaştırma
 * YAPILMAZ); yalnızca sipariş numarasını bilmek erişim sağlamaz.
 */
export async function findOrderByResultAccessToken(
  orderNumber: string,
  token: string,
): Promise<CustomerOrderViewRow | null> {
  return prisma.order.findFirst({
    where: { orderNumber, resultAccessToken: token },
    select: customerOrderViewSelect,
  });
}

/** `/hesabim/siparisler/[orderNumber]` için — oturumdaki kullanıcının KENDİ siparişi olduğu DB sorgusunda doğrulanır. */
export async function findOrderForUser(
  orderNumber: string,
  userId: string,
): Promise<CustomerOrderViewRow | null> {
  return prisma.order.findFirst({
    where: { orderNumber, userId },
    select: customerOrderViewSelect,
  });
}

const publicTrackingSelect = {
  orderNumber: true,
  email: true,
  phone: true,
  status: true,
  createdAt: true,
  shipments: latestShipmentSelect,
} satisfies Prisma.OrderSelect;

export type OrderTrackingLookupRow = Prisma.OrderGetPayload<{ select: typeof publicTrackingSelect }>;

/**
 * Public `/siparis-takibi` için — `orderNumber` `@unique` olduğundan tek satır
 * döner; e-posta/telefon eşleşmesi BURADA değil, `order-tracking-service.ts`'te
 * (normalize edilerek) yapılır. `email`/`phone` yalnızca eşleştirme amaçlı
 * seçilir, çağıran katman bunları asla doğrudan ekrana basmaz.
 */
export async function findOrderByOrderNumberForTracking(
  orderNumber: string,
): Promise<OrderTrackingLookupRow | null> {
  return prisma.order.findUnique({
    where: { orderNumber },
    select: publicTrackingSelect,
  });
}

const customerOrderListSelect = {
  ...orderCoreSelect,
  items: { select: { id: true, productName: true, quantity: true } },
} satisfies Prisma.OrderSelect;

export type CustomerOrderListRow = Prisma.OrderGetPayload<{ select: typeof customerOrderListSelect }>;

export interface ListOrdersForUserParams {
  page: number;
  pageSize: number;
}

/** `/hesabim/siparisler` için — yalnızca `userId`'ye ait siparişler, en yeniden eskiye, sayfalı. */
export async function listOrdersForUser(
  userId: string,
  params: ListOrdersForUserParams,
): Promise<{ rows: CustomerOrderListRow[]; total: number }> {
  const where: Prisma.OrderWhereInput = { userId };
  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: customerOrderListSelect,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.pageSize,
      take: params.pageSize,
    }),
    prisma.order.count({ where }),
  ]);
  return { rows, total };
}

// ==================== Sipariş e-postaları ====================

const orderEmailSelect = {
  ...orderCoreSelect,
  shippingAddressSnapshot: true,
  items: { select: { id: true, productName: true, quantity: true } },
} satisfies Prisma.OrderSelect;

export type OrderEmailRow = Prisma.OrderGetPayload<{ select: typeof orderEmailSelect }>;

/** E-posta şablonlarının ihtiyaç duyduğu minimal sipariş verisi (bkz. `order-email-service.ts`). */
export async function findOrderForEmail(orderId: string): Promise<OrderEmailRow | null> {
  return prisma.order.findUnique({ where: { id: orderId }, select: orderEmailSelect });
}

export interface OrderEmailLogRow {
  type: OrderEmailType;
  status: EmailSendStatus;
  recipient: string;
  errorMessage: string | null;
  createdAt: Date;
}

/**
 * Her `OrderEmailType` için EN SON gönderim denemesi — admin detay sayfasındaki
 * gönderim durumu/son gönderim zamanı gösterimi ve yeniden-gönderim hız
 * sınırlaması (`sendOrderEmail`) bunun üzerine kurulur. Tek sorgu; `type`
 * başına ilk (en yeni) kayıt JS'te seçilir.
 */
export async function findLatestEmailLogsForOrder(
  orderId: string,
): Promise<Map<OrderEmailType, OrderEmailLogRow>> {
  const logs = await prisma.orderEmailLog.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
    select: { type: true, status: true, recipient: true, errorMessage: true, createdAt: true },
  });
  const latestByType = new Map<OrderEmailType, OrderEmailLogRow>();
  for (const log of logs) {
    if (!latestByType.has(log.type)) {
      latestByType.set(log.type, log);
    }
  }
  return latestByType;
}

// ==================== Yönetim ====================

export interface AdminOrderListFilters {
  page: number;
  pageSize: number;
  status?: OrderStatus;
  /** Birden çok durumu birden filtrelemek için (ör. "Yeni" kovası PENDING+CONFIRMED) — bkz. `order-status-bucket.ts`. Verilirse `status`'tan ÖNCELİKLİDİR. */
  statusIn?: OrderStatus[];
  paymentStatus?: "PENDING" | "SUCCEEDED";
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

const adminOrderListSelect = {
  ...orderCoreSelect,
  phone: true,
  shippingAddressSnapshot: true,
  shipments: latestShipmentSelect,
  payments: { select: { status: true }, where: { status: PaymentStatus.SUCCEEDED }, take: 1 },
} satisfies Prisma.OrderSelect;

export type AdminOrderListRow = Prisma.OrderGetPayload<{ select: typeof adminOrderListSelect }>;

function buildAdminOrderWhere(
  filters: Omit<AdminOrderListFilters, "page" | "pageSize">,
): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};

  if (filters.statusIn && filters.statusIn.length > 0) {
    where.status = { in: filters.statusIn };
  } else if (filters.status) {
    where.status = filters.status;
  }
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
      ...(filters.dateTo ? { lte: filters.dateTo } : {}),
    };
  }
  const term = filters.search?.trim();
  if (term) {
    // Müşteri adı `shippingAddressSnapshot` JSON'ı içinde tutulur (Order'da
    // ayrı bir "ad" kolonu yok) — yeni kolon/migration GEREKMEDEN mevcut
    // JSON alanı üzerinden aranır.
    where.OR = [
      { orderNumber: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
      { shippingAddressSnapshot: { path: ["firstName"], string_contains: term } },
      { shippingAddressSnapshot: { path: ["lastName"], string_contains: term } },
    ];
  }
  if (filters.paymentStatus === "SUCCEEDED") {
    where.payments = { some: { status: PaymentStatus.SUCCEEDED } };
  } else if (filters.paymentStatus === "PENDING") {
    where.payments = { none: { status: PaymentStatus.SUCCEEDED } };
  }

  return where;
}

/** Yönetim "Siparişler" listesi — filtreli, sayfalı; tüm siparişler asla sınırsız çekilmez. */
export async function listOrdersForAdmin(
  filters: AdminOrderListFilters,
): Promise<{ rows: AdminOrderListRow[]; total: number }> {
  const where = buildAdminOrderWhere(filters);
  const [rows, total] = await Promise.all([
    prisma.order.findMany({
      where,
      select: adminOrderListSelect,
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
    }),
    prisma.order.count({ where }),
  ]);
  return { rows, total };
}

/** Belirli bir durumdaki sipariş sayısı — dashboard KPI'ı ("Bekleyen Sipariş") için. */
export async function countOrdersByStatus(status: OrderStatus): Promise<number> {
  return prisma.order.count({ where: { status } });
}

/** Bugün (sunucu yerel gün başlangıcından itibaren) oluşturulan sipariş sayısı — dashboard KPI'ı. */
export async function countOrdersCreatedToday(): Promise<number> {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return prisma.order.count({ where: { createdAt: { gte: startOfToday } } });
}

/**
 * Dashboard "Toplam Satış/Ciro" KPI'ı — İPTAL/SÜRESİ DOLMUŞ/ÖDEME BAŞARISIZ/
 * İADE edilmiş siparişler HARİÇ tutulur, yalnızca `totalStatus=FINAL` (kesin,
 * geçici olmayan tutar) satırlar toplanır. Gerçek iyzico entegrasyonu henüz
 * bağlanmadığından "PAID" ile sınırlamak her zaman 0 gösterirdi — bu yüzden
 * "gerçekleşmesi beklenen sipariş tutarı" tanımı kullanılır, sahte veri DEĞİLDİR.
 */
export async function sumOrderGrandTotal(): Promise<string> {
  const excludedStatuses: OrderStatus[] = [
    OrderStatus.CANCELLED,
    OrderStatus.EXPIRED,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.RETURNED,
  ];
  const result = await prisma.order.aggregate({
    where: { totalStatus: OrderTotalStatus.FINAL, status: { notIn: excludedStatuses } },
    _sum: { grandTotal: true },
  });
  return (result._sum.grandTotal ?? new Prisma.Decimal(0)).toString();
}

const adminOrderDetailSelect = {
  ...orderCoreSelect,
  userId: true,
  phone: true,
  invoiceType: true,
  invoiceCompanyName: true,
  invoiceTaxOffice: true,
  invoiceTaxNumber: true,
  discountTotal: true,
  taxTotal: true,
  currency: true,
  shippingAddressSnapshot: true,
  billingAddressSnapshot: true,
  customerNote: true,
  confirmedAt: true,
  cancelledAt: true,
  updatedAt: true,
  items: {
    select: {
      id: true,
      productName: true,
      variantName: true,
      sku: true,
      quantity: true,
      regularUnitPrice: true,
      unitPrice: true,
      lineTotal: true,
      productId: true,
      variantId: true,
    },
  },
  payments: { select: { status: true }, where: { status: PaymentStatus.SUCCEEDED }, take: 1 },
} satisfies Prisma.OrderSelect;

export type AdminOrderDetailRow = Prisma.OrderGetPayload<{ select: typeof adminOrderDetailSelect }>;

/** `idempotencyKey`/`requestFingerprint`/`resultAccessToken` kasıtlı olarak select'te YOK — yönetim arayüzünde gösterilmez. */
export async function findOrderForAdmin(id: string): Promise<AdminOrderDetailRow | null> {
  return prisma.order.findUnique({ where: { id }, select: adminOrderDetailSelect });
}

export type UpdateOrderStatusFailureReason = "ORDER_NOT_FOUND" | "INVALID_TRANSITION";
export type UpdateOrderStatusResult =
  | { ok: true; previousStatus: OrderStatus; newStatus: OrderStatus }
  | { ok: false; reason: UpdateOrderStatusFailureReason };

/**
 * Sipariş durumunu değiştirir — yalnızca `canTransitionOrderStatus` true
 * dönen geçişlere izin verilir. `CANCELLED`'a geçişte, tutulan stok
 * rezervasyonu (varsa) AYNI transaction içinde serbest bırakılır — sipariş
 * durumu güncellenip stok serbest kalması atomik, birbirinden ayrı düşmez.
 */
export async function updateOrderStatus(
  orderId: string,
  to: OrderStatus,
): Promise<UpdateOrderStatusResult> {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, select: { status: true } });
    if (!order) {
      return { ok: false, reason: "ORDER_NOT_FOUND" };
    }
    if (!canTransitionOrderStatus(order.status, to)) {
      return { ok: false, reason: "INVALID_TRANSITION" };
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: to,
        ...(to === OrderStatus.CONFIRMED ? { confirmedAt: new Date() } : {}),
        ...(to === OrderStatus.CANCELLED ? { cancelledAt: new Date() } : {}),
      },
    });

    if (to === OrderStatus.CANCELLED) {
      await releaseReservationsForOrder(orderId, "Sipariş iptal edildi", tx);
    }

    return { ok: true, previousStatus: order.status, newStatus: to };
  });
}

export type CancelOrderFailureReason = UpdateOrderStatusFailureReason;
export type CancelOrderResult =
  | { ok: true; previousStatus: OrderStatus }
  | { ok: false; reason: CancelOrderFailureReason };

/**
 * Bir siparişi iptal eder — `updateOrderStatus(orderId, CANCELLED)`'a ince bir
 * sarmalayıcıdır (fetch/geçiş-kontrolü/update mantığını TEKRARLAMAZ, bkz.
 * yukarısı). Durum geçişi `canTransitionOrderStatus` ile doğrulanır (yalnızca
 * PENDING/CONFIRMED/PROCESSING → CANCELLED izinli, bkz. `order-status.ts`).
 * Tutulan stok rezervasyonu `updateOrderStatus` içinde AYNI transaction'da
 * serbest bırakılır (bkz. yukarısı).
 */
export async function cancelOrder(orderId: string): Promise<CancelOrderResult> {
  const result = await updateOrderStatus(orderId, OrderStatus.CANCELLED);
  if (!result.ok) {
    return result;
  }
  return { ok: true, previousStatus: result.previousStatus };
}

export type FinalizeShippingInput = { mode: "FREE" } | { mode: "FIXED"; amount: Prisma.Decimal };

export type FinalizeShippingFailureReason = "ORDER_NOT_FOUND" | "NOT_PENDING" | "INVALID_AMOUNT";

export type FinalizeShippingResult =
  | { ok: true; shippingTotal: Prisma.Decimal; grandTotal: Prisma.Decimal }
  | { ok: false; reason: FinalizeShippingFailureReason };

/**
 * Yönetici, kargo ücreti bilinmeyen (`shippingPriceStatus=PENDING`) bir
 * siparişte gerçek ücreti netleştirir. `subtotal` HER ZAMAN DB'den okunur —
 * client'tan gelen hiçbir tutar kullanılmaz. Sıfır ücret yalnızca `mode:"FREE"`
 * açıkça seçildiğinde kabul edilir; `FIXED` modda tutar pozitif olmalıdır.
 */
export async function finalizeOrderShipping(
  orderId: string,
  input: FinalizeShippingInput,
): Promise<FinalizeShippingResult> {
  if (input.mode === "FIXED" && !input.amount.greaterThan(0)) {
    return { ok: false, reason: "INVALID_AMOUNT" };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { shippingPriceStatus: true, subtotal: true },
  });
  if (!order) {
    return { ok: false, reason: "ORDER_NOT_FOUND" };
  }
  if (order.shippingPriceStatus !== ShippingPriceStatus.PENDING) {
    return { ok: false, reason: "NOT_PENDING" };
  }

  const shippingTotal = input.mode === "FREE" ? new Prisma.Decimal(0) : input.amount;
  const grandTotal = order.subtotal.add(shippingTotal);

  await prisma.order.update({
    where: { id: orderId },
    data: {
      shippingTotal,
      shippingPriceStatus:
        input.mode === "FREE" ? ShippingPriceStatus.FREE : ShippingPriceStatus.FIXED,
      grandTotal,
      totalStatus: OrderTotalStatus.FINAL,
    },
  });

  return { ok: true, shippingTotal, grandTotal };
}
