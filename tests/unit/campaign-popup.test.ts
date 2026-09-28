import { describe, expect, it } from "vitest";
import { resolveCampaignPopupData } from "@/lib/campaign-popup";
import type { BundleOfferDisplay, ProductSummary, ProductVariantSummary } from "@/types/catalog";

function buildVariant(overrides: Partial<ProductVariantSummary> = {}): ProductVariantSummary {
  return {
    id: "variant-1",
    sku: "SKU-1",
    name: "500 g",
    weightGram: 500,
    regularPrice: "750.00",
    effectivePrice: "750.00",
    discountPrice: null,
    discountPercentage: null,
    hasActiveDiscount: false,
    discountEndsAt: null,
    stockStatus: "IN_STOCK",
    isAvailable: true,
    ...overrides,
  };
}

function buildProduct(id: string, name: string, overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id,
    name,
    slug: `${id}-slug`,
    shortDescription: null,
    primaryImage: { url: `https://example.test/${id}.jpg`, altText: null, isPrimary: true },
    minPrice: "750.00",
    defaultVariant: buildVariant(),
    isOutOfStock: false,
    isFeatured: false,
    badges: [],
    ...overrides,
  };
}

function buildBundleOffer(id: string): BundleOfferDisplay {
  return {
    id,
    primaryProductId: "primary-1",
    primaryProductName: "Türk Kahvesi",
    primaryProductSlug: "turk-kahvesi",
    primaryImage: null,
    primaryVariantId: "variant-primary-1",
    primaryVariantName: "250 g",
    companionProductId: "companion-1",
    companionProductName: "Fındıklı Lokum",
    companionProductSlug: "findikli-lokum",
    companionImage: null,
    companionVariantId: "variant-companion-1",
    companionVariantName: "400 g",
    companionRegularPrice: "150.00",
    companionBundlePrice: "120.00",
  };
}

describe("resolveCampaignPopupData — ürün odaklı kampanya popup DTO'su", () => {
  it("hiçbir aktif kampanya yoksa null döner (sahte popup üretilmez)", () => {
    const result = resolveCampaignPopupData({ discountedProducts: [], bundleOffers: [], featuredPicks: [] });
    expect(result).toBeNull();
  });

  it("aktif indirim varsa discount DTO'su üretir — gerçek ürün fiyatlarıyla", () => {
    const product = buildProduct("p1", "Çiğ Badem", {
      defaultVariant: buildVariant({
        regularPrice: "750.00",
        effectivePrice: "649.00",
        discountPercentage: 13,
        hasActiveDiscount: true,
      }),
    });
    const result = resolveCampaignPopupData({ discountedProducts: [product], bundleOffers: [], featuredPicks: [] });

    expect(result?.kind).toBe("discount");
    if (result?.kind === "discount") {
      expect(result.eyebrow).toBe("BU HAFTANIN FIRSATI");
      expect(result.productName).toBe("Çiğ Badem");
      expect(result.regularPrice).toBe("750.00");
      expect(result.effectivePrice).toBe("649.00");
      expect(result.discountPercentage).toBe(13);
      expect(result.ctaLabel).toBe("Ürünü İncele");
      expect(result.ctaHref).toBe("/urunler/p1-slug");
    }
  });

  it("indirim yok, bundle varsa bundle DTO'su üretir ve ana ürünün PDP'sine gider", () => {
    const result = resolveCampaignPopupData({
      discountedProducts: [],
      bundleOffers: [buildBundleOffer("bundle-1")],
      featuredPicks: [],
    });

    expect(result?.kind).toBe("bundle");
    if (result?.kind === "bundle") {
      expect(result.primaryProductName).toBe("Türk Kahvesi");
      expect(result.companionProductName).toBe("Fındıklı Lokum");
      expect(result.ctaLabel).toBe("Birlikte İncele");
      expect(result.ctaHref).toBe("/urunler/turk-kahvesi");
    }
  });

  it("yalnızca Ayın Favorisi aktifse featured DTO'su üretir", () => {
    const product = buildProduct("p2", "Kavrulmuş Fıstık");
    const result = resolveCampaignPopupData({ discountedProducts: [], bundleOffers: [], featuredPicks: [product] });

    expect(result?.kind).toBe("featured");
    if (result?.kind === "featured") {
      expect(result.eyebrow).toBe("AYIN FAVORİSİ");
      expect(result.productName).toBe("Kavrulmuş Fıstık");
      expect(result.ctaLabel).toBe("Keşfet");
      expect(result.ctaHref).toBe("/urunler/p2-slug");
    }
  });

  it("hepsi aktifse öncelik: indirim > bundle > Ayın Favorisi", () => {
    const result = resolveCampaignPopupData({
      discountedProducts: [buildProduct("p1", "Çiğ Badem")],
      bundleOffers: [buildBundleOffer("bundle-1")],
      featuredPicks: [buildProduct("p2", "Kavrulmuş Fıstık")],
    });
    expect(result?.kind).toBe("discount");
  });

  it("bundle ve featured aktifse (indirim yok) bundle kazanır", () => {
    const result = resolveCampaignPopupData({
      discountedProducts: [],
      bundleOffers: [buildBundleOffer("bundle-1")],
      featuredPicks: [buildProduct("p2", "Kavrulmuş Fıstık")],
    });
    expect(result?.kind).toBe("bundle");
  });

  it("campaignId ürüne/bundle'a özgüdür (tekil id bazlı, set-bazlı değil)", () => {
    const result = resolveCampaignPopupData({
      discountedProducts: [buildProduct("p1", "Çiğ Badem")],
      bundleOffers: [],
      featuredPicks: [],
    });
    expect(result?.campaignId).toBe("discount:p1");
  });
});

describe("resolveCampaignPopupData — MarketingCampaign (haftalık kampanya) önceliği", () => {
  it("aktif haftalık kampanya varsa DİĞER TÜM adaylardan (indirim/bundle/featured) önce gösterilir", () => {
    const result = resolveCampaignPopupData({
      activeWeeklyPopupCampaign: {
        id: "camp-1",
        name: "Haftanın Kampanyası",
        headline: "Bu Hafta Sepette",
        description: "Seçili ürünlerde özel fiyat.",
        endsAt: "2026-06-20T12:00:00.000Z",
        isSingleProduct: false,
        product: null,
      },
      discountedProducts: [buildProduct("p1", "Çiğ Badem")],
      bundleOffers: [buildBundleOffer("bundle-1")],
      featuredPicks: [buildProduct("p2", "Kavrulmuş Fıstık")],
    });

    expect(result?.kind).toBe("campaign");
    if (result?.kind === "campaign") {
      expect(result.campaignId).toBe("campaign:camp-1");
      expect(result.eyebrow).toBe("BU HAFTAYA ÖZEL");
      expect(result.headline).toBe("Bu Hafta Sepette");
      expect(result.endsAt).toBe("2026-06-20T12:00:00.000Z");
    }
  });

  it("headline boşsa kampanya adına (name) düşer", () => {
    const result = resolveCampaignPopupData({
      activeWeeklyPopupCampaign: {
        id: "camp-2",
        name: "Yaz Kampanyası",
        headline: null,
        description: null,
        endsAt: "2026-06-20T12:00:00.000Z",
        isSingleProduct: false,
        product: null,
      },
      discountedProducts: [],
      bundleOffers: [],
      featuredPicks: [],
    });
    expect(result?.kind).toBe("campaign");
    if (result?.kind === "campaign") {
      expect(result.headline).toBe("Yaz Kampanyası");
    }
  });

  it("tek ürünlü kampanyada CTA doğrudan ürünün PDP'sine gider", () => {
    const product = buildProduct("p1", "Çiğ Badem");
    const result = resolveCampaignPopupData({
      activeWeeklyPopupCampaign: {
        id: "camp-3",
        name: "Tekil Kampanya",
        headline: "Bu Hafta",
        description: null,
        endsAt: "2026-06-20T12:00:00.000Z",
        isSingleProduct: true,
        product,
      },
      discountedProducts: [],
      bundleOffers: [],
      featuredPicks: [],
    });
    expect(result?.kind).toBe("campaign");
    if (result?.kind === "campaign") {
      expect(result.ctaHref).toBe("/urunler/p1-slug");
      expect(result.featuredProduct?.name).toBe("Çiğ Badem");
    }
  });

  it("çoklu ürünlü kampanyada CTA kampanya filtresine gider (/urunler?kampanya=)", () => {
    const result = resolveCampaignPopupData({
      activeWeeklyPopupCampaign: {
        id: "camp-4",
        name: "Çoklu Kampanya",
        headline: "Bu Hafta",
        description: null,
        endsAt: "2026-06-20T12:00:00.000Z",
        isSingleProduct: false,
        product: buildProduct("p1", "Çiğ Badem"),
      },
      discountedProducts: [],
      bundleOffers: [],
      featuredPicks: [],
    });
    expect(result?.kind).toBe("campaign");
    if (result?.kind === "campaign") {
      expect(result.ctaHref).toBe("/urunler?kampanya=camp-4");
    }
  });

  it("activeWeeklyPopupCampaign null/undefined ise mevcut indirim>bundle>featured zinciri DEĞİŞMEDEN çalışır", () => {
    const withNull = resolveCampaignPopupData({
      activeWeeklyPopupCampaign: null,
      discountedProducts: [buildProduct("p1", "Çiğ Badem")],
      bundleOffers: [],
      featuredPicks: [],
    });
    expect(withNull?.kind).toBe("discount");

    const withUndefined = resolveCampaignPopupData({
      discountedProducts: [buildProduct("p1", "Çiğ Badem")],
      bundleOffers: [],
      featuredPicks: [],
    });
    expect(withUndefined?.kind).toBe("discount");
  });
});
