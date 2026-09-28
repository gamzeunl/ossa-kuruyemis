/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz. tests/db.ts).
 * "Tükendi yap" / restock akışının GERÇEK `Inventory`/`InventoryMovement`
 * ile uyumlu çalıştığını doğrular — ayrı bir yapay `isOutOfStock` alanı YOK,
 * tek gerçek kaynak `Inventory.quantityAvailable - quantityReserved`'dır.
 */
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import {
  adjustInventory,
  getInventoryForVariant,
  markAllVariantsSoldOut,
  markVariantSoldOut,
} from "@/server/repositories/inventory-repository";
import { listVariantStockForAdmin } from "@/server/repositories/inventory-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/admin-stock-management] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("Admin stok yönetimi — Tükendi yap / Restock (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  let actorId: string;
  const createdProductIds: string[] = [];

  async function createTestVariant(suffix: string, quantityAvailable: number) {
    const product = await prisma.product.create({
      data: { name: `Stok Test ${suffix}`, slug: `stok-test-${suffix}`, status: ProductStatus.ACTIVE },
    });
    createdProductIds.push(product.id);
    const variant = await prisma.productVariant.create({
      data: { productId: product.id, sku: `STOK-TEST-${suffix}`, name: "500 g", price: "50.00", isActive: true },
    });
    await prisma.inventory.create({
      data: { variantId: variant.id, quantityAvailable, quantityReserved: 0, lowStockThreshold: 2 },
    });
    return { productId: product.id, variantId: variant.id };
  }

  async function ensureActor() {
    if (actorId) return actorId;
    const role = await prisma.role.upsert({
      where: { key: "ADMIN" },
      update: {},
      create: { key: "ADMIN", name: "Yönetici" },
    });
    const suffix = randomUUID().slice(0, 8);
    const admin = await prisma.user.create({
      data: { roleId: role.id, email: `stok-admin-${suffix}@ossa-test.local`, firstName: "Test", lastName: "Admin" },
    });
    actorId = admin.id;
    return actorId;
  }

  afterEach(async () => {
    for (const productId of createdProductIds) {
      const variants = await prisma.productVariant.findMany({ where: { productId }, select: { id: true } });
      const variantIds = variants.map((v) => v.id);
      await prisma.inventoryMovement.deleteMany({ where: { variantId: { in: variantIds } } });
      await prisma.inventory.deleteMany({ where: { variantId: { in: variantIds } } });
      await prisma.productVariant.deleteMany({ where: { productId } });
      await prisma.product.delete({ where: { id: productId } });
    }
    createdProductIds.length = 0;
  });

  it("markVariantSoldOut: mevcut stok tek işlemle 0'a iner, InventoryMovement kaydı oluşur", async () => {
    await ensureActor();
    const suffix = randomUUID().slice(0, 8);
    const { variantId } = await createTestVariant(suffix, 25);

    const result = await markVariantSoldOut(variantId, actorId);
    expect(result).toEqual({ ok: true });

    const inventory = await getInventoryForVariant(variantId);
    expect(inventory?.quantityAvailable).toBe(0);

    const movements = await prisma.inventoryMovement.findMany({ where: { variantId } });
    expect(movements).toHaveLength(1);
    expect(movements[0].type).toBe("ADJUSTMENT");
    expect(movements[0].quantityDelta).toBe(-25);
    expect(movements[0].reason).toBe("Admin tarafından tükendi olarak işaretlendi.");
    expect(movements[0].actorId).toBe(actorId);
  });

  it("zaten 0 olan bir varyantta markVariantSoldOut no-op sayılır (fazladan hareket kaydı oluşmaz)", async () => {
    await ensureActor();
    const suffix = randomUUID().slice(0, 8);
    const { variantId } = await createTestVariant(suffix, 0);

    const result = await markVariantSoldOut(variantId, actorId);
    expect(result).toEqual({ ok: false, reason: "ALREADY_SOLD_OUT" });

    const movements = await prisma.inventoryMovement.findMany({ where: { variantId } });
    expect(movements).toHaveLength(0);
  });

  it("markAllVariantsSoldOut: çoklu varyantlı üründe TÜM varyantlar tükendi olur", async () => {
    await ensureActor();
    const suffix = randomUUID().slice(0, 8);
    const product = await prisma.product.create({
      data: { name: `Çoklu Varyant Test ${suffix}`, slug: `coklu-varyant-test-${suffix}`, status: ProductStatus.ACTIVE },
    });
    createdProductIds.push(product.id);
    const variant500 = await prisma.productVariant.create({
      data: { productId: product.id, sku: `MULTI-${suffix}-500`, name: "500 g", price: "50.00", isActive: true },
    });
    const variant1000 = await prisma.productVariant.create({
      data: { productId: product.id, sku: `MULTI-${suffix}-1000`, name: "1000 g", price: "90.00", isActive: true },
    });
    await prisma.inventory.create({
      data: { variantId: variant500.id, quantityAvailable: 10, quantityReserved: 0 },
    });
    await prisma.inventory.create({
      data: { variantId: variant1000.id, quantityAvailable: 15, quantityReserved: 0 },
    });

    const result = await markAllVariantsSoldOut(product.id, actorId);
    expect(result).toEqual({ affected: 2 });

    const inv500 = await getInventoryForVariant(variant500.id);
    const inv1000 = await getInventoryForVariant(variant1000.id);
    expect(inv500?.quantityAvailable).toBe(0);
    expect(inv1000?.quantityAvailable).toBe(0);
  });

  it("Tükendi yapılan bir varyant tekrar stok eklenince (restock) otomatik satılabilir hale gelir", async () => {
    await ensureActor();
    const suffix = randomUUID().slice(0, 8);
    const { variantId } = await createTestVariant(suffix, 5);

    await markVariantSoldOut(variantId, actorId);
    let inventory = await getInventoryForVariant(variantId);
    expect(inventory?.quantityAvailable).toBe(0);

    // Restock: "500 g → +10" örneğiyle aynı — PURCHASE_IN, pozitif miktar.
    const restockResult = await adjustInventory({
      variantId,
      delta: 10,
      type: "PURCHASE_IN",
      actorId,
      reason: "Yeni sevkiyat",
    });
    expect(restockResult).toEqual({ ok: true, quantityAvailable: 10 });

    inventory = await getInventoryForVariant(variantId);
    expect(inventory?.quantityAvailable).toBe(10);

    // Stok yönetimi ekranındaki "yalnızca tükenenler" filtresinden artık düşer.
    const outOfStockRows = await listVariantStockForAdmin("OUT_OF_STOCK");
    expect(outOfStockRows.some((row) => row.variantId === variantId)).toBe(false);
  });

  it("listVariantStockForAdmin: OUT_OF_STOCK filtresi yalnızca gerçekten satılabilir<=0 olan varyantları döner", async () => {
    await ensureActor();
    const suffix = randomUUID().slice(0, 8);
    const { variantId: soldOutVariantId } = await createTestVariant(`${suffix}-a`, 3);
    const { variantId: inStockVariantId } = await createTestVariant(`${suffix}-b`, 20);

    await markVariantSoldOut(soldOutVariantId, actorId);

    const outOfStockRows = await listVariantStockForAdmin("OUT_OF_STOCK");
    const outOfStockIds = outOfStockRows.map((r) => r.variantId);
    expect(outOfStockIds).toContain(soldOutVariantId);
    expect(outOfStockIds).not.toContain(inStockVariantId);
  });
});
