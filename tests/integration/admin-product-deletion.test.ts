/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz. tests/db.ts).
 * Ürün silme güvenliğini doğrular: geçmiş kaydı OLMAYAN bir ürün kalıcı
 * silinir, geçmiş sipariş/review/bundle/vb. kaydı OLAN bir ürün ASLA
 * hard-delete edilmez — güvenli şekilde ARCHIVED yapılır (bkz. görev kuralı,
 * "historical order integrity > fiziksel silme").
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { InvoiceType, ProductStatus } from "@/generated/prisma/client";
import { checkProductDeletionSafety, deleteOrArchiveProduct } from "@/server/repositories/product-repository";
import { prisma as sharedPrisma } from "@/server/db/prisma";
import { getTestPrismaClient, hasTestDatabase } from "../db";

// `deleteProductAction`'ın yetkilendirme davranışı (oturumsuz/ADMIN olmayan
// çağrı reddi) `tests/unit/admin-products-action.test.ts`'te mock'lanmış
// `betterAuthProvider` ile test edilir — bu dosya gerçek bir Next.js istek
// bağlamı OLMADIĞI için `next/headers` burada çalışmaz; bu yüzden BURADA
// yalnızca repository katmanı (DB'ye gerçekten dokunan iş mantığı) test edilir.

if (!hasTestDatabase) {
  console.warn("[tests/integration/admin-product-deletion] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("Ürün silme güvenliği (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdProductIds: string[] = [];
  const createdOrderIds: string[] = [];

  async function createTestProduct(suffix: string) {
    const product = await prisma.product.create({
      data: { name: `Silme Test ${suffix}`, slug: `silme-test-${suffix}`, status: ProductStatus.ACTIVE },
    });
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: `DEL-TEST-${suffix}`, name: "500 g", price: "50.00", isActive: true },
    });
    createdProductIds.push(product.id);
    return { productId: product.id, variantId: variant.id };
  }

  afterEach(async () => {
    await prisma.stockReservation.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.inventoryMovement.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
    createdOrderIds.length = 0;
    // Hâlâ var olan (silinmemiş/arşivlenmiş) test ürünlerini temizle.
    for (const productId of createdProductIds) {
      await prisma.product.deleteMany({ where: { id: productId } }).catch(() => {});
    }
    createdProductIds.length = 0;
  });

  it("geçmiş kaydı olmayan bir ürün güvenle hard-delete edilebilir", async () => {
    const suffix = randomUUID().slice(0, 8);
    const { productId } = await createTestProduct(suffix);

    const safety = await checkProductDeletionSafety(productId);
    expect(safety.canHardDelete).toBe(true);
    expect(safety.blockingReasons).toEqual([]);

    const result = await deleteOrArchiveProduct(productId);
    expect(result).toEqual({ ok: true, mode: "HARD_DELETE" });

    const stillExists = await prisma.product.findUnique({ where: { id: productId } });
    expect(stillExists).toBeNull();
  });

  it("geçmiş bir siparişte kullanılmış ürün ASLA hard-delete edilmez — ARCHIVED yapılır", async () => {
    const suffix = randomUUID().slice(0, 8);
    const { productId, variantId } = await createTestProduct(suffix);

    const order = await sharedPrisma.order.create({
      data: {
        orderNumber: `OSSA-TEST-${suffix.toUpperCase()}`,
        email: `test-${suffix}@ossa-test.local`,
        phone: "05551234567",
        invoiceType: InvoiceType.INDIVIDUAL,
        subtotal: "50.00",
        discountTotal: "0",
        shippingTotal: "0",
        shippingPriceStatus: "FREE",
        taxTotal: "0",
        grandTotal: "50.00",
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
    await sharedPrisma.orderItem.create({
      data: {
        orderId: order.id,
        productId,
        variantId,
        productName: "Silme Test",
        variantName: "500 g",
        sku: `DEL-TEST-${suffix}`,
        quantity: 1,
        regularUnitPrice: "50.00",
        unitPrice: "50.00",
        lineTotal: "50.00",
      },
    });

    const safety = await checkProductDeletionSafety(productId);
    expect(safety.canHardDelete).toBe(false);
    expect(safety.blockingReasons).toContain("geçmiş siparişlerde kullanılmış");

    const result = await deleteOrArchiveProduct(productId);
    expect(result.ok).toBe(true);
    expect(result.mode).toBe("ARCHIVED");

    const product = await prisma.product.findUnique({ where: { id: productId } });
    expect(product?.status).toBe(ProductStatus.ARCHIVED);
    // Sipariş kaydı bozulmadı — hâlâ ürüne bağlı.
    const orderItem = await sharedPrisma.orderItem.findFirst({ where: { orderId: order.id } });
    expect(orderItem?.productId).toBe(productId);
  });

  it("bir review'ı olan ürün de hard-delete edilmez", async () => {
    const suffix = randomUUID().slice(0, 8);
    const { productId } = await createTestProduct(suffix);

    const role = await prisma.role.upsert({
      where: { key: "CUSTOMER" },
      update: {},
      create: { key: "CUSTOMER", name: "Müşteri" },
    });
    const customer = await prisma.user.create({
      data: { roleId: role.id, email: `reviewer-${suffix}@ossa-test.local`, firstName: "Test", lastName: "Müşteri" },
    });
    await prisma.review.create({
      data: {
        productId,
        userId: customer.id,
        rating: 5,
        displayName: "Test Müşteri",
        status: "APPROVED",
      },
    });

    const safety = await checkProductDeletionSafety(productId);
    expect(safety.canHardDelete).toBe(false);
    expect(safety.blockingReasons).toContain("müşteri yorumu var");

    await prisma.review.deleteMany({ where: { productId } });
    await prisma.user.delete({ where: { id: customer.id } });
  });
});
