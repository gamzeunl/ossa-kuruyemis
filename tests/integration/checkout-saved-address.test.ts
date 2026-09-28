/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — `mapSavedAddressToCheckoutFields`
 * + `createDraftOrder`'ın BİRLİKTE doğru çalıştığını ve en kritiği, sipariş
 * ANINDAKİ adres snapshot'ının `Address` tablosuna CANLI bağımlı KALMADIĞINI
 * (kaynak Address sonradan güncellense/silinse dahi Order'ın değişmediğini)
 * kanıtlar. `createDraftOrder`'ın kendisi (idempotency/fingerprint/fiyat/
 * bundle/misafir) `create-draft-order.test.ts`'te zaten kapsamlı test edilmiş
 * ve bu görevde DEĞİŞTİRİLMEDİ — burada tekrar edilmez.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { InvoiceType, ProductStatus } from "@/generated/prisma/client";
import { mapSavedAddressToCheckoutFields } from "@/lib/checkout-address-mapping";
import { createAddress, deleteAddress, updateAddress } from "@/server/repositories/address-repository";
import { createDraftOrder, type CreateDraftOrderInput } from "@/server/repositories/order-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/checkout-saved-address] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

const SHIPPING_SETTINGS = { freeShippingThreshold: null, standardShippingFee: 50 };

describe.skipIf(!hasTestDatabase)("Checkout ↔ kayıtlı adres (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdUserIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdOrderIds: string[] = [];

  let userId: string;
  let variantId: string;

  beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);
    const role = await prisma.role.upsert({
      where: { key: "CUSTOMER" },
      update: {},
      create: { key: "CUSTOMER", name: "Müşteri" },
    });
    const user = await prisma.user.create({
      data: { roleId: role.id, email: `checkout-addr-${suffix}@ossa-test.local`, firstName: "Test", lastName: "Kullanıcı" },
    });
    userId = user.id;
    createdUserIds.push(userId);

    const product = await prisma.product.create({
      data: { name: `Checkout Adres Ürünü ${suffix}`, slug: `checkout-adres-${suffix}`, status: ProductStatus.ACTIVE },
    });
    createdProductIds.push(product.id);
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: `CKA-${suffix}`, name: "500 g", price: "100.00", isActive: true },
    });
    variantId = variant.id;
    await prisma.inventory.create({
      data: { variantId: variant.id, quantityAvailable: 10, quantityReserved: 0, lowStockThreshold: 1 },
    });
  });

  afterAll(async () => {
    // `InventoryMovement`/`StockReservation` → `Order`/`ProductVariant` ilişkisi
    // `onDelete: Restrict` — `createDraftOrder` artık gerçek rezervasyon
    // oluşturduğundan sipariş/varyant silinmeden ÖNCE bu iki tablo temizlenir
    // (bkz. create-draft-order.test.ts'teki aynı düzeltme).
    await prisma.stockReservation.deleteMany({ where: { variantId } });
    await prisma.inventoryMovement.deleteMany({ where: { variantId } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
    await prisma.address.deleteMany({ where: { userId: { in: createdUserIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.inventory.deleteMany({ where: { variant: { productId: { in: createdProductIds } } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  function draftInput(overrides: Partial<CreateDraftOrderInput> = {}): CreateDraftOrderInput {
    return {
      userId,
      email: `checkout-addr-${randomUUID().slice(0, 8)}@ossa-test.local`,
      phone: "05551234567",
      items: [{ variantId, quantity: 1 }],
      shippingAddress: {
        firstName: "X",
        lastName: "Y",
        phone: "05551234567",
        city: "X",
        district: "Y",
        neighborhood: "Z",
        addressLine: "test",
        addressLabel: "test",
      },
      billingAddress: {
        firstName: "X",
        lastName: "Y",
        phone: "05551234567",
        city: "X",
        district: "Y",
        neighborhood: "Z",
        addressLine: "test",
        addressLabel: "test",
      },
      invoice: { invoiceType: InvoiceType.INDIVIDUAL },
      idempotencyKey: randomUUID(),
      ...overrides,
    };
  }

  it("mapSavedAddressToCheckoutFields çıktısıyla oluşturulan sipariş, adresi DOĞRU snapshot'lar", async () => {
    const address = await createAddress(userId, {
      type: "SHIPPING",
      title: "Ev Adresim",
      firstName: "Ayşe",
      lastName: "Yılmaz",
      phone: "05349567879",
      city: "Mersin",
      district: "Mut",
      neighborhood: "Karşıyaka",
      postalCode: "33600",
      addressLine: "Seyran Sokak No:2",
      invoiceCompanyName: null,
      taxOffice: null,
      taxNumber: null,
      isDefault: false,
    });

    const mapped = mapSavedAddressToCheckoutFields(address);
    const result = await createDraftOrder(
      draftInput({ shippingAddress: mapped, billingAddress: mapped, idempotencyKey: randomUUID() }),
      SHIPPING_SETTINGS,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdOrderIds.push(result.orderId);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } });
    const snapshot = order.shippingAddressSnapshot as Record<string, unknown>;
    expect(snapshot.firstName).toBe("Ayşe");
    expect(snapshot.addressLabel).toBe("Ev Adresim"); // title -> addressLabel doğru eşlendi
    expect(snapshot.addressLine).toBe("Seyran Sokak No:2");
    // Address'e özgü, checkout'ta karşılığı olmayan alanlar snapshot'a hiç girmez.
    expect(snapshot).not.toHaveProperty("postalCode");
  });

  it("REGRESYON: sipariş sonrası kaynak Address GÜNCELLENSE dahi Order snapshot'ı değişmez", async () => {
    const address = await createAddress(userId, {
      type: "SHIPPING",
      title: "Değişmeyecek Başlık",
      firstName: "Orijinal",
      lastName: "Ad",
      phone: "05340000000",
      city: "Ankara",
      district: "Çankaya",
      neighborhood: null,
      postalCode: null,
      addressLine: "Orijinal açık adres metni",
      invoiceCompanyName: null,
      taxOffice: null,
      taxNumber: null,
      isDefault: false,
    });

    const mapped = mapSavedAddressToCheckoutFields({ ...address, neighborhood: "Orijinal Mahalle" });
    const result = await createDraftOrder(
      draftInput({ shippingAddress: mapped, billingAddress: mapped, idempotencyKey: randomUUID() }),
      SHIPPING_SETTINGS,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdOrderIds.push(result.orderId);

    // Kaynak adres SONRADAN tamamen farklı bir adrese güncellenir.
    await updateAddress(address.id, userId, {
      type: "SHIPPING",
      title: "Yeni Başlık",
      firstName: "Değişti",
      lastName: "Değişti",
      phone: "05349999999",
      city: "İzmir",
      district: "Konak",
      neighborhood: "Yeni Mahalle",
      postalCode: null,
      addressLine: "Tamamen farklı bir adres",
      invoiceCompanyName: null,
      taxOffice: null,
      taxNumber: null,
      isDefault: false,
    });

    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } });
    const snapshot = order.shippingAddressSnapshot as Record<string, unknown>;
    expect(snapshot.firstName).toBe("Orijinal");
    expect(snapshot.addressLabel).toBe("Değişmeyecek Başlık");
    expect(snapshot.addressLine).toBe("Orijinal açık adres metni");
  });

  it("REGRESYON: sipariş sonrası kaynak Address SİLİNSE dahi Order snapshot'ı değişmez/kaybolmaz", async () => {
    const address = await createAddress(userId, {
      type: "SHIPPING",
      title: "Silinecek Adres",
      firstName: "Silinecek",
      lastName: "Kullanıcı",
      phone: "05345555555",
      city: "Bursa",
      district: "Nilüfer",
      neighborhood: null,
      postalCode: null,
      addressLine: "Silinecek adres satırı",
      invoiceCompanyName: null,
      taxOffice: null,
      taxNumber: null,
      isDefault: false,
    });

    const mapped = mapSavedAddressToCheckoutFields(address);
    const result = await createDraftOrder(
      draftInput({ shippingAddress: mapped, billingAddress: mapped, idempotencyKey: randomUUID() }),
      SHIPPING_SETTINGS,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdOrderIds.push(result.orderId);

    const deleted = await deleteAddress(address.id, userId);
    expect(deleted).toBe(true);

    const order = await prisma.order.findUniqueOrThrow({ where: { id: result.orderId } });
    const snapshot = order.shippingAddressSnapshot as Record<string, unknown>;
    expect(snapshot.addressLabel).toBe("Silinecek Adres");
    expect(snapshot.addressLine).toBe("Silinecek adres satırı");
  });
});
