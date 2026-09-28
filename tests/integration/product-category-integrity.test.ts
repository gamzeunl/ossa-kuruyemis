/**
 * Bu dosya İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz.
 * tests/db.ts, tests/setup.ts, docs/TEST_STRATEGY.md) — dev/production
 * veritabanına ASLA yazmaz. "Ürünlerin yanlış kategorilere atanması"
 * düzeltmesinin DB-seviyesi/sorgu-seviyesi doğrulamalarını içerir:
 * tek ana kategori kısıtı, idempotent upsert, kategori sayfası/mega menü
 * grup filtresi/benzer ürün sorgularının kategori dışına SIZMADIĞI.
 */
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { ProductStatus } from "@/generated/prisma/client";
import {
  getProductBySlug,
  getRelatedProducts,
  listProducts,
  listProductsByGroup,
} from "@/server/services/catalog-service";
import { updateProductAdminSettings } from "@/server/repositories/product-repository";
import { getTestPrismaClient, hasTestDatabase } from "../db";

/** `updateProductAdminSettings`'in gerektirdiği alanları test senaryosuna göre dolduran yardımcı — ad/slug/durum değişmeden korunur. */
function updateInput(product: { name: string; slug: string }, categoryId: string) {
  return {
    name: product.name,
    slug: product.slug,
    status: ProductStatus.ACTIVE,
    isRecommended: false,
    newBadgeOverride: null,
    categoryId,
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
  };
}

if (!hasTestDatabase) {
  console.warn(
    "[tests/integration/product-category-integrity] TEST_DATABASE_URL tanımsız — testler atlanıyor.",
  );
}

describe.skipIf(!hasTestDatabase)("Ürün-kategori veri bütünlüğü (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const createdCategoryIds: string[] = [];
  const createdProductIds: string[] = [];

  async function createCategory(namePrefix: string) {
    const suffix = randomUUID().slice(0, 8);
    const category = await prisma.category.create({
      data: {
        name: `${namePrefix} ${suffix}`,
        slug: `${namePrefix.toLowerCase().replace(/\s+/g, "-")}-${suffix}`,
        isActive: true,
      },
    });
    createdCategoryIds.push(category.id);
    return category;
  }

  async function createProduct(name: string, categoryId: string, slugHint?: string) {
    const suffix = randomUUID().slice(0, 8);
    const product = await prisma.product.create({
      data: {
        name,
        slug: `${slugHint ?? name.toLowerCase().replace(/\s+/g, "-")}-${suffix}`,
        status: ProductStatus.ACTIVE,
        productCategories: { create: [{ categoryId, sortOrder: 0 }] },
        variants: {
          create: [
            {
              sku: `TEST-CAT-SKU-${suffix}`,
              name: "500 g",
              price: "100.00",
              isActive: true,
              inventory: { create: { quantityAvailable: 10, quantityReserved: 0, lowStockThreshold: 1 } },
            },
          ],
        },
      },
    });
    createdProductIds.push(product.id);
    return product;
  }

  afterAll(async () => {
    await prisma.inventory.deleteMany({ where: { variant: { productId: { in: createdProductIds } } } });
    await prisma.productVariant.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.productCategory.deleteMany({ where: { productId: { in: createdProductIds } } });
    await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    await prisma.category.deleteMany({ where: { id: { in: createdCategoryIds } } });
  });

  it("bir ürün ikinci bir ana kategoriye BAĞLANAMAZ — DB unique kısıtı reddeder", async () => {
    const categoryA = await createCategory("Test Kategori A");
    const categoryB = await createCategory("Test Kategori B");
    const product = await createProduct("Test Tekil Kategori Ürünü", categoryA.id);

    await expect(
      prisma.productCategory.create({ data: { productId: product.id, categoryId: categoryB.id, sortOrder: 0 } }),
    ).rejects.toThrow();

    const links = await prisma.productCategory.findMany({ where: { productId: product.id } });
    expect(links).toHaveLength(1);
    expect(links[0].categoryId).toBe(categoryA.id);
  });

  it("seed'in kullandığı upsert deseni idempotent — aynı ürün/kategori ikinci kez upsert edilince tek satır kalır", async () => {
    const category = await createCategory("Test Kategori İdempotent");
    const product = await createProduct("Test İdempotent Ürün", category.id);

    // seed.ts'in gerçek deseniyle AYNI: productId_categoryId üzerinden upsert.
    for (let i = 0; i < 2; i += 1) {
      await prisma.productCategory.upsert({
        where: { productId_categoryId: { productId: product.id, categoryId: category.id } },
        update: { sortOrder: i },
        create: { productId: product.id, categoryId: category.id, sortOrder: i },
      });
    }

    const links = await prisma.productCategory.findMany({ where: { productId: product.id } });
    expect(links).toHaveLength(1);
    expect(links[0].sortOrder).toBe(1);
  });

  it("kategori sayfası yalnızca kendi kategorisindeki ürünleri döndürür — başka kategoriden sızma yok", async () => {
    const categoryA = await createCategory("Test Vitrin A");
    const categoryB = await createCategory("Test Vitrin B");
    const productA = await createProduct("Test Vitrin Ürünü A", categoryA.id);
    const productB = await createProduct("Test Vitrin Ürünü B", categoryB.id);

    const resultA = await listProducts({ categorySlug: categoryA.slug, pageSize: 50 });
    const idsA = resultA.items.map((item) => item.id);
    expect(idsA).toContain(productA.id);
    expect(idsA).not.toContain(productB.id);

    const resultB = await listProducts({ categorySlug: categoryB.slug, pageSize: 50 });
    const idsB = resultB.items.map((item) => item.id);
    expect(idsB).toContain(productB.id);
    expect(idsB).not.toContain(productA.id);
  });

  it("mega menü grup filtresi (gerçek cerez/cekirdekler ve cerez/misir grupları) kategori dışına taşmıyor", async () => {
    // `getMegaMenuGroup` sabit `mega-menu-content.ts` konfigürasyonunu LİTERAL
    // "cerez" slug'ıyla anahtarlar — bu yüzden test kategorisi rastgele ek
    // olmadan tam bu slug'la oluşturulur (test DB'de gerçek "cerez" kategorisi
    // yok, çakışma riski yok; `afterAll` id bazlı temizlik yapar). Aynı slug'ı
    // İKİNCİ kez oluşturmak unique kısıtına takılacağından, cekirdekler VE
    // misir grup testleri AYNI kategori kaydını paylaşır.
    const cerez = await prisma.category.create({
      data: { name: "Test Cerez (mega menü)", slug: "cerez", isActive: true },
    });
    createdCategoryIds.push(cerez.id);
    const otherCategory = await createCategory("Test Diğer Kategori");

    // Çekirdekler grubunun GERÇEK ürünü, doğru (cerez) kategoride.
    const realMember = await createProduct("Kabak çekirdeği", cerez.id, "kabak-cekirdegi-group-test");
    // Aynı kategoride ama BAŞKA bir grubun ürünü (leblebiler) — cekirdekler grubuna sızmamalı.
    const sameCategoryDifferentGroup = await createProduct("Sarı leblebi", cerez.id, "sari-leblebi-group-test");
    // AYNI isim ("Kabak çekirdeği") ama YANLIŞ kategoride — sızma testi.
    const wrongCategorySameName = await createProduct(
      "Kabak çekirdeği",
      otherCategory.id,
      "kabak-cekirdegi-wrong-category-test",
    );
    // Mısır grubunun GERÇEK ürünü — aynı "cerez" kategoride, ayrı grup.
    const misirMember = await createProduct("Yağlı mısır", cerez.id, "yagli-misir-group-test");

    const cekirdeklerResult = await listProductsByGroup({
      categorySlug: cerez.slug,
      groupSlug: "cekirdekler",
      page: 1,
      pageSize: 50,
      sort: "default",
    });
    const cekirdeklerIds = cekirdeklerResult.items.map((item) => item.id);

    expect(cekirdeklerIds).toContain(realMember.id);
    expect(cekirdeklerIds).not.toContain(sameCategoryDifferentGroup.id);
    expect(cekirdeklerIds).not.toContain(wrongCategorySameName.id);
    // Mısır ürünü artık Çekirdekler grubuna sızmıyor (iş kararıyla taşındı).
    expect(cekirdeklerIds).not.toContain(misirMember.id);

    const misirResult = await listProductsByGroup({
      categorySlug: cerez.slug,
      groupSlug: "misir",
      page: 1,
      pageSize: 50,
      sort: "default",
    });
    const misirIds = misirResult.items.map((item) => item.id);

    expect(misirIds).toContain(misirMember.id);
    expect(misirIds).not.toContain(realMember.id);

    // Mısır ürününün ana kategorisi hâlâ "cerez" — yalnızca grup eşleşmesi değişti.
    const misirCategoryLinks = await prisma.productCategory.findMany({ where: { productId: misirMember.id } });
    expect(misirCategoryLinks).toHaveLength(1);
    expect(misirCategoryLinks[0].categoryId).toBe(cerez.id);
  });

  it("benzer ürünler (Bunları da Beğenebilirsiniz) yalnızca AYNI ana kategoriden gelir", async () => {
    const categoryA = await createCategory("Test Benzer A");
    const categoryB = await createCategory("Test Benzer B");
    const anchor = await createProduct("Test Benzer Ana Ürün", categoryA.id);
    const sibling = await createProduct("Test Benzer Kardeş Ürün", categoryA.id);
    const stranger = await createProduct("Test Benzer Yabancı Ürün", categoryB.id);

    const anchorDetail = await getProductBySlug(anchor.slug);
    expect(anchorDetail).not.toBeNull();
    if (!anchorDetail) return;

    const related = await getRelatedProducts(anchorDetail, 10);
    const relatedIds = related.map((item) => item.id);

    expect(relatedIds).toContain(sibling.id);
    expect(relatedIds).not.toContain(stranger.id);
    expect(relatedIds).not.toContain(anchor.id);
  });

  describe("updateProductAdminSettings — admin ürün düzenlemede kategori değişimi", () => {
    it("kategori değiştirme: eski ilişki kaldırılır, yeni ilişki oluşur, tek satır kalır", async () => {
      const oldCategory = await createCategory("Test Güncelleme Eski");
      const newCategory = await createCategory("Test Güncelleme Yeni");
      const product = await createProduct("Test Güncelleme Ürünü", oldCategory.id);

      await updateProductAdminSettings(product.id, updateInput(product, newCategory.id));

      const links = await prisma.productCategory.findMany({ where: { productId: product.id } });
      expect(links).toHaveLength(1);
      expect(links[0].categoryId).toBe(newCategory.id);
    });

    it("aynı kategoriyle kaydetme: idempotent — ilişki değişmeden tek satır kalır", async () => {
      const category = await createCategory("Test Aynı Kategori");
      const product = await createProduct("Test Aynı Kategori Ürünü", category.id);

      await updateProductAdminSettings(product.id, updateInput(product, category.id));
      await updateProductAdminSettings(product.id, updateInput(product, category.id));

      const links = await prisma.productCategory.findMany({ where: { productId: product.id } });
      expect(links).toHaveLength(1);
      expect(links[0].categoryId).toBe(category.id);
    });

    it("ürün güncelleme sonrası da asla 2 kategoriye birden bağlı kalmıyor (birden fazla ardışık değişiklik)", async () => {
      const categoryA = await createCategory("Test Ardışık A");
      const categoryB = await createCategory("Test Ardışık B");
      const categoryC = await createCategory("Test Ardışık C");
      const product = await createProduct("Test Ardışık Değişim Ürünü", categoryA.id);

      await updateProductAdminSettings(product.id, updateInput(product, categoryB.id));
      await updateProductAdminSettings(product.id, updateInput(product, categoryC.id));
      await updateProductAdminSettings(product.id, updateInput(product, categoryB.id));

      const links = await prisma.productCategory.findMany({ where: { productId: product.id } });
      expect(links).toHaveLength(1);
      expect(links[0].categoryId).toBe(categoryB.id);
    });

    it("kategori değiştikten sonra ürün ESKİ kategori sayfasından kaybolur, YENİ kategori sayfasında görünür", async () => {
      const oldCategory = await createCategory("Test Sayfa Eski");
      const newCategory = await createCategory("Test Sayfa Yeni");
      const product = await createProduct("Test Sayfa Görünürlük Ürünü", oldCategory.id);

      const beforeOld = await listProducts({ categorySlug: oldCategory.slug, pageSize: 50 });
      expect(beforeOld.items.map((item) => item.id)).toContain(product.id);
      const beforeNew = await listProducts({ categorySlug: newCategory.slug, pageSize: 50 });
      expect(beforeNew.items.map((item) => item.id)).not.toContain(product.id);

      await updateProductAdminSettings(product.id, updateInput(product, newCategory.id));

      const afterOld = await listProducts({ categorySlug: oldCategory.slug, pageSize: 50 });
      expect(afterOld.items.map((item) => item.id)).not.toContain(product.id);
      const afterNew = await listProducts({ categorySlug: newCategory.slug, pageSize: 50 });
      expect(afterNew.items.map((item) => item.id)).toContain(product.id);
    });

    it("geçersiz kategoriye geçiş denemesi (yabancı anahtar ihlali) reddedilir, mevcut ilişki bozulmaz", async () => {
      const category = await createCategory("Test Geçersiz Hedef");
      const product = await createProduct("Test Geçersiz Hedef Ürünü", category.id);

      await expect(
        updateProductAdminSettings(product.id, updateInput(product, "does-not-exist")),
      ).rejects.toThrow();

      const links = await prisma.productCategory.findMany({ where: { productId: product.id } });
      expect(links).toHaveLength(1);
      expect(links[0].categoryId).toBe(category.id);
    });
  });
});
