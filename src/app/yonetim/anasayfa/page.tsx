import type { Metadata } from "next";
import Link from "next/link";
import { HomepageSectionManager } from "@/components/admin/homepage-section-manager";
import { PageContainer } from "@/components/layout/container";
import { HOMEPAGE_SECTIONS, resolveHomepageSectionOrder } from "@/lib/homepage-sections";
import { publicEnv } from "@/config/env";
import { requireRole } from "@/server/auth/guard";
import { BannerType } from "@/generated/prisma/client";
import { countBannersByType } from "@/server/repositories/banner-repository";
import { listBundleOffersForAdmin } from "@/server/repositories/bundle-offer-repository";
import { listActiveCategoryOptions } from "@/server/repositories/category-repository";
import { countActiveFeaturedPicks } from "@/server/repositories/featured-pick-repository";
import { getHomepageSelectionForAdmin } from "@/server/repositories/homepage-selection-repository";
import { listHomepageSections } from "@/server/repositories/homepage-section-repository";
import { listInstagramPostsForAdmin } from "@/server/repositories/instagram-post-repository";
import { listEventCards } from "@/server/repositories/event-card-repository";
import { listAllPosts } from "@/server/repositories/blog-repository";
import { getBestSellingProductsWithQuantity, getMostFavoritedProducts } from "@/server/services/catalog-service";

export const metadata: Metadata = { title: "Ana Sayfa Yönetimi" };

const INSIGHT_LIMIT = 50;

/**
 * Her bölümün YANINDA gösterilen kısa özet — TAMAMEN gerçek DB verisinden,
 * mevcut admin CRUD repository fonksiyonları reuse edilerek hesaplanır.
 * Yeni bir sayaç sorgusu/DB modeli EKLENMEDİ; zaten var olan `list*ForAdmin`/
 * `count*` fonksiyonlarının sonucu üzerinden (`.length`/`.filter`) türetilir.
 */
async function buildSectionSummaries(): Promise<Record<string, string>> {
  const [
    heroCount,
    fullWidthCount,
    categories,
    featuredPickCount,
    bundleOffers,
    eventCards,
    homepageSelection,
    instagramPosts,
    blogPosts,
  ] = await Promise.all([
    countBannersByType(BannerType.HERO),
    countBannersByType(BannerType.FULL_WIDTH),
    listActiveCategoryOptions(),
    countActiveFeaturedPicks(),
    listBundleOffersForAdmin(),
    listEventCards(),
    getHomepageSelectionForAdmin(),
    listInstagramPostsForAdmin(),
    listAllPosts(),
  ]);

  const activeBundleOffers = bundleOffers.filter((offer) => offer.isActive).length;
  const activeEventCards = eventCards.filter((card) => card.isActive).length;
  const activeInstagramPosts = instagramPosts.filter((post) => post.isActive).length;
  const publishedBlogPosts = blogPosts.filter((post) => post.status === "PUBLISHED").length;
  const selectionProductCount = homepageSelection?.productIds.length ?? 0;

  return {
    hero: heroCount > 0 ? `${heroCount} slayt` : "Henüz slayt yok",
    "main-categories": `${categories.length} kategori`,
    "deals-shelf": "Otomatik — aktif kampanya veya gerçek indirimli ürünler",
    "monthly-favorites": featuredPickCount > 0 ? `${featuredPickCount} ürün seçili` : "Henüz ürün seçilmedi",
    "best-sellers": "Otomatik — gerçek sipariş verisinden",
    "better-together": activeBundleOffers > 0 ? `${activeBundleOffers} aktif paket` : "Henüz aktif paket yok",
    "event-snacks": activeEventCards > 0 ? `${activeEventCards} aktif kart` : "Henüz aktif kart yok",
    "popular-groups": "Otomatik — mega-menu gruplarından",
    "editorial-selection": !homepageSelection?.isActive
      ? "İçerik henüz etkinleştirilmedi"
      : selectionProductCount > 0
        ? `${selectionProductCount} ürün seçili`
        : "İçerik etkin ama ürün seçilmedi",
    "discovery-links": "Sabit içerik",
    "editorial-banner": fullWidthCount > 0 ? "İçerik hazır" : "Henüz içerik yok",
    instagram: activeInstagramPosts > 0 ? `${activeInstagramPosts} gönderi` : "Henüz gönderi yok",
    "why-ossa": "Sabit içerik",
    blog: publishedBlogPosts > 0 ? `${publishedBlogPosts} yayınlanmış yazı` : "Henüz yayınlanmış yazı yok",
    "final-cta": "Sabit içerik",
  };
}

export default async function AdminHomepagePage() {
  await requireRole("ADMIN", "/yonetim/anasayfa");

  const [rows, summaryByKey, mostFavorited, bestSellers] = await Promise.all([
    listHomepageSections(),
    buildSectionSummaries(),
    getMostFavoritedProducts(INSIGHT_LIMIT),
    getBestSellingProductsWithQuantity(INSIGHT_LIMIT),
  ]);
  const resolved = resolveHomepageSectionOrder(rows);
  const sections = resolved.map((row) => {
    const config = HOMEPAGE_SECTIONS.find((section) => section.key === row.key);
    return { ...config!, isActive: row.isActive, summary: summaryByKey[row.key] ?? config!.description };
  });

  return (
    <PageContainer maxWidthClassName="max-w-[900px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim" className="text-brand w-fit text-xs font-semibold">
          ← Yönetim
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Ana Sayfa Yönetimi</h1>
          <a
            href={publicEnv.NEXT_PUBLIC_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="border-border-muted hover:border-brand min-h-9 rounded-lg border px-4 text-sm font-semibold transition-colors"
          >
            Siteyi Görüntüle ↗
          </a>
        </div>
        <p className="text-foreground/60 text-sm">
          Ana sayfadaki TÜM bölümlere buradan ulaşabilirsiniz — sırayı sürükleyerek veya ok tuşlarıyla
          değiştirin, editoryal bölümleri aktif/pasif yapın. İçeriği düzenlemek için ilgili bölümün
          &ldquo;Düzenle&rdquo; bağlantısını kullanın. Liste, ana sayfadaki GERÇEK sırayla birebir aynıdır.
        </p>
      </div>

      <HomepageSectionManager initialSections={sections} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-base font-semibold">İçgörüler</h2>
          <p className="text-foreground/50 text-xs">
            Bunlar ana sayfa bölümü değildir, otomatik/salt-okunur raporlardır — elle düzenlenemez.
          </p>
        </div>
        <ul className="flex flex-col gap-2" aria-label="Salt-okunur içgörü raporları">
          <li className="border-border-muted bg-surface flex flex-wrap items-center gap-3 rounded-xl border p-4">
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-semibold">Müşteri Favorileri</p>
              <p className="text-foreground/50 text-xs">
                {mostFavorited.length > 0
                  ? `${mostFavorited.length} üründe favori kaydı — gerçek Favorite verisinden`
                  : "Henüz favori kaydı yok"}
              </p>
            </div>
            <Link
              href="/yonetim/kampanyalar/musteri-favorileri"
              className="border-border-muted hover:border-brand min-h-8 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
            >
              Görüntüle
            </Link>
          </li>
          <li className="border-border-muted bg-surface flex flex-wrap items-center gap-3 rounded-xl border p-4">
            <div className="min-w-0 flex-1">
              <p className="text-foreground text-sm font-semibold">En Çok Satanlar</p>
              <p className="text-foreground/50 text-xs">
                {bestSellers.length > 0
                  ? `${bestSellers.length} ürün — son 90 gün gerçek sipariş verisinden`
                  : "Son 90 günde eşiği aşan satış yok"}
              </p>
            </div>
            <Link
              href="/yonetim/kampanyalar/en-cok-satanlar"
              className="border-border-muted hover:border-brand min-h-8 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
            >
              Görüntüle
            </Link>
          </li>
        </ul>
      </div>
    </PageContainer>
  );
}
