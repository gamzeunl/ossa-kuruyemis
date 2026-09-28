import type { ReactNode } from "react";
import { BlogPreviewSection } from "@/components/home/blog-preview-section";
import { BundleDiscoverySection } from "@/components/home/bundle-discovery-section";
import { DiscoveryLinksSection } from "@/components/home/discovery-links-section";
import { EditorialBannerSection } from "@/components/home/editorial-banner-section";
import { EventSnacksSection } from "@/components/home/event-snacks-section";
import { FeaturedPicksSection } from "@/components/home/featured-picks-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";
import { HeroSlider } from "@/components/home/hero-slider";
import { HomepageSelectionSection } from "@/components/home/homepage-selection-section";
import { InstagramShowcaseSection } from "@/components/home/instagram-showcase-section";
import { MainCategoriesSection } from "@/components/home/main-categories-section";
import { PopularGroupsSection } from "@/components/home/popular-groups-section";
import { ProductShelf } from "@/components/home/product-shelf";
import { WhyOssaSection } from "@/components/home/why-ossa-section";
import { CAMPAIGN_TYPE_LABELS } from "@/lib/campaign-type-preset";
import { getHomePageData } from "@/server/services/homepage-service";

export default async function Home() {
  const {
    categories,
    popularGroups,
    cerezDiscoveryCards,
    heroSlides,
    fullWidthBanner,
    fullWidthBannerFallbackImage,
    eventCards,
    bestSellingProducts,
    featuredPickProducts,
    activeDiscountProducts,
    discountDeadlineLabel,
    activeMarketingCampaign,
    bundleOffers,
    blogPosts,
    homepageSelection,
    instagramPosts,
    favoritedProductIds,
    isLoggedIn,
    sectionOrder,
  } = await getHomePageData();

  const showcaseCategories = categories.filter((category) => category.slug !== "kampanyali-paketler");

  // Her bölümün gerçek render fonksiyonu — mevcut prop'lar/koşullar AYNEN
  // korunur, yalnızca JSX'in sabit sırası `sectionOrder`'a (bkz.
  // `HomepageSection` + `resolveHomepageSectionOrder`) devredilir. Bölümün
  // KENDİSİ zaten "veri yoksa/pasifse render etme" güvenli varsayılanına
  // sahip (ör. `null` dönen bileşenler) — bu harita yalnızca admin'in
  // AÇIKÇA pasifleştirdiği bölümleri atlar.
  const sectionRenderers: Record<string, () => ReactNode> = {
    hero: () => <HeroSlider slides={heroSlides} />,
    "main-categories": () => <MainCategoriesSection categories={showcaseCategories} />,
    "deals-shelf": () =>
      activeMarketingCampaign ? (
        <ProductShelf
          eyebrow={`${CAMPAIGN_TYPE_LABELS[activeMarketingCampaign.type]} Kampanya`}
          title={activeMarketingCampaign.headline ?? activeMarketingCampaign.name}
          subtitle={activeMarketingCampaign.description ?? undefined}
          countdownEndsAt={activeMarketingCampaign.endsAt}
          viewAllHref={`/urunler?kampanya=${activeMarketingCampaign.id}`}
          viewAllLabel="Tüm Fırsatları Gör"
          products={activeMarketingCampaign.products}
          toneClassName="bg-surface-muted"
          variant="deal"
          compact
          favoritedProductIds={favoritedProductIds}
          isLoggedIn={isLoggedIn}
        />
      ) : (
        <ProductShelf
          eyebrow="Seçili Ürünler"
          title="Bu Haftanın Fırsatları"
          titleBadge={discountDeadlineLabel ?? undefined}
          subtitle="Sınırlı süreyle avantajlı fiyatları keşfedin."
          viewAllHref="/urunler"
          viewAllLabel="Fırsatları Gör"
          products={activeDiscountProducts}
          toneClassName="bg-surface-muted"
          variant="deal"
          compact
          favoritedProductIds={favoritedProductIds}
          isLoggedIn={isLoggedIn}
          highlightDeals
        />
      ),
    "monthly-favorites": () => (
      <FeaturedPicksSection
        products={featuredPickProducts.slice(0, 4)}
        favoritedProductIds={favoritedProductIds}
        isLoggedIn={isLoggedIn}
      />
    ),
    "best-sellers": () => (
      <ProductShelf
        eyebrow="Müşterilerin Tercihi"
        title="En Çok Tercih Edilenler"
        subtitle="Gerçek sipariş verilerine göre öne çıkan ürünler."
        viewAllHref="/urunler"
        viewAllLabel="Tüm Ürünleri Gör"
        products={bestSellingProducts}
        toneClassName="bg-background"
        favoritedProductIds={favoritedProductIds}
        isLoggedIn={isLoggedIn}
      />
    ),
    "better-together": () => <BundleDiscoverySection offers={bundleOffers} />,
    "event-snacks": () => <EventSnacksSection cards={eventCards} />,
    "popular-groups": () => <PopularGroupsSection groups={popularGroups} />,
    "editorial-selection": () => <HomepageSelectionSection selection={homepageSelection} />,
    "discovery-links": () => (
      <DiscoveryLinksSection
        headingId="cerez-sofrasini-tamamla-baslik"
        eyebrow="Sofra Önerisi"
        title="Çerez Sofrasını Tamamla"
        subtitle="Çerez tabağınızı zenginleştirecek çeşitleri keşfedin."
        items={cerezDiscoveryCards}
        toneClassName="bg-surface-muted"
        layout="compact"
      />
    ),
    "editorial-banner": () => (
      <EditorialBannerSection banner={fullWidthBanner} fallbackImage={fullWidthBannerFallbackImage} />
    ),
    instagram: () => <InstagramShowcaseSection posts={instagramPosts} />,
    "why-ossa": () => <WhyOssaSection />,
    blog: () => <BlogPreviewSection posts={blogPosts} />,
    "final-cta": () => <FinalCtaSection />,
  };

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      {sectionOrder
        .filter((section) => section.isActive)
        .map((section) => {
          const render = sectionRenderers[section.key];
          return render ? <div key={section.key}>{render()}</div> : null;
        })}
    </main>
  );
}
