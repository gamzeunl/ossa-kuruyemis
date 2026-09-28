import { NutritionConfidence, NutritionReferenceType, Prisma, ProductStatus } from "@/generated/prisma/client";
import { violatesUniqueConstraintOn } from "@/lib/prisma-errors";
import { prisma } from "@/server/db/prisma";

const variantSelect = {
  id: true,
  sku: true,
  name: true,
  weightGram: true,
  price: true,
  discountPrice: true,
  discountStartsAt: true,
  discountEndsAt: true,
  isDiscountActive: true,
  sortOrder: true,
  inventory: {
    select: {
      quantityAvailable: true,
      quantityReserved: true,
      lowStockThreshold: true,
    },
  },
} satisfies Prisma.ProductVariantSelect;

const productListArgs = {
  select: {
    id: true,
    name: true,
    slug: true,
    shortDescription: true,
    isFeatured: true,
    isRecommended: true,
    newBadgeOverride: true,
    sortOrder: true,
    createdAt: true,
    images: {
      where: { isPrimary: true },
      take: 1,
      select: { url: true, altText: true, isPrimary: true },
    },
    variants: {
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      select: variantSelect,
    },
  },
} satisfies Prisma.ProductFindManyArgs;

export type ProductListRow = Prisma.ProductGetPayload<typeof productListArgs>;

const productDetailArgs = {
  select: {
    ...productListArgs.select,
    description: true,
    ingredients: true,
    storageConditions: true,
    deliveryInfo: true,
    shelfLifeDays: true,
    allergenInfo: true,
    originInfo: true,
    usageSuggestion: true,
    nutritionEnergyKcal: true,
    nutritionEnergyKj: true,
    nutritionFat: true,
    nutritionSaturatedFat: true,
    nutritionCarbohydrate: true,
    nutritionSugars: true,
    nutritionFiber: true,
    nutritionProtein: true,
    nutritionSalt: true,
    nutritionConfidence: true,
    metaTitle: true,
    metaDescription: true,
    images: {
      orderBy: { sortOrder: "asc" },
      select: { url: true, altText: true, isPrimary: true },
    },
    productCategories: {
      select: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            imageUrl: true,
            imageAlt: true,
            sortOrder: true,
          },
        },
      },
    },
  },
} satisfies Prisma.ProductFindManyArgs;

export type ProductDetailRow = Prisma.ProductGetPayload<typeof productDetailArgs>;

const productSearchArgs = {
  select: {
    ...productListArgs.select,
    productCategories: {
      take: 1,
      orderBy: { category: { sortOrder: "asc" } },
      select: { category: { select: { name: true } } },
    },
  },
} satisfies Prisma.ProductFindManyArgs;

export type ProductSearchRow = Prisma.ProductGetPayload<typeof productSearchArgs>;

export type ProductSortOption =
  "default" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "newest";

export interface ListPublishedProductsParams {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  categorySlugs?: string[];
  query?: string;
  sort?: ProductSortOption;
  /** Yalnızca bu `MarketingCampaign`e (varyantları üzerinden) dahil ürünler — `/urunler?kampanya=`. */
  campaignId?: string;
}

export interface PagedRows<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function buildWhere(params: {
  categorySlug?: string;
  categorySlugs?: string[];
  query?: string;
  campaignId?: string;
}): Prisma.ProductWhereInput {
  const slugs =
    params.categorySlugs && params.categorySlugs.length > 0
      ? params.categorySlugs
      : params.categorySlug
        ? [params.categorySlug]
        : null;

  return {
    status: ProductStatus.ACTIVE,
    ...(slugs
      ? {
          productCategories: {
            some: { category: { slug: { in: slugs }, isActive: true } },
          },
        }
      : {}),
    ...(params.query ? { name: { contains: params.query, mode: "insensitive" } } : {}),
    ...(params.campaignId
      ? { variants: { some: { marketingCampaignProducts: { some: { campaignId: params.campaignId } } } } }
      : {}),
  };
}

function resolveOrderBy(
  sort: ProductSortOption | undefined,
): Prisma.ProductOrderByWithRelationInput {
  switch (sort) {
    case "name-asc":
      return { name: "asc" };
    case "name-desc":
      return { name: "desc" };
    case "newest":
      return { createdAt: "desc" };
    default:
      return { sortOrder: "asc" };
  }
}

/**
 * Fiyata göre sıralama, `Product` üzerinde doğrudan desteklenmez (Prisma yalnızca
 * `_count` bazlı relation-aggregate sıralamaya izin verir) — bu yüzden önce
 * `ProductVariant.groupBy` ile ürün başına en düşük fiyata göre sıralı/sayfalı
 * `productId` listesi alınır, sonra ürünler bu sırayla getirilir.
 */
async function listPublishedProductsSortedByPrice(
  params: ListPublishedProductsParams,
  direction: "asc" | "desc",
  page: number,
  pageSize: number,
): Promise<PagedRows<ProductListRow>> {
  const where = buildWhere(params);

  const [grouped, total] = await Promise.all([
    prisma.productVariant.groupBy({
      by: ["productId"],
      where: { isActive: true, product: where },
      _min: { price: true },
      orderBy: { _min: { price: direction } },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  const orderedIds = grouped.map((entry) => entry.productId);
  const rows = await prisma.product.findMany({
    ...productListArgs,
    where: { id: { in: orderedIds } },
  });
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const orderedRows = orderedIds.map((id) => rowsById.get(id)).filter((row) => row !== undefined);

  return { rows: orderedRows, total, page, pageSize };
}

/** Yayındaki (status=ACTIVE) ürünleri, varyant/stok/ana görsel dahil, tek sorguda sayfalı listeler. */
export async function listPublishedProducts(
  params: ListPublishedProductsParams = {},
): Promise<PagedRows<ProductListRow>> {
  const page = params.page && params.page > 0 ? Math.floor(params.page) : 1;
  const pageSize =
    params.pageSize && params.pageSize > 0
      ? Math.min(Math.floor(params.pageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  if (params.sort === "price-asc" || params.sort === "price-desc") {
    return listPublishedProductsSortedByPrice(
      params,
      params.sort === "price-asc" ? "asc" : "desc",
      page,
      pageSize,
    );
  }

  const where = buildWhere(params);

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      ...productListArgs,
      where,
      orderBy: resolveOrderBy(params.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return { rows, total, page, pageSize };
}

/**
 * Verilen id listesindeki yayındaki ürünleri, sırayı KORUYARAK (`ids` dizisinin
 * sırası — ör. gerçek satış adedine göre azalan) döner. `listBestSellingProductIds`
 * (`order-repository.ts`) ile birlikte kullanılır; `Prisma.findMany({where:{id:{in}}})`
 * sıra garantisi vermediğinden eşleme burada elle yapılır.
 */
/**
 * "Müşterilerin Favorileri" admin ekranı için — bir dizi ürünün TEK
 * (`ProductCategory.@@unique([productId])`) kategori adı. Ayrı, hafif TEK
 * sorgu; `productListArgs`'ın (storefront'un yaygın kullandığı) select
 * şekline kategori EKLEMEZ — blast-radius'u bu tek admin ekranıyla sınırlı tutar.
 */
export async function getCategoryNamesByProductIds(productIds: string[]): Promise<Map<string, string>> {
  if (productIds.length === 0) {
    return new Map();
  }
  const rows = await prisma.productCategory.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true, category: { select: { name: true } } },
  });
  return new Map(rows.map((row) => [row.productId, row.category.name]));
}

export async function listProductsByIds(ids: string[]): Promise<ProductListRow[]> {
  if (ids.length === 0) {
    return [];
  }
  const rows = await prisma.product.findMany({
    ...productListArgs,
    where: { id: { in: ids }, status: ProductStatus.ACTIVE },
  });
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  return ids.map((id) => rowsById.get(id)).filter((row): row is ProductListRow => row !== undefined);
}

/**
 * Bir kategorideki tüm yayındaki ürünleri, sayfalama olmadan tek sorguda getirir —
 * mega menü "Öne Çıkanlar" grup filtresi (`?grup=`) için: Türkçe normalize edilmiş
 * tam ürün adı eşleştirmesi Prisma/Postgres tarafında güvenilir yapılamadığından,
 * eşleştirme servis katmanında (`catalog-service.ts`) bu sonuç üzerinde yapılır.
 * Kategori başına ürün sayısı küçük (~30) olduğundan bu tek sorgu N+1 veya büyük
 * veri çekimi oluşturmaz.
 */
export async function listAllActiveProductsInCategory(
  categorySlug: string,
): Promise<ProductListRow[]> {
  return prisma.product.findMany({
    ...productListArgs,
    where: {
      status: ProductStatus.ACTIVE,
      productCategories: {
        some: { category: { slug: categorySlug, isActive: true } },
      },
    },
    orderBy: { sortOrder: "asc" },
  });
}

/**
 * Header arama önerileri için yayındaki tüm ürünleri (kategori adı dahil) tek
 * sorguda getirir — Türkçe karakter toleranslı eşleştirme ve alaka sıralaması
 * servis katmanında (`@/server/services/catalog-service`, `normalizeSearchText`)
 * yapılır; Postgres/Prisma `contains` bunu güvenilir yapamaz. Katalog boyutu
 * küçük olduğundan (bkz. `listAllActiveProductsInCategory` ile aynı desen) bu
 * tek sorgu N+1 veya büyük veri çekimi oluşturmaz; yalnızca sunucu içinde
 * kullanılır, tüm katalog client'a gönderilmez.
 */
export async function listActiveProductsForSearch(): Promise<ProductSearchRow[]> {
  return prisma.product.findMany({
    ...productSearchArgs,
    where: { status: ProductStatus.ACTIVE },
    orderBy: { sortOrder: "asc" },
  });
}

export interface ProductSlugForSitemap {
  slug: string;
  updatedAt: Date;
}

/** `sitemap.ts` için — yalnızca slug/updatedAt; DRAFT/ARCHIVED ürünler asla dahil edilmez. */
export async function listActiveProductSlugsForSitemap(): Promise<ProductSlugForSitemap[]> {
  return prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    select: { slug: true, updatedAt: true },
    orderBy: { slug: "asc" },
  });
}

export interface ListFeaturedProductsParams {
  limit: number;
}

/** Yayındaki, `isFeatured` işaretli ürünleri (varyant/stok/görsel dahil) tek sorguda getirir. */
export async function listFeaturedProducts(
  params: ListFeaturedProductsParams,
): Promise<ProductListRow[]> {
  return prisma.product.findMany({
    ...productListArgs,
    where: { status: ProductStatus.ACTIVE, isFeatured: true },
    orderBy: { sortOrder: "asc" },
    take: params.limit,
  });
}

export interface ListRecommendedProductsParams {
  limit: number;
}

/** Yayındaki, `isRecommended` (OSSA Öneriyor) işaretli ürünleri tek sorguda getirir. */
export async function listRecommendedProducts(
  params: ListRecommendedProductsParams,
): Promise<ProductListRow[]> {
  return prisma.product.findMany({
    ...productListArgs,
    where: { status: ProductStatus.ACTIVE, isRecommended: true },
    orderBy: { sortOrder: "asc" },
    take: params.limit,
  });
}

/**
 * "Kaçırılmayacak Fırsatlar" için aday ürün id'leri — YALNIZCA kaba bir DB
 * daraltması yapar (boolean + tarih aralığı). Gerçek doğru/yanlış karar
 * (yüzde, geçerlilik) burada DEĞİL, `resolveVariantPricing()`'den (servis
 * katmanında `toProductSummary` üzerinden) gelir — ikinci bir indirim
 * hesaplayıcı değildir, best-seller'ın `groupBy` aday-daraltma deseniyle aynı
 * mimari. `distinct` sayesinde bir üründe birden fazla indirimli varyant olsa
 * bile ürün yalnızca bir kez döner.
 */
export async function listActiveDiscountedProductIds(limit: number): Promise<string[]> {
  const now = new Date();
  const variants = await prisma.productVariant.findMany({
    where: {
      isDiscountActive: true,
      discountPrice: { not: null },
      isActive: true,
      product: { status: ProductStatus.ACTIVE },
      AND: [
        { OR: [{ discountStartsAt: null }, { discountStartsAt: { lte: now } }] },
        { OR: [{ discountEndsAt: null }, { discountEndsAt: { gte: now } }] },
      ],
    },
    select: { productId: true },
    distinct: ["productId"],
    take: limit * 3,
  });
  return variants.map((variant) => variant.productId);
}

/** Slug ile yayındaki bir ürünün tüm katalog ilişkilerini (görseller, varyantlar, kategoriler) getirir. */
export async function findPublishedProductBySlug(slug: string): Promise<ProductDetailRow | null> {
  return prisma.product.findFirst({
    ...productDetailArgs,
    where: { slug, status: ProductStatus.ACTIVE },
  });
}

// ==================== Yönetim ====================

const adminProductListSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  createdAt: true,
  images: { where: { isPrimary: true }, take: 1, select: { url: true, altText: true } },
  productCategories: { select: { category: { select: { id: true, name: true } } } },
  variants: {
    select: {
      id: true,
      price: true,
      isActive: true,
      inventory: { select: { quantityAvailable: true, quantityReserved: true } },
    },
  },
} satisfies Prisma.ProductSelect;

type AdminProductListPrismaRow = Prisma.ProductGetPayload<{ select: typeof adminProductListSelect }>;

export type AdminProductStatusFilter = "ALL" | "ACTIVE" | "DRAFT" | "ARCHIVED" | "OUT_OF_STOCK";
export type AdminProductSort = "name-asc" | "newest" | "oldest" | "category";

export interface AdminProductListRow {
  id: string;
  name: string;
  slug: string;
  status: ProductStatus;
  categoryName: string | null;
  primaryImageUrl: string | null;
  primaryImageAlt: string | null;
  variantCount: number;
  startingPrice: string | null;
  /** Yalnızca ACTIVE ürünlerde anlamlı — TÜM aktif varyantların satılabilir miktarı <= 0. */
  isOutOfStock: boolean;
  createdAt: Date;
}

export interface ListProductsForAdminParams {
  page: number;
  pageSize: number;
  search?: string;
  status?: AdminProductStatusFilter;
  categoryId?: string;
  sort?: AdminProductSort;
}

function toAdminProductListRow(product: AdminProductListPrismaRow): AdminProductListRow {
  const activeVariants = product.variants.filter((variant) => variant.isActive);
  const relevantVariants = activeVariants.length > 0 ? activeVariants : product.variants;
  const isOutOfStock =
    product.status === ProductStatus.ACTIVE &&
    relevantVariants.length > 0 &&
    relevantVariants.every((variant) => {
      const sellable = (variant.inventory?.quantityAvailable ?? 0) - (variant.inventory?.quantityReserved ?? 0);
      return sellable <= 0;
    });
  const prices = product.variants.map((variant) => Number(variant.price)).filter((price) => Number.isFinite(price));
  const startingPrice = prices.length > 0 ? Math.min(...prices).toFixed(2) : null;

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    status: product.status,
    categoryName: product.productCategories[0]?.category.name ?? null,
    primaryImageUrl: product.images[0]?.url ?? null,
    primaryImageAlt: product.images[0]?.altText ?? null,
    variantCount: product.variants.length,
    startingPrice,
    isOutOfStock,
    createdAt: product.createdAt,
  };
}

/**
 * Yönetim "Ürünler" listesi — TÜM durumlar (ACTIVE/DRAFT/ARCHIVED) görünür;
 * admin fiyatı/varyantı eksik DRAFT ürünleri de görüp tamamlayabilmeli.
 * Storefront tarafı ayrı sorgularda (`listActiveProducts` vb.) zaten yalnızca
 * ACTIVE filtreler — BURASI DEĞİŞTİRİLMEDİ.
 *
 * "Tükendi" filtresi DB seviyesinde tek bir kolon DEĞİL (satılabilir miktar =
 * `quantityAvailable - quantityReserved`, iki kolonun farkı) — bu yüzden arama/
 * kategori/durum SQL'de daralttıktan SONRA, gerçek katalog boyutu (~150 ürün)
 * için performans sorunu yaratmayacak şekilde tükenme durumu ve sıralama
 * JS'de hesaplanır/uygulanır. Aşırı büyük bir katalogda bu yaklaşım yeniden
 * değerlendirilmeli — şu an aşırı mühendislik yapılmadı.
 */
export async function listProductsForAdmin(
  params: ListProductsForAdminParams,
): Promise<{ rows: AdminProductListRow[]; total: number }> {
  const where: Prisma.ProductWhereInput = {};

  if (params.search?.trim()) {
    const term = params.search.trim();
    where.OR = [{ name: { contains: term, mode: "insensitive" } }, { slug: { contains: term, mode: "insensitive" } }];
  }
  if (params.status && params.status !== "ALL" && params.status !== "OUT_OF_STOCK") {
    where.status = params.status;
  } else if (params.status === "OUT_OF_STOCK") {
    where.status = ProductStatus.ACTIVE;
  }
  if (params.categoryId) {
    where.productCategories = { some: { categoryId: params.categoryId } };
  }

  const matched = await prisma.product.findMany({ where, select: adminProductListSelect });
  let rows = matched.map(toAdminProductListRow);

  if (params.status === "OUT_OF_STOCK") {
    rows = rows.filter((row) => row.isOutOfStock);
  }

  const sort = params.sort ?? "newest";
  rows.sort((a, b) => {
    switch (sort) {
      case "name-asc":
        return a.name.localeCompare(b.name, "tr");
      case "oldest":
        return a.createdAt.getTime() - b.createdAt.getTime();
      case "category":
        return (a.categoryName ?? "").localeCompare(b.categoryName ?? "", "tr") || a.name.localeCompare(b.name, "tr");
      case "newest":
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const total = rows.length;
  const start = (params.page - 1) * params.pageSize;
  const pageRows = rows.slice(start, start + params.pageSize);
  return { rows: pageRows, total };
}

/** Yayındaki (ACTIVE) ürün sayısı — dashboard KPI'ı için. */
export async function countActiveProducts(): Promise<number> {
  return prisma.product.count({ where: { status: ProductStatus.ACTIVE } });
}

/**
 * Tükenen (ACTIVE ama TÜM varyantları satılabilir<=0) ürün sayısı — dashboard
 * KPI'ı ve stok ekranı için. Katalog boyutu için `listProductsForAdmin`'deki
 * aynı JS-hesaplama yaklaşımı kullanılır (bkz. oradaki not).
 */
export async function countOutOfStockProducts(): Promise<number> {
  const products = await prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    select: {
      variants: {
        select: { isActive: true, inventory: { select: { quantityAvailable: true, quantityReserved: true } } },
      },
    },
  });
  return products.filter((product) => {
    const activeVariants = product.variants.filter((v) => v.isActive);
    const relevant = activeVariants.length > 0 ? activeVariants : product.variants;
    return (
      relevant.length > 0 &&
      relevant.every((v) => (v.inventory?.quantityAvailable ?? 0) - (v.inventory?.quantityReserved ?? 0) <= 0)
    );
  }).length;
}

const adminProductDetailSelect = {
  id: true,
  name: true,
  slug: true,
  status: true,
  isRecommended: true,
  newBadgeOverride: true,
  description: true,
  shortDescription: true,
  ingredients: true,
  storageConditions: true,
  deliveryInfo: true,
  allergenInfo: true,
  originInfo: true,
  usageSuggestion: true,
  nutritionEnergyKcal: true,
  nutritionEnergyKj: true,
  nutritionFat: true,
  nutritionSaturatedFat: true,
  nutritionCarbohydrate: true,
  nutritionSugars: true,
  nutritionFiber: true,
  nutritionProtein: true,
  nutritionSalt: true,
  nutritionSourceName: true,
  nutritionSourceUrl: true,
  nutritionSourceProduct: true,
  nutritionReferenceType: true,
  nutritionConfidence: true,
  metaTitle: true,
  metaDescription: true,
  _count: { select: { favorites: true } },
  // `@@unique([productId])` sayesinde en fazla 1 satır — yine de ilişki
  // şeması gereği dizi olarak gelir, çağıran taraf `[0]` ile okur.
  productCategories: {
    select: { categoryId: true, category: { select: { id: true, slug: true, name: true } } },
  },
  variants: {
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      sku: true,
      weightGram: true,
      price: true,
      isActive: true,
      // İndirim alanları BURADA düzenlenmez (bkz. `updateProductAdminSettings`'in
      // yorum notu) — yalnızca "Haftanın Fırsatları"na yönlendirmek için OKUNUR.
      discountPrice: true,
      discountStartsAt: true,
      discountEndsAt: true,
      isDiscountActive: true,
      inventory: { select: { quantityAvailable: true, quantityReserved: true, lowStockThreshold: true } },
    },
  },
  images: {
    orderBy: { sortOrder: "asc" },
    select: { id: true, url: true, altText: true, isPrimary: true, sortOrder: true },
  },
} satisfies Prisma.ProductSelect;

export type AdminProductDetailRow = Prisma.ProductGetPayload<{
  select: typeof adminProductDetailSelect;
}>;

export async function findProductForAdmin(id: string): Promise<AdminProductDetailRow | null> {
  return prisma.product.findUnique({ where: { id }, select: adminProductDetailSelect });
}

export interface UpdateProductVariantDiscountInput {
  id: string;
  discountPrice: Prisma.Decimal | null;
  discountStartsAt: Date | null;
  discountEndsAt: Date | null;
  isDiscountActive: boolean;
}

export interface UpdateProductNutritionInput {
  energyKcal: Prisma.Decimal | null;
  energyKj: Prisma.Decimal | null;
  fat: Prisma.Decimal | null;
  saturatedFat: Prisma.Decimal | null;
  carbohydrate: Prisma.Decimal | null;
  sugars: Prisma.Decimal | null;
  fiber: Prisma.Decimal | null;
  protein: Prisma.Decimal | null;
  salt: Prisma.Decimal | null;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceProduct: string | null;
  referenceType: NutritionReferenceType | null;
  confidence: NutritionConfidence | null;
}

export interface UpdateProductInfoInput {
  description: string | null;
  shortDescription: string | null;
  ingredients: string | null;
  storageConditions: string | null;
  /** `null` iken PDP paylaşılan `getDeliveryInformationText()` metnini göstermeye devam eder (bkz. şema yorumu). */
  deliveryInfo: string | null;
  allergenInfo: string | null;
  originInfo: string | null;
  usageSuggestion: string | null;
  nutrition: UpdateProductNutritionInput;
}

export interface UpdateProductExistingVariantInput {
  id: string;
  name: string;
  sku: string;
  weightGram: number | null;
  price: Prisma.Decimal;
  isActive: boolean;
}

export interface UpdateProductNewVariantInput {
  name: string;
  sku: string;
  weightGram: number | null;
  price: Prisma.Decimal;
  isActive: boolean;
}

export interface UpdateProductAdminInput extends UpdateProductInfoInput {
  name: string;
  slug: string;
  status: ProductStatus;
  isRecommended: boolean;
  newBadgeOverride: boolean | null;
  metaTitle: string | null;
  metaDescription: string | null;
  /** Ürünün TEK ana kategorisi — mevcut atamadan farklıysa eskisi kaldırılıp yenisi oluşturulur (bkz. aşağısı). */
  categoryId: string;
  /** Mevcut varyantların düzenlenen (ad/gramaj/SKU/normal fiyat/aktiflik) hâli — indirim alanları BURADA yok, bkz. "Haftanın Fırsatları". */
  existingVariants: UpdateProductExistingVariantInput[];
  /** Bu kaydetmede eklenecek yeni varyantlar — indirimsiz, `isDiscountActive:false` olarak oluşturulur. */
  newVariants: UpdateProductNewVariantInput[];
}

export type UpdateProductAdminFailureReason = "DUPLICATE_SLUG" | "DUPLICATE_SKU";
export type UpdateProductAdminResult =
  | { ok: true }
  | { ok: false; reason: UpdateProductAdminFailureReason };

/**
 * Ürünün temel bilgilerini (ad/slug/durum/açıklama alanları/SEO/OSSA Öneriyor/
 * Yeni-override), TEK ana kategorisini ve varyantlarının çekirdek alanlarını
 * (ad/gramaj/SKU/normal fiyat/aktiflik — İNDİRİM DEĞİL, bkz. not) TEK
 * transaction'da günceller; aynı transaction içinde yeni varyantlar da
 * oluşturulabilir. Kategori değişimi önce eski ilişkiyi (varsa) SİLER, sonra
 * yeniyi upsert eder — arada kategorisiz veya çift-kategorili bir ara durum
 * oluşmaz; `ProductCategory.productId @unique` kısıtıyla uyumludur. Herhangi
 * bir adım (dup slug/SKU) başarısız olursa transaction'ın TAMAMI geri alınır.
 *
 * İndirim alanları (`discountPrice`/tarih/`isDiscountActive`) BİLİNÇLİ OLARAK
 * burada YOK — "Haftanın Fırsatları" (`updateVariantDiscount`) TEK indirim
 * yazma yolu olmaya devam ediyor, ikinci bir indirim sistemi kurulmuyor.
 */
export async function updateProductAdminSettings(
  productId: string,
  input: UpdateProductAdminInput,
): Promise<UpdateProductAdminResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name: input.name,
          slug: input.slug,
          status: input.status,
          isRecommended: input.isRecommended,
          newBadgeOverride: input.newBadgeOverride,
          description: input.description,
          shortDescription: input.shortDescription,
          ingredients: input.ingredients,
          storageConditions: input.storageConditions,
          deliveryInfo: input.deliveryInfo,
          allergenInfo: input.allergenInfo,
          originInfo: input.originInfo,
          usageSuggestion: input.usageSuggestion,
          nutritionEnergyKcal: input.nutrition.energyKcal,
          nutritionEnergyKj: input.nutrition.energyKj,
          nutritionFat: input.nutrition.fat,
          nutritionSaturatedFat: input.nutrition.saturatedFat,
          nutritionCarbohydrate: input.nutrition.carbohydrate,
          nutritionSugars: input.nutrition.sugars,
          nutritionFiber: input.nutrition.fiber,
          nutritionProtein: input.nutrition.protein,
          nutritionSalt: input.nutrition.salt,
          nutritionSourceName: input.nutrition.sourceName,
          nutritionSourceUrl: input.nutrition.sourceUrl,
          nutritionSourceProduct: input.nutrition.sourceProduct,
          nutritionReferenceType: input.nutrition.referenceType,
          nutritionConfidence: input.nutrition.confidence,
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,
        },
      });

      await tx.productCategory.deleteMany({
        where: { productId, categoryId: { not: input.categoryId } },
      });
      await tx.productCategory.upsert({
        where: { productId_categoryId: { productId, categoryId: input.categoryId } },
        update: {},
        create: { productId, categoryId: input.categoryId, sortOrder: 0 },
      });

      for (const variant of input.existingVariants) {
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            name: variant.name,
            sku: variant.sku,
            weightGram: variant.weightGram,
            price: variant.price,
            isActive: variant.isActive,
          },
        });
      }

      for (const [index, variant] of input.newVariants.entries()) {
        await tx.productVariant.create({
          data: {
            productId,
            name: variant.name,
            sku: variant.sku,
            weightGram: variant.weightGram,
            price: variant.price,
            isActive: variant.isActive,
            sortOrder: input.existingVariants.length + index + 1,
          },
        });
      }
    });
    return { ok: true };
  } catch (error) {
    if (violatesUniqueConstraintOn(error, "slug")) {
      return { ok: false, reason: "DUPLICATE_SLUG" };
    }
    if (violatesUniqueConstraintOn(error, "sku")) {
      return { ok: false, reason: "DUPLICATE_SKU" };
    }
    throw error;
  }
}

export interface ProductVariantUsage {
  hasOrderItems: boolean;
  hasBundleOffers: boolean;
}

/** Bir varyantın geçmiş siparişlerde veya BundleOffer (ana/tamamlayıcı) ilişkilerinde kullanılıp kullanılmadığını doğrular — fiziksel silme kararından ÖNCE her zaman çağrılır. */
export async function getProductVariantUsage(variantId: string): Promise<ProductVariantUsage> {
  const [orderItemCount, bundleOfferCount] = await Promise.all([
    prisma.orderItem.count({ where: { variantId } }),
    prisma.bundleOffer.count({
      where: { OR: [{ primaryVariantId: variantId }, { companionVariantId: variantId }] },
    }),
  ]);
  return { hasOrderItems: orderItemCount > 0, hasBundleOffers: bundleOfferCount > 0 };
}

export type DeleteProductVariantFailureReason = "NOT_FOUND" | "IN_USE" | "LAST_VARIANT";
export type DeleteProductVariantResult =
  | { ok: true; removedImageUrls: string[] }
  | { ok: false; reason: DeleteProductVariantFailureReason };

/**
 * Bir varyantı yalnızca HİÇBİR geçmiş siparişte/BundleOffer'da kullanılmamışsa
 * VE ürünün tek/son varyantı DEĞİLSE fiziksel olarak siler (görsel dosyaları
 * da best-effort temizlenmesi için URL'leri döner — silme çağıranın işi,
 * bkz. `admin-products.ts`). Aksi durumda hiçbir DB değişikliği yapmadan
 * reddeder — çağıran taraf admini "pasifleştirin" akışına yönlendirir.
 */
export async function deleteProductVariant(variantId: string): Promise<DeleteProductVariantResult> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: {
      id: true,
      images: { select: { url: true } },
      product: { select: { _count: { select: { variants: true } } } },
    },
  });
  if (!variant) {
    return { ok: false, reason: "NOT_FOUND" };
  }
  if (variant.product._count.variants <= 1) {
    return { ok: false, reason: "LAST_VARIANT" };
  }

  const usage = await getProductVariantUsage(variantId);
  if (usage.hasOrderItems || usage.hasBundleOffers) {
    return { ok: false, reason: "IN_USE" };
  }

  await prisma.productVariant.delete({ where: { id: variantId } });
  return { ok: true, removedImageUrls: variant.images.map((image) => image.url) };
}

// ==================== Ürün görselleri (yönetim) ====================

/**
 * `/api/yonetim/urun-gorseli` DELETE'in (orphan temizliği) fiziksel dosyayı
 * silmeden önceki güvenlik kontrolü — bir URL zaten gerçek bir `ProductImage`
 * satırına bağlıysa ASLA silinmez (aksi halde bir admin başka bir ürünün
 * hâlâ kullanılan görselini kazara/kötü niyetle silebilirdi).
 */
export async function isProductImageUrlInUse(url: string): Promise<boolean> {
  const count = await prisma.productImage.count({ where: { url } });
  return count > 0;
}

export interface AddProductImageInput {
  url: string;
  altText: string | null;
}

/** Ürünün hiç görseli yoksa yeni görsel otomatik primary olur (oluşturma akışıyla aynı kural, bkz. `createProduct`). */
export async function addProductImage(
  productId: string,
  input: AddProductImageInput,
): Promise<{ id: string }> {
  return prisma.$transaction(async (tx) => {
    const existingCount = await tx.productImage.count({ where: { productId } });
    return tx.productImage.create({
      data: {
        productId,
        url: input.url,
        altText: input.altText,
        isPrimary: existingCount === 0,
        sortOrder: existingCount,
      },
      select: { id: true },
    });
  });
}

export type RemoveProductImageResult =
  | { ok: true; removedUrl: string }
  | { ok: false; reason: "NOT_FOUND" };

/** Kaldırılan görsel primary ise, kalan görsellerden biri (varsa) otomatik yeni primary olur — üründe primary'siz kalan görsel bırakılmaz. */
export async function removeProductImage(imageId: string): Promise<RemoveProductImageResult> {
  return prisma.$transaction(async (tx) => {
    const image = await tx.productImage.findUnique({
      where: { id: imageId },
      select: { id: true, productId: true, url: true, isPrimary: true },
    });
    if (!image) {
      return { ok: false, reason: "NOT_FOUND" };
    }

    await tx.productImage.delete({ where: { id: imageId } });

    if (image.isPrimary) {
      const next = await tx.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { sortOrder: "asc" },
        select: { id: true },
      });
      if (next) {
        await tx.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
      }
    }

    return { ok: true, removedUrl: image.url };
  });
}

export type SetPrimaryProductImageResult = { ok: true } | { ok: false; reason: "NOT_FOUND" };

/** Seçilen görseli primary yapar, ürünün AYNI ANDA yalnızca bir primary görseli olmasını garanti eder (diğerleri tek transaction'da false'a çekilir). */
export async function setPrimaryProductImage(imageId: string): Promise<SetPrimaryProductImageResult> {
  return prisma.$transaction(async (tx) => {
    const image = await tx.productImage.findUnique({
      where: { id: imageId },
      select: { id: true, productId: true },
    });
    if (!image) {
      return { ok: false, reason: "NOT_FOUND" };
    }

    await tx.productImage.updateMany({
      where: { productId: image.productId, isPrimary: true },
      data: { isPrimary: false },
    });
    await tx.productImage.update({ where: { id: imageId }, data: { isPrimary: true } });

    return { ok: true };
  });
}

export async function updateProductImageAlt(imageId: string, altText: string | null): Promise<void> {
  await prisma.productImage.update({ where: { id: imageId }, data: { altText } });
}

export interface ProductOption {
  id: string;
  name: string;
}

/** Blog yönetiminin "ilişkili ürün" seçici listesi için yayındaki ürünlerin yalnızca id+adı. */
export async function listActiveProductOptions(): Promise<ProductOption[]> {
  return prisma.product.findMany({
    where: { status: ProductStatus.ACTIVE },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

// ==================== Haftanın Fırsatları (çapraz-ürün indirim yönetimi) ====================

const adminDiscountVariantSelect = {
  id: true,
  name: true,
  price: true,
  discountPrice: true,
  discountStartsAt: true,
  discountEndsAt: true,
  isDiscountActive: true,
  product: {
    select: {
      id: true,
      name: true,
      slug: true,
      productCategories: { select: { category: { select: { slug: true } } } },
    },
  },
} satisfies Prisma.ProductVariantSelect;

export type AdminDiscountVariantRow = Prisma.ProductVariantGetPayload<{
  select: typeof adminDiscountVariantSelect;
}>;

/** Şu ana kadar en az bir kez indirim tanımlanmış (`discountPrice` dolu) TÜM varyantlar — "Haftanın Fırsatları" yönetim listesi. */
export async function listVariantsWithDiscountConfig(): Promise<AdminDiscountVariantRow[]> {
  return prisma.productVariant.findMany({
    where: { discountPrice: { not: null } },
    select: adminDiscountVariantSelect,
    orderBy: [{ isDiscountActive: "desc" }, { discountEndsAt: "asc" }],
  });
}

export interface VariantOption {
  id: string;
  label: string;
  price: string;
}

/** Yayındaki ürünlerin aktif varyantları — yeni indirim tanımlama formunun tek `<select>`'i için "Ürün Adı — Varyant Adı" etiketli, JS gerektirmeyen basit liste. */
export async function listActiveVariantOptions(): Promise<VariantOption[]> {
  const variants = await prisma.productVariant.findMany({
    where: { isActive: true, product: { status: ProductStatus.ACTIVE } },
    select: { id: true, name: true, price: true, product: { select: { name: true } } },
    orderBy: [{ product: { name: "asc" } }, { name: "asc" }],
  });
  return variants.map((variant) => ({
    id: variant.id,
    label: `${variant.product.name} — ${variant.name}`,
    price: variant.price.toString(),
  }));
}

/** Tek varyant + üst ürün bilgisi (revalidation için kategori slug'ları dahil) — "Haftanın Fırsatları" düzenleme ekranı. */
export async function findVariantForAdmin(variantId: string): Promise<AdminDiscountVariantRow | null> {
  return prisma.productVariant.findUnique({ where: { id: variantId }, select: adminDiscountVariantSelect });
}

/**
 * Tek bir varyantın indirim alanlarını doğrudan günceller — `updateProductAdminSettings`'in
 * ürün-bilgisi+TÜM-varyantlar transaction'ını GEREKTİRMEYEN, çapraz-ürün "Haftanın
 * Fırsatları" ekranı için daha dar bir yazma yolu. Aynı alanlar/aynı model — ikinci
 * bir indirim sistemi değildir.
 */
export async function updateVariantDiscount(
  variantId: string,
  input: UpdateProductVariantDiscountInput,
): Promise<void> {
  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      discountPrice: input.discountPrice,
      discountStartsAt: input.discountStartsAt,
      discountEndsAt: input.discountEndsAt,
      isDiscountActive: input.isDiscountActive,
    },
  });
}

export interface CreateProductVariantInput {
  name: string;
  sku: string;
  weightGram: number | null;
  price: Prisma.Decimal;
  discountPrice: Prisma.Decimal | null;
  discountStartsAt: Date | null;
  discountEndsAt: Date | null;
  isActive: boolean;
}

export interface CreateProductImageInput {
  url: string;
  altText: string | null;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  status: ProductStatus;
  isRecommended: boolean;
  newBadgeOverride: boolean | null;
  metaTitle: string | null;
  metaDescription: string | null;
  categoryId: string;
  variants: CreateProductVariantInput[];
  images: CreateProductImageInput[];
}

export type CreateProductFailureReason = "DUPLICATE_SLUG" | "DUPLICATE_SKU" | "NO_VARIANTS";

export type CreateProductResult = { ok: true; productId: string } | { ok: false; reason: CreateProductFailureReason };

/**
 * Ürün + en az 1 varyant + opsiyonel görselleri TEK transaction'da oluşturur.
 * Envanter (`Inventory`) satırı BİLİNÇLİ OLARAK oluşturulmaz — kod tabanının
 * her yerinde eksik envanter zaten `?? 0` ile güvenle "0 stok" sayılır (bkz.
 * `catalog-service.ts`, `order-repository.ts`); yeni bir stok göstergesi bu
 * akışın kapsamında değil. Herhangi bir adım başarısız olursa (ör. 2.
 * varyantın SKU'su çakışıyor) transaction'ın TAMAMI geri alınır — Product ve
 * önceki varyant satırları da silinir.
 */
export async function createProduct(input: CreateProductInput): Promise<CreateProductResult> {
  if (input.variants.length === 0) {
    return { ok: false, reason: "NO_VARIANTS" };
  }

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          name: input.name,
          slug: input.slug,
          shortDescription: input.shortDescription,
          description: input.description,
          status: input.status,
          isRecommended: input.isRecommended,
          newBadgeOverride: input.newBadgeOverride,
          metaTitle: input.metaTitle,
          metaDescription: input.metaDescription,
          productCategories: { create: [{ categoryId: input.categoryId, sortOrder: 0 }] },
        },
      });

      for (const variant of input.variants) {
        await tx.productVariant.create({
          data: {
            productId: created.id,
            name: variant.name,
            sku: variant.sku,
            weightGram: variant.weightGram,
            price: variant.price,
            discountPrice: variant.discountPrice,
            discountStartsAt: variant.discountStartsAt,
            discountEndsAt: variant.discountEndsAt,
            isDiscountActive: variant.discountPrice !== null,
            isActive: variant.isActive,
          },
        });
      }

      if (input.images.length > 0) {
        await tx.productImage.createMany({
          data: input.images.map((image, index) => ({
            productId: created.id,
            url: image.url,
            altText: image.altText,
            isPrimary: index === 0,
            sortOrder: index,
          })),
        });
      }

      return created;
    });

    return { ok: true, productId: product.id };
  } catch (error) {
    if (violatesUniqueConstraintOn(error, "slug")) {
      return { ok: false, reason: "DUPLICATE_SLUG" };
    }
    if (violatesUniqueConstraintOn(error, "sku")) {
      return { ok: false, reason: "DUPLICATE_SKU" };
    }
    throw error;
  }
}

// ==================== Silme / Kaldırma Güvenliği ====================

export interface ProductDeletionSafety {
  canHardDelete: boolean;
  /** Kullanıcıya gösterilecek, hangi gerçek ilişkilerin silmeyi engellediğini açıklayan Türkçe liste. */
  blockingReasons: string[];
}

/**
 * Bir ürünün fiziksel olarak (hard-delete) silinip silinemeyeceğini gerçek
 * ilişkilere bakarak belirler — `InventoryMovement`/`StockReservation`
 * DB seviyesinde zaten `onDelete: Restrict` (silme veritabanı tarafından da
 * reddedilir), ama `OrderItem`/`Review`/bundle/kampanya/favori/anasayfa
 * seçkisi/blog/sepet gibi `Cascade` ilişkiler DB'de silinmeyi ENGELLEMEZ —
 * yine de "geçmiş kayıt bütünlüğü" iş kuralı gereği BURADA elle kontrol
 * edilir (bkz. görev kuralı). Herhangi biri > 0 ise güvenli tarafta kalınır.
 */
export async function checkProductDeletionSafety(productId: string): Promise<ProductDeletionSafety> {
  const variants = await prisma.productVariant.findMany({ where: { productId }, select: { id: true } });
  const variantIds = variants.map((v) => v.id);

  const [
    orderItemCount,
    stockReservationCount,
    inventoryMovementCount,
    reviewCount,
    bundleCount,
    campaignCount,
    favoriteCount,
    featuredPickCount,
    homepageSelectionCount,
    blogPostCount,
    cartItemCount,
  ] = await Promise.all([
    prisma.orderItem.count({ where: { productId } }),
    variantIds.length > 0 ? prisma.stockReservation.count({ where: { variantId: { in: variantIds } } }) : 0,
    variantIds.length > 0 ? prisma.inventoryMovement.count({ where: { variantId: { in: variantIds } } }) : 0,
    prisma.review.count({ where: { productId } }),
    prisma.bundleOffer.count({ where: { OR: [{ primaryProductId: productId }, { companionProductId: productId }] } }),
    variantIds.length > 0 ? prisma.marketingCampaignProduct.count({ where: { variantId: { in: variantIds } } }) : 0,
    prisma.favorite.count({ where: { productId } }),
    prisma.featuredProductPick.count({ where: { productId } }),
    prisma.homepageSelectionProduct.count({ where: { productId } }),
    prisma.blogPostProduct.count({ where: { productId } }),
    variantIds.length > 0 ? prisma.cartItem.count({ where: { variantId: { in: variantIds } } }) : 0,
  ]);

  const blockingReasons: string[] = [];
  if (orderItemCount > 0) blockingReasons.push("geçmiş siparişlerde kullanılmış");
  if (stockReservationCount > 0) blockingReasons.push("stok rezervasyon kaydı var");
  if (inventoryMovementCount > 0) blockingReasons.push("stok hareket geçmişi var");
  if (reviewCount > 0) blockingReasons.push("müşteri yorumu var");
  if (bundleCount > 0) blockingReasons.push("kampanya paketinde kullanılıyor");
  if (campaignCount > 0) blockingReasons.push("pazarlama kampanyasında kullanılıyor");
  if (favoriteCount > 0) blockingReasons.push("müşteri favorilerinde var");
  if (featuredPickCount > 0) blockingReasons.push("Ayın Favorileri seçkisinde var");
  if (homepageSelectionCount > 0) blockingReasons.push("Anasayfa Seçkisi'nde var");
  if (blogPostCount > 0) blockingReasons.push("bir blog yazısında referanslanıyor");
  if (cartItemCount > 0) blockingReasons.push("müşteri sepetlerinde var");

  return { canHardDelete: blockingReasons.length === 0, blockingReasons };
}

export type DeleteOrArchiveProductResult =
  | { ok: true; mode: "HARD_DELETE" }
  | { ok: true; mode: "ARCHIVED"; blockingReasons: string[] };

/**
 * Güvenli ürün kaldırma — gerçek ilişki yoksa fiziksel siler, varsa
 * `ARCHIVED`'e çeker (storefront'tan tamamen kaybolur, geçmiş veri bozulmaz).
 */
export async function deleteOrArchiveProduct(productId: string): Promise<DeleteOrArchiveProductResult> {
  const safety = await checkProductDeletionSafety(productId);
  if (safety.canHardDelete) {
    await prisma.product.delete({ where: { id: productId } });
    return { ok: true, mode: "HARD_DELETE" };
  }
  await prisma.product.update({ where: { id: productId }, data: { status: ProductStatus.ARCHIVED } });
  return { ok: true, mode: "ARCHIVED", blockingReasons: safety.blockingReasons };
}
