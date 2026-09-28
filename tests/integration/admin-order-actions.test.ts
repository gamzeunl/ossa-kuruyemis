/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — repository katmanındaki admin
 * sipariş fonksiyonlarını (`updateOrderStatus`, `cancelOrder`,
 * `finalizeOrderShipping`, `listOrdersForAdmin`, `findOrderForAdmin`,
 * `findOrderByResultAccessToken`, `findOrderForUser`) doğrudan test eder.
 * `src/actions/admin-orders.ts` katmanı (oturum + `revalidatePath`) gerçek bir
 * Next.js istek bağlamı gerektirdiğinden burada değil, canlı sunucu
 * doğrulamasında test edilir.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { OrderStatus, PaymentStatus, Prisma, ProductStatus, ShippingPriceStatus } from "@/generated/prisma/client";
import {
  cancelOrder,
  finalizeOrderShipping,
  findOrderByResultAccessToken,
  findOrderForAdmin,
  findOrderForUser,
  listOrdersForAdmin,
  sumOrderGrandTotal,
  updateOrderStatus,
} from "@/server/repositories/order-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn(
    "[tests/integration/admin-order-actions] TEST_DATABASE_URL tanımsız — testler atlanıyor.",
  );
}

describe.skipIf(!hasTestDatabase)("admin sipariş repository fonksiyonları (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;

  let productId: string;
  let variantId: string;
  let orderId: string;
  let ownerUserId: string;
  let otherUserId: string;

  async function createPendingOrder(overrides: Partial<Prisma.OrderUncheckedCreateInput> = {}) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `OSSA-TEST-${randomUUID().slice(0, 8).toUpperCase()}`,
        email: "admin-test@ossa-test.local",
        phone: "05551234567",
        status: OrderStatus.PENDING,
        invoiceType: "INDIVIDUAL",
        subtotal: "100.00",
        discountTotal: "0",
        shippingTotal: null,
        shippingPriceStatus: ShippingPriceStatus.PENDING,
        taxTotal: "0",
        grandTotal: "100.00",
        totalStatus: "PENDING",
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
              quantity: 1,
              regularUnitPrice: "100.00",
              unitPrice: "100.00",
              lineTotal: "100.00",
            },
          ],
        },
        ...overrides,
      },
    });
    return order.id;
  }

  beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);
    const product = await prisma.product.create({
      data: { name: `Admin Test Ürün ${suffix}`, slug: `admin-test-${suffix}`, status: ProductStatus.ACTIVE },
    });
    productId = product.id;
    const variant = await prisma.productVariant.create({
      data: { productId, sku: `ADMIN-TEST-${suffix}`, name: "500 g", price: "100.00", isActive: true },
    });
    variantId = variant.id;

    const role = await prisma.role.upsert({
      where: { key: "CUSTOMER" },
      update: {},
      create: { key: "CUSTOMER", name: "Müşteri" },
    });
    const owner = await prisma.user.create({
      data: { roleId: role.id, email: `admin-owner-${suffix}@ossa-test.local`, firstName: "Sahip", lastName: "Kullanıcı" },
    });
    ownerUserId = owner.id;
    const other = await prisma.user.create({
      data: { roleId: role.id, email: `admin-other-${suffix}@ossa-test.local`, firstName: "Başka", lastName: "Kullanıcı" },
    });
    otherUserId = other.id;
  });

  beforeEach(async () => {
    orderId = await createPendingOrder();
  });

  afterAll(async () => {
    // Payment satırları `onDelete: Restrict` ile Order'a bağlı — sipariş silinmeden önce silinmeli.
    await prisma.payment.deleteMany({ where: { order: { items: { some: { productId } } } } });
    await prisma.order.deleteMany({ where: { items: { some: { productId } } } });
    await prisma.productVariant.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
    await prisma.user.deleteMany({ where: { id: { in: [ownerUserId, otherUserId] } } });
  });

  describe("updateOrderStatus", () => {
    it("senaryo 17: izin verilen geçiş (PENDING→CONFIRMED) başarılı olur", async () => {
      const result = await updateOrderStatus(orderId, OrderStatus.CONFIRMED);
      expect(result).toEqual({ ok: true, previousStatus: OrderStatus.PENDING, newStatus: OrderStatus.CONFIRMED });

      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(order.status).toBe(OrderStatus.CONFIRMED);
      expect(order.confirmedAt).not.toBeNull();
    });

    it("senaryo 16: izin verilmeyen geçiş (PENDING→DELIVERED) reddedilir", async () => {
      const result = await updateOrderStatus(orderId, OrderStatus.DELIVERED);
      expect(result).toEqual({ ok: false, reason: "INVALID_TRANSITION" });

      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(order.status).toBe(OrderStatus.PENDING);
    });

    it("sipariş asla admin tarafından PAID işaretlenemez", async () => {
      const result = await updateOrderStatus(orderId, OrderStatus.PAID);
      expect(result).toEqual({ ok: false, reason: "INVALID_TRANSITION" });
    });

    it("var olmayan sipariş ORDER_NOT_FOUND döner", async () => {
      const result = await updateOrderStatus("does-not-exist", OrderStatus.CONFIRMED);
      expect(result).toEqual({ ok: false, reason: "ORDER_NOT_FOUND" });
    });
  });

  describe("cancelOrder", () => {
    it("senaryo 18: PENDING sipariş iptal edilebilir", async () => {
      const result = await cancelOrder(orderId);
      expect(result).toEqual({ ok: true, previousStatus: OrderStatus.PENDING });

      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.cancelledAt).not.toBeNull();
    });

    it("zaten DELIVERED olan sipariş iptal edilemez", async () => {
      await prisma.order.update({ where: { id: orderId }, data: { status: OrderStatus.DELIVERED } });
      const result = await cancelOrder(orderId);
      expect(result).toEqual({ ok: false, reason: "INVALID_TRANSITION" });
    });
  });

  describe("finalizeOrderShipping", () => {
    it("senaryo 5+6: ücretsiz kargo açıkça seçildiğinde FREE + shippingTotal=0 + totalStatus=FINAL olur", async () => {
      const result = await finalizeOrderShipping(orderId, { mode: "FREE" });
      expect(result.ok).toBe(true);

      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(order.shippingPriceStatus).toBe(ShippingPriceStatus.FREE);
      expect(Number(order.shippingTotal)).toBe(0);
      expect(order.totalStatus).toBe("FINAL");
      expect(Number(order.grandTotal)).toBeCloseTo(100, 2);
    });

    it("senaryo 5: sabit ücret server'da subtotal'dan yeniden grandTotal hesaplar", async () => {
      const result = await finalizeOrderShipping(orderId, { mode: "FIXED", amount: new Prisma.Decimal("35.50") });
      expect(result.ok).toBe(true);

      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(order.shippingPriceStatus).toBe(ShippingPriceStatus.FIXED);
      expect(Number(order.shippingTotal)).toBeCloseTo(35.5, 2);
      expect(Number(order.grandTotal)).toBeCloseTo(135.5, 2);
      expect(order.totalStatus).toBe("FINAL");
    });

    it("senaryo 7: sıfır/negatif sabit ücret reddedilir", async () => {
      const zero = await finalizeOrderShipping(orderId, { mode: "FIXED", amount: new Prisma.Decimal("0") });
      expect(zero).toEqual({ ok: false, reason: "INVALID_AMOUNT" });

      const negative = await finalizeOrderShipping(orderId, { mode: "FIXED", amount: new Prisma.Decimal("-5") });
      expect(negative).toEqual({ ok: false, reason: "INVALID_AMOUNT" });

      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      expect(order.shippingPriceStatus).toBe(ShippingPriceStatus.PENDING);
    });

    it("kargo zaten netleşmiş bir siparişte tekrar netleştirme NOT_PENDING döner", async () => {
      const first = await finalizeOrderShipping(orderId, { mode: "FREE" });
      expect(first.ok).toBe(true);

      const second = await finalizeOrderShipping(orderId, { mode: "FIXED", amount: new Prisma.Decimal("10") });
      expect(second).toEqual({ ok: false, reason: "NOT_PENDING" });
    });
  });

  describe("findOrderForAdmin", () => {
    it("var olan sipariş bulunur ve gizli alanlar (idempotencyKey/requestFingerprint/resultAccessToken) select'e dahil değildir", async () => {
      const order = await findOrderForAdmin(orderId);
      expect(order).not.toBeNull();
      expect(order?.id).toBe(orderId);
      expect(order && "idempotencyKey" in order).toBe(false);
      expect(order && "requestFingerprint" in order).toBe(false);
      expect(order && "resultAccessToken" in order).toBe(false);
    });

    it("var olmayan sipariş null döner", async () => {
      const order = await findOrderForAdmin("does-not-exist");
      expect(order).toBeNull();
    });
  });

  describe("findOrderByResultAccessToken", () => {
    it("doğru sipariş no + doğru token ile sipariş bulunur", async () => {
      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      const result = await findOrderByResultAccessToken(order.orderNumber, order.resultAccessToken);
      expect(result?.id).toBe(orderId);
    });

    it("yanlış token ile null döner", async () => {
      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      const result = await findOrderByResultAccessToken(order.orderNumber, randomUUID());
      expect(result).toBeNull();
    });

    it("doğru token ama yanlış sipariş no ile null döner", async () => {
      const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
      const result = await findOrderByResultAccessToken("OSSA-YANLIS-NO", order.resultAccessToken);
      expect(result).toBeNull();
    });
  });

  describe("findOrderForUser", () => {
    it("siparişin sahibi kendi siparişini görebilir", async () => {
      const ownedOrderId = await createPendingOrder({ userId: ownerUserId });
      const order = await prisma.order.findUniqueOrThrow({ where: { id: ownedOrderId } });

      const result = await findOrderForUser(order.orderNumber, ownerUserId);
      expect(result?.id).toBe(ownedOrderId);
    });

    it("başka bir kullanıcı siparişi göremez", async () => {
      const ownedOrderId = await createPendingOrder({ userId: ownerUserId });
      const order = await prisma.order.findUniqueOrThrow({ where: { id: ownedOrderId } });

      const result = await findOrderForUser(order.orderNumber, otherUserId);
      expect(result).toBeNull();
    });
  });

  describe("listOrdersForAdmin", () => {
    it("status filtresi yalnızca eşleşen durumdaki siparişleri döner", async () => {
      const marker = randomUUID().slice(0, 8);
      const confirmedOrderId = await createPendingOrder({
        email: `list-status-${marker}@ossa-test.local`,
        status: OrderStatus.CONFIRMED,
      });
      const pendingOrderId = await createPendingOrder({ email: `list-status-${marker}-pending@ossa-test.local` });

      const { rows, total } = await listOrdersForAdmin({
        page: 1,
        pageSize: 20,
        status: OrderStatus.CONFIRMED,
        search: `list-status-${marker}`,
      });

      expect(total).toBe(1);
      expect(rows.map((r) => r.id)).toEqual([confirmedOrderId]);
      expect(rows.map((r) => r.id)).not.toContain(pendingOrderId);
    });

    it("arama sipariş no/e-posta/telefon üzerinde çalışır", async () => {
      const marker = randomUUID().slice(0, 8);
      const targetOrderId = await createPendingOrder({
        email: `search-target-${marker}@ossa-test.local`,
        phone: "05559998877",
      });
      const target = await prisma.order.findUniqueOrThrow({ where: { id: targetOrderId } });

      const byEmail = await listOrdersForAdmin({ page: 1, pageSize: 20, search: `search-target-${marker}` });
      expect(byEmail.rows.map((r) => r.id)).toEqual([targetOrderId]);

      const byOrderNumber = await listOrdersForAdmin({ page: 1, pageSize: 20, search: target.orderNumber });
      expect(byOrderNumber.rows.map((r) => r.id)).toEqual([targetOrderId]);

      const byPhone = await listOrdersForAdmin({ page: 1, pageSize: 20, search: "05559998877" });
      expect(byPhone.rows.map((r) => r.id)).toContain(targetOrderId);
    });

    it("dateFrom/dateTo tarih aralığı dışındaki siparişleri hariç tutar", async () => {
      const marker = randomUUID().slice(0, 8);
      const oldOrderId = await createPendingOrder({ email: `list-date-${marker}@ossa-test.local` });
      await prisma.order.update({
        where: { id: oldOrderId },
        data: { createdAt: new Date("2020-01-01T00:00:00.000Z") },
      });
      const recentOrderId = await createPendingOrder({ email: `list-date-${marker}-recent@ossa-test.local` });

      const { rows, total } = await listOrdersForAdmin({
        page: 1,
        pageSize: 20,
        search: `list-date-${marker}`,
        dateFrom: new Date("2024-01-01T00:00:00.000Z"),
      });

      expect(total).toBe(1);
      expect(rows.map((r) => r.id)).toEqual([recentOrderId]);
    });

    it("paymentStatus=SUCCEEDED yalnızca başarılı ödemesi olan siparişleri döner", async () => {
      const marker = randomUUID().slice(0, 8);
      const paidOrderId = await createPendingOrder({ email: `list-payment-${marker}@ossa-test.local` });
      const unpaidOrderId = await createPendingOrder({ email: `list-payment-${marker}-unpaid@ossa-test.local` });
      await prisma.payment.create({
        data: {
          orderId: paidOrderId,
          provider: "iyzico",
          status: PaymentStatus.SUCCEEDED,
          amount: "100.00",
          conversationId: randomUUID(),
        },
      });

      const succeeded = await listOrdersForAdmin({
        page: 1,
        pageSize: 20,
        search: `list-payment-${marker}`,
        paymentStatus: "SUCCEEDED",
      });
      expect(succeeded.rows.map((r) => r.id)).toEqual([paidOrderId]);

      const pending = await listOrdersForAdmin({
        page: 1,
        pageSize: 20,
        search: `list-payment-${marker}`,
        paymentStatus: "PENDING",
      });
      expect(pending.rows.map((r) => r.id)).toEqual([unpaidOrderId]);
    });

    it("sayfalama total ve sayfa başına satır sayısını doğru döner", async () => {
      const marker = randomUUID().slice(0, 8);
      const ids = await Promise.all(
        [0, 1, 2].map((i) => createPendingOrder({ email: `list-page-${marker}-${i}@ossa-test.local` })),
      );

      const page1 = await listOrdersForAdmin({ page: 1, pageSize: 2, search: `list-page-${marker}` });
      expect(page1.total).toBe(3);
      expect(page1.rows).toHaveLength(2);

      const page2 = await listOrdersForAdmin({ page: 2, pageSize: 2, search: `list-page-${marker}` });
      expect(page2.total).toBe(3);
      expect(page2.rows).toHaveLength(1);

      const allIds = [...page1.rows, ...page2.rows].map((r) => r.id).sort();
      expect(allIds).toEqual([...ids].sort());
    });
  });

  describe("sumOrderGrandTotal", () => {
    // Bu tablo TÜM siparişleri toplar (tek bir siparişe/markera göre filtrelenemez)
    // — bu yüzden mutlak değer DEĞİL, testin KENDİ oluşturduğu satırların sebep
    // olduğu DELTA doğrulanır; dosyadaki diğer testlerin sırası/durumu sonucu etkilemez.
    it("Dashboard KPI'ı: yalnızca totalStatus=FINAL VE İPTAL/SÜRESİ DOLMUŞ/ÖDEME BAŞARISIZ/İADE olmayan siparişleri toplar", async () => {
      const before = Number(await sumOrderGrandTotal());

      // Dahil edilmeli: FINAL + CONFIRMED (gerçekleşmiş, kesinleşmiş sipariş).
      await createPendingOrder({
        status: OrderStatus.CONFIRMED,
        totalStatus: "FINAL",
        grandTotal: "111.11",
      });
      // Hariç: totalStatus hâlâ PENDING (kargo ücreti netleşmemiş, tutar geçici).
      await createPendingOrder({
        status: OrderStatus.PENDING,
        totalStatus: "PENDING",
        grandTotal: "222.22",
      });
      // Hariç: FINAL ama İPTAL EDİLMİŞ — iptal edilen bir siparişin tutarı ciroya dahil edilemez.
      await createPendingOrder({
        status: OrderStatus.CANCELLED,
        totalStatus: "FINAL",
        grandTotal: "333.33",
      });

      const after = Number(await sumOrderGrandTotal());
      expect(after - before).toBeCloseTo(111.11, 2);
    });
  });
});
