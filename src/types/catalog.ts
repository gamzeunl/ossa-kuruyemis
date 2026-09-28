/**
 * Katalog için provider/ORM'den bağımsız dönüş tipleri. Para alanları her zaman
 * ondalık-güvenli `string` olarak taşınır (ör. "129.90") — hiçbir yerde `number`'a
 * çevrilmez; Decimal hassasiyeti kaybı yaşanmaz.
 */

import type { ProductBadge } from "@/lib/product-badges";

export type StockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  sortOrder: number;
}

export interface CategoryPreviewProduct {
  name: string;
  slug: string;
  imageUrl: string | null;
}

/**
 * Mega menü paneli için kategori + mobil accordion'da kullanılan ürün
 * önizlemesi (`previewProducts`). Masaüstü mega menü paneli artık yalnızca
 * statik "Alt Kategoriler" grup verisini (`@/lib/mega-menu-content`) gösterir
 * — ürün tabanlı bir alan (ör. öne çıkan/çok satan ürünler) TAŞIMAZ.
 */
export interface CategoryWithPreviewProducts extends CategorySummary {
  previewProducts: CategoryPreviewProduct[];
}

export interface ProductImageSummary {
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

export interface ProductVariantSummary {
  id: string;
  sku: string;
  name: string;
  weightGram: number | null;
  /** Normal/liste fiyatı — her zaman dolu, indirim olsun olmasın. */
  regularPrice: string;
  /** Müşterinin şu an ödeyeceği fiyat — aktif indirim varsa indirimli fiyat, yoksa `regularPrice` ile aynı. */
  effectivePrice: string;
  /** Yalnızca aktif indirimde dolu — üstü çizili gösterim için. */
  discountPrice: string | null;
  /** Yalnızca aktif indirimde dolu — her zaman gerçek fiyatlardan hesaplanır. */
  discountPercentage: number | null;
  hasActiveDiscount: boolean;
  /** Ham bitiş tarihi — yalnızca "Son fırsat: ..." gibi gösterim metinleri için, DB'den doğrudan geçirilir. */
  discountEndsAt: Date | null;
  stockStatus: StockStatus;
  isAvailable: boolean;
}

export interface ProductSummary {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  primaryImage: ProductImageSummary | null;
  minPrice: string | null;
  defaultVariant: ProductVariantSummary | null;
  /** TÜM varyantlar tükendiğinde true — `defaultVariant.isAvailable` yalnızca TEK varyantı yansıtır, bu alan ürünün GENEL "Tükendi" durumudur. */
  isOutOfStock: boolean;
  isFeatured: boolean;
  /** En fazla 2 — bkz. `resolveProductBadges` (tek seçim/öncelik kaynağı). */
  badges: ProductBadge[];
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  ingredients: string | null;
  storageConditions: string | null;
  /** Ürüne özgü teslimat bilgisi override'ı — `null` iken PDP paylaşılan `getDeliveryInformationText()` metnini kullanır. */
  deliveryInfo: string | null;
  shelfLifeDays: number | null;
  allergenInfo: string | null;
  originInfo: string | null;
  usageSuggestion: string | null;
  nutritionEnergyKcal: number | null;
  nutritionEnergyKj: number | null;
  nutritionFat: number | null;
  nutritionSaturatedFat: number | null;
  nutritionCarbohydrate: number | null;
  nutritionSugars: number | null;
  nutritionFiber: number | null;
  nutritionProtein: number | null;
  nutritionSalt: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  images: ProductImageSummary[];
  variants: ProductVariantSummary[];
  categories: CategorySummary[];
}

/** Header arama önerileri (autocomplete) için hafif ürün özeti. */
export interface ProductSearchSuggestion {
  id: string;
  name: string;
  slug: string;
  categoryName: string | null;
  primaryImage: ProductImageSummary | null;
  minPrice: string | null;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

/**
 * "Birlikte Daha Güzel" — yalnızca GEÇERLİ (`resolveBundleCompanionPrice`
 * onaylı) kampanyalar bu şekle dönüştürülür; PDP ve ana sayfa keşif kartı
 * bunu doğrudan render eder, kendi fiyat hesaplaması yapmaz.
 */
export interface BundleOfferDisplay {
  id: string;
  primaryProductId: string;
  primaryProductName: string;
  primaryProductSlug: string;
  primaryImage: ProductImageSummary | null;
  primaryVariantId: string;
  primaryVariantName: string;
  companionProductId: string;
  companionProductName: string;
  companionProductSlug: string;
  companionImage: ProductImageSummary | null;
  companionVariantId: string;
  companionVariantName: string;
  /** Tamamlayıcının bağımsız (normal indirim varsa dahil) efektif fiyatı — üstü çizili gösterim için. */
  companionRegularPrice: string;
  /** Nihai, `min()` sonrası ödenecek fiyat. */
  companionBundlePrice: string;
}

/**
 * Storefront'ta (homepage hero section + popup) gösterilecek TEK aktif
 * kampanya — fiyat/ürün verisi yine `ProductSummary`/`resolveVariantPricing`
 * zincirinden gelir, bu tip yalnızca kampanya metadata'sını taşır.
 */
export interface MarketingCampaignDisplay {
  id: string;
  name: string;
  type: "DAILY" | "WEEKLY" | "MONTHLY";
  headline: string | null;
  description: string | null;
  /** ISO string — client sayaç epoch-ms farkıyla hesaplar, saat dilimine duyarlı değildir. */
  endsAt: string;
  showPopup: boolean;
  products: ProductSummary[];
}
