/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı — `/hesabim/siparisler` (liste)
 * ve `/hesabim/siparisler/[orderNumber]` (detay) sayfalarının dayandığı
 * repository fonksiyonlarını (`listOrdersForUser`, `findOrderForUser`)
 * doğrudan test eder: kullanıcı yalnızca KENDİ siparişlerini görebilmeli,
 * sayfalama doğru çalışmalı, `totalStatus=PENDING` durumunda sayfanın
 * dallandığı alanlar (`shippingTotal:null`, `grandTotal`=subtotal) doğru
 * olmalıdır.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { InvoiceType, OrderStatus, ProductStatus } from "@/generated/prisma/client";
import {
  createDraftOrder,
  findOrderForUser,
  listOrdersForUser,
} from "@/server/repositories/order-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn(
    "[tests/integration/account-orders] TEST_DATABASE_URL tanımsız — testler atlanıyor.",
  );
}

const SHIPPING_SETTINGS_FEE = { freeShippingThreshold: null, standardShippingFee: 50 };
const SHIPPING_SETTINGS_UNKNOWN = { freeShippingThreshold: null, standardShippingFee: null };

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

describe.skipIf(!hasTestDatabase)("hesap sipariş erişimi (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;

  let productId: string;
  let variantId: string;
  let roleId: string;
  const createdUserIds: string[] = [];

  /** Her test kendi kullanıcısını oluşturur — testler arası sıralamaya bağımlı olmadan izole çalışır. */
  async function createUser(label: string) {
    const suffix = randomUUID().slice(0, 8);
    const user = await prisma.user.create({
      data: { roleId, email: `account-${label}-${suffix}@ossa-test.local`, firstName: label, lastName: "Kullanıcı" },
    });
    createdUserIds.push(user.id);
    return user.id;
  }

  async function createOrderFor(userId: string) {
    const result = await createDraftOrder(
      {
        userId,
        email: `account-test-${randomUUID()}@ossa-test.local`,
        phone: "05551234567",
        items: [{ variantId, quantity: 1 }],
        shippingAddress: baseAddress(),
        billingAddress: baseAddress(),
        invoice: { invoiceType: InvoiceType.INDIVIDUAL },
        idempotencyKey: randomUUID(),
      },
      SHIPPING_SETTINGS_FEE,
    );
    if (!result.ok) {
      throw new Error(`Test siparişi oluşturulamadı: ${result.reason}`);
    }
    return result.orderNumber;
  }

  beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);

    const role = await prisma.role.upsert({
      where: { key: "CUSTOMER" },
      update: {},
      create: { key: "CUSTOMER", name: "Müşteri" },
    });
    roleId = role.id;

    const product = await prisma.product.create({
      data: { name: `Hesap Test Ürün ${suffix}`, slug: `hesap-test-${suffix}`, status: ProductStatus.ACTIVE },
    });
    productId = product.id;
    const variant = await prisma.productVariant.create({
      data: { productId, sku: `ACCOUNT-TEST-${suffix}`, name: "500 g", price: "100.00", isActive: true },
    });
    variantId = variant.id;
    await prisma.inventory.create({
      data: { variantId, quantityAvailable: 100, quantityReserved: 0, lowStockThreshold: 1 },
    });
  });

  afterAll(async () => {
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
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("listOrdersForUser yalnızca ilgili kullanıcının siparişlerini döner", async () => {
    const ownerUserId = await createUser("owner1");
    const otherUserId = await createUser("other1");
    const ownedOrderNumber = await createOrderFor(ownerUserId);
    await createOrderFor(otherUserId);

    const { rows, total } = await listOrdersForUser(ownerUserId, { page: 1, pageSize: 20 });
    expect(total).toBe(1);
    expect(rows).toHaveLength(1);
    expect(rows[0].orderNumber).toBe(ownedOrderNumber);
  });

  it("findOrderForUser başka kullanıcının siparişi için null döner (sayfa seviyesinde notFound()'a denk gelir)", async () => {
    const ownerUserId = await createUser("owner2");
    const otherUserId = await createUser("other2");
    const ownedOrderNumber = await createOrderFor(ownerUserId);

    const ownFetch = await findOrderForUser(ownedOrderNumber, ownerUserId);
    expect(ownFetch?.orderNumber).toBe(ownedOrderNumber);

    const otherFetch = await findOrderForUser(ownedOrderNumber, otherUserId);
    expect(otherFetch).toBeNull();
  });

  it("listOrdersForUser sayfalama total ve sayfa başına satır sayısını doğru döner", async () => {
    const pagingUserId = await createUser("paging");

    const orderNumbers = [
      await createOrderFor(pagingUserId),
      await createOrderFor(pagingUserId),
      await createOrderFor(pagingUserId),
    ];

    const page1 = await listOrdersForUser(pagingUserId, { page: 1, pageSize: 2 });
    expect(page1.total).toBe(3);
    expect(page1.rows).toHaveLength(2);

    const page2 = await listOrdersForUser(pagingUserId, { page: 2, pageSize: 2 });
    expect(page2.total).toBe(3);
    expect(page2.rows).toHaveLength(1);

    const allReturned = [...page1.rows, ...page2.rows].map((r) => r.orderNumber).sort();
    expect(allReturned).toEqual([...orderNumbers].sort());
  });

  it("totalStatus=PENDING iken satır shippingTotal:null + grandTotal=subtotal taşır (sayfanın dallandığı alanlar)", async () => {
    const userId = await createUser("pending");
    const result = await createDraftOrder(
      {
        userId,
        email: `account-pending-${randomUUID()}@ossa-test.local`,
        phone: "05551234567",
        items: [{ variantId, quantity: 1 }],
        shippingAddress: baseAddress(),
        billingAddress: baseAddress(),
        invoice: { invoiceType: InvoiceType.INDIVIDUAL },
        idempotencyKey: randomUUID(),
      },
      SHIPPING_SETTINGS_UNKNOWN,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const { rows } = await listOrdersForUser(userId, { page: 1, pageSize: 50 });
    const row = rows.find((r) => r.orderNumber === result.orderNumber);
    expect(row).toBeDefined();
    expect(row?.totalStatus).toBe("PENDING");
    expect(row?.shippingTotal).toBeNull();
    expect(Number(row?.grandTotal)).toBeCloseTo(100, 2);
    expect(row?.status).toBe(OrderStatus.PENDING);
  });
});
