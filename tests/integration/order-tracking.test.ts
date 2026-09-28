/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — `order-tracking-service.ts`'i
 * uçtan uca test eder: doğru orderNumber+email, doğru orderNumber+telefon
 * (farklı format), yanlış email, yanlış telefon, yanlış orderNumber — hepsi
 * AYNI (null) sonucu döner. En kritik iki test: dönen objede kişisel/adres/
 * ödeme bilgisi OLMADIĞI ve CANCELLED/normal timeline'ın doğru status'le
 * çalıştığı.
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { InvoiceType, OrderStatus, OrderTotalStatus, ShippingPriceStatus } from "@/generated/prisma/client";
import { resolveOrderTimeline } from "@/lib/order-timeline";
import { trackOrder } from "@/server/services/order-tracking-service";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/order-tracking] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("order-tracking-service (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdOrderIds: string[] = [];

  async function createOrder(overrides: { email?: string; phone?: string; status?: OrderStatus } = {}) {
    const suffix = randomUUID().slice(0, 8).toUpperCase();
    const order = await prisma.order.create({
      data: {
        orderNumber: `OSSA-TEST-${suffix}`,
        email: overrides.email ?? `takip-${suffix}@ossa-test.local`,
        phone: overrides.phone ?? "0534 956 78 79",
        status: overrides.status ?? OrderStatus.CONFIRMED,
        invoiceType: InvoiceType.INDIVIDUAL,
        subtotal: "100.00",
        discountTotal: "0.00",
        taxTotal: "0.00",
        grandTotal: "100.00",
        totalStatus: OrderTotalStatus.FINAL,
        shippingPriceStatus: ShippingPriceStatus.FREE,
        shippingAddressSnapshot: {
          firstName: "Test",
          lastName: "Kullanıcı",
          phone: "0534 956 78 79",
          city: "Mersin",
          district: "Mut",
          neighborhood: "Karşıyaka",
          addressLine: "Seyran Sokak No:2",
          addressLabel: "Ev",
        },
        billingAddressSnapshot: {
          firstName: "Test",
          lastName: "Kullanıcı",
          phone: "0534 956 78 79",
          city: "Mersin",
          district: "Mut",
          neighborhood: "Karşıyaka",
          addressLine: "Seyran Sokak No:2",
          addressLabel: "Ev",
        },
        idempotencyKey: randomUUID(),
        requestFingerprint: randomUUID(),
        resultAccessToken: randomUUID(),
      },
    });
    createdOrderIds.push(order.id);
    return order;
  }

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
  });

  it("doğru orderNumber + doğru e-posta ile bulunur", async () => {
    const order = await createOrder({ email: "musteri@ornek.com" });
    const result = await trackOrder({ orderNumber: order.orderNumber, contact: "musteri@ornek.com" });
    expect(result?.orderNumber).toBe(order.orderNumber);
  });

  it("e-posta büyük/küçük harf farkı olsa da eşleşir", async () => {
    const order = await createOrder({ email: "musteri@ornek.com" });
    const result = await trackOrder({ orderNumber: order.orderNumber, contact: "MUSTERI@ORNEK.COM" });
    expect(result).not.toBeNull();
  });

  it("doğru orderNumber + doğru telefon (FARKLI format) ile bulunur", async () => {
    const order = await createOrder({ phone: "0534 956 78 79" });
    const result = await trackOrder({ orderNumber: order.orderNumber, contact: "5349567879" });
    expect(result?.orderNumber).toBe(order.orderNumber);
  });

  it("yanlış e-posta ile null döner", async () => {
    const order = await createOrder({ email: "gercek@ornek.com" });
    const result = await trackOrder({ orderNumber: order.orderNumber, contact: "yanlis@ornek.com" });
    expect(result).toBeNull();
  });

  it("yanlış telefon ile null döner", async () => {
    const order = await createOrder({ phone: "0534 956 78 79" });
    const result = await trackOrder({ orderNumber: order.orderNumber, contact: "05001234567" });
    expect(result).toBeNull();
  });

  it("yanlış orderNumber ile null döner (sipariş var/yok bilgisi sızdırmaz)", async () => {
    const result = await trackOrder({ orderNumber: "OSSA-YOK-000000", contact: "herhangi@ornek.com" });
    expect(result).toBeNull();
  });

  it("dönen objede KİŞİSEL/ADRES/ÖDEME bilgisi YOKTUR", async () => {
    const order = await createOrder({ email: "gizlilik@ornek.com" });
    const result = await trackOrder({ orderNumber: order.orderNumber, contact: "gizlilik@ornek.com" });

    expect(result).not.toBeNull();
    const keys = Object.keys(result ?? {});
    expect(keys.sort()).toEqual(["createdAt", "orderNumber", "shipment", "status"].sort());
    expect(JSON.stringify(result)).not.toContain("gizlilik@ornek.com");
    expect(JSON.stringify(result)).not.toContain("Seyran Sokak");
  });

  it("CANCELLED sipariş timeline'ı 'cancelled' olarak çözülür", async () => {
    const order = await createOrder({ email: "iptal@ornek.com", status: OrderStatus.CANCELLED });
    const result = await trackOrder({ orderNumber: order.orderNumber, contact: "iptal@ornek.com" });

    expect(result?.status).toBe(OrderStatus.CANCELLED);
    expect(resolveOrderTimeline(result!.status).kind).toBe("cancelled");
  });

  it("normal (SHIPPED) sipariş timeline'ı adım listesi olarak çözülür", async () => {
    const order = await createOrder({ email: "kargoda@ornek.com", status: OrderStatus.SHIPPED });
    const result = await trackOrder({ orderNumber: order.orderNumber, contact: "kargoda@ornek.com" });

    expect(result?.status).toBe(OrderStatus.SHIPPED);
    const timeline = resolveOrderTimeline(result!.status);
    expect(timeline.kind).toBe("steps");
  });

  it("kargo bilgisi yalnızca gerçek bir Shipment kaydı + dolu trackingNumber varsa döner", async () => {
    const order = await createOrder({ email: "kargosuz@ornek.com" });
    const result = await trackOrder({ orderNumber: order.orderNumber, contact: "kargosuz@ornek.com" });
    expect(result?.shipment).toBeNull();
  });
});
