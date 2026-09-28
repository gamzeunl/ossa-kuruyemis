/**
 * Bu dosya İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz.
 * tests/db.ts, tests/setup.ts, docs/TEST_STRATEGY.md) — dev/production
 * veritabanına ASLA yazmaz. `TEST_DATABASE_URL` tanımsızsa tüm suite
 * `describe.skip` ile atlanır (aşağıdaki konsol uyarısıyla).
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Prisma, ProductStatus } from "@/generated/prisma/client";
import {
  createProduct,
  type CreateProductInput,
  type CreateProductVariantInput,
} from "@/server/repositories/product-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn(
    "[tests/integration/create-product] TEST_DATABASE_URL tanımsız — entegrasyon testleri atlanıyor.",
  );
}

function baseVariant(overrides: Partial<CreateProductVariantInput> = {}): CreateProductVariantInput {
  return {
    name: "500g Paket",
    sku: `OSSA-TEST-${randomUUID().slice(0, 8)}`,
    weightGram: 500,
    price: new Prisma.Decimal("150.00"),
    discountPrice: null,
    discountStartsAt: null,
    discountEndsAt: null,
    isActive: true,
    ...overrides,
  };
}

function baseInput(
  suffix: string,
  categoryId: string,
  overrides: Partial<CreateProductInput> = {},
): CreateProductInput {
  return {
    name: `Test Ürün ${suffix}`,
    slug: `test-urun-${suffix}`,
    shortDescription: null,
    description: null,
    status: ProductStatus.DRAFT,
    isRecommended: false,
    newBadgeOverride: null,
    metaTitle: null,
    metaDescription: null,
    categoryId,
    variants: [baseVariant()],
    images: [],
    ...overrides,
  };
}

describe.skipIf(!hasTestDatabase)("createProduct (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;

  let categoryId: string;
  const createdProductIds: string[] = [];

  beforeAll(async () => {
    const suffix = randomUUID().slice(0, 8);
    const category = await prisma.category.create({
      data: { name: `Test Kategori ${suffix}`, slug: `test-kategori-${suffix}` },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    await prisma.productImage.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.productCategory.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.category.delete({ where: { id: categoryId } });
  });

  it("senaryo 1: geçerli ürün oluşturma — ürün/varyant/ana görsel gerçekten kaydedilir", async () => {
    const suffix = randomUUID().slice(0, 8);
    const result = await createProduct(
      baseInput(suffix, categoryId, {
        images: [{ url: "/images/products/test-fixture.svg", altText: "Test görsel" }],
      }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    createdProductIds.push(result.productId);

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: result.productId },
      include: { variants: true, images: true, productCategories: true },
    });
    expect(product.slug).toBe(`test-urun-${suffix}`);
    expect(product.variants).toHaveLength(1);
    expect(product.images).toHaveLength(1);
    expect(product.images[0]?.isPrimary).toBe(true);
    expect(product.productCategories[0]?.categoryId).toBe(categoryId);
  });

  it("senaryo 2: duplicate slug reddedilir", async () => {
    const suffix = randomUUID().slice(0, 8);
    const first = await createProduct(baseInput(suffix, categoryId));
    expect(first.ok).toBe(true);
    if (first.ok) createdProductIds.push(first.productId);

    const second = await createProduct(baseInput(suffix, categoryId));
    expect(second).toEqual({ ok: false, reason: "DUPLICATE_SLUG" });
  });

  it("senaryo 3: duplicate SKU reddedilir", async () => {
    const sharedSku = `OSSA-TEST-DUP-${randomUUID().slice(0, 8)}`;

    const first = await createProduct(
      baseInput(randomUUID().slice(0, 8), categoryId, { variants: [baseVariant({ sku: sharedSku })] }),
    );
    expect(first.ok).toBe(true);
    if (first.ok) createdProductIds.push(first.productId);

    const attemptedSuffix = randomUUID().slice(0, 8);
    const second = await createProduct(
      baseInput(attemptedSuffix, categoryId, { variants: [baseVariant({ sku: sharedSku })] }),
    );
    expect(second).toEqual({ ok: false, reason: "DUPLICATE_SKU" });

    const count = await prisma.product.count({ where: { slug: `test-urun-${attemptedSuffix}` } });
    expect(count).toBe(0);
  });

  it("senaryo 4: varyantsız ürün reddedilir, hiçbir satır oluşturulmaz", async () => {
    const suffix = randomUUID().slice(0, 8);
    const result = await createProduct(baseInput(suffix, categoryId, { variants: [] }));
    expect(result).toEqual({ ok: false, reason: "NO_VARIANTS" });

    const count = await prisma.product.count({ where: { slug: `test-urun-${suffix}` } });
    expect(count).toBe(0);
  });

  it("senaryo 5 (transaction rollback): 2. varyantın SKU çakışması TÜM ürünü + 1. varyantı geri alır", async () => {
    const existingSku = `OSSA-TEST-EXIST-${randomUUID().slice(0, 8)}`;
    const existing = await createProduct(
      baseInput(randomUUID().slice(0, 8), categoryId, { variants: [baseVariant({ sku: existingSku })] }),
    );
    expect(existing.ok).toBe(true);
    if (existing.ok) createdProductIds.push(existing.productId);

    const attemptedSuffix = randomUUID().slice(0, 8);
    const result = await createProduct(
      baseInput(attemptedSuffix, categoryId, {
        variants: [baseVariant(), baseVariant({ sku: existingSku })],
      }),
    );
    expect(result).toEqual({ ok: false, reason: "DUPLICATE_SKU" });

    // Rollback kanıtı: ne Product satırı ne de 1. (çakışmayan) varyant kalıcı yazıldı.
    const productCount = await prisma.product.count({ where: { slug: `test-urun-${attemptedSuffix}` } });
    expect(productCount).toBe(0);
  });
});
