/**
 * Bu dosya İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz.
 * tests/db.ts, tests/setup.ts, docs/TEST_STRATEGY.md) — dev/production
 * veritabanına ASLA yazmaz. `TEST_DATABASE_URL` tanımsızsa tüm suite
 * `describe.skip` ile atlanır (aşağıdaki konsol uyarısıyla).
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type CategoryFields,
} from "@/server/repositories/category-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn(
    "[tests/integration/create-category] TEST_DATABASE_URL tanımsız — entegrasyon testleri atlanıyor.",
  );
}

function baseFields(suffix: string, overrides: Partial<CategoryFields> = {}): CategoryFields {
  return {
    name: `Test Kategori ${suffix}`,
    slug: `test-kategori-${suffix}`,
    description: null,
    imageUrl: null,
    imageAlt: null,
    isActive: true,
    sortOrder: 0,
    ...overrides,
  };
}

describe.skipIf(!hasTestDatabase)("createCategory / updateCategory / deleteCategory (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdCategoryIds: string[] = [];
  const createdProductIds: string[] = [];

  afterAll(async () => {
    await prisma.productCategory.deleteMany({ where: { categoryId: { in: createdCategoryIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
  });

  it("senaryo 1: geçerli kategori oluşturma", async () => {
    const suffix = randomUUID().slice(0, 8);
    const result = await createCategory(baseFields(suffix));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdCategoryIds.push(result.categoryId);

    const category = await prisma.category.findUniqueOrThrow({ where: { id: result.categoryId } });
    expect(category.slug).toBe(`test-kategori-${suffix}`);
    expect(category.name).toBe(`Test Kategori ${suffix}`);
    expect(category.isActive).toBe(true);
  });

  it("senaryo 2: duplicate slug reddedilir", async () => {
    const suffix = randomUUID().slice(0, 8);
    const first = await createCategory(baseFields(suffix));
    expect(first.ok).toBe(true);
    if (first.ok) createdCategoryIds.push(first.categoryId);

    const second = await createCategory(baseFields(suffix));
    expect(second).toEqual({ ok: false, reason: "DUPLICATE_SLUG" });
  });

  it("senaryo 3: güncelleme — ad/açıklama/durum/sıra gerçekten değişir", async () => {
    const suffix = randomUUID().slice(0, 8);
    const created = await createCategory(baseFields(suffix));
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    createdCategoryIds.push(created.categoryId);

    const updateResult = await updateCategory(
      created.categoryId,
      baseFields(suffix, {
        name: "Güncellenmiş Ad",
        description: "Yeni açıklama",
        isActive: false,
        sortOrder: 5,
      }),
    );
    expect(updateResult).toEqual({ ok: true });

    const category = await prisma.category.findUniqueOrThrow({ where: { id: created.categoryId } });
    expect(category.name).toBe("Güncellenmiş Ad");
    expect(category.description).toBe("Yeni açıklama");
    expect(category.isActive).toBe(false);
    expect(category.sortOrder).toBe(5);
  });

  it("senaryo 4: bağlı ürün varken silme reddedilir", async () => {
    const suffix = randomUUID().slice(0, 8);
    const created = await createCategory(baseFields(suffix));
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    createdCategoryIds.push(created.categoryId);

    const product = await prisma.product.create({
      data: {
        name: `Test Ürün ${suffix}`,
        slug: `test-urun-${suffix}`,
        status: ProductStatus.ACTIVE,
        productCategories: { create: [{ categoryId: created.categoryId, sortOrder: 0 }] },
      },
    });
    createdProductIds.push(product.id);

    const deleteResult = await deleteCategory(created.categoryId);
    expect(deleteResult).toEqual({ ok: false, reason: "HAS_PRODUCTS" });

    const stillExists = await prisma.category.findUnique({ where: { id: created.categoryId } });
    expect(stillExists).not.toBeNull();
  });

  it("senaryo 5: bağlı ürünü olmayan (boş) kategori güvenle silinebilir", async () => {
    const suffix = randomUUID().slice(0, 8);
    const created = await createCategory(baseFields(suffix));
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const deleteResult = await deleteCategory(created.categoryId);
    expect(deleteResult).toEqual({ ok: true });

    const stillExists = await prisma.category.findUnique({ where: { id: created.categoryId } });
    expect(stillExists).toBeNull();
  });
});
