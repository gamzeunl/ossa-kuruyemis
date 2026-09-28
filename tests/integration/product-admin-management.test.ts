/**
 * Bu dosya İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz.
 * tests/db.ts, tests/setup.ts, docs/TEST_STRATEGY.md) — dev/production
 * veritabanına ASLA yazmaz. `/yonetim/urunler/[id]` ürün düzenleme
 * altyapısının repository-seviyesi doğrulamalarını içerir: temel bilgi +
 * varyant güncelleme/ekleme (dup slug/SKU), varyant güvenli silme (kullanım
 * kontrolü), görsel CRUD (primary garantisi).
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { InvoiceType, OrderStatus, Prisma, ProductStatus } from "@/generated/prisma/client";
import {
  addProductImage,
  deleteProductVariant,
  removeProductImage,
  setPrimaryProductImage,
  updateProductAdminSettings,
  updateProductImageAlt,
} from "@/server/repositories/product-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn(
    "[tests/integration/product-admin-management] TEST_DATABASE_URL tanımsız — testler atlanıyor.",
  );
}

function baseUpdateInput(overrides: Partial<Parameters<typeof updateProductAdminSettings>[1]> = {}) {
  return {
    name: "Test Ürün",
    slug: `test-urun-${randomUUID().slice(0, 8)}`,
    status: ProductStatus.ACTIVE,
    isRecommended: false,
    newBadgeOverride: null,
    categoryId: "",
    metaTitle: null,
    metaDescription: null,
    description: null,
    shortDescription: null,
    ingredients: null,
    storageConditions: null,
    deliveryInfo: null,
    allergenInfo: null,
    originInfo: null,
    usageSuggestion: null,
    nutrition: {
      energyKcal: null,
      energyKj: null,
      fat: null,
      saturatedFat: null,
      carbohydrate: null,
      sugars: null,
      fiber: null,
      protein: null,
      salt: null,
      sourceName: null,
      sourceUrl: null,
      sourceProduct: null,
      referenceType: null,
      confidence: null,
    },
    existingVariants: [],
    newVariants: [],
    ...overrides,
  };
}

describe.skipIf(!hasTestDatabase)("Ürün yönetim ekranı — repository katmanı (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdCategoryIds: string[] = [];
  const createdProductIds: string[] = [];
  const createdOrderIds: string[] = [];
  const createdBundleOfferIds: string[] = [];

  async function createCategory() {
    const suffix = randomUUID().slice(0, 8);
    const category = await prisma.category.create({
      data: { name: `Test Kategori ${suffix}`, slug: `test-kategori-${suffix}`, isActive: true },
    });
    createdCategoryIds.push(category.id);
    return category;
  }

  async function createProductWithVariant(categoryId: string) {
    const suffix = randomUUID().slice(0, 8);
    const product = await prisma.product.create({
      data: {
        name: `Test Ürün ${suffix}`,
        slug: `test-urun-${suffix}`,
        status: ProductStatus.ACTIVE,
        productCategories: { create: [{ categoryId, sortOrder: 0 }] },
        variants: {
          create: [{ sku: `TEST-SKU-${suffix}`, name: "500 g", weightGram: 500, price: "100.00", isActive: true }],
        },
      },
      include: { variants: true },
    });
    createdProductIds.push(product.id);
    return product;
  }

  afterAll(async () => {
    await prisma.orderItem.deleteMany({ where: { orderId: { in: createdOrderIds } } });
    await prisma.order.deleteMany({ where: { id: { in: createdOrderIds } } });
    await prisma.bundleOffer.deleteMany({ where: { id: { in: createdBundleOfferIds } } });
    await prisma.productImage.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.productCategory.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
  });

  describe("updateProductAdminSettings — temel bilgi + varyant güncelleme/ekleme", () => {
    it("ad/slug/durum + mevcut varyant alanları gerçekten güncellenir", async () => {
      const category = await createCategory();
      const product = await createProductWithVariant(category.id);
      const variant = product.variants[0];
      const newSlug = `guncellenmis-${randomUUID().slice(0, 8)}`;

      const result = await updateProductAdminSettings(
        product.id,
        baseUpdateInput({
          name: "Güncellenmiş Ürün Adı",
          slug: newSlug,
          categoryId: category.id,
          existingVariants: [
            {
              id: variant.id,
              name: "1 kg",
              sku: variant.sku,
              weightGram: 1000,
              price: new Prisma.Decimal("199.00"),
              isActive: false,
            },
          ],
        }),
      );
      expect(result).toEqual({ ok: true });

      const updated = await prisma.product.findUniqueOrThrow({
        where: { id: product.id },
        include: { variants: true },
      });
      expect(updated.name).toBe("Güncellenmiş Ürün Adı");
      expect(updated.slug).toBe(newSlug);
      expect(updated.variants[0].name).toBe("1 kg");
      expect(updated.variants[0].weightGram).toBe(1000);
      expect(Number(updated.variants[0].price)).toBeCloseTo(199, 2);
      expect(updated.variants[0].isActive).toBe(false);
    });

    it("yeni varyant AYNI kaydetmede oluşturulur", async () => {
      const category = await createCategory();
      const product = await createProductWithVariant(category.id);
      const variant = product.variants[0];
      const newSku = `TEST-NEW-SKU-${randomUUID().slice(0, 8)}`;

      const result = await updateProductAdminSettings(
        product.id,
        baseUpdateInput({
          categoryId: category.id,
          existingVariants: [
            { id: variant.id, name: variant.name, sku: variant.sku, weightGram: 500, price: new Prisma.Decimal("100.00"), isActive: true },
          ],
          newVariants: [{ name: "1 kg", sku: newSku, weightGram: 1000, price: new Prisma.Decimal("180.00"), isActive: true }],
        }),
      );
      expect(result).toEqual({ ok: true });

      const variants = await prisma.productVariant.findMany({ where: { productId: product.id } });
      expect(variants).toHaveLength(2);
      expect(variants.some((v) => v.sku === newSku)).toBe(true);
    });

    it("duplicate slug (BAŞKA bir ürünle) reddedilir — DUPLICATE_SLUG", async () => {
      const category = await createCategory();
      const existingOther = await createProductWithVariant(category.id);
      const product = await createProductWithVariant(category.id);
      const variant = product.variants[0];

      const result = await updateProductAdminSettings(
        product.id,
        baseUpdateInput({
          slug: existingOther.slug,
          categoryId: category.id,
          existingVariants: [
            { id: variant.id, name: variant.name, sku: variant.sku, weightGram: 500, price: new Prisma.Decimal("100.00"), isActive: true },
          ],
        }),
      );
      expect(result).toEqual({ ok: false, reason: "DUPLICATE_SLUG" });
    });

    it("duplicate SKU (BAŞKA bir varyantla) reddedilir — DUPLICATE_SKU", async () => {
      const category = await createCategory();
      const existingOther = await createProductWithVariant(category.id);
      const product = await createProductWithVariant(category.id);
      const variant = product.variants[0];

      const result = await updateProductAdminSettings(
        product.id,
        baseUpdateInput({
          categoryId: category.id,
          existingVariants: [
            {
              id: variant.id,
              name: variant.name,
              sku: existingOther.variants[0].sku,
              weightGram: 500,
              price: new Prisma.Decimal("100.00"),
              isActive: true,
            },
          ],
        }),
      );
      expect(result).toEqual({ ok: false, reason: "DUPLICATE_SKU" });
    });

    it("kategori GERÇEKTEN değişince eski ilişki kaldırılır, yeni ilişki tek satır olarak oluşur", async () => {
      const categoryA = await createCategory();
      const categoryB = await createCategory();
      const product = await createProductWithVariant(categoryA.id);
      const variant = product.variants[0];

      await updateProductAdminSettings(
        product.id,
        baseUpdateInput({
          categoryId: categoryB.id,
          existingVariants: [
            { id: variant.id, name: variant.name, sku: variant.sku, weightGram: 500, price: new Prisma.Decimal("100.00"), isActive: true },
          ],
        }),
      );

      const links = await prisma.productCategory.findMany({ where: { productId: product.id } });
      expect(links).toHaveLength(1);
      expect(links[0].categoryId).toBe(categoryB.id);
    });
  });

  describe("deleteProductVariant — güvenli silme", () => {
    it("hiç kullanılmamış varyant (birden fazla varyantlı üründe) fiziksel olarak silinir", async () => {
      const category = await createCategory();
      const product = await createProductWithVariant(category.id);
      const suffix = randomUUID().slice(0, 8);
      const secondVariant = await prisma.productVariant.create({
        data: { productId: product.id, sku: `TEST-SKU-2-${suffix}`, name: "1 kg", price: "180.00", isActive: true },
      });

      const result = await deleteProductVariant(secondVariant.id);
      expect(result).toEqual({ ok: true, removedImageUrls: [] });

      const stillExists = await prisma.productVariant.findUnique({ where: { id: secondVariant.id } });
      expect(stillExists).toBeNull();
    });

    it("ürünün TEK/son varyantı silinemez — LAST_VARIANT", async () => {
      const category = await createCategory();
      const product = await createProductWithVariant(category.id);
      const variant = product.variants[0];

      const result = await deleteProductVariant(variant.id);
      expect(result).toEqual({ ok: false, reason: "LAST_VARIANT" });

      const stillExists = await prisma.productVariant.findUnique({ where: { id: variant.id } });
      expect(stillExists).not.toBeNull();
    });

    it("geçmiş bir siparişte kullanılan varyant silinemez — IN_USE", async () => {
      const category = await createCategory();
      const product = await createProductWithVariant(category.id);
      const suffix = randomUUID().slice(0, 8);
      const secondVariant = await prisma.productVariant.create({
        data: { productId: product.id, sku: `TEST-SKU-ORDER-${suffix}`, name: "1 kg", price: "180.00", isActive: true },
      });

      const order = await prisma.order.create({
        data: {
          orderNumber: `OSSA-TEST-${suffix.toUpperCase()}`,
          email: `test-${suffix}@ossa-test.local`,
          phone: "05551234567",
          status: OrderStatus.PENDING,
          invoiceType: InvoiceType.INDIVIDUAL,
          subtotal: "180.00",
          discountTotal: "0",
          shippingTotal: "0",
          shippingPriceStatus: "FREE",
          taxTotal: "0",
          grandTotal: "180.00",
          totalStatus: "FINAL",
          shippingAddressSnapshot: {},
          billingAddressSnapshot: {},
          idempotencyKey: randomUUID(),
          requestFingerprint: randomUUID(),
          resultAccessToken: randomUUID(),
          items: {
            create: [
              {
                productId: product.id,
                variantId: secondVariant.id,
                productName: product.name,
                variantName: secondVariant.name,
                sku: secondVariant.sku,
                quantity: 1,
                regularUnitPrice: "180.00",
                unitPrice: "180.00",
                lineTotal: "180.00",
              },
            ],
          },
        },
      });
      createdOrderIds.push(order.id);

      const result = await deleteProductVariant(secondVariant.id);
      expect(result).toEqual({ ok: false, reason: "IN_USE" });

      const stillExists = await prisma.productVariant.findUnique({ where: { id: secondVariant.id } });
      expect(stillExists).not.toBeNull();
    });

    it("aktif bir BundleOffer'da (ana veya tamamlayıcı) kullanılan varyant silinemez — IN_USE", async () => {
      const category = await createCategory();
      const primaryProduct = await createProductWithVariant(category.id);
      const companionProduct = await createProductWithVariant(category.id);
      const suffix = randomUUID().slice(0, 8);
      const extraVariant = await prisma.productVariant.create({
        data: { productId: primaryProduct.id, sku: `TEST-SKU-BUNDLE-${suffix}`, name: "1 kg", price: "180.00", isActive: true },
      });

      const bundle = await prisma.bundleOffer.create({
        data: {
          primaryProductId: primaryProduct.id,
          primaryVariantId: extraVariant.id,
          companionProductId: companionProduct.id,
          companionVariantId: companionProduct.variants[0].id,
          companionPrice: "80.00",
          isActive: true,
        },
      });
      createdBundleOfferIds.push(bundle.id);

      const result = await deleteProductVariant(extraVariant.id);
      expect(result).toEqual({ ok: false, reason: "IN_USE" });
    });
  });

  describe("Görsel yönetimi — add/remove/setPrimary/updateAlt", () => {
    it("ilk eklenen görsel otomatik primary olur, ikinci görsel primary olmaz", async () => {
      const category = await createCategory();
      const product = await createProductWithVariant(category.id);

      const first = await addProductImage(product.id, { url: "/images/products/test-1.svg", altText: "Birinci" });
      const second = await addProductImage(product.id, { url: "/images/products/test-2.svg", altText: "İkinci" });

      const images = await prisma.productImage.findMany({ where: { productId: product.id }, orderBy: { sortOrder: "asc" } });
      expect(images.find((i) => i.id === first.id)?.isPrimary).toBe(true);
      expect(images.find((i) => i.id === second.id)?.isPrimary).toBe(false);
    });

    it("primary görsel kaldırılınca kalan görsellerden biri otomatik yeni primary olur", async () => {
      const category = await createCategory();
      const product = await createProductWithVariant(category.id);
      const first = await addProductImage(product.id, { url: "/images/products/test-a.svg", altText: null });
      const second = await addProductImage(product.id, { url: "/images/products/test-b.svg", altText: null });

      const removeResult = await removeProductImage(first.id);
      expect(removeResult).toEqual({ ok: true, removedUrl: "/images/products/test-a.svg" });

      const remaining = await prisma.productImage.findUnique({ where: { id: second.id } });
      expect(remaining?.isPrimary).toBe(true);
    });

    it("setPrimaryProductImage üründe HER ZAMAN yalnızca bir primary bırakır", async () => {
      const category = await createCategory();
      const product = await createProductWithVariant(category.id);
      const first = await addProductImage(product.id, { url: "/images/products/test-c.svg", altText: null });
      const second = await addProductImage(product.id, { url: "/images/products/test-d.svg", altText: null });

      await setPrimaryProductImage(second.id);

      const images = await prisma.productImage.findMany({ where: { productId: product.id } });
      const primaries = images.filter((i) => i.isPrimary);
      expect(primaries).toHaveLength(1);
      expect(primaries[0].id).toBe(second.id);
      void first;
    });

    it("updateProductImageAlt alt metnini günceller", async () => {
      const category = await createCategory();
      const product = await createProductWithVariant(category.id);
      const image = await addProductImage(product.id, { url: "/images/products/test-e.svg", altText: "Eski" });

      await updateProductImageAlt(image.id, "Yeni alt metin");

      const updated = await prisma.productImage.findUnique({ where: { id: image.id } });
      expect(updated?.altText).toBe("Yeni alt metin");
    });
  });

  describe("Ürün Bilgisi alanları — alerjen/kullanım önerisi/menşe/besin değerleri", () => {
    it("besin değeri + kaynak alanları birlikte doğru şekilde yazılır ve okunur", async () => {
      const category = await createCategory();
      const product = await createProductWithVariant(category.id);

      const result = await updateProductAdminSettings(
        product.id,
        baseUpdateInput({
          categoryId: category.id,
          allergenInfo: "Sert kabuklu yemiş (badem) içerir.",
          usageSuggestion: "Kahvaltıda kullanılabilir.",
          originInfo: null,
          nutrition: {
            energyKcal: new Prisma.Decimal("579"),
            energyKj: null,
            fat: new Prisma.Decimal("49.90"),
            saturatedFat: new Prisma.Decimal("3.80"),
            carbohydrate: new Prisma.Decimal("21.60"),
            sugars: null,
            fiber: new Prisma.Decimal("12.50"),
            protein: new Prisma.Decimal("21.20"),
            salt: new Prisma.Decimal("0.003"),
            sourceName: "USDA FoodData Central",
            sourceUrl: "https://fdc.nal.usda.gov/food-details/170567/nutrients",
            sourceProduct: "Nuts, almonds",
            referenceType: "REFERENCE_AVERAGE",
            confidence: "HIGH",
          },
        }),
      );

      expect(result).toEqual({ ok: true });

      const updated = await prisma.product.findUnique({ where: { id: product.id } });
      expect(updated?.allergenInfo).toBe("Sert kabuklu yemiş (badem) içerir.");
      expect(updated?.originInfo).toBeNull();
      expect(updated?.nutritionEnergyKcal?.toString()).toBe("579");
      expect(updated?.nutritionEnergyKj).toBeNull();
      expect(updated?.nutritionSourceUrl).toBe("https://fdc.nal.usda.gov/food-details/170567/nutrients");
      expect(updated?.nutritionConfidence).toBe("HIGH");
    });

    it("nutrition alanları boş geçilirse hepsi NULL kalır (RECIPE_REQUIRED ürün senaryosu)", async () => {
      const category = await createCategory();
      const product = await createProductWithVariant(category.id);

      await updateProductAdminSettings(
        product.id,
        baseUpdateInput({ categoryId: category.id, description: "Soslu mısır — reçeteye bağlı bir üründür." }),
      );

      const updated = await prisma.product.findUnique({ where: { id: product.id } });
      expect(updated?.nutritionEnergyKcal).toBeNull();
      expect(updated?.nutritionSourceName).toBeNull();
      expect(updated?.nutritionConfidence).toBeNull();
      expect(updated?.allergenInfo).toBeNull();
      expect(updated?.originInfo).toBeNull();
    });
  });
});
