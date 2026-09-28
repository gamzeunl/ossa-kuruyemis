/**
 * Bu dosya İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz.
 * tests/db.ts, tests/setup.ts, docs/TEST_STRATEGY.md) — dev/production
 * veritabanına ASLA yazmaz. `TEST_DATABASE_URL` tanımsızsa tüm suite
 * `describe.skip` ile atlanır (aşağıdaki konsol uyarısıyla).
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { InvoiceType, OrderStatus, ProductStatus, StockReservationStatus } from "@/generated/prisma/client";
import {
  createDraftOrder,
  hasCompletedPurchase,
  listBestSellingProductIds,
  type CreateDraftOrderInput,
} from "@/server/repositories/order-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn(
    "[tests/integration/create-draft-order] TEST_DATABASE_URL tanımsız — entegrasyon testleri atlanıyor.",
  );
}

const SHIPPING_SETTINGS_FEE = { freeShippingThreshold: null, standardShippingFee: 50 };
const SHIPPING_SETTINGS_UNKNOWN = { freeShippingThreshold: null, standardShippingFee: null };
const SHIPPING_SETTINGS_FREE = { freeShippingThreshold: 1, standardShippingFee: 50 };

function baseAddress() {
  return {
    firstName: "Test",
    lastName: "Kullanıcı",
    phone: "05551234567",
    city: "İstanbul",
    district: "Kadıköy",
    neighborhood: "Test Mahallesi",
    addressLine: "Test sokak no:1",
    addressLabel: "Ev",
  };
}

function baseInput(overrides: Partial<CreateDraftOrderInput> = {}): CreateDraftOrderInput {
  const shippingAddress = overrides.shippingAddress ?? baseAddress();
  return {
    userId: null,
    email: `test-${randomUUID()}@ossa-test.local`,
    phone: "05551234567",
    items: [],
    shippingAddress,
    billingAddress: shippingAddress,
    invoice: { invoiceType: InvoiceType.INDIVIDUAL },
    idempotencyKey: randomUUID(),
    ...overrides,
  };
}

describe.skipIf(!hasTestDatabase)("createDraftOrder (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;

  let productId: string;
  let variantId: string;
  let regularPrice: string;
  let testUserId: string;
  let discountedProductId: string;
  let discountedVariantId: string;
  let discountedRegularPrice: string;
  let discountedEffectivePrice: string;
  let secondProductId: string;
  let secondVariantId: string;
  let secondRegularPrice: string;
  let expiredDiscountProductId: string;
  let expiredDiscountVariantId: string;
  let expiredDiscountRegularPrice: string;
  let bundlePrimaryProductId: string;
  let bundlePrimaryVariantId: string;
  let bundlePrimaryRegularPrice: string;
  let bundleCompanionProductId: string;
  let bundleCompanionVariantId: string;
  let bundleCompanionRegularPrice: string;
  let bundleOfferId: string;
  const BUNDLE_COMPANION_PRICE = "119.00";

  beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);

    const role = await prisma.role.upsert({
      where: { key: "CUSTOMER" },
      update: {},
      create: { key: "CUSTOMER", name: "Müşteri" },
    });

    const user = await prisma.user.create({
      data: {
        roleId: role.id,
        email: `test-user-${suffix}@ossa-test.local`,
        firstName: "Test",
        lastName: "Kullanıcı",
      },
    });
    testUserId = user.id;

    const product = await prisma.product.create({
      data: {
        name: `Test Ürün ${suffix}`,
        slug: `test-urun-${suffix}`,
        status: ProductStatus.ACTIVE,
      },
    });
    productId = product.id;
    regularPrice = "100.00";

    const variant = await prisma.productVariant.create({
      data: {
        productId: product.id,
        sku: `TEST-SKU-${suffix}`,
        name: "500 g",
        price: regularPrice,
        isActive: true,
      },
    });
    variantId = variant.id;

    await prisma.inventory.create({
      data: { variantId: variant.id, quantityAvailable: 500, quantityReserved: 0, lowStockThreshold: 1 },
    });

    // Aktif indirimli ikinci bir ürün/varyant — fiyat snapshot testlerinde kullanılır.
    discountedRegularPrice = "200.00";
    discountedEffectivePrice = "150.00";
    const discountedProduct = await prisma.product.create({
      data: {
        name: `Test İndirimli Ürün ${suffix}`,
        slug: `test-indirimli-urun-${suffix}`,
        status: ProductStatus.ACTIVE,
      },
    });
    discountedProductId = discountedProduct.id;
    const discountedVariant = await prisma.productVariant.create({
      data: {
        productId: discountedProduct.id,
        sku: `TEST-DISCOUNT-SKU-${suffix}`,
        name: "1 kg",
        price: discountedRegularPrice,
        discountPrice: discountedEffectivePrice,
        isDiscountActive: true,
        isActive: true,
      },
    });
    discountedVariantId = discountedVariant.id;
    await prisma.inventory.create({
      data: { variantId: discountedVariant.id, quantityAvailable: 500, quantityReserved: 0, lowStockThreshold: 1 },
    });

    // İndirimsiz farklı bir üçüncü ürün/varyant — çoklu-kalem sipariş testinde kullanılır.
    secondRegularPrice = "75.00";
    const secondProduct = await prisma.product.create({
      data: {
        name: `Test İkinci Ürün ${suffix}`,
        slug: `test-ikinci-urun-${suffix}`,
        status: ProductStatus.ACTIVE,
      },
    });
    secondProductId = secondProduct.id;
    const secondVariant = await prisma.productVariant.create({
      data: {
        productId: secondProduct.id,
        sku: `TEST-SECOND-SKU-${suffix}`,
        name: "250 g",
        price: secondRegularPrice,
        isActive: true,
      },
    });
    secondVariantId = secondVariant.id;
    await prisma.inventory.create({
      data: { variantId: secondVariant.id, quantityAvailable: 500, quantityReserved: 0, lowStockThreshold: 1 },
    });

    // Süresi GEÇMİŞ indirimli dördüncü bir ürün/varyant — `discountPrice`/
    // `isDiscountActive` DB'de hâlâ dolu ama `discountEndsAt` geçmişte. Bu,
    // "kullanıcı ürünü indirimliyken sepete ekleyip indirim bittikten sonra
    // checkout'a gitti" senaryosunu (stale localStorage fiyatı) temsil eder.
    expiredDiscountRegularPrice = "500.00";
    const expiredDiscountProduct = await prisma.product.create({
      data: {
        name: `Test Süresi Geçmiş İndirim ${suffix}`,
        slug: `test-suresi-gecmis-indirim-${suffix}`,
        status: ProductStatus.ACTIVE,
      },
    });
    expiredDiscountProductId = expiredDiscountProduct.id;
    const expiredDiscountVariant = await prisma.productVariant.create({
      data: {
        productId: expiredDiscountProduct.id,
        sku: `TEST-EXPIRED-DISCOUNT-SKU-${suffix}`,
        name: "750 g",
        price: expiredDiscountRegularPrice,
        discountPrice: "399.00",
        isDiscountActive: true,
        discountEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        isActive: true,
      },
    });
    expiredDiscountVariantId = expiredDiscountVariant.id;
    await prisma.inventory.create({
      data: {
        variantId: expiredDiscountVariant.id,
        quantityAvailable: 500,
        quantityReserved: 0,
        lowStockThreshold: 1,
      },
    });

    // "Birlikte Daha Güzel" — Türk Kahvesi (ana) + Lokum (tamamlayıcı) çifti,
    // yalnızca ana varyant sepette VE tamamlayıcı doğru varyantsa geçerli.
    bundlePrimaryRegularPrice = "80.00";
    const bundlePrimaryProduct = await prisma.product.create({
      data: {
        name: `Test Türk Kahvesi ${suffix}`,
        slug: `test-turk-kahvesi-${suffix}`,
        status: ProductStatus.ACTIVE,
      },
    });
    bundlePrimaryProductId = bundlePrimaryProduct.id;
    const bundlePrimaryVariant = await prisma.productVariant.create({
      data: {
        productId: bundlePrimaryProduct.id,
        sku: `TEST-BUNDLE-PRIMARY-SKU-${suffix}`,
        name: "250 g",
        price: bundlePrimaryRegularPrice,
        isActive: true,
      },
    });
    bundlePrimaryVariantId = bundlePrimaryVariant.id;
    await prisma.inventory.create({
      data: { variantId: bundlePrimaryVariant.id, quantityAvailable: 500, quantityReserved: 0, lowStockThreshold: 1 },
    });

    bundleCompanionRegularPrice = "150.00";
    const bundleCompanionProduct = await prisma.product.create({
      data: {
        name: `Test Fındıklı Lokum ${suffix}`,
        slug: `test-findikli-lokum-${suffix}`,
        status: ProductStatus.ACTIVE,
      },
    });
    bundleCompanionProductId = bundleCompanionProduct.id;
    const bundleCompanionVariant = await prisma.productVariant.create({
      data: {
        productId: bundleCompanionProduct.id,
        sku: `TEST-BUNDLE-COMPANION-SKU-${suffix}`,
        name: "500 g",
        price: bundleCompanionRegularPrice,
        isActive: true,
      },
    });
    bundleCompanionVariantId = bundleCompanionVariant.id;
    await prisma.inventory.create({
      data: {
        variantId: bundleCompanionVariant.id,
        quantityAvailable: 500,
        quantityReserved: 0,
        lowStockThreshold: 1,
      },
    });

    const bundleOffer = await prisma.bundleOffer.create({
      data: {
        primaryProductId: bundlePrimaryProductId,
        primaryVariantId: bundlePrimaryVariantId,
        companionProductId: bundleCompanionProductId,
        companionVariantId: bundleCompanionVariantId,
        companionPrice: BUNDLE_COMPANION_PRICE,
        isActive: true,
      },
    });
    bundleOfferId = bundleOffer.id;
  });

  afterAll(async () => {
    // Order → OrderItem ilişkisi `onDelete: Cascade` olduğundan (bkz. schema.prisma)
    // siparişi silmek kalemlerini de otomatik siler — ayrıca `orderItem.deleteMany`
    // ÖNCE çağrılırsa bu sorgunun `items: { some: { productId } }` koşulu artık
    // hiçbir siparişi eşleştiremez (kalemler zaten silinmiş olur).
    const allProductIds = [
      productId,
      discountedProductId,
      secondProductId,
      expiredDiscountProductId,
      bundlePrimaryProductId,
      bundleCompanionProductId,
    ];
    const ordersToDelete = await prisma.order.findMany({
      where: { items: { some: { productId: { in: allProductIds } } } },
      select: { id: true },
    });
    const orderIds = ordersToDelete.map((o) => o.id);
    const allVariantIds = [
      variantId,
      discountedVariantId,
      secondVariantId,
      expiredDiscountVariantId,
      bundlePrimaryVariantId,
      bundleCompanionVariantId,
    ];
    // `InventoryMovement`/`StockReservation` → `Order`/`ProductVariant` ilişkisi
    // bilinçli olarak `onDelete: Restrict` (denetim izi sessizce kaybolmasın diye)
    // — sipariş/varyant silinmeden ÖNCE bu iki tablo variantId'ye göre (orderId'ye
    // göre değil — bazı hareketler `orderId: null` olabilir, ör. hiç olmasa da
    // ileride) TAMAMEN temizlenir (bkz. `inventory-repository.ts`, her
    // `createDraftOrder` çağrısı artık gerçek bir rezervasyon oluşturuyor).
    await prisma.stockReservation.deleteMany({ where: { variantId: { in: allVariantIds } } });
    await prisma.inventoryMovement.deleteMany({ where: { variantId: { in: allVariantIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
    await prisma.bundleOffer.deleteMany({ where: { id: bundleOfferId } });
    await prisma.inventory.deleteMany({ where: { variantId: { in: allVariantIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: allProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: allProductIds } } });
    await prisma.user.delete({ where: { id: testUserId } });
  });

  it("senaryo 7: geçersiz varyantla sipariş oluşmaz", async () => {
    const result = await createDraftOrder(
      baseInput({ items: [{ variantId: "does-not-exist", quantity: 1 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result).toEqual({ ok: false, reason: "ITEM_NOT_FOUND" });
  });

  it("senaryo 8: yayından kaldırılmış ürün sipariş edilemez", async () => {
    await prisma.product.update({ where: { id: productId }, data: { status: ProductStatus.DRAFT } });
    try {
      const result = await createDraftOrder(
        baseInput({ items: [{ variantId, quantity: 1 }] }),
        SHIPPING_SETTINGS_FEE,
      );
      expect(result).toEqual({ ok: false, reason: "PRODUCT_UNAVAILABLE" });
    } finally {
      await prisma.product.update({ where: { id: productId }, data: { status: ProductStatus.ACTIVE } });
    }
  });

  it("senaryo 9: adet sıfır veya negatif olamaz", async () => {
    const zero = await createDraftOrder(
      baseInput({ items: [{ variantId, quantity: 0 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(zero).toEqual({ ok: false, reason: "INVALID_QUANTITY" });

    const negative = await createDraftOrder(
      baseInput({ items: [{ variantId, quantity: -1 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(negative).toEqual({ ok: false, reason: "INVALID_QUANTITY" });
  });

  it("senaryo yetersiz stok: talep edilen adet mevcut stoktan fazlaysa reddedilir", async () => {
    const result = await createDraftOrder(
      baseInput({ items: [{ variantId, quantity: 9999 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result).toEqual({ ok: false, reason: "INSUFFICIENT_STOCK" });
  });

  it("KRİTİK — stok=1 iken iki eşzamanlı sipariş aynı son birimi ALAMAZ (overselling imkansız)", async () => {
    const suffix = randomUUID().slice(0, 8);
    const lastItemProduct = await prisma.product.create({
      data: { name: `Son Birim Ürün ${suffix}`, slug: `son-birim-${suffix}`, status: ProductStatus.ACTIVE },
    });
    const lastItemVariant = await prisma.productVariant.create({
      data: { productId: lastItemProduct.id, sku: `LAST-ITEM-${suffix}`, name: "500 g", price: "50.00", isActive: true },
    });
    await prisma.inventory.create({
      data: { variantId: lastItemVariant.id, quantityAvailable: 1, quantityReserved: 0, lowStockThreshold: 0 },
    });

    try {
      const [buyerA, buyerB] = await Promise.all([
        createDraftOrder(
          baseInput({
            email: `buyer-a-${suffix}@ossa-test.local`,
            items: [{ variantId: lastItemVariant.id, quantity: 1 }],
          }),
          SHIPPING_SETTINGS_FEE,
        ),
        createDraftOrder(
          baseInput({
            email: `buyer-b-${suffix}@ossa-test.local`,
            items: [{ variantId: lastItemVariant.id, quantity: 1 }],
          }),
          SHIPPING_SETTINGS_FEE,
        ),
      ]);

      const results = [buyerA, buyerB];
      const succeeded = results.filter((r) => r.ok);
      const failed = results.filter((r) => !r.ok);

      // Tam olarak BİRİ başarılı olmalı, diğeri INSUFFICIENT_STOCK ile reddedilmeli
      // — ikisi de başarılı olursa overselling gerçekleşmiş demektir (KRİTİK hata).
      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);
      expect(failed[0]).toEqual({ ok: false, reason: "INSUFFICIENT_STOCK" });

      const reservations = await prisma.stockReservation.findMany({
        where: { variantId: lastItemVariant.id, status: StockReservationStatus.ACTIVE },
      });
      expect(reservations).toHaveLength(1);
      expect(reservations[0].quantity).toBe(1);

      const inventory = await prisma.inventory.findUniqueOrThrow({ where: { variantId: lastItemVariant.id } });
      expect(inventory.quantityAvailable).toBe(1);
      expect(inventory.quantityReserved).toBe(1);
    } finally {
      const orders = await prisma.order.findMany({
        where: { items: { some: { productId: lastItemProduct.id } } },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);
      await prisma.stockReservation.deleteMany({ where: { variantId: lastItemVariant.id } });
      await prisma.inventoryMovement.deleteMany({ where: { variantId: lastItemVariant.id } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
      await prisma.inventory.deleteMany({ where: { variantId: lastItemVariant.id } });
      await prisma.productVariant.delete({ where: { id: lastItemVariant.id } });
      await prisma.product.delete({ where: { id: lastItemProduct.id } });
    }
  });

  it("süresi geçmiş rezervasyon: ödemesi tamamlanmamış eski siparişin rezervasyonu son birimi sonsuza kadar kilitlemez", async () => {
    const suffix = randomUUID().slice(0, 8);
    const expiredResProduct = await prisma.product.create({
      data: { name: `Süresi Geçmiş Rezervasyon ${suffix}`, slug: `sureli-rezervasyon-${suffix}`, status: ProductStatus.ACTIVE },
    });
    const expiredResVariant = await prisma.productVariant.create({
      data: { productId: expiredResProduct.id, sku: `EXPIRED-RES-${suffix}`, name: "500 g", price: "50.00", isActive: true },
    });
    await prisma.inventory.create({
      data: { variantId: expiredResVariant.id, quantityAvailable: 1, quantityReserved: 0, lowStockThreshold: 0 },
    });

    try {
      // 1. Alıcı A son birimi rezerve eder ama ödemeyi hiç tamamlamaz (checkout'u terk eder).
      const buyerA = await createDraftOrder(
        baseInput({
          email: `buyer-a-expired-${suffix}@ossa-test.local`,
          items: [{ variantId: expiredResVariant.id, quantity: 1 }],
        }),
        SHIPPING_SETTINGS_FEE,
      );
      expect(buyerA.ok).toBe(true);

      // 2. Zamanı simüle et: rezervasyon süresi dolmuş olsun (15 dakikalık pencere geçti).
      await prisma.stockReservation.updateMany({
        where: { variantId: expiredResVariant.id, status: StockReservationStatus.ACTIVE },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      // 3. Alıcı B aynı son birimi talep eder — `createDraftOrder` kendi transaction'ı
      // içinde süresi geçmiş rezervasyonu geri kazanmalı ve Alıcı B'ye izin vermeli.
      const buyerB = await createDraftOrder(
        baseInput({
          email: `buyer-b-expired-${suffix}@ossa-test.local`,
          items: [{ variantId: expiredResVariant.id, quantity: 1 }],
        }),
        SHIPPING_SETTINGS_FEE,
      );
      expect(buyerB.ok).toBe(true);

      const oldReservation = await prisma.stockReservation.findFirst({
        where: { variantId: expiredResVariant.id, status: StockReservationStatus.EXPIRED },
      });
      expect(oldReservation).not.toBeNull();

      const activeReservations = await prisma.stockReservation.findMany({
        where: { variantId: expiredResVariant.id, status: StockReservationStatus.ACTIVE },
      });
      expect(activeReservations).toHaveLength(1);
      expect(activeReservations[0].quantity).toBe(1);

      const inventory = await prisma.inventory.findUniqueOrThrow({ where: { variantId: expiredResVariant.id } });
      expect(inventory.quantityAvailable).toBe(1);
      expect(inventory.quantityReserved).toBe(1);
    } finally {
      const orders = await prisma.order.findMany({
        where: { items: { some: { productId: expiredResProduct.id } } },
        select: { id: true },
      });
      const orderIds = orders.map((o) => o.id);
      await prisma.stockReservation.deleteMany({ where: { variantId: expiredResVariant.id } });
      await prisma.inventoryMovement.deleteMany({ where: { variantId: expiredResVariant.id } });
      await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
      await prisma.inventory.deleteMany({ where: { variantId: expiredResVariant.id } });
      await prisma.productVariant.delete({ where: { id: expiredResVariant.id } });
      await prisma.product.delete({ where: { id: expiredResProduct.id } });
    }
  });

  it("senaryo 10+11+12: server toplamı hesaplar, OrderItem snapshot'ı (normal+efektif fiyat) doğru kaydeder, asla PAID işaretlenmez", async () => {
    const result = await createDraftOrder(
      baseInput({ items: [{ variantId, quantity: 2 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: result.orderNumber },
      include: { items: true },
    });

    expect(order.orderNumber).toMatch(/^OSSA-\d{8}-[A-Z0-9]{6}$/);
    expect(order.orderNumber).not.toBe(order.id);
    expect(order.status).toBe(OrderStatus.PENDING);

    expect(Number(order.subtotal)).toBeCloseTo(Number(regularPrice) * 2, 2);
    expect(Number(order.shippingTotal)).toBe(SHIPPING_SETTINGS_FEE.standardShippingFee);
    expect(order.shippingPriceStatus).toBe("FIXED");
    expect(order.totalStatus).toBe("FINAL");
    expect(Number(order.grandTotal)).toBeCloseTo(
      Number(regularPrice) * 2 + SHIPPING_SETTINGS_FEE.standardShippingFee,
      2,
    );

    expect(order.items).toHaveLength(1);
    const item = order.items[0];
    expect(item.quantity).toBe(2);
    expect(Number(item.regularUnitPrice)).toBeCloseTo(Number(regularPrice), 2);
    expect(Number(item.unitPrice)).toBeCloseTo(Number(regularPrice), 2);
    expect(Number(item.lineTotal)).toBeCloseTo(Number(regularPrice) * 2, 2);
  });

  it("senaryo 1-3: kargo durumu — bilinmiyor→PENDING/null, bilinen ücret→FIXED, eşik karşılanınca→FREE", async () => {
    const unknown = await createDraftOrder(
      baseInput({ items: [{ variantId, quantity: 1 }] }),
      SHIPPING_SETTINGS_UNKNOWN,
    );
    expect(unknown.ok).toBe(true);
    if (unknown.ok) {
      const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: unknown.orderNumber } });
      expect(order.shippingPriceStatus).toBe("PENDING");
      expect(order.shippingTotal).toBeNull();
      expect(order.totalStatus).toBe("PENDING");
      // totalStatus=PENDING iken grandTotal yalnızca ara toplamı taşır — FINAL göstergesi olmadan kesin toplam sayılmaz.
      expect(Number(order.grandTotal)).toBeCloseTo(Number(regularPrice), 2);
    }

    const free = await createDraftOrder(
      baseInput({ items: [{ variantId, quantity: 1 }] }),
      SHIPPING_SETTINGS_FREE,
    );
    expect(free.ok).toBe(true);
    if (free.ok) {
      const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: free.orderNumber } });
      expect(order.shippingPriceStatus).toBe("FREE");
      expect(Number(order.shippingTotal)).toBe(0);
      expect(order.totalStatus).toBe("FINAL");
    }
  });

  it("senaryo 8 (idempotency): aynı idempotencyKey + aynı içerik tek sipariş oluşturur", async () => {
    const key = randomUUID();
    const input = baseInput({ idempotencyKey: key, items: [{ variantId, quantity: 1 }] });

    const first = await createDraftOrder(input, SHIPPING_SETTINGS_FEE);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = await createDraftOrder(input, SHIPPING_SETTINGS_FEE);
    expect(second).toEqual({
      ok: true,
      orderId: first.orderId,
      orderNumber: first.orderNumber,
      resultAccessToken: first.resultAccessToken,
    });

    const count = await prisma.order.count({ where: { idempotencyKey: key } });
    expect(count).toBe(1);
  });

  it("senaryo 9 (idempotency): eşzamanlı iki aynı istek tek sipariş oluşturur", async () => {
    const key = randomUUID();
    const input = baseInput({ idempotencyKey: key, items: [{ variantId, quantity: 1 }] });

    const [first, second] = await Promise.all([
      createDraftOrder(input, SHIPPING_SETTINGS_FEE),
      createDraftOrder(input, SHIPPING_SETTINGS_FEE),
    ]);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.orderNumber).toBe(second.orderNumber);

    const count = await prisma.order.count({ where: { idempotencyKey: key } });
    expect(count).toBe(1);
  });

  it("senaryo 10 (fingerprint): aynı idempotencyKey + farklı içerik FINGERPRINT_MISMATCH döner", async () => {
    const key = randomUUID();
    const first = await createDraftOrder(
      baseInput({ idempotencyKey: key, items: [{ variantId, quantity: 1 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(first.ok).toBe(true);

    const second = await createDraftOrder(
      baseInput({ idempotencyKey: key, items: [{ variantId, quantity: 2 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(second).toEqual({ ok: false, reason: "FINGERPRINT_MISMATCH" });

    const count = await prisma.order.count({ where: { idempotencyKey: key } });
    expect(count).toBe(1);
  });

  it("senaryo 11: farklı idempotencyKey + aynı müşteri ayrı sipariş oluşturabilir", async () => {
    const email = `same-customer-${randomUUID()}@ossa-test.local`;
    const first = await createDraftOrder(
      baseInput({ email, items: [{ variantId, quantity: 1 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    const second = await createDraftOrder(
      baseInput({ email, items: [{ variantId, quantity: 1 }] }),
      SHIPPING_SETTINGS_FEE,
    );

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.orderNumber).not.toBe(second.orderNumber);

    const count = await prisma.order.count({ where: { email } });
    expect(count).toBe(2);
  });

  it("senaryo 13+14: userId oturumdan bağlanır (client'tan gelen userId doğrudan güvenilmez — bu zaten sunucu tarafında `betterAuthProvider` ile belirlenir)", async () => {
    const result = await createDraftOrder(
      baseInput({ userId: testUserId, items: [{ variantId, quantity: 1 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    expect(order.userId).toBe(testUserId);
  });

  it("senaryo 15+29: PENDING sipariş doğrulanmış alışveriş sayılmaz, çok satan hesabına girmez", async () => {
    const result = await createDraftOrder(
      baseInput({ userId: testUserId, items: [{ variantId, quantity: 5 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result.ok).toBe(true);

    const verified = await hasCompletedPurchase(testUserId, productId);
    expect(verified).toBe(false);

    const bestSellerIds = await listBestSellingProductIds({ windowDays: 90, minUnits: 1, limit: 50 });
    expect(bestSellerIds).not.toContain(productId);
  });

  it("senaryo 16+28: gerçek PAID durumu doğrulanmış alışveriş ve çok satan hesabına girer; 26/27: PENDING/CANCELLED girmez", async () => {
    // Gerçek ödeme entegrasyonu olmadığından bu satır DOĞRUDAN veritabanında
    // simüle edilir — `createDraftOrder` asla PAID üretmez, yalnızca test
    // ortamında mevcut filtre mantığını doğrulamak için kullanılır.
    const paidOrder = await prisma.order.create({
      data: {
        orderNumber: `OSSA-TEST-${randomUUID().slice(0, 8).toUpperCase()}`,
        userId: testUserId,
        email: "paid-test@ossa-test.local",
        phone: "05551234567",
        status: OrderStatus.PAID,
        invoiceType: "INDIVIDUAL",
        subtotal: regularPrice,
        discountTotal: 0,
        shippingTotal: 0,
        shippingPriceStatus: "FREE",
        taxTotal: 0,
        grandTotal: regularPrice,
        totalStatus: "FINAL",
        shippingAddressSnapshot: {},
        billingAddressSnapshot: {},
        idempotencyKey: randomUUID(),
        requestFingerprint: randomUUID(),
        resultAccessToken: randomUUID(),
        items: {
          create: [
            {
              productId,
              variantId,
              productName: "Test Ürün",
              variantName: "500 g",
              sku: "TEST-SKU",
              quantity: 3,
              regularUnitPrice: regularPrice,
              unitPrice: regularPrice,
              lineTotal: (Number(regularPrice) * 3).toFixed(2),
            },
          ],
        },
      },
    });

    try {
      const verified = await hasCompletedPurchase(testUserId, productId);
      expect(verified).toBe(true);

      const bestSellerIds = await listBestSellingProductIds({ windowDays: 90, minUnits: 3, limit: 50 });
      expect(bestSellerIds).toContain(productId);

      // CANCELLED — aynı ürün için tamamlanmış sayılan hiçbir sipariş kalmadığında hesaba girmemeli.
      await prisma.order.update({ where: { id: paidOrder.id }, data: { status: OrderStatus.CANCELLED } });
      const bestSellerIdsAfterCancel = await listBestSellingProductIds({
        windowDays: 90,
        minUnits: 3,
        limit: 50,
      });
      expect(bestSellerIdsAfterCancel).not.toContain(productId);
      const verifiedAfterCancel = await hasCompletedPurchase(testUserId, productId);
      expect(verifiedAfterCancel).toBe(false);
    } finally {
      await prisma.orderItem.deleteMany({ where: { orderId: paidOrder.id } });
      await prisma.order.delete({ where: { id: paidOrder.id } });
    }
  });

  it("fiyat snapshot — aktif indirimli varyant: regularUnitPrice normal fiyatı, unitPrice/lineTotal indirimli fiyatı taşır", async () => {
    const quantity = 2;
    const result = await createDraftOrder(
      baseInput({ items: [{ variantId: discountedVariantId, quantity }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: result.orderNumber },
      include: { items: true },
    });

    expect(order.items).toHaveLength(1);
    const item = order.items[0];
    expect(Number(item.regularUnitPrice)).toBeCloseTo(Number(discountedRegularPrice), 2);
    expect(Number(item.unitPrice)).toBeCloseTo(Number(discountedEffectivePrice), 2);
    expect(Number(item.lineTotal)).toBeCloseTo(Number(discountedEffectivePrice) * quantity, 2);
    expect(Number(order.subtotal)).toBeCloseTo(Number(discountedEffectivePrice) * quantity, 2);
  });

  it("fiyat snapshot — süresi geçmiş indirim: discountPrice/isDiscountActive DB'de dolu olsa bile sipariş normal fiyat üzerinden oluşur (stale sepet fiyatına güvenilmez)", async () => {
    const result = await createDraftOrder(
      baseInput({ items: [{ variantId: expiredDiscountVariantId, quantity: 1 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: result.orderNumber },
      include: { items: true },
    });
    const item = order.items[0];
    expect(Number(item.regularUnitPrice)).toBeCloseTo(Number(expiredDiscountRegularPrice), 2);
    // Süresi geçmiş indirimin fiyatı (399.00) DEĞİL, güncel normal fiyat kullanılır.
    expect(Number(item.unitPrice)).toBeCloseTo(Number(expiredDiscountRegularPrice), 2);
    expect(Number(order.subtotal)).toBeCloseTo(Number(expiredDiscountRegularPrice), 2);
  });

  it("fiyat snapshot — çoklu farklı varyant: her kalem kendi normal/efektif fiyatını bağımsız taşır, subtotal tüm satır toplamlarının toplamıdır", async () => {
    const result = await createDraftOrder(
      baseInput({
        items: [
          { variantId, quantity: 1 },
          { variantId: discountedVariantId, quantity: 3 },
          { variantId: secondVariantId, quantity: 2 },
        ],
      }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderNumber: result.orderNumber },
      include: { items: true },
    });
    expect(order.items).toHaveLength(3);

    const plainItem = order.items.find((i) => i.variantId === variantId);
    const discountedItem = order.items.find((i) => i.variantId === discountedVariantId);
    const secondItem = order.items.find((i) => i.variantId === secondVariantId);
    expect(plainItem && discountedItem && secondItem).toBeTruthy();
    if (!plainItem || !discountedItem || !secondItem) return;

    expect(Number(plainItem.regularUnitPrice)).toBeCloseTo(Number(regularPrice), 2);
    expect(Number(plainItem.unitPrice)).toBeCloseTo(Number(regularPrice), 2);
    expect(Number(plainItem.lineTotal)).toBeCloseTo(Number(regularPrice) * 1, 2);

    expect(Number(discountedItem.regularUnitPrice)).toBeCloseTo(Number(discountedRegularPrice), 2);
    expect(Number(discountedItem.unitPrice)).toBeCloseTo(Number(discountedEffectivePrice), 2);
    expect(Number(discountedItem.lineTotal)).toBeCloseTo(Number(discountedEffectivePrice) * 3, 2);

    expect(Number(secondItem.regularUnitPrice)).toBeCloseTo(Number(secondRegularPrice), 2);
    expect(Number(secondItem.unitPrice)).toBeCloseTo(Number(secondRegularPrice), 2);
    expect(Number(secondItem.lineTotal)).toBeCloseTo(Number(secondRegularPrice) * 2, 2);

    const expectedSubtotal =
      Number(regularPrice) * 1 + Number(discountedEffectivePrice) * 3 + Number(secondRegularPrice) * 2;
    expect(Number(order.subtotal)).toBeCloseTo(expectedSubtotal, 2);
  });

  it("fiyat snapshot — değişmezlik: sipariş sonrası ürün fiyatı/indirimi değişse dahi zaten oluşturulmuş OrderItem etkilenmez", async () => {
    const result = await createDraftOrder(
      baseInput({ items: [{ variantId: discountedVariantId, quantity: 1 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    try {
      // Sipariş oluştuktan SONRA kaynak varyantın fiyatı/indirimi değiştirilir.
      await prisma.productVariant.update({
        where: { id: discountedVariantId },
        data: { price: "999.00", discountPrice: "1.00", isDiscountActive: false },
      });

      const order = await prisma.order.findUniqueOrThrow({
        where: { orderNumber: result.orderNumber },
        include: { items: true },
      });
      const item = order.items[0];
      expect(Number(item.regularUnitPrice)).toBeCloseTo(Number(discountedRegularPrice), 2);
      expect(Number(item.unitPrice)).toBeCloseTo(Number(discountedEffectivePrice), 2);
      expect(Number(order.subtotal)).toBeCloseTo(Number(discountedEffectivePrice), 2);
    } finally {
      // Sonraki testler bu varyantın orijinal fiyat/indirimine güvendiği için geri alınır.
      await prisma.productVariant.update({
        where: { id: discountedVariantId },
        data: { price: discountedRegularPrice, discountPrice: discountedEffectivePrice, isDiscountActive: true },
      });
    }
  });

  it("fatura — bireysel siparişte şirket alanları (companyName/taxOffice/taxNumber) null kaydedilir", async () => {
    const result = await createDraftOrder(
      baseInput({ items: [{ variantId, quantity: 1 }] }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    expect(order.invoiceType).toBe(InvoiceType.INDIVIDUAL);
    expect(order.invoiceCompanyName).toBeNull();
    expect(order.invoiceTaxOffice).toBeNull();
    expect(order.invoiceTaxNumber).toBeNull();
  });

  it("fatura — kurumsal siparişte invoiceType + şirket alanları doğru snapshot'lanır", async () => {
    const result = await createDraftOrder(
      baseInput({
        items: [{ variantId, quantity: 1 }],
        invoice: {
          invoiceType: InvoiceType.CORPORATE,
          companyName: "Test Kuruyemiş A.Ş.",
          taxOffice: "Kadıköy",
          taxNumber: "1234567890",
        },
      }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    expect(order.invoiceType).toBe(InvoiceType.CORPORATE);
    expect(order.invoiceCompanyName).toBe("Test Kuruyemiş A.Ş.");
    expect(order.invoiceTaxOffice).toBe("Kadıköy");
    expect(order.invoiceTaxNumber).toBe("1234567890");
  });

  it("fatura adresi — teslimattan ayrı girilen fatura adresi billingAddressSnapshot'a ayrı kaydedilir", async () => {
    const shippingAddress = baseAddress();
    const billingAddress = { ...baseAddress(), city: "Ankara", district: "Çankaya", addressLine: "Fatura sokak no:2" };

    const result = await createDraftOrder(
      baseInput({ items: [{ variantId, quantity: 1 }], shippingAddress, billingAddress }),
      SHIPPING_SETTINGS_FEE,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const order = await prisma.order.findUniqueOrThrow({ where: { orderNumber: result.orderNumber } });
    expect(order.shippingAddressSnapshot).toEqual(shippingAddress);
    expect(order.billingAddressSnapshot).toEqual(billingAddress);
    expect(order.billingAddressSnapshot).not.toEqual(order.shippingAddressSnapshot);
  });

  describe("Birlikte Daha Güzel — bundle fiyatlandırma (Türk Kahvesi + Lokum)", () => {
    it("ana ürün (primary) sepette yoksa tamamlayıcı bundle fiyatı ALMAZ (KRİTİK KURAL)", async () => {
      const result = await createDraftOrder(
        baseInput({ items: [{ variantId: bundleCompanionVariantId, quantity: 1 }] }),
        SHIPPING_SETTINGS_FEE,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const order = await prisma.order.findUniqueOrThrow({
        where: { orderNumber: result.orderNumber },
        include: { items: true },
      });
      expect(order.items).toHaveLength(1);
      expect(Number(order.items[0].unitPrice)).toBeCloseTo(Number(bundleCompanionRegularPrice), 2);
    });

    it("yanlış (kampanyaya bağlı olmayan) bir varyant primary ile birlikte sepette olsa bile bundle fiyatı ALMAZ", async () => {
      const result = await createDraftOrder(
        baseInput({
          items: [
            { variantId: bundlePrimaryVariantId, quantity: 1 },
            { variantId: secondVariantId, quantity: 1 },
          ],
        }),
        SHIPPING_SETTINGS_FEE,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const order = await prisma.order.findUniqueOrThrow({
        where: { orderNumber: result.orderNumber },
        include: { items: true },
      });
      const impostorItem = order.items.find((item) => item.variantId === secondVariantId);
      expect(impostorItem).toBeTruthy();
      expect(Number(impostorItem?.unitPrice)).toBeCloseTo(Number(secondRegularPrice), 2);
    });

    it("1 primary + 1 companion → companion bundle fiyatıyla (₺119) tek satır kaydedilir, primary kendi normal fiyatını korur", async () => {
      const result = await createDraftOrder(
        baseInput({
          items: [
            { variantId: bundlePrimaryVariantId, quantity: 1 },
            { variantId: bundleCompanionVariantId, quantity: 1 },
          ],
        }),
        SHIPPING_SETTINGS_FEE,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const order = await prisma.order.findUniqueOrThrow({
        where: { orderNumber: result.orderNumber },
        include: { items: true },
      });
      const primaryItem = order.items.find((item) => item.variantId === bundlePrimaryVariantId);
      const companionItems = order.items.filter((item) => item.variantId === bundleCompanionVariantId);
      expect(Number(primaryItem?.unitPrice)).toBeCloseTo(Number(bundlePrimaryRegularPrice), 2);
      expect(companionItems).toHaveLength(1);
      expect(companionItems[0].quantity).toBe(1);
      expect(Number(companionItems[0].unitPrice)).toBeCloseTo(Number(BUNDLE_COMPANION_PRICE), 2);
    });

    it("1 primary + 3 companion → yalnızca 1 birim bundle fiyatlı, kalan 2 birim bağımsız fiyatlı AYRI bir satır olarak kaydedilir", async () => {
      const result = await createDraftOrder(
        baseInput({
          items: [
            { variantId: bundlePrimaryVariantId, quantity: 1 },
            { variantId: bundleCompanionVariantId, quantity: 3 },
          ],
        }),
        SHIPPING_SETTINGS_FEE,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const order = await prisma.order.findUniqueOrThrow({
        where: { orderNumber: result.orderNumber },
        include: { items: true },
      });
      const companionItems = order.items.filter((item) => item.variantId === bundleCompanionVariantId);
      expect(companionItems).toHaveLength(2);

      const bundleSegment = companionItems.find((item) => item.quantity === 1);
      const independentSegment = companionItems.find((item) => item.quantity === 2);
      expect(bundleSegment).toBeTruthy();
      expect(independentSegment).toBeTruthy();
      expect(Number(bundleSegment?.unitPrice)).toBeCloseTo(Number(BUNDLE_COMPANION_PRICE), 2);
      expect(Number(independentSegment?.unitPrice)).toBeCloseTo(Number(bundleCompanionRegularPrice), 2);

      const totalCompanionQuantity = companionItems.reduce((sum, item) => sum + item.quantity, 0);
      expect(totalCompanionQuantity).toBe(3);
    });

    it("2 primary + 2 companion → tek satır, 2 adedin TAMAMI bundle fiyatlı", async () => {
      const result = await createDraftOrder(
        baseInput({
          items: [
            { variantId: bundlePrimaryVariantId, quantity: 2 },
            { variantId: bundleCompanionVariantId, quantity: 2 },
          ],
        }),
        SHIPPING_SETTINGS_FEE,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const order = await prisma.order.findUniqueOrThrow({
        where: { orderNumber: result.orderNumber },
        include: { items: true },
      });
      const companionItems = order.items.filter((item) => item.variantId === bundleCompanionVariantId);
      expect(companionItems).toHaveLength(1);
      expect(companionItems[0].quantity).toBe(2);
      expect(Number(companionItems[0].unitPrice)).toBeCloseTo(Number(BUNDLE_COMPANION_PRICE), 2);
    });

    it("client'ın gönderebildiği TEK veri {variantId,quantity} (bkz. DraftOrderItemInput — hiçbir fiyat alanı YOK) ile bile sunucu kendi bundle eşleşmesini kurar — sahte fiyat kanalı yapısal olarak mevcut değil", async () => {
      const items: CreateDraftOrderInput["items"] = [
        { variantId: bundlePrimaryVariantId, quantity: 1 },
        { variantId: bundleCompanionVariantId, quantity: 1 },
      ];
      expect(Object.keys(items[0])).toEqual(["variantId", "quantity"]);

      const result = await createDraftOrder(baseInput({ items }), SHIPPING_SETTINGS_FEE);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      const order = await prisma.order.findUniqueOrThrow({
        where: { orderNumber: result.orderNumber },
        include: { items: true },
      });
      const companionItem = order.items.find((item) => item.variantId === bundleCompanionVariantId);
      expect(Number(companionItem?.unitPrice)).toBeCloseTo(Number(BUNDLE_COMPANION_PRICE), 2);
    });

    it("değişmezlik: sipariş sonrası kampanya pasif hâle getirilse/silinse dahi zaten oluşturulmuş OrderItem'ın bundle fiyatı DEĞİŞMEZ", async () => {
      const result = await createDraftOrder(
        baseInput({
          items: [
            { variantId: bundlePrimaryVariantId, quantity: 1 },
            { variantId: bundleCompanionVariantId, quantity: 1 },
          ],
        }),
        SHIPPING_SETTINGS_FEE,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      try {
        await prisma.bundleOffer.update({ where: { id: bundleOfferId }, data: { isActive: false } });

        const order = await prisma.order.findUniqueOrThrow({
          where: { orderNumber: result.orderNumber },
          include: { items: true },
        });
        const companionItem = order.items.find((item) => item.variantId === bundleCompanionVariantId);
        expect(Number(companionItem?.unitPrice)).toBeCloseTo(Number(BUNDLE_COMPANION_PRICE), 2);
      } finally {
        await prisma.bundleOffer.update({ where: { id: bundleOfferId }, data: { isActive: true } });
      }
    });
  });
});
