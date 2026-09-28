import type { CampaignPopupData } from "@/types/campaign-popup";
import type { BundleOfferDisplay, ProductSummary } from "@/types/catalog";

export interface CampaignPopupCandidates {
  /** "Bu Haftanın Fırsatı" — `getActiveDiscountedProducts` sonucu. */
  discountedProducts: ProductSummary[];
  /** "Birlikte Daha Güzel" — `getBundleOffersForHomepage` sonucu (yalnızca ilki kullanılır). */
  bundleOffers: BundleOfferDisplay[];
  /** "Ayın Favorisi" — `getFeaturedProductPicks` sonucu. */
  featuredPicks: ProductSummary[];
  /**
   * WEEKLY + `showPopup=true` + gerçekten aktif TEK `MarketingCampaign` —
   * `getActiveWeeklyPopupCampaign` sonucu. Doluysa diğer üç adaydan ÖNCE
   * kontrol edilir (öncelik: haftalık kampanya > indirim > bundle > featured).
   * `undefined`/`null` iken davranış tamamen geriye dönük uyumludur.
   */
  activeWeeklyPopupCampaign?: {
    id: string;
    name: string;
    headline: string | null;
    description: string | null;
    /** ISO string. */
    endsAt: string;
    /** Kampanyada tam olarak TEK ürün varsa `true` — CTA doğrudan PDP'ye gider. */
    isSingleProduct: boolean;
    /** Popup'ta gösterilecek öne çıkan (varsa ilk) ürün. */
    product: ProductSummary | null;
  } | null;
}

/**
 * Aktif kampanya adaylarından TEK, ürün odaklı popup DTO'sunu üreten merkezi
 * öncelik kararı — component'te dağınık if/else YOK, hepsi burada. Öncelik:
 * aktif indirim > Birlikte Daha Güzel > Ayın Favorisi. Fiyat alanları
 * doğrudan `ProductSummary.defaultVariant`'tan (`resolveVariantPricing`'in
 * zaten ürettiği) okunur — yeni bir fiyat hesaplayıcı YAZILMAZ. Hiçbiri aktif
 * değilse `null` — popup hiç render edilmez, sahte kampanya ÜRETİLMEZ.
 */
export function resolveCampaignPopupData(candidates: CampaignPopupCandidates): CampaignPopupData | null {
  const { discountedProducts, bundleOffers, featuredPicks, activeWeeklyPopupCampaign } = candidates;

  if (activeWeeklyPopupCampaign) {
    const campaign = activeWeeklyPopupCampaign;
    const product = campaign.product;
    return {
      kind: "campaign",
      campaignId: `campaign:${campaign.id}`,
      eyebrow: "BU HAFTAYA ÖZEL",
      headline: campaign.headline ?? campaign.name,
      description: campaign.description,
      endsAt: campaign.endsAt,
      featuredProduct:
        product && product.defaultVariant
          ? {
              name: product.name,
              slug: product.slug,
              imageUrl: product.primaryImage?.url ?? null,
              imageAlt: product.primaryImage?.altText ?? product.name,
              regularPrice: product.defaultVariant.regularPrice,
              effectivePrice: product.defaultVariant.effectivePrice,
            }
          : null,
      ctaLabel: "Fırsatı İncele",
      ctaHref:
        campaign.isSingleProduct && product ? `/urunler/${product.slug}` : `/urunler?kampanya=${campaign.id}`,
    };
  }

  if (discountedProducts.length > 0) {
    const product = discountedProducts[0];
    const variant = product.defaultVariant;
    return {
      kind: "discount",
      campaignId: `discount:${product.id}`,
      eyebrow: "BU HAFTANIN FIRSATI",
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.primaryImage?.url ?? null,
      imageAlt: product.primaryImage?.altText ?? product.name,
      regularPrice: variant?.regularPrice ?? product.minPrice ?? "0",
      effectivePrice: variant?.effectivePrice ?? product.minPrice ?? "0",
      discountPercentage: variant?.discountPercentage ?? null,
      ctaLabel: "Ürünü İncele",
      ctaHref: `/urunler/${product.slug}`,
    };
  }

  if (bundleOffers.length > 0) {
    const offer = bundleOffers[0];
    return {
      kind: "bundle",
      campaignId: `bundle:${offer.id}`,
      eyebrow: "BİRLİKTE DAHA GÜZEL",
      primaryProductName: offer.primaryProductName,
      primaryImageUrl: offer.primaryImage?.url ?? null,
      companionProductName: offer.companionProductName,
      companionImageUrl: offer.companionImage?.url ?? null,
      ctaLabel: "Birlikte İncele",
      ctaHref: `/urunler/${offer.primaryProductSlug}`,
    };
  }

  if (featuredPicks.length > 0) {
    const product = featuredPicks[0];
    return {
      kind: "featured",
      campaignId: `featured:${product.id}`,
      eyebrow: "AYIN FAVORİSİ",
      productName: product.name,
      productSlug: product.slug,
      imageUrl: product.primaryImage?.url ?? null,
      imageAlt: product.primaryImage?.altText ?? product.name,
      price: product.defaultVariant?.effectivePrice ?? product.minPrice ?? "0",
      ctaLabel: "Keşfet",
      ctaHref: `/urunler/${product.slug}`,
    };
  }

  return null;
}
