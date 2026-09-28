/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz. tests/db.ts).
 * `HomepageSelection`/`HomepageSelectionProduct` repository katmanının
 * singleton-upsert davranışını, görünürlük kuralını (isActive + en az 1 ürün)
 * ve ürün sıralamasını doğrular.
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import {
  getActiveHomepageSelection,
  getHomepageSelectionForAdmin,
  upsertHomepageSelection,
} from "@/server/repositories/homepage-selection-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/homepage-selection] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

describe.skipIf(!hasTestDatabase)("HomepageSelection — repository katmanı (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdCategoryIds: string[] = [];
  const createdProductIds: string[] = [];

  async function createProduct(name: string) {
    const suffix = randomUUID().slice(0, 8);
    const category = await prisma.category.create({
      data: { name: `Test Kategori ${suffix}`, slug: `test-kategori-${suffix}`, isActive: true },
    });
    createdCategoryIds.push(category.id);
    const product = await prisma.product.create({
      data: {
        name: `${name} ${suffix}`,
        slug: `test-urun-${suffix}`,
        status: ProductStatus.ACTIVE,
        productCategories: { create: [{ categoryId: category.id, sortOrder: 0 }] },
        variants: {
          create: [{ sku: `TEST-SKU-${suffix}`, name: "500 g", weightGram: 500, price: "100.00", isActive: true }],
        },
      },
    });
    createdProductIds.push(product.id);
    return product;
  }

  beforeEach(async () => {
    // Her testten önce tek satırı temizle — singleton davranışını testler arası izole eder.
    await prisma.homepageSelectionProduct.deleteMany({});
    await prisma.homepageSelection.deleteMany({});
  });

  afterAll(async () => {
    await prisma.homepageSelectionProduct.deleteMany({});
    await prisma.homepageSelection.deleteMany({});
    await prisma.productCategory.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
  });

  it("upsertHomepageSelection ilk çağrıda oluşturur, ikinci çağrıda AYNI satırı günceller (singleton)", async () => {
    const productA = await createProduct("Ürün A");
    const id1 = await upsertHomepageSelection(
      {
        isActive: true,
        eyebrow: "Seçki",
        title: "İlk Başlık",
        description: null,
        ctaLabel: "Keşfet",
        ctaHref: "/urunler",
        imageUrl: null,
        imageAlt: null,
      },
      [productA.id],
    );
    const id2 = await upsertHomepageSelection(
      {
        isActive: true,
        eyebrow: "Seçki",
        title: "Güncellenmiş Başlık",
        description: null,
        ctaLabel: "Keşfet",
        ctaHref: "/urunler",
        imageUrl: null,
        imageAlt: null,
      },
      [productA.id],
    );
    expect(id2).toBe(id1);

    const rowCount = await prisma.homepageSelection.count();
    expect(rowCount).toBe(1);

    const admin = await getHomepageSelectionForAdmin();
    expect(admin?.title).toBe("Güncellenmiş Başlık");
  });

  it("isActive: false ise storefront'ta null döner (ürün var olsa bile)", async () => {
    const productA = await createProduct("Ürün B");
    await upsertHomepageSelection(
      {
        isActive: false,
        eyebrow: null,
        title: "Pasif Seçki",
        description: null,
        ctaLabel: "Keşfet",
        ctaHref: "/urunler",
        imageUrl: null,
        imageAlt: null,
      },
      [productA.id],
    );
    const active = await getActiveHomepageSelection();
    expect(active).toBeNull();
  });

  it("isActive: true ama hiç ürün seçilmemişse storefront'ta null döner", async () => {
    await upsertHomepageSelection(
      {
        isActive: true,
        eyebrow: null,
        title: "Ürünsüz Seçki",
        description: null,
        ctaLabel: "Keşfet",
        ctaHref: "/urunler",
        imageUrl: null,
        imageAlt: null,
      },
      [],
    );
    const active = await getActiveHomepageSelection();
    expect(active).toBeNull();
  });

  it("isActive: true + ürün varsa storefront'ta SIRALI productIds döner", async () => {
    const productA = await createProduct("Ürün C");
    const productB = await createProduct("Ürün D");
    const productC = await createProduct("Ürün E");
    await upsertHomepageSelection(
      {
        isActive: true,
        eyebrow: "Seçki",
        title: "Aktif Seçki",
        description: "Açıklama",
        ctaLabel: "Keşfet",
        ctaHref: "/urunler",
        imageUrl: "/images/home/test.webp",
        imageAlt: "Test",
      },
      [productC.id, productA.id, productB.id],
    );
    const active = await getActiveHomepageSelection();
    expect(active).not.toBeNull();
    expect(active?.productIds).toEqual([productC.id, productA.id, productB.id]);
    expect(active?.title).toBe("Aktif Seçki");
  });

  it("ürün listesi ikinci upsert'te TAMAMEN senkronize edilir (eski ürün kalıcı olarak kalmaz)", async () => {
    const productA = await createProduct("Ürün F");
    const productB = await createProduct("Ürün G");
    await upsertHomepageSelection(
      {
        isActive: true,
        eyebrow: null,
        title: "Seçki",
        description: null,
        ctaLabel: "Keşfet",
        ctaHref: "/urunler",
        imageUrl: null,
        imageAlt: null,
      },
      [productA.id],
    );
    await upsertHomepageSelection(
      {
        isActive: true,
        eyebrow: null,
        title: "Seçki",
        description: null,
        ctaLabel: "Keşfet",
        ctaHref: "/urunler",
        imageUrl: null,
        imageAlt: null,
      },
      [productB.id],
    );
    const active = await getActiveHomepageSelection();
    expect(active?.productIds).toEqual([productB.id]);
  });
});
