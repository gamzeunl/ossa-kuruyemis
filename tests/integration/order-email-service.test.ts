/**
 * `ORDER_STATUS_TO_EMAIL_TYPE` eşlemesi saf bir sabit olduğundan İLK describe
 * DB gerektirmeden her zaman çalışır. `sendOrderEmail` ise gerçek `OrderEmailLog`
 * satırları yazdığından İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır
 * (bkz. tests/db.ts, docs/TEST_STRATEGY.md) — dev/production veritabanına
 * ASLA yazmaz. `TEST_DATABASE_URL` tanımsızsa o bölüm `describe.skip` ile atlanır.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { InvoiceType, OrderStatus, ProductStatus } from "@/generated/prisma/client";
import type { EmailProvider, SendEmailResult } from "@/server/providers/email-provider";
import {
  createDraftOrder,
  type CreateDraftOrderInput,
} from "@/server/repositories/order-repository";
import {
  ORDER_STATUS_TO_EMAIL_TYPE,
  RESEND_COOLDOWN_MS,
  sendOrderEmail,
} from "@/server/services/order-email-service";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn(
    "[tests/integration/order-email-service] TEST_DATABASE_URL tanımsız — DB gerektiren testler atlanıyor.",
  );
}

describe("ORDER_STATUS_TO_EMAIL_TYPE eşlemesi (durum → e-posta türü)", () => {
  it("durum geçişleri doğru e-posta türüne eşlenir", () => {
    expect(ORDER_STATUS_TO_EMAIL_TYPE[OrderStatus.CONFIRMED]).toBe("STATUS_CONFIRMED");
    expect(ORDER_STATUS_TO_EMAIL_TYPE[OrderStatus.PROCESSING]).toBe("STATUS_PROCESSING");
    expect(ORDER_STATUS_TO_EMAIL_TYPE[OrderStatus.SHIPPED]).toBe("STATUS_SHIPPED");
    expect(ORDER_STATUS_TO_EMAIL_TYPE[OrderStatus.DELIVERED]).toBe("STATUS_DELIVERED");
    expect(ORDER_STATUS_TO_EMAIL_TYPE[OrderStatus.CANCELLED]).toBe("STATUS_CANCELLED");
  });

  it("ödeme-güdümlü/başlangıç durumları eşlemede YOK (otomatik e-posta tetiklemez)", () => {
    expect(ORDER_STATUS_TO_EMAIL_TYPE[OrderStatus.PENDING]).toBeUndefined();
    expect(ORDER_STATUS_TO_EMAIL_TYPE[OrderStatus.PAID]).toBeUndefined();
    expect(ORDER_STATUS_TO_EMAIL_TYPE[OrderStatus.PAYMENT_PROCESSING]).toBeUndefined();
  });
});

class FakeEmailProvider implements EmailProvider {
  callCount = 0;
  constructor(private readonly result: SendEmailResult | (() => SendEmailResult)) {}
  async sendEmail(): Promise<SendEmailResult> {
    this.callCount += 1;
    return typeof this.result === "function" ? this.result() : this.result;
  }
}

class ThrowingEmailProvider implements EmailProvider {
  callCount = 0;
  async sendEmail(): Promise<SendEmailResult> {
    this.callCount += 1;
    throw new Error("SMTP bağlantısı başarısız");
  }
}

describe.skipIf(!hasTestDatabase)("sendOrderEmail (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;

  let productId: string;
  let variantId: string;

  async function createOrderId(): Promise<string> {
    const input: CreateDraftOrderInput = {
      userId: null,
      email: `email-service-test-${randomUUID()}@ossa-test.local`,
      phone: "05551234567",
      items: [{ variantId, quantity: 1 }],
      shippingAddress: {
        firstName: "Test",
        lastName: "Kullanıcı",
        phone: "05551234567",
        city: "İstanbul",
        district: "Kadıköy",
        neighborhood: "Test Mahallesi",
        addressLine: "Test sokak no:1",
        addressLabel: "Ev",
      },
      billingAddress: {
        firstName: "Test",
        lastName: "Kullanıcı",
        phone: "05551234567",
        city: "İstanbul",
        district: "Kadıköy",
        neighborhood: "Test Mahallesi",
        addressLine: "Test sokak no:1",
        addressLabel: "Ev",
      },
      invoice: { invoiceType: InvoiceType.INDIVIDUAL },
      idempotencyKey: randomUUID(),
    };
    const result = await createDraftOrder(input, { freeShippingThreshold: null, standardShippingFee: 50 });
    if (!result.ok) {
      throw new Error(`Test siparişi oluşturulamadı: ${result.reason}`);
    }
    return result.orderId;
  }

  beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);
    const product = await prisma.product.create({
      data: { name: `Email Test Ürün ${suffix}`, slug: `email-test-${suffix}`, status: ProductStatus.ACTIVE },
    });
    productId = product.id;
    const variant = await prisma.productVariant.create({
      data: { productId, sku: `EMAIL-TEST-${suffix}`, name: "500 g", price: "100.00", isActive: true },
    });
    variantId = variant.id;
    await prisma.inventory.create({
      data: { variantId, quantityAvailable: 100, quantityReserved: 0, lowStockThreshold: 1 },
    });
  });

  afterAll(async () => {
    // OrderEmailLog → Order onDelete:Cascade olduğundan siparişi silmek loglarını da otomatik siler.
    const ordersToDelete = await prisma.order.findMany({
      where: { items: { some: { productId } } },
      select: { id: true },
    });
    // `InventoryMovement`/`StockReservation` → `Order`/`ProductVariant` ilişkisi
    // `onDelete: Restrict` — sipariş/varyant silinmeden ÖNCE temizlenir (bkz.
    // create-draft-order.test.ts'teki aynı düzeltme).
    await prisma.stockReservation.deleteMany({ where: { variantId } });
    await prisma.inventoryMovement.deleteMany({ where: { variantId } });
    await prisma.order.deleteMany({ where: { id: { in: ordersToDelete.map((o) => o.id) } } });
    await prisma.inventory.deleteMany({ where: { variantId } });
    await prisma.productVariant.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
  });

  it("provider yapılandırılmamış (null) → sipariş işlemi etkilenmez, OrderEmailLog oluşmaz", async () => {
    const orderId = await createOrderId();
    const result = await sendOrderEmail({ orderId, type: "ORDER_RECEIVED", emailProvider: null });
    expect(result).toEqual({ ok: false, reason: "PROVIDER_NOT_CONFIGURED" });

    const count = await prisma.orderEmailLog.count({ where: { orderId } });
    expect(count).toBe(0);
  });

  it("var olmayan sipariş ORDER_NOT_FOUND döner", async () => {
    const provider = new FakeEmailProvider({ ok: true });
    const result = await sendOrderEmail({ orderId: "does-not-exist", type: "ORDER_RECEIVED", emailProvider: provider });
    expect(result).toEqual({ ok: false, reason: "ORDER_NOT_FOUND" });
  });

  it("provider ok:false döndürürse throw ETMEZ, OrderEmailLog FAILED olarak yazılır", async () => {
    const orderId = await createOrderId();
    const provider = new FakeEmailProvider({ ok: false, error: "Geçersiz alıcı adresi" });

    const result = await sendOrderEmail({ orderId, type: "ORDER_RECEIVED", emailProvider: provider });
    expect(result).toEqual({ ok: false, reason: "SEND_FAILED" });

    const log = await prisma.orderEmailLog.findFirstOrThrow({ where: { orderId, type: "ORDER_RECEIVED" } });
    expect(log.status).toBe("FAILED");
    expect(log.errorMessage).toBe("Geçersiz alıcı adresi");
  });

  it("provider throw ederse sendOrderEmail YİNE throw ETMEZ, OrderEmailLog FAILED olarak yazılır", async () => {
    const orderId = await createOrderId();
    const provider = new ThrowingEmailProvider();

    let result;
    let threw = false;
    try {
      result = await sendOrderEmail({ orderId, type: "ORDER_RECEIVED", emailProvider: provider });
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
    expect(result).toEqual({ ok: false, reason: "SEND_FAILED" });

    const log = await prisma.orderEmailLog.findFirstOrThrow({ where: { orderId, type: "ORDER_RECEIVED" } });
    expect(log.status).toBe("FAILED");
    expect(log.errorMessage).toContain("SMTP bağlantısı başarısız");
  });

  it("başarılı gönderim → SENT kaydı doğru type ile oluşur", async () => {
    const orderId = await createOrderId();
    const provider = new FakeEmailProvider({ ok: true });

    const result = await sendOrderEmail({ orderId, type: "STATUS_CONFIRMED", emailProvider: provider });
    expect(result).toEqual({ ok: true });
    expect(provider.callCount).toBe(1);

    const log = await prisma.orderEmailLog.findFirstOrThrow({ where: { orderId, type: "STATUS_CONFIRMED" } });
    expect(log.status).toBe("SENT");
    expect(log.errorMessage).toBeNull();
  });

  it("force olmadan ikinci çağrı (cooldown dışında) ALREADY_SENT döner, tekrar gönderilmez", async () => {
    const orderId = await createOrderId();
    const provider = new FakeEmailProvider({ ok: true });

    const first = await sendOrderEmail({ orderId, type: "ORDER_RECEIVED", emailProvider: provider });
    expect(first).toEqual({ ok: true });

    // Cooldown'u aşmak için loglanan zamanı geçmişe çekiyoruz (fragile sleep/timer YOK).
    await prisma.orderEmailLog.updateMany({
      where: { orderId, type: "ORDER_RECEIVED" },
      data: { createdAt: new Date(Date.now() - RESEND_COOLDOWN_MS - 1000) },
    });

    const second = await sendOrderEmail({ orderId, type: "ORDER_RECEIVED", emailProvider: provider });
    expect(second).toEqual({ ok: false, reason: "ALREADY_SENT" });
    expect(provider.callCount).toBe(1);

    const count = await prisma.orderEmailLog.count({ where: { orderId, type: "ORDER_RECEIVED" } });
    expect(count).toBe(1);
  });

  it("force:true cooldown içinde RATE_LIMITED döner, cooldown sonrası tekrar gönderir", async () => {
    const orderId = await createOrderId();
    const provider = new FakeEmailProvider({ ok: true });

    const first = await sendOrderEmail({ orderId, type: "STATUS_SHIPPED", emailProvider: provider, force: true });
    expect(first).toEqual({ ok: true });

    const rateLimited = await sendOrderEmail({
      orderId,
      type: "STATUS_SHIPPED",
      emailProvider: provider,
      force: true,
    });
    expect(rateLimited).toEqual({ ok: false, reason: "RATE_LIMITED" });
    expect(provider.callCount).toBe(1);

    await prisma.orderEmailLog.updateMany({
      where: { orderId, type: "STATUS_SHIPPED" },
      data: { createdAt: new Date(Date.now() - RESEND_COOLDOWN_MS - 1000) },
    });

    const resent = await sendOrderEmail({
      orderId,
      type: "STATUS_SHIPPED",
      emailProvider: provider,
      force: true,
    });
    expect(resent).toEqual({ ok: true });
    expect(provider.callCount).toBe(2);

    const count = await prisma.orderEmailLog.count({ where: { orderId, type: "STATUS_SHIPPED" } });
    expect(count).toBe(2);
  });
});
