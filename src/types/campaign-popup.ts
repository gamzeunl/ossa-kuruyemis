/**
 * Site girişinde gösterilecek TEK kampanya popup'ının render DTO'su —
 * `resolveCampaignPopupData` (`@/lib/campaign-popup`) tarafından üretilir.
 * Ayırt edici birleşim (discriminated union): her kampanya türü kendi gerçek
 * ürün/fiyat alanlarını taşır — genel/soyut bir "description" metni YOK,
 * popup her zaman somut bir ürüne (veya bundle çiftine) bağlıdır.
 */
export type CampaignPopupData =
  | {
      kind: "campaign";
      campaignId: string;
      eyebrow: "BU HAFTAYA ÖZEL";
      headline: string;
      description: string | null;
      /** ISO string — `CampaignCountdown` epoch-ms farkıyla hesaplar, saat dilimine duyarlı değildir. */
      endsAt: string;
      /** Kampanyanın öne çıkan (varsa TEK) ürünü — fiyat alanları `resolveVariantPricing`'den. */
      featuredProduct: {
        name: string;
        slug: string;
        imageUrl: string | null;
        imageAlt: string;
        regularPrice: string;
        effectivePrice: string;
      } | null;
      ctaLabel: "Fırsatı İncele";
      ctaHref: string;
    }
  | {
      kind: "discount";
      campaignId: string;
      eyebrow: "BU HAFTANIN FIRSATI";
      productName: string;
      productSlug: string;
      imageUrl: string | null;
      imageAlt: string;
      regularPrice: string;
      effectivePrice: string;
      discountPercentage: number | null;
      ctaLabel: "Ürünü İncele";
      ctaHref: string;
    }
  | {
      kind: "bundle";
      campaignId: string;
      eyebrow: "BİRLİKTE DAHA GÜZEL";
      primaryProductName: string;
      primaryImageUrl: string | null;
      companionProductName: string;
      companionImageUrl: string | null;
      ctaLabel: "Birlikte İncele";
      ctaHref: string;
    }
  | {
      kind: "featured";
      campaignId: string;
      eyebrow: "AYIN FAVORİSİ";
      productName: string;
      productSlug: string;
      imageUrl: string | null;
      imageAlt: string;
      price: string;
      ctaLabel: "Keşfet";
      ctaHref: string;
    };

export type CampaignPopupKind = CampaignPopupData["kind"];
