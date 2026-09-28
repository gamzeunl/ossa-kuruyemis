import { cache } from "react";
import {
  findActiveCategoryBySlug,
  listActiveCategories,
  listActiveCategoriesWithPreviewProducts,
} from "@/server/repositories/category-repository";
import { resolveBundleCompanionPrice } from "@/lib/bundle-pricing";
import { CAMPAIGN_TYPE_PRIORITY } from "@/lib/campaign-type-preset";
import { isCampaignCurrentlyActive } from "@/lib/campaign-status";
import { getMegaMenuGroup, normalizeProductName } from "@/lib/mega-menu-content";
import { resolveProductBadges } from "@/lib/product-badges";
import { resolveVariantPricing } from "@/lib/product-pricing";
import { normalizeSearchText } from "@/lib/search-text";
import { listBestSellingProductIds, listBestSellingProductsWithQuantity } from "@/server/repositories/order-repository";
import { listMostFavoritedProductIds } from "@/server/repositories/favorite-repository";
import {
  listActiveBundleOffersForVariants,
  listActiveBundleOfferCandidatesForHomepage,
  type BundleOfferDetailRow,
} from "@/server/repositories/bundle-offer-repository";
import { listActivePicksForDisplay } from "@/server/repositories/featured-pick-repository";
import {
  findMarketingCampaignBasicById,
  listEnabledMarketingCampaigns,
  type MarketingCampaignRow,
} from "@/server/repositories/marketing-campaign-repository";
import {
  findPublishedProductBySlug,
  listActiveDiscountedProductIds,
  listActiveProductsForSearch,
  listAllActiveProductsInCategory,
  listFeaturedProducts,
  listProductsByIds,
  listPublishedProducts,
  listRecommendedProducts,
  type ListPublishedProductsParams,
  type ProductDetailRow,
  type ProductListRow,
  type ProductSearchRow,
  type ProductSortOption,
} from "@/server/repositories/product-repository";
import type {
  BundleOfferDisplay,
  CategorySummary,
  CategoryWithPreviewProducts,
  MarketingCampaignDisplay,
  PaginatedResult,
  ProductDetail,
  ProductImageSummary,
  ProductSearchSuggestion,
  ProductSummary,
  ProductVariantSummary,
  StockStatus,
} from "@/types/catalog";

export type VariantRow = ProductListRow["variants"][number];
type ImageRow = { url: string; altText: string | null; isPrimary: boolean };

/** Bir varyantın tam çözümlenmiş hâli — ham satır + türetilmiş özet + fiyat sonucu bir arada. */
interface ResolvedVariant {
  row: VariantRow;
  summary: ProductVariantSummary;
  pricing: ReturnType<typeof resolveVariantPricing>;
}

function computeStockStatus(inventory: VariantRow["inventory"]): StockStatus {
  if (!inventory) {
    return "OUT_OF_STOCK";
  }
  const sellable = inventory.quantityAvailable - inventory.quantityReserved;
  if (sellable <= 0) {
    return "OUT_OF_STOCK";
  }
  if (sellable <= inventory.lowStockThreshold) {
    return "LOW_STOCK";
  }
  return "IN_STOCK";
}

/**
 * Varyant başına stok durumu + gerçek indirim fiyatlandırmasını (`resolveVariantPricing`,
 * tek kaynak) tek geçişte çözer. `computeMinPrice`/`pickDefaultVariant` bu sonucu
 * yeniden hesaplamadan kullanır.
 */
export function resolveVariants(rows: VariantRow[]): ResolvedVariant[] {
  return rows.map((row) => {
    const pricing = resolveVariantPricing(row);
    const stockStatus = computeStockStatus(row.inventory);
    const summary: ProductVariantSummary = {
      id: row.id,
      sku: row.sku,
      name: row.name,
      weightGram: row.weightGram,
      regularPrice: pricing.regularPrice.toString(),
      effectivePrice: pricing.effectivePrice.toString(),
      discountPrice: pricing.discountPrice ? pricing.discountPrice.toString() : null,
      discountPercentage: pricing.discountPercentage,
      hasActiveDiscount: pricing.hasActiveDiscount,
      discountEndsAt: row.discountEndsAt,
      stockStatus,
      isAvailable: stockStatus !== "OUT_OF_STOCK",
    };
    return { row, summary, pricing };
  });
}

function toImageSummary(image: ImageRow): ProductImageSummary {
  return { url: image.url, altText: image.altText, isPrimary: image.isPrimary };
}

/**
 * Varsayılan varyantı seçer: satılabilir ve gerçek (aktif) indirimi olan bir
 * varyant varsa onu (kartta fırsatın görünür olması için), yoksa ilk satılabilir
 * varyantı, o da yoksa listedeki ilk varyantı döner.
 */
function pickDefaultVariant(resolved: ResolvedVariant[]): ProductVariantSummary | null {
  if (resolved.length === 0) {
    return null;
  }
  const discountedAvailable = resolved.find(
    (entry) => entry.summary.isAvailable && entry.summary.hasActiveDiscount,
  );
  return (
    discountedAvailable?.summary ??
    resolved.find((entry) => entry.summary.isAvailable)?.summary ??
    resolved[0].summary
  );
}

/**
 * Satılabilir varyantlar arasındaki en düşük EFEKTİF (gerçek indirim varsa
 * indirimli) fiyatı Decimal hassasiyetiyle hesaplar; hiç varyant yoksa `null`
 * döner. Satılabilir varyant yoksa tüm varyantlar arasından en düşüğe düşer.
 */
export function computeMinPrice(resolved: ResolvedVariant[]): string | null {
  if (resolved.length === 0) {
    return null;
  }
  const available = resolved.filter((entry) => entry.summary.isAvailable);
  const pool = available.length > 0 ? available : resolved;
  const cheapest = pool.reduce((lowest, entry) =>
    entry.pricing.effectivePrice.lessThan(lowest.pricing.effectivePrice) ? entry : lowest,
  );
  return cheapest.pricing.effectivePrice.toString();
}

function toProductSummary(row: ProductListRow, bestSellerIds: ReadonlySet<string>): ProductSummary {
  const resolved = resolveVariants(row.variants);
  const primaryImage = row.images[0];
  const hasActiveDiscount = resolved.some((entry) => entry.summary.hasActiveDiscount);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    primaryImage: primaryImage ? toImageSummary(primaryImage) : null,
    minPrice: computeMinPrice(resolved),
    defaultVariant: pickDefaultVariant(resolved),
    isOutOfStock: resolved.every((entry) => !entry.summary.isAvailable),
    isFeatured: row.isFeatured,
    badges: resolveProductBadges({
      hasActiveDiscount,
      isRecommended: row.isRecommended,
      isBestSeller: bestSellerIds.has(row.id),
      createdAt: row.createdAt,
      newBadgeOverride: row.newBadgeOverride,
    }),
  };
}

function toProductDetail(row: ProductDetailRow, bestSellerIds: ReadonlySet<string>): ProductDetail {
  const resolved = resolveVariants(row.variants);
  const primaryImage = row.images.find((image) => image.isPrimary) ?? row.images[0];
  const hasActiveDiscount = resolved.some((entry) => entry.summary.hasActiveDiscount);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    shortDescription: row.shortDescription,
    description: row.description,
    ingredients: row.ingredients,
    storageConditions: row.storageConditions,
    deliveryInfo: row.deliveryInfo,
    shelfLifeDays: row.shelfLifeDays,
    allergenInfo: row.allergenInfo,
    originInfo: row.originInfo,
    usageSuggestion: row.usageSuggestion,
    nutritionEnergyKcal: row.nutritionEnergyKcal?.toNumber() ?? null,
    nutritionEnergyKj: row.nutritionEnergyKj?.toNumber() ?? null,
    nutritionFat: row.nutritionFat?.toNumber() ?? null,
    nutritionSaturatedFat: row.nutritionSaturatedFat?.toNumber() ?? null,
    nutritionCarbohydrate: row.nutritionCarbohydrate?.toNumber() ?? null,
    nutritionSugars: row.nutritionSugars?.toNumber() ?? null,
    nutritionFiber: row.nutritionFiber?.toNumber() ?? null,
    nutritionProtein: row.nutritionProtein?.toNumber() ?? null,
    nutritionSalt: row.nutritionSalt?.toNumber() ?? null,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    isFeatured: row.isFeatured,
    badges: resolveProductBadges({
      hasActiveDiscount,
      isRecommended: row.isRecommended,
      isBestSeller: bestSellerIds.has(row.id),
      createdAt: row.createdAt,
      newBadgeOverride: row.newBadgeOverride,
    }),
    primaryImage: primaryImage ? toImageSummary(primaryImage) : null,
    images: row.images.map(toImageSummary),
    variants: resolved.map((entry) => entry.summary),
    defaultVariant: pickDefaultVariant(resolved),
    isOutOfStock: resolved.every((entry) => !entry.summary.isAvailable),
    minPrice: computeMinPrice(resolved),
    categories: row.productCategories.map((entry): CategorySummary => ({
      id: entry.category.id,
      name: entry.category.name,
      slug: entry.category.slug,
      description: entry.category.description,
      imageUrl: entry.category.imageUrl,
      imageAlt: entry.category.imageAlt,
      sortOrder: entry.category.sortOrder,
    })),
  };
}

/** Aktif kategorileri sırayla döner. */
export async function getActiveCategories(): Promise<CategorySummary[]> {
  return listActiveCategories();
}

/** Slug ile aktif kategoriyi döner; bulunamazsa veya pasifse `null`. */
export async function getCategoryBySlug(slug: string): Promise<CategorySummary | null> {
  return findActiveCategoryBySlug(slug);
}

/**
 * "Çok Satan" için gerçek satış eşiği — yalnızca gerçekten tamamlanmış/ödenmiş
 * siparişlerden (bkz. `order-repository.ts`) hesaplanır. Gerçek sipariş yoksa
 * boş küme döner; hiçbir ürün otomatik "Çok Satan" sayılmaz.
 */
const BEST_SELLER_WINDOW_DAYS = 90;
const BEST_SELLER_MIN_UNITS = 3;
const BEST_SELLER_GLOBAL_LIMIT = 50;

/**
 * Katalog genelindeki gerçek çok-satan ürün id'lerini (satış adedine göre azalan
 * sırada) istek başına BİR kez hesaplayıp önbelleğe alır (`react`'ın `cache()`'i)
 * — aynı istek içindeki tüm `toProductSummary`/`toProductDetail` çağrıları bunu
 * yeniden sorgulamadan paylaşır (N+1 yok). `Set` iterasyon sırası ekleme sırasını
 * korur (ECMAScript garantisi), bu yüzden `[...set]` de satış sırasını korur.
 */
const getBestSellerIdSet = cache(async (): Promise<Set<string>> => {
  const ids = await listBestSellingProductIds({
    windowDays: BEST_SELLER_WINDOW_DAYS,
    minUnits: BEST_SELLER_MIN_UNITS,
    limit: BEST_SELLER_GLOBAL_LIMIT,
  });
  return new Set(ids);
});

const MEGA_MENU_PREVIEW_LIMIT = 6;

/**
 * Mega menü için aktif kategorileri, mobil accordion'daki ürün önizlemesiyle
 * (`previewProducts`) birlikte döner. Masaüstü panelinde artık yalnızca
 * statik "Alt Kategoriler" grubu (`@/lib/mega-menu-content`) gösterildiğinden
 * burada HİÇBİR ürün sorgusu ÇALIŞTIRILMAZ — eski "Öne Çıkanlar" sütunu için
 * yazılmış ek sorgu tamamen kaldırıldı.
 */
export async function getCategoryMenuData(): Promise<CategoryWithPreviewProducts[]> {
  return listActiveCategoriesWithPreviewProducts(MEGA_MENU_PREVIEW_LIMIT);
}

export type ListProductsOptions = ListPublishedProductsParams;

/** Yayındaki ürünleri, müşteriye kapalı/pasif kayıtlar filtrelenmiş ve sayfalı olarak döner. */
export async function listProducts(
  options: ListProductsOptions = {},
): Promise<PaginatedResult<ProductSummary>> {
  const [{ rows, total, page, pageSize }, bestSellerIds] = await Promise.all([
    listPublishedProducts(options),
    getBestSellerIdSet(),
  ]);
  return {
    items: rows.map((row) => toProductSummary(row, bestSellerIds)),
    total,
    page,
    pageSize,
    hasNextPage: page * pageSize < total,
  };
}

/**
 * Satır dizisini (`ProductListRow[]`), kategori sayfasındaki `SortDropdown`
 * seçenekleriyle aynı sıralamayla döner. Fiyat sıralaması, mevcut
 * `computeMinPrice` ile aynı Decimal-güvenli, indirim-farkında mantığı kullanır.
 */
function sortProductRows(rows: ProductListRow[], sort: ProductSortOption): ProductListRow[] {
  const sorted = [...rows];

  switch (sort) {
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name, "tr"));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name, "tr"));
      break;
    case "newest":
      sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      break;
    case "price-asc":
    case "price-desc": {
      const direction = sort === "price-asc" ? 1 : -1;
      sorted.sort((a, b) => {
        const priceA = Number(computeMinPrice(resolveVariants(a.variants)) ?? Infinity);
        const priceB = Number(computeMinPrice(resolveVariants(b.variants)) ?? Infinity);
        return (priceA - priceB) * direction;
      });
      break;
    }
    default:
      sorted.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return sorted;
}

/**
 * Mega menü "Öne Çıkanlar" grup filtresi (`?grup=`) için: kategori + grup
 * slug'ından `src/lib/mega-menu-content.ts`'teki merkezi ürün adı listesini
 * çözer, kategorinin tüm ürünlerini (tek sorgu, N+1 yok) getirip
 * `normalizeProductName` ile TAM ad eşleşmesine göre filtreler — belirsiz
 * `contains` araması kullanılmaz. Eşleşme kategori kapsamıyla sınırlı olduğundan
 * başka bir kategorideki aynı adlı ürün asla dahil olmaz. Grup tanımsızsa
 * (bilinmeyen `grup` değeri) sorgu hiç çalıştırılmadan boş sonuç döner.
 */
export async function listProductsByGroup(params: {
  categorySlug: string;
  groupSlug: string | undefined;
  page: number;
  pageSize: number;
  sort: ProductSortOption;
}): Promise<PaginatedResult<ProductSummary>> {
  const group = getMegaMenuGroup(params.categorySlug, params.groupSlug);

  if (!group) {
    return {
      items: [],
      total: 0,
      page: params.page,
      pageSize: params.pageSize,
      hasNextPage: false,
    };
  }

  const normalizedNames = new Set(group.productNames.map(normalizeProductName));
  const [categoryRows, bestSellerIds] = await Promise.all([
    listAllActiveProductsInCategory(params.categorySlug),
    getBestSellerIdSet(),
  ]);
  const matchedRows = categoryRows.filter((row) =>
    normalizedNames.has(normalizeProductName(row.name)),
  );
  const sortedRows = sortProductRows(matchedRows, params.sort);

  const total = sortedRows.length;
  const start = (params.page - 1) * params.pageSize;
  const pageRows = sortedRows.slice(start, start + params.pageSize);

  return {
    items: pageRows.map((row) => toProductSummary(row, bestSellerIds)),
    total,
    page: params.page,
    pageSize: params.pageSize,
    hasNextPage: params.page * params.pageSize < total,
  };
}

/** Slug ile yayındaki ürün detayını, satılabilirlik/stok durumu normalize edilmiş olarak döner. */
export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const [row, bestSellerIds] = await Promise.all([
    findPublishedProductBySlug(slug),
    getBestSellerIdSet(),
  ]);
  return row ? toProductDetail(row, bestSellerIds) : null;
}

/**
 * Verilen id listesindeki ürünleri, sırayı koruyarak `ProductSummary` olarak
 * döner — blog yazısındaki "Bu yazıda geçen ürünler" bölümü (`blog-service.ts`)
 * için; katalog dışında ikinci bir ürün-özet dönüştürücü oluşturulmaz.
 */
export async function getProductSummariesByIds(ids: string[]): Promise<ProductSummary[]> {
  if (ids.length === 0) {
    return [];
  }
  const [rows, bestSellerIds] = await Promise.all([listProductsByIds(ids), getBestSellerIdSet()]);
  return rows.map((row) => toProductSummary(row, bestSellerIds));
}

/** Ürünün birincil kategorisinden, kendisi hariç, sınırlı sayıda benzer ürün döner. */
export async function getRelatedProducts(
  product: ProductDetail,
  limit: number,
): Promise<ProductSummary[]> {
  const categorySlug = product.categories[0]?.slug;
  if (!categorySlug) {
    return [];
  }
  const { items } = await listProducts({ categorySlug, pageSize: limit + 1 });
  return items.filter((item) => item.id !== product.id).slice(0, limit);
}

function toProductSearchSuggestion(row: ProductSearchRow): ProductSearchSuggestion {
  const resolved = resolveVariants(row.variants);
  const primaryImage = row.images[0];
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    categoryName: row.productCategories[0]?.category.name ?? null,
    primaryImage: primaryImage ? toImageSummary(primaryImage) : null,
    minPrice: computeMinPrice(resolved),
  };
}

/**
 * Alaka sırası: 0) tam ad eşleşmesi, 1) adın başlangıcıyla eşleşme,
 * 2) bir kelimenin başlangıcıyla eşleşme, 3) genel (herhangi bir yerde) eşleşme.
 * Eşleşme yoksa `null` döner ve ürün sonuçlardan elenir.
 */
function rankSearchMatch(normalizedName: string, normalizedQuery: string): number | null {
  if (normalizedName === normalizedQuery) {
    return 0;
  }
  if (normalizedName.startsWith(normalizedQuery)) {
    return 1;
  }
  if (normalizedName.split(" ").some((word) => word.startsWith(normalizedQuery))) {
    return 2;
  }
  if (normalizedName.includes(normalizedQuery)) {
    return 3;
  }
  return null;
}

/**
 * Header aramasındaki öneri açılır listesi için Türkçe karakter toleranslı
 * (bkz. `normalizeSearchText`), alaka sırasına göre sıralanmış ürün eşleşmesi
 * döner. Yalnızca yayındaki (`ACTIVE`) ürünler arasından arar; aynı ürün asla
 * birden fazla kez görünmez (`Product.id` benzersizliği doğal olarak garanti eder).
 */
export async function searchProductSuggestions(
  query: string,
  limit: number,
): Promise<ProductSearchSuggestion[]> {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }

  const rows = await listActiveProductsForSearch();

  const ranked = rows
    .map((row) => ({ row, rank: rankSearchMatch(normalizeSearchText(row.name), normalizedQuery) }))
    .filter((entry): entry is { row: ProductSearchRow; rank: number } => entry.rank !== null)
    .sort((a, b) => a.rank - b.rank);

  return ranked.slice(0, limit).map((entry) => toProductSearchSuggestion(entry.row));
}

/** Gerçek satış verisinden çok satan ürünleri (satış adedine göre azalan) sınırlı sayıda döner. */
export async function getBestSellingProducts(limit: number): Promise<ProductSummary[]> {
  const bestSellerIds = await getBestSellerIdSet();
  // `Set` iterasyon sırası ekleme sırasını (= satış adedine göre azalan) korur.
  const orderedIds = [...bestSellerIds].slice(0, limit);
  const rows = await listProductsByIds(orderedIds);
  return rows.map((row) => toProductSummary(row, bestSellerIds));
}

/**
 * Admin "En Çok Satanlar" salt-okunur ekranı — `getBestSellingProducts` ile
 * AYNI pencere/eşik sabitlerini (`BEST_SELLER_WINDOW_DAYS`/`MIN_UNITS`)
 * kullanır, TEK "çok satan" tanımı korunur. Yönetici bu listeyi elle
 * değiştiremez — salt-okunur.
 */
export interface BestSellingProductRow {
  product: ProductSummary;
  unitsSold: number;
}

export async function getBestSellingProductsWithQuantity(limit: number): Promise<BestSellingProductRow[]> {
  const ranked = await listBestSellingProductsWithQuantity({
    windowDays: BEST_SELLER_WINDOW_DAYS,
    minUnits: BEST_SELLER_MIN_UNITS,
    limit,
  });
  if (ranked.length === 0) {
    return [];
  }
  const summaries = await getProductSummariesByIds(ranked.map((entry) => entry.productId));
  const summaryById = new Map(summaries.map((summary) => [summary.id, summary]));
  return ranked
    .map((entry) => {
      const product = summaryById.get(entry.productId);
      return product ? { product, unitsSold: entry.unitsSold } : null;
    })
    .filter((row): row is BestSellingProductRow => row !== null);
}

/** Öne çıkan (`isFeatured`) ürünleri sınırlı sayıda döner. */
export async function getFeaturedProducts(limit: number): Promise<ProductSummary[]> {
  const [rows, bestSellerIds] = await Promise.all([
    listFeaturedProducts({ limit }),
    getBestSellerIdSet(),
  ]);
  return rows.map((row) => toProductSummary(row, bestSellerIds));
}

/** "OSSA Öneriyor" (`isRecommended`) işaretli ürünleri sınırlı sayıda döner. İşaretli ürün yoksa boş dizi döner. */
export async function getRecommendedProducts(limit: number): Promise<ProductSummary[]> {
  const [rows, bestSellerIds] = await Promise.all([
    listRecommendedProducts({ limit }),
    getBestSellerIdSet(),
  ]);
  return rows.map((row) => toProductSummary(row, bestSellerIds));
}

/**
 * "Kaçırılmayacak Fırsatlar" — gerçekten aktif indirimi olan ürünler. Aday
 * id listesi kaba bir DB daraltmasıdır; nihai karar (`hasActiveDiscount`)
 * TEK kaynak `resolveVariantPricing()`'den (bu dosyadaki `toProductSummary`
 * üzerinden) gelir — ikinci bir indirim hesaplayıcı YOKTUR. Aktif indirim
 * yoksa boş dizi döner.
 */
export async function getActiveDiscountedProducts(limit: number): Promise<ProductSummary[]> {
  const candidateIds = await listActiveDiscountedProductIds(limit);
  if (candidateIds.length === 0) {
    return [];
  }
  const summaries = await getProductSummariesByIds(candidateIds);
  return summaries.filter((product) => product.badges.some((badge) => badge.key === "discount")).slice(0, limit);
}

/**
 * "Ayın Favorileri" — admin-küratörlü editoryal vitrin (`FeaturedProductPick`).
 * Kullanıcı favorilerinden (`Favorite`) TAMAMEN bağımsızdır. Süresi dolmuş/
 * henüz başlamamış/pasif kayıtlar `listActivePicksForDisplay`'in tarih
 * filtresiyle zaten elenir. Aktif kayıt yoksa boş dizi döner.
 */
export async function getFeaturedProductPicks(limit: number): Promise<ProductSummary[]> {
  const picks = await listActivePicksForDisplay(limit);
  if (picks.length === 0) {
    return [];
  }
  return getProductSummariesByIds(picks.map((pick) => pick.productId));
}

/**
 * "Birlikte Daha Güzel" — bir `BundleOffer` satırını yalnızca GERÇEKTEN
 * geçerliyse (tarih + fiyat, `resolveBundleCompanionPrice` TEK kaynak)
 * gösterilebilir şekle çevirir; geçersizse `null` döner (çağıran taraf eler).
 * `resolveVariantPricing()`'e dokunulmaz — tamamlayıcının normal indirimi
 * ZATEN bu fonksiyonun İÇİNDE hesaba katılır.
 */
function toBundleOfferDisplay(row: BundleOfferDetailRow): BundleOfferDisplay | null {
  const companionPricing = resolveVariantPricing({
    price: row.companionVariant.price,
    discountPrice: row.companionVariant.discountPrice,
    discountStartsAt: row.companionVariant.discountStartsAt,
    discountEndsAt: row.companionVariant.discountEndsAt,
    isDiscountActive: row.companionVariant.isDiscountActive,
  });
  const resolved = resolveBundleCompanionPrice(companionPricing.effectivePrice, {
    companionPrice: row.companionPrice,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    isActive: row.isActive,
  });
  if (!resolved.isBundleApplied) {
    return null;
  }

  const companionImage = row.companionProduct.images[0];
  const primaryImage = row.primaryProduct.images[0];

  return {
    id: row.id,
    primaryProductId: row.primaryProduct.id,
    primaryProductName: row.primaryProduct.name,
    primaryProductSlug: row.primaryProduct.slug,
    primaryImage: primaryImage ? toImageSummary(primaryImage) : null,
    primaryVariantId: row.primaryVariant.id,
    primaryVariantName: row.primaryVariant.name,
    companionProductId: row.companionProduct.id,
    companionProductName: row.companionProduct.name,
    companionProductSlug: row.companionProduct.slug,
    companionImage: companionImage ? toImageSummary(companionImage) : null,
    companionVariantId: row.companionVariant.id,
    companionVariantName: row.companionVariant.name,
    companionRegularPrice: companionPricing.effectivePrice.toString(),
    companionBundlePrice: resolved.effectivePrice.toString(),
  };
}

/** PDP "Birlikte Daha Güzel" — bu ürünün varyantlarından biri ana (primary) olan, GERÇEKTEN geçerli kampanyalar. En fazla `limit` kadar (PDP'yi doldurmamak için). */
export async function getBundleOffersForProduct(
  variantIds: string[],
  limit = 3,
): Promise<BundleOfferDisplay[]> {
  const rows = await listActiveBundleOffersForVariants(variantIds);
  return rows
    .map(toBundleOfferDisplay)
    .filter((offer): offer is BundleOfferDisplay => offer !== null)
    .slice(0, limit);
}

/** Ana sayfa kompakt keşif kartları — yalnızca gerçekten geçerli kampanyalar, hiçbiri yoksa boş dizi. */
export async function getBundleOffersForHomepage(limit = 3): Promise<BundleOfferDisplay[]> {
  const rows = await listActiveBundleOfferCandidatesForHomepage(limit);
  return rows
    .map(toBundleOfferDisplay)
    .filter((offer): offer is BundleOfferDisplay => offer !== null)
    .slice(0, limit);
}

/**
 * "Müşterilerin Favorileri" — admin salt-okunur analitik ekranı. Gerçek
 * `Favorite` satırlarından `groupBy` ile sayılır (bkz. `favorite-repository.ts`),
 * sahte minimum eşik YOKTUR. Bir ürün artık listelenemez durumdaysa (ör.
 * arşivlendi) `getProductSummariesByIds` onu döndürmez — o satır sessizce elenir.
 */
export interface MostFavoritedProductRow {
  product: ProductSummary;
  favoriteCount: number;
}

export async function getMostFavoritedProducts(limit: number): Promise<MostFavoritedProductRow[]> {
  const ranked = await listMostFavoritedProductIds(limit);
  if (ranked.length === 0) {
    return [];
  }
  const summaries = await getProductSummariesByIds(ranked.map((entry) => entry.productId));
  const summaryById = new Map(summaries.map((summary) => [summary.id, summary]));
  return ranked
    .map((entry) => {
      const product = summaryById.get(entry.productId);
      return product ? { product, favoriteCount: entry.favoriteCount } : null;
    })
    .filter((row): row is MostFavoritedProductRow => row !== null);
}

/**
 * Bir `MarketingCampaign` satırındaki varyantların ait olduğu, TEKİLLEŞTİRİLMİŞ
 * (aynı üründen birden fazla varyant seçilmişse bir kez) ürün id listesi —
 * ekleniş sırası korunur.
 */
function collectCampaignProductIds(row: MarketingCampaignRow): string[] {
  const seen = new Set<string>();
  const productIds: string[] = [];
  for (const item of row.products) {
    const productId = item.variant.productId;
    if (!seen.has(productId)) {
      seen.add(productId);
      productIds.push(productId);
    }
  }
  return productIds;
}

async function toMarketingCampaignDisplay(
  row: MarketingCampaignRow,
  productLimit: number,
): Promise<MarketingCampaignDisplay> {
  const productIds = collectCampaignProductIds(row).slice(0, productLimit);
  const products = await getProductSummariesByIds(productIds);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    headline: row.headline,
    description: row.description,
    endsAt: row.endsAt.toISOString(),
    showPopup: row.showPopup,
    products,
  };
}

/**
 * Storefront'ta GERÇEKTEN aktif olan kampanyalar (`isCampaignCurrentlyActive`
 * TEK karar kaynağı) — tip önceliğine göre sıralı (Günlük>Haftalık>Aylık,
 * eşitlikte en yakın bitiş tarihi önce). Pasif/planlı/süresi dolmuş kampanyalar
 * bu listede HİÇ yoktur.
 */
async function listCurrentlyActiveCampaigns(): Promise<MarketingCampaignRow[]> {
  const rows = await listEnabledMarketingCampaigns();
  const now = new Date();
  return rows
    .filter((row) => isCampaignCurrentlyActive({ isActive: row.isActive, startsAt: row.startsAt, endsAt: row.endsAt }, now))
    .sort((a, b) => {
      const priorityDiff = CAMPAIGN_TYPE_PRIORITY[b.type] - CAMPAIGN_TYPE_PRIORITY[a.type];
      return priorityDiff !== 0 ? priorityDiff : a.endsAt.getTime() - b.endsAt.getTime();
    });
}

/**
 * Ana sayfa "AKTİF KAMPANYA" hero bölümü — en yüksek öncelikli, `showOnHomepage=true`
 * olan aktif kampanya + gerçek ürün özetleri. Hiçbir uygun kampanya yoksa
 * `null` (çağıran taraf mevcut "Bu Haftanın Fırsatları" rafına geri döner).
 */
export async function getHighestPriorityActiveCampaignWithProducts(
  productLimit = 4,
): Promise<MarketingCampaignDisplay | null> {
  const active = await listCurrentlyActiveCampaigns();
  const candidate = active.find((row) => row.showOnHomepage);
  return candidate ? toMarketingCampaignDisplay(candidate, productLimit) : null;
}

export interface WeeklyPopupCampaignCandidate {
  id: string;
  name: string;
  headline: string | null;
  description: string | null;
  endsAt: string;
  isSingleProduct: boolean;
  product: ProductSummary | null;
}

/**
 * Haftalık popup — WEEKLY tipinde, `showPopup=true`, GERÇEKTEN aktif TEK
 * kampanya (+ varsa tek öne çıkan ürün, tekilse CTA doğrudan PDP'ye gitsin
 * diye `isSingleProduct` de hesaplanır). Hiçbiri yoksa `null` — popup servisi
 * bu durumda mevcut indirim/bundle/featured zincirine düşer.
 */
/** `/urunler?kampanya=` başlığı için — kampanya bulunamazsa `null` (sayfa "Ürünler" varsayılan başlığa düşer, hata değildir). */
export async function getMarketingCampaignBasicById(
  id: string,
): Promise<{ id: string; name: string; headline: string | null } | null> {
  return findMarketingCampaignBasicById(id);
}

export async function getActiveWeeklyPopupCampaign(): Promise<WeeklyPopupCampaignCandidate | null> {
  const active = await listCurrentlyActiveCampaigns();
  const candidate = active.find((row) => row.type === "WEEKLY" && row.showPopup);
  if (!candidate) {
    return null;
  }
  const productIds = collectCampaignProductIds(candidate);
  const products = await getProductSummariesByIds(productIds.slice(0, 1));
  return {
    id: candidate.id,
    name: candidate.name,
    headline: candidate.headline,
    description: candidate.description,
    endsAt: candidate.endsAt.toISOString(),
    isSingleProduct: productIds.length === 1,
    product: products[0] ?? null,
  };
}
