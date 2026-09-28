"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { validateVariantPriceInput } from "@/lib/product-pricing";
import { productInfoFormSchema } from "@/lib/product-info-schema";
import { productFormSchema, productUpdateFormSchema, productVariantFormSchema } from "@/lib/product-schema";
import { recordAuditLog } from "@/server/audit/audit-log";
import { prisma } from "@/server/db/prisma";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { findCategoryById } from "@/server/repositories/category-repository";
import { markAllVariantsSoldOut, markVariantSoldOut } from "@/server/repositories/inventory-repository";
import {
  addProductImage,
  createProduct,
  deleteOrArchiveProduct,
  deleteProductVariant,
  findProductForAdmin,
  removeProductImage,
  setPrimaryProductImage,
  updateProductAdminSettings,
  updateProductImageAlt,
  type AdminProductDetailRow,
  type CreateProductFailureReason,
  type CreateProductImageInput,
  type CreateProductVariantInput,
  type UpdateProductExistingVariantInput,
  type UpdateProductInfoInput,
  type UpdateProductNewVariantInput,
} from "@/server/repositories/product-repository";
import { resolveStorageProvider } from "@/server/providers/storage-provider";

export type AdminActionResult = { ok: true } | { ok: false; message: string };

function parseNewBadgeOverride(value: FormDataEntryValue | null): boolean | null {
  if (value === "show") return true;
  if (value === "hide") return false;
  return null;
}

function parseOptionalDate(value: string): Date | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toNullable(value: string | undefined): string | null {
  return value && value.length > 0 ? value : null;
}

function toNullableDecimal(value: string | undefined): Prisma.Decimal | null {
  return value && value.length > 0 ? new Prisma.Decimal(value) : null;
}

/** Tüm alanlar opsiyonel — hiçbiri zorunlu değil. */
function parseProductInfoInput(
  formData: FormData,
): { ok: true; data: UpdateProductInfoInput } | { ok: false; message: string } {
  const parsed = productInfoFormSchema.safeParse({
    description: String(formData.get("description") ?? "").trim() || undefined,
    shortDescription: String(formData.get("shortDescription") ?? "").trim() || undefined,
    ingredients: String(formData.get("ingredients") ?? "").trim() || undefined,
    storageConditions: String(formData.get("storageConditions") ?? "").trim() || undefined,
    deliveryInfo: String(formData.get("deliveryInfo") ?? "").trim() || undefined,
    allergenInfo: String(formData.get("allergenInfo") ?? "").trim() || undefined,
    originInfo: String(formData.get("originInfo") ?? "").trim() || undefined,
    usageSuggestion: String(formData.get("usageSuggestion") ?? "").trim() || undefined,
    nutritionEnergyKcal: String(formData.get("nutritionEnergyKcal") ?? "").trim() || undefined,
    nutritionEnergyKj: String(formData.get("nutritionEnergyKj") ?? "").trim() || undefined,
    nutritionFat: String(formData.get("nutritionFat") ?? "").trim() || undefined,
    nutritionSaturatedFat: String(formData.get("nutritionSaturatedFat") ?? "").trim() || undefined,
    nutritionCarbohydrate: String(formData.get("nutritionCarbohydrate") ?? "").trim() || undefined,
    nutritionSugars: String(formData.get("nutritionSugars") ?? "").trim() || undefined,
    nutritionFiber: String(formData.get("nutritionFiber") ?? "").trim() || undefined,
    nutritionProtein: String(formData.get("nutritionProtein") ?? "").trim() || undefined,
    nutritionSalt: String(formData.get("nutritionSalt") ?? "").trim() || undefined,
    nutritionSourceName: String(formData.get("nutritionSourceName") ?? "").trim() || undefined,
    nutritionSourceUrl: String(formData.get("nutritionSourceUrl") ?? "").trim() || undefined,
    nutritionSourceProduct: String(formData.get("nutritionSourceProduct") ?? "").trim() || undefined,
    nutritionReferenceType: String(formData.get("nutritionReferenceType") ?? "").trim() || undefined,
    nutritionConfidence: String(formData.get("nutritionConfidence") ?? "").trim() || undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  return {
    ok: true,
    data: {
      description: toNullable(parsed.data.description),
      shortDescription: toNullable(parsed.data.shortDescription),
      ingredients: toNullable(parsed.data.ingredients),
      storageConditions: toNullable(parsed.data.storageConditions),
      deliveryInfo: toNullable(parsed.data.deliveryInfo),
      allergenInfo: toNullable(parsed.data.allergenInfo),
      originInfo: toNullable(parsed.data.originInfo),
      usageSuggestion: toNullable(parsed.data.usageSuggestion),
      nutrition: {
        energyKcal: toNullableDecimal(parsed.data.nutritionEnergyKcal),
        energyKj: toNullableDecimal(parsed.data.nutritionEnergyKj),
        fat: toNullableDecimal(parsed.data.nutritionFat),
        saturatedFat: toNullableDecimal(parsed.data.nutritionSaturatedFat),
        carbohydrate: toNullableDecimal(parsed.data.nutritionCarbohydrate),
        sugars: toNullableDecimal(parsed.data.nutritionSugars),
        fiber: toNullableDecimal(parsed.data.nutritionFiber),
        protein: toNullableDecimal(parsed.data.nutritionProtein),
        salt: toNullableDecimal(parsed.data.nutritionSalt),
        sourceName: toNullable(parsed.data.nutritionSourceName),
        sourceUrl: toNullable(parsed.data.nutritionSourceUrl),
        sourceProduct: toNullable(parsed.data.nutritionSourceProduct),
        referenceType: parsed.data.nutritionReferenceType ?? null,
        confidence: parsed.data.nutritionConfidence ?? null,
      },
    },
  };
}

interface ParsedVariantRow {
  name: string;
  sku: string;
  weightGram: number | null;
  price: Prisma.Decimal;
  isActive: boolean;
}

/**
 * Bir varyant satırını (mevcut VEYA yeni — aynı alan seti) forma göre
 * doğrular. Fiyat/gramaj kuralları oluşturma akışıyla AYNI kaynaktan
 * (`validateVariantPriceInput`) gelir; burada indirim hiç toplanmaz (`null`
 * geçilir) — bu form indirim yazmaz, bkz. dosya başı yorumu.
 */
function parseVariantRow(
  formData: FormData,
  prefix: string,
): { ok: true; data: ParsedVariantRow } | { ok: false; message: string } {
  const parsed = productVariantFormSchema.safeParse({
    name: String(formData.get(`${prefix}-name`) ?? ""),
    sku: String(formData.get(`${prefix}-sku`) ?? ""),
    weightGram: String(formData.get(`${prefix}-weightGram`) ?? "").trim() || undefined,
    price: String(formData.get(`${prefix}-price`) ?? ""),
    isActive: formData.get(`${prefix}-isActive`) === "on",
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const priceResult = validateVariantPriceInput({
    price: parsed.data.price,
    discountPrice: null,
    discountStartsAt: null,
    discountEndsAt: null,
  });
  if (!priceResult.ok) {
    return { ok: false, message: `${parsed.data.name}: ${priceResult.message}` };
  }

  const weightGram = parsed.data.weightGram ? Number(parsed.data.weightGram) : null;
  if (weightGram !== null && (!Number.isFinite(weightGram) || weightGram <= 0)) {
    return { ok: false, message: `${parsed.data.name}: gramaj pozitif bir sayı olmalı.` };
  }

  return {
    ok: true,
    data: {
      name: parsed.data.name,
      sku: parsed.data.sku.trim(),
      weightGram,
      price: priceResult.price,
      isActive: parsed.data.isActive,
    },
  };
}

/** Ürünün mevcut (eski) VE olası yeni slug/kategori kombinasyonu için ilgili tüm müşteri yüzeylerini günceller. */
function revalidateProductCoreSurfaces(slug: string, categorySlug: string | null): void {
  revalidatePath("/");
  revalidatePath("/urunler");
  revalidatePath(`/urunler/${slug}`);
  if (categorySlug) {
    revalidatePath(`/${categorySlug}`);
  }
}

function revalidateProductChangeSurfaces(
  oldSlug: string,
  newSlug: string,
  oldCategorySlug: string | null,
  newCategorySlug: string,
): void {
  revalidateProductCoreSurfaces(oldSlug, oldCategorySlug);
  if (newSlug !== oldSlug || newCategorySlug !== oldCategorySlug) {
    revalidateProductCoreSurfaces(newSlug, newCategorySlug);
  }
}

function infoFieldsChanged(before: AdminProductDetailRow, after: UpdateProductInfoInput): boolean {
  return (
    before.description !== after.description ||
    before.shortDescription !== after.shortDescription ||
    before.ingredients !== after.ingredients ||
    before.storageConditions !== after.storageConditions ||
    before.deliveryInfo !== after.deliveryInfo
  );
}

/**
 * `/yonetim/urunler/[id]` — Temel Bilgiler + Ürün İçeriği + Varyantlar (çekirdek
 * alanlar) + SEO + Yayın Ayarları'nı TEK kaydetmede günceller. İndirim alanları
 * BİLİNÇLİ OLARAK burada YOK (bkz. `updateProductAdminSettings` yorumu) —
 * "Haftanın Fırsatları" TEK indirim yazma yolu olmaya devam ediyor. Görsel
 * ekleme/kaldırma/ana-görsel-seçme ve varyant silme AYRI, küçük, odaklı
 * action'lardır (aşağıda) — bu büyük form onları KAPSAMAZ.
 */
export async function updateProductAdminAction(
  productId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const product = await findProductForAdmin(productId);
  if (!product) {
    return { ok: false, message: "Ürün bulunamadı." };
  }

  const basicResult = productUpdateFormSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    categoryId: String(formData.get("categoryId") ?? ""),
    status: String(formData.get("status") ?? product.status),
    metaTitle: String(formData.get("metaTitle") ?? "").trim() || undefined,
    metaDescription: String(formData.get("metaDescription") ?? "").trim() || undefined,
  });
  if (!basicResult.success) {
    return { ok: false, message: basicResult.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const category = await findCategoryById(basicResult.data.categoryId);
  if (!category) {
    return { ok: false, message: "Seçilen kategori bulunamadı." };
  }
  if (!category.isActive) {
    return { ok: false, message: "Seçilen kategori pasif — ürün pasif bir kategoriye atanamaz." };
  }

  const isRecommended = formData.get("isRecommended") === "on";
  const newBadgeOverride = parseNewBadgeOverride(formData.get("newBadgeOverride"));

  const infoResult = parseProductInfoInput(formData);
  if (!infoResult.ok) {
    return { ok: false, message: infoResult.message };
  }

  // Mevcut varyantlar — yalnızca ÜRÜNE GERÇEKTEN AİT olduğu DB'den doğrulanmış
  // id'ler işlenir; client'tan gelebilecek keyfi bir varyant id'si asla
  // güvenilmez (yalnızca `product.variants` üzerinden döngü kurulur).
  const existingVariants: UpdateProductExistingVariantInput[] = [];
  for (const variant of product.variants) {
    const parsedRow = parseVariantRow(formData, `existingVariant-${variant.id}`);
    if (!parsedRow.ok) {
      return { ok: false, message: parsedRow.message };
    }
    existingVariants.push({ id: variant.id, ...parsedRow.data });
  }

  // Yeni eklenen varyantlar (oluşturma formuyla aynı `*Index` deseni).
  const newVariantKeys = formData.getAll("newVariantIndex").map(String);
  const newVariants: UpdateProductNewVariantInput[] = [];
  for (const key of newVariantKeys) {
    const parsedRow = parseVariantRow(formData, `newVariant-${key}`);
    if (!parsedRow.ok) {
      return { ok: false, message: parsedRow.message };
    }
    newVariants.push(parsedRow.data);
  }

  // Aynı gönderim içindeki SKU çakışması — DB kısıtına gitmeden önce dostane hata.
  const skuCounts = new Map<string, number>();
  for (const sku of [...existingVariants.map((v) => v.sku), ...newVariants.map((v) => v.sku)]) {
    skuCounts.set(sku, (skuCounts.get(sku) ?? 0) + 1);
  }
  const duplicateSku = [...skuCounts.entries()].find(([, count]) => count > 1);
  if (duplicateSku) {
    return { ok: false, message: `"${duplicateSku[0]}" SKU'su birden fazla varyantta kullanılıyor.` };
  }

  const oldCategoryLink = product.productCategories[0] ?? null;
  const categoryChanged = oldCategoryLink?.categoryId !== category.id;
  const recommendationChanged = product.isRecommended !== isRecommended;
  const infoChanged = infoFieldsChanged(product, infoResult.data);
  const basicInfoChanged =
    product.name !== basicResult.data.name ||
    product.slug !== basicResult.data.slug ||
    product.status !== basicResult.data.status;
  const metaTitleValue = basicResult.data.metaTitle ?? null;
  const metaDescriptionValue = basicResult.data.metaDescription ?? null;
  const seoChanged = product.metaTitle !== metaTitleValue || product.metaDescription !== metaDescriptionValue;
  const changedExistingVariantIds = existingVariants
    .filter((input) => {
      const before = product.variants.find((variant) => variant.id === input.id);
      if (!before) return false;
      return (
        before.name !== input.name ||
        before.sku !== input.sku ||
        before.weightGram !== input.weightGram ||
        !before.price.equals(input.price) ||
        before.isActive !== input.isActive
      );
    })
    .map((input) => input.id);

  const result = await updateProductAdminSettings(productId, {
    name: basicResult.data.name,
    slug: basicResult.data.slug,
    status: basicResult.data.status,
    isRecommended,
    newBadgeOverride,
    categoryId: category.id,
    metaTitle: metaTitleValue,
    metaDescription: metaDescriptionValue,
    existingVariants,
    newVariants,
    ...infoResult.data,
  });

  if (!result.ok) {
    return {
      ok: false,
      message: result.reason === "DUPLICATE_SLUG" ? "Bu slug zaten kullanılıyor." : "Bu SKU zaten kullanılıyor.",
    };
  }

  if (categoryChanged) {
    await recordAuditLog({
      actorId: admin.id,
      action: "PRODUCT_CATEGORY_CHANGED",
      entityType: "Product",
      entityId: productId,
      metadata: {
        before: oldCategoryLink
          ? { categoryId: oldCategoryLink.categoryId, categorySlug: oldCategoryLink.category.slug }
          : null,
        after: { categoryId: category.id, categorySlug: category.slug },
      },
    });
  }
  if (basicInfoChanged) {
    await recordAuditLog({
      actorId: admin.id,
      action: "PRODUCT_BASIC_INFO_CHANGED",
      entityType: "Product",
      entityId: productId,
      metadata: {
        before: { name: product.name, slug: product.slug, status: product.status },
        after: { name: basicResult.data.name, slug: basicResult.data.slug, status: basicResult.data.status },
      },
    });
  }
  if (recommendationChanged) {
    await recordAuditLog({
      actorId: admin.id,
      action: "PRODUCT_RECOMMENDATION_CHANGED",
      entityType: "Product",
      entityId: productId,
      metadata: { isRecommended },
    });
  }
  if (infoChanged) {
    await recordAuditLog({
      actorId: admin.id,
      action: "PRODUCT_INFO_UPDATED",
      entityType: "Product",
      entityId: productId,
    });
  }
  if (seoChanged) {
    await recordAuditLog({
      actorId: admin.id,
      action: "PRODUCT_SEO_UPDATED",
      entityType: "Product",
      entityId: productId,
    });
  }
  if (changedExistingVariantIds.length > 0) {
    await recordAuditLog({
      actorId: admin.id,
      action: "PRODUCT_VARIANT_UPDATED",
      entityType: "Product",
      entityId: productId,
      metadata: { variantIds: changedExistingVariantIds },
    });
  }
  if (newVariants.length > 0) {
    await recordAuditLog({
      actorId: admin.id,
      action: "PRODUCT_VARIANT_ADDED",
      entityType: "Product",
      entityId: productId,
      metadata: { count: newVariants.length, skus: newVariants.map((v) => v.sku) },
    });
  }

  revalidateProductChangeSurfaces(
    product.slug,
    basicResult.data.slug,
    oldCategoryLink?.category.slug ?? null,
    category.slug,
  );

  return { ok: true };
}

// ==================== Varyant silme ====================

const DELETE_VARIANT_FAILURE_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Varyant bulunamadı.",
  LAST_VARIANT: "Bir ürünün en az bir varyantı olmalı — bu son varyant silinemez, bunun yerine pasifleştirin.",
  IN_USE:
    "Bu varyant geçmiş siparişlerde veya kampanyalarda kullanıldığı için silinemez. Bunun yerine \"Aktif\" işaretini kaldırarak pasifleştirin.",
};

/** Yalnızca hiçbir sipariş/BundleOffer'da kullanılmamış VE ürünün son varyantı olmayan varyantları fiziksel siler (bkz. `deleteProductVariant`). */
export async function deleteProductVariantAction(
  productId: string,
  variantId: string,
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const product = await findProductForAdmin(productId);
  if (!product) {
    return { ok: false, message: "Ürün bulunamadı." };
  }

  const result = await deleteProductVariant(variantId);
  if (!result.ok) {
    return { ok: false, message: DELETE_VARIANT_FAILURE_MESSAGES[result.reason] ?? "Varyant silinemedi." };
  }

  const storageProvider = resolveStorageProvider();
  for (const url of result.removedImageUrls) {
    await storageProvider.deleteByUrl(url);
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_VARIANT_DELETED",
    entityType: "Product",
    entityId: productId,
    metadata: { variantId },
  });

  revalidateProductCoreSurfaces(product.slug, product.productCategories[0]?.category.slug ?? null);
  return { ok: true };
}

// ==================== Görsel yönetimi ====================
// Görsel BİNARY'si artık bu action'lara hiç gelmez — dosya önce ayrı
// `/api/yonetim/urun-gorseli` Route Handler'ına yüklenir (orada
// `validateUploadedImage`/optimize edilir/depolanır), buraya yalnızca dönen
// küçük URL string'i ulaşır (bkz. `createProductAction` ile aynı desen).
// Bu, Server Action'ların varsayılan 1 MB body limitini aşmayı önler.

/** Ürüne, ÖNCEDEN yüklenmiş bir görseli (URL) ekler — üründe hiç görsel yoksa otomatik primary olur. */
export async function addProductImageAction(productId: string, formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const product = await findProductForAdmin(productId);
  if (!product) {
    return { ok: false, message: "Ürün bulunamadı." };
  }

  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  if (!resolveStorageProvider().isOwnedUrl(imageUrl)) {
    return { ok: false, message: "Önce bir görsel yüklemelisiniz." };
  }

  const altText = String(formData.get("altText") ?? "").trim() || null;
  await addProductImage(productId, { url: imageUrl, altText });

  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_IMAGE_ADDED",
    entityType: "Product",
    entityId: productId,
  });

  revalidateProductCoreSurfaces(product.slug, product.productCategories[0]?.category.slug ?? null);
  return { ok: true };
}

/** Bir görseli kaldırır — primary görsel kaldırılırsa kalan görsellerden biri (varsa) otomatik yeni primary olur. */
export async function removeProductImageAction(productId: string, imageId: string): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const product = await findProductForAdmin(productId);
  if (!product) {
    return { ok: false, message: "Ürün bulunamadı." };
  }

  const result = await removeProductImage(imageId);
  if (!result.ok) {
    return { ok: false, message: "Görsel bulunamadı." };
  }

  await resolveStorageProvider().deleteByUrl(result.removedUrl);

  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_IMAGE_REMOVED",
    entityType: "Product",
    entityId: productId,
  });

  revalidateProductCoreSurfaces(product.slug, product.productCategories[0]?.category.slug ?? null);
  return { ok: true };
}

/** Bir görseli ana (primary) görsel yapar — üründe her zaman en fazla bir primary görsel kalır. */
export async function setPrimaryProductImageAction(
  productId: string,
  imageId: string,
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const product = await findProductForAdmin(productId);
  if (!product) {
    return { ok: false, message: "Ürün bulunamadı." };
  }

  const result = await setPrimaryProductImage(imageId);
  if (!result.ok) {
    return { ok: false, message: "Görsel bulunamadı." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_IMAGE_PRIMARY_CHANGED",
    entityType: "Product",
    entityId: productId,
    metadata: { imageId },
  });

  revalidateProductCoreSurfaces(product.slug, product.productCategories[0]?.category.slug ?? null);
  return { ok: true };
}

/** Bir görselin alt metnini günceller. */
export async function updateProductImageAltAction(
  productId: string,
  imageId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const product = await findProductForAdmin(productId);
  if (!product) {
    return { ok: false, message: "Ürün bulunamadı." };
  }

  const altText = String(formData.get("altText") ?? "").trim() || null;
  await updateProductImageAlt(imageId, altText);

  revalidateProductCoreSurfaces(product.slug, product.productCategories[0]?.category.slug ?? null);
  return { ok: true };
}

// ==================== Ürün oluşturma ====================

const CREATE_PRODUCT_FAILURE_MESSAGES: Record<CreateProductFailureReason, string> = {
  DUPLICATE_SLUG: "Bu slug zaten kullanılıyor.",
  DUPLICATE_SKU: "Bu SKU zaten kullanılıyor.",
  NO_VARIANTS: "En az bir varyant eklemelisiniz.",
};

/**
 * Yeni ürün + en az 1 varyant + opsiyonel görselleri TEK `createProduct`
 * transaction'ı üzerinden oluşturur. Fiyat/indirim doğrulaması `price-pricing.ts`'teki
 * paylaşılan `validateVariantPriceInput`'tan gelir — normal fiyat burada (UPDATE'in
 * aksine) DB'den değil formdan geldiği için hem fiyat hem indirim birlikte doğrulanır.
 */
export async function createProductAction(formData: FormData): Promise<AdminActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const variantIndexes = formData.getAll("variantIndex").map(String);
  const rawVariants = variantIndexes.map((index) => ({
    name: String(formData.get(`variant-${index}-name`) ?? ""),
    sku: String(formData.get(`variant-${index}-sku`) ?? ""),
    weightGram: String(formData.get(`variant-${index}-weightGram`) ?? "").trim() || undefined,
    price: String(formData.get(`variant-${index}-price`) ?? ""),
    discountPrice: String(formData.get(`variant-${index}-discountPrice`) ?? "").trim() || undefined,
    discountStartsAt: String(formData.get(`variant-${index}-discountStartsAt`) ?? "").trim() || undefined,
    discountEndsAt: String(formData.get(`variant-${index}-discountEndsAt`) ?? "").trim() || undefined,
    isActive: formData.get(`variant-${index}-isActive`) === "on",
  }));

  const parsed = productFormSchema.safeParse({
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    shortDescription: String(formData.get("shortDescription") ?? "").trim() || undefined,
    description: String(formData.get("description") ?? "").trim() || undefined,
    categoryId: String(formData.get("categoryId") ?? ""),
    status: String(formData.get("status") ?? "DRAFT"),
    metaTitle: String(formData.get("metaTitle") ?? "").trim() || undefined,
    metaDescription: String(formData.get("metaDescription") ?? "").trim() || undefined,
    variants: rawVariants,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Girdi doğrulanamadı." };
  }

  const resolvedVariants: CreateProductVariantInput[] = [];
  for (const variant of parsed.data.variants) {
    const discountStartsAt = parseOptionalDate(variant.discountStartsAt ?? "");
    const discountEndsAt = parseOptionalDate(variant.discountEndsAt ?? "");
    const priceResult = validateVariantPriceInput({
      price: variant.price,
      discountPrice: variant.discountPrice ?? null,
      discountStartsAt,
      discountEndsAt,
    });
    if (!priceResult.ok) {
      return { ok: false, message: `${variant.name}: ${priceResult.message}` };
    }

    const weightGram = variant.weightGram ? Number(variant.weightGram) : null;
    if (weightGram !== null && (!Number.isFinite(weightGram) || weightGram <= 0)) {
      return { ok: false, message: `${variant.name}: gramaj pozitif bir sayı olmalı.` };
    }

    resolvedVariants.push({
      name: variant.name,
      sku: variant.sku,
      weightGram,
      price: priceResult.price,
      discountPrice: priceResult.discountPrice,
      discountStartsAt,
      discountEndsAt,
      isActive: variant.isActive,
    });
  }

  // Görseller ÖNCEDEN `/api/yonetim/urun-gorseli`'ne yüklendi (bkz. `ProductCreateForm`/
  // `ProductImageUploader`) — buraya yalnızca küçük URL string'leri (hidden input,
  // `imageUrls`) ulaşır, hiçbir zaman dosya binary'si gelmez.
  const imageAlt = String(formData.get("imageAlt") ?? "").trim() || null;
  const storageProviderForImages = resolveStorageProvider();
  const imageUrls = formData
    .getAll("imageUrls")
    .map((entry) => String(entry).trim())
    .filter((url) => storageProviderForImages.isOwnedUrl(url));
  const images: CreateProductImageInput[] = imageUrls.map((url) => ({ url, altText: imageAlt }));

  const result = await createProduct({
    name: parsed.data.name,
    slug: parsed.data.slug,
    shortDescription: parsed.data.shortDescription ?? null,
    description: parsed.data.description ?? null,
    status: parsed.data.status,
    isRecommended: formData.get("isRecommended") === "on",
    newBadgeOverride: parseNewBadgeOverride(formData.get("newBadgeOverride")),
    metaTitle: parsed.data.metaTitle ?? null,
    metaDescription: parsed.data.metaDescription ?? null,
    categoryId: parsed.data.categoryId,
    variants: resolvedVariants,
    images,
  });

  if (!result.ok) {
    return { ok: false, message: CREATE_PRODUCT_FAILURE_MESSAGES[result.reason] };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_CREATED",
    entityType: "Product",
    entityId: result.productId,
  });

  redirect(`/yonetim/urunler/${result.productId}`);
}

// ==================== Stok: Tükendi / Tekrar Satışa Açma ====================
// Tek gerçek kaynak `Inventory` — burada ayrı bir yapay `isOutOfStock`
// boolean'ı YOK, tükenme durumu her zaman `quantityAvailable - quantityReserved`
// hesabından türetilir (bkz. `product-repository.ts::toAdminProductListRow`).

export type MarkSoldOutActionResult = { ok: true; affectedCount: number } | { ok: false; message: string };

/** Tek bir varyantı tükendi yapar — admin miktar hesabı yapmaz, mevcut stok tamamı sıfırlanır. */
export async function markVariantSoldOutAction(
  productId: string,
  variantId: string,
): Promise<MarkSoldOutActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const result = await markVariantSoldOut(variantId, admin.id);
  if (!result.ok) {
    return { ok: false, message: "Bu varyant zaten tükenmiş durumda." };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_VARIANT_MARKED_SOLD_OUT",
    entityType: "ProductVariant",
    entityId: variantId,
  });

  revalidatePath(`/yonetim/urunler/${productId}`);
  revalidatePath("/yonetim/stok");
  revalidatePath("/");
  return { ok: true, affectedCount: 1 };
}

/** Ürünün TÜM varyantlarını tükendi yapar — çoklu varyantlı ürünlerde toplu aksiyon. */
export async function markAllProductVariantsSoldOutAction(productId: string): Promise<MarkSoldOutActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const { affected } = await markAllVariantsSoldOut(productId, admin.id);

  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_ALL_VARIANTS_MARKED_SOLD_OUT",
    entityType: "Product",
    entityId: productId,
    metadata: { affected },
  });

  revalidatePath(`/yonetim/urunler/${productId}`);
  revalidatePath("/yonetim/stok");
  revalidatePath("/");
  return { ok: true, affectedCount: affected };
}

// ==================== Ürün Silme / Kaldırma ====================

export type DeleteProductActionResult =
  | { ok: true; mode: "HARD_DELETE" }
  | { ok: true; mode: "ARCHIVED"; message: string }
  | { ok: false; message: string };

/**
 * Ürünü güvenli şekilde kaldırır — geçmiş kayıt ilişkisi yoksa kalıcı siler,
 * varsa storefront'tan tamamen kaldırıp (ARCHIVED) geçmiş veriyi korur (bkz.
 * `deleteOrArchiveProduct`). Client tarafında onay diyaloğu ZORUNLU ama
 * bu yetkilendirme DEĞİLDİR — asıl kontrol burada, server tarafındadır.
 */
export async function deleteProductAction(productId: string): Promise<DeleteProductActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, message: "Bu işlem için yetkiniz yok." };
  }

  const product = await findProductForAdmin(productId);
  if (!product) {
    return { ok: false, message: "Ürün bulunamadı." };
  }

  const result = await deleteOrArchiveProduct(productId);

  if (result.mode === "HARD_DELETE") {
    const storageProvider = resolveStorageProvider();
    for (const image of product.images) {
      await storageProvider.deleteByUrl(image.url);
    }
    await recordAuditLog({
      actorId: admin.id,
      action: "PRODUCT_HARD_DELETED",
      entityType: "Product",
      entityId: productId,
      metadata: { name: product.name, slug: product.slug },
    });
    revalidateProductCoreSurfaces(product.slug, product.productCategories[0]?.category.slug ?? null);
    revalidatePath("/yonetim/urunler");
    return { ok: true, mode: "HARD_DELETE" };
  }

  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_ARCHIVED",
    entityType: "Product",
    entityId: productId,
    metadata: { name: product.name, slug: product.slug, blockingReasons: result.blockingReasons },
  });
  revalidateProductCoreSurfaces(product.slug, product.productCategories[0]?.category.slug ?? null);
  revalidatePath("/yonetim/urunler");
  return {
    ok: true,
    mode: "ARCHIVED",
    message: `Bu ürün geçmiş kayıtlarda kullanıldığı için (${result.blockingReasons.join(", ")}) kalıcı olarak silinemez. Mağazadan kaldırıldı.`,
  };
}

// ==================== Toplu İşlemler ====================
// Hard-delete BİLEREK toplu aksiyon listesinde YOK (bkz. görev kuralı) —
// yalnızca geri alınabilir/güvenli durum değişiklikleri toplu uygulanabilir.

export type BulkProductAction = "ACTIVATE" | "ARCHIVE" | "MARK_SOLD_OUT";

export interface BulkProductActionResult {
  ok: boolean;
  affectedCount: number;
  message: string;
}

export async function bulkProductActionAction(
  productIds: string[],
  action: BulkProductAction,
): Promise<BulkProductActionResult> {
  const admin = await betterAuthProvider.getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return { ok: false, affectedCount: 0, message: "Bu işlem için yetkiniz yok." };
  }
  if (productIds.length === 0) {
    return { ok: false, affectedCount: 0, message: "Hiçbir ürün seçilmedi." };
  }

  if (action === "ACTIVATE") {
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { status: "ACTIVE" },
    });
    await recordAuditLog({
      actorId: admin.id,
      action: "PRODUCT_BULK_ACTIVATED",
      entityType: "Product",
      metadata: { productIds },
    });
    revalidatePath("/yonetim/urunler");
    revalidatePath("/");
    return { ok: true, affectedCount: result.count, message: `${result.count} ürün aktif yapıldı.` };
  }

  if (action === "ARCHIVE") {
    const result = await prisma.product.updateMany({
      where: { id: { in: productIds } },
      data: { status: "ARCHIVED" },
    });
    await recordAuditLog({
      actorId: admin.id,
      action: "PRODUCT_BULK_ARCHIVED",
      entityType: "Product",
      metadata: { productIds },
    });
    revalidatePath("/yonetim/urunler");
    revalidatePath("/");
    return { ok: true, affectedCount: result.count, message: `${result.count} ürün mağazadan kaldırıldı.` };
  }

  // MARK_SOLD_OUT — her ürün için TÜM varyantları tükendi yapar.
  let affected = 0;
  for (const productId of productIds) {
    const { affected: variantsAffected } = await markAllVariantsSoldOut(productId, admin.id);
    if (variantsAffected > 0) {
      affected += 1;
    }
  }
  await recordAuditLog({
    actorId: admin.id,
    action: "PRODUCT_BULK_MARKED_SOLD_OUT",
    entityType: "Product",
    metadata: { productIds },
  });
  revalidatePath("/yonetim/urunler");
  revalidatePath("/yonetim/stok");
  revalidatePath("/");
  return { ok: true, affectedCount: affected, message: `${affected} ürün tükendi olarak işaretlendi.` };
}
