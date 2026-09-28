import { getCategoryHref } from "@/lib/category-routes";
import { resolveSharedDiscountDeadlineLabel } from "@/lib/discount-shared-deadline";
import { resolveHomepageSectionOrder, type ResolvedHomepageSection } from "@/lib/homepage-sections";
import { getMegaMenuGroup, type MegaMenuGroupImage } from "@/lib/mega-menu-content";
import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { listHomepageSections } from "@/server/repositories/homepage-section-repository";
import { getActiveHomepageSelection } from "@/server/repositories/homepage-selection-repository";
import {
  getActiveCategories,
  getActiveDiscountedProducts,
  getBestSellingProducts,
  getBundleOffersForHomepage,
  getFeaturedProductPicks,
  getHighestPriorityActiveCampaignWithProducts,
  getProductSummariesByIds,
  listProductsByGroup,
} from "@/server/services/catalog-service";
import { listFavoritedProductIdSet } from "@/server/services/favorite-service";
import { listBlogPosts, type BlogPostSummary } from "@/server/services/blog-service";
import {
  getActiveEventCards,
  getActiveFullWidthBanner,
  getActiveHeroBanners,
  getActiveInstagramPosts,
  type BannerSummary,
  type EventCardSummary,
  type InstagramPostSummary,
} from "@/server/services/content-service";
import type {
  BundleOfferDisplay,
  CategorySummary,
  MarketingCampaignDisplay,
  ProductImageSummary,
  ProductSummary,
} from "@/types/catalog";

const BEST_SELLING_PRODUCTS_LIMIT = 4;
const FEATURED_PICKS_LIMIT = 4;
const ACTIVE_DISCOUNTS_LIMIT = 4;
const EVENT_CARDS_LIMIT = 2;
const BLOG_PREVIEW_LIMIT = 3;
const HERO_SLIDES_LIMIT = 5;
const BUNDLE_OFFERS_LIMIT = 3;
const INSTAGRAM_POSTS_LIMIT = 4;

/**
 * Ana sayfa "Popüler Alt Kategoriler" bölümü için elle küratörlenmiş grup
 * seçimi — kategori + grup slug'ı gerçek `@/lib/mega-menu-content` verisine
 * karşılık gelir, rastgele/uydurma bir seçim DEĞİLDİR.
 */
const POPULAR_GROUPS: { categorySlug: string; groupSlug: string }[] = [
  { categorySlug: "cerez", groupSlug: "cekirdekler" },
  { categorySlug: "cerez", groupSlug: "fistik-cesitleri" },
  { categorySlug: "lokum", groupSlug: "sade-klasik-lokumlar" },
  { categorySlug: "kurabiye-sekerleme", groupSlug: "kurabiyeler" },
  { categorySlug: "cay-kahve", groupSlug: "bitki-caylari" },
  { categorySlug: "cay-kahve", groupSlug: "kahveler" },
  { categorySlug: "baharat", groupSlug: "aci-baharatlar" },
  { categorySlug: "hurma-kuru-meyve", groupSlug: "hurmalar" },
];

/**
 * Ana sayfa "keşif" bölümleri için elle küratörlenmiş kategori/grup linkleri —
 * `POPULAR_GROUPS` ile AYNI mantık, yeni bir sorgu/veri kaynağı DEĞİL. Etiket
 * gerçek `mega-menu-content.ts` grup adıyla birebir aynı olmak ZORUNDA değil
 * (ör. "Türk Kahvesi" → gerçek "Kahveler" grubuna yönlendirir) ama hedef HER
 * ZAMAN gerçek, var olan bir kategori/grup route'udur. `groupSlug: undefined`
 * olan satır kategori köküne (tüm kategori) bağlanır.
 */
const CEREZ_DISCOVERY_ITEMS: { categorySlug: string; groupSlug?: string; label: string }[] = [
  { categorySlug: "cerez", groupSlug: "fistik-cesitleri", label: "Fıstık Çeşitleri" },
  { categorySlug: "cerez", groupSlug: "leblebiler", label: "Leblebiler" },
  { categorySlug: "cerez", groupSlug: "misir", label: "Mısır" },
  { categorySlug: "cerez", groupSlug: "kuru-meyveler", label: "Kuru Meyveler" },
];

/**
 * Hero slider'ın SABİT metin içeriği — görevde birebir verildi, admin
 * banner'dan gelmez (yalnızca görseller admin-öncelikli, bkz. `buildHeroSlides`).
 */
const HERO_SLIDE_CONTENT: { title: string; subtitle: string; ctaLabel: string; ctaHref: string }[] = [
  {
    title: "Doğal lezzetin en taze hali",
    subtitle: "Kuruyemişten kahveye, özenle seçilen ürünleri OSSA kalitesiyle keşfedin.",
    ctaLabel: "Ürünleri İncele",
    ctaHref: "/urunler",
  },
  {
    title: "Geleneksel tatları keşfedin",
    subtitle: "Lokum, kahve, kuruyemiş ve daha fazlasını sofranıza taşıyın.",
    ctaLabel: "Kategorileri Keşfet",
    ctaHref: "#ana-kategoriler",
  },
  {
    title: "Özel günlerinize özel lezzetler",
    subtitle: "Kına, düğün ve davetleriniz için ihtiyacınıza uygun çerez seçenekleri.",
    ctaLabel: "İletişime Geç",
    ctaHref: "/iletisim",
  },
  {
    title: "Kahve Yanına En Güzel Eşlikçiler",
    subtitle:
      "Lokumdan drajeye, kuruyemişten tatlı atıştırmalıklara kahve keyfinizi tamamlayan OSSA lezzetlerini keşfedin.",
    ctaLabel: "Kahve Yanını Keşfet",
    ctaHref: "/cay-kahve",
  },
  {
    title: "Özel Günlerinize Lezzet Katın",
    subtitle:
      "Kına, düğün, davet ve özel organizasyonlarınız için ihtiyacınıza uygun çerez ve ikram seçeneklerini birlikte planlayalım.",
    ctaLabel: "Toplu Sipariş Ver",
    ctaHref: "/iletisim",
  },
];

export interface HeroSlideData {
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  imageAlt: string;
}

/**
 * Sabit slayt metnini admin Hero banner görselleriyle (varsa) eşler; eksik
 * kalan slaytlar gerçek çok-satan ürün görselleriyle (`fallbackImages`)
 * doldurulur — dış/uydurma görsel YOK, hiçbiri yoksa `ProductImage`'ın
 * kendi ikon fallback'i devreye girer (`imageUrl: null`).
 */
function buildHeroSlides(heroBanners: BannerSummary[], fallbackImages: ProductImageSummary[]): HeroSlideData[] {
  return HERO_SLIDE_CONTENT.map((content, index) => {
    const banner = heroBanners[index];
    const fallbackImage = fallbackImages.length > 0 ? fallbackImages[index % fallbackImages.length] : undefined;
    return {
      ...content,
      imageUrl: banner?.imageUrl ?? fallbackImage?.url ?? null,
      imageAlt: banner?.imageAlt ?? fallbackImage?.altText ?? content.title,
    };
  });
}

export interface HomePopularGroupCard {
  key: string;
  label: string;
  href: string;
  image: ProductImageSummary | null;
  /** Grubun ait olduğu kategori adı — kart üzerinde küçük meta metni için (`categories`'ten, ek sorgu YOK). */
  categoryName: string | null;
}

interface HomePopularGroupRow extends HomePopularGroupCard {
  categorySlug: string;
}

/**
 * Keşif kartı satırı — grup varsa `listProductsByGroup`'un ilk ürün görseliyle,
 * yoksa (kategori köküne bağlanan satır) `image: null` ile döner; asıl kategori
 * görseli `categories` (aynı `Promise.all`'da zaten çekiliyor) resolve olduktan
 * SONRA `patchDiscoveryImage` ile doldurulur — döngüsel bağımlılık oluşmaz.
 */
interface HomeDiscoveryRow {
  key: string;
  label: string;
  href: string;
  image: ProductImageSummary | null;
  categorySlug: string;
}

/** `MegaMenuGroupImage`'ı (`altText` her zaman dolu) `ProductImageSummary` şekline uyarlar. */
function toGroupCardImage(image: MegaMenuGroupImage | undefined): ProductImageSummary | null {
  return image ? { url: image.url, altText: image.altText, isPrimary: true } : null;
}

async function resolveDiscoveryRow(item: { categorySlug: string; groupSlug?: string; label: string }): Promise<HomeDiscoveryRow> {
  if (!item.groupSlug) {
    return {
      key: item.categorySlug,
      label: item.label,
      href: getCategoryHref(item.categorySlug),
      image: null,
      categorySlug: item.categorySlug,
    };
  }
  const group = getMegaMenuGroup(item.categorySlug, item.groupSlug);
  const { items } = await listProductsByGroup({
    categorySlug: item.categorySlug,
    groupSlug: item.groupSlug,
    page: 1,
    pageSize: 1,
    sort: "default",
  });
  return {
    key: `${item.categorySlug}-${item.groupSlug}`,
    label: item.label,
    href: `${getCategoryHref(item.categorySlug)}?grup=${item.groupSlug}`,
    // Grubun küratörlü temsilci görseli (`mega-menu-content.ts`) varsa ÖNCELİKLİDİR —
    // mega-menu/ana sayfa/keşif kartları AYNI merkezi kaynağı kullanır; yoksa
    // gruptaki ilk ürünün gerçek görseline (mevcut davranış) düşülür.
    image: toGroupCardImage(group?.image) ?? items[0]?.primaryImage ?? null,
    categorySlug: item.categorySlug,
  };
}

export interface HomePageData {
  categories: CategorySummary[];
  popularGroups: HomePopularGroupCard[];
  cerezDiscoveryCards: HomePopularGroupCard[];
  heroSlides: HeroSlideData[];
  fullWidthBanner: BannerSummary | null;
  fullWidthBannerFallbackImage: ProductImageSummary | null;
  eventCards: EventCardSummary[];
  bestSellingProducts: ProductSummary[];
  featuredPickProducts: ProductSummary[];
  activeDiscountProducts: ProductSummary[];
  /** Tüm gösterilen indirimli ürünlerin ortak/yakın bitiş tarihi varsa nötr etiket — bkz. `resolveSharedDiscountDeadlineLabel`. */
  discountDeadlineLabel: string | null;
  /** En yüksek öncelikli (Günlük>Haftalık>Aylık) GERÇEKTEN aktif kampanya — yoksa `null`, sayfa mevcut "Bu Haftanın Fırsatları" rafına geri döner. */
  activeMarketingCampaign: MarketingCampaignDisplay | null;
  bundleOffers: BundleOfferDisplay[];
  blogPosts: BlogPostSummary[];
  /** "OSSA'dan Seçtiklerimiz" — `isActive:false` veya seçili ürün yoksa `null` (bölüm hiç render edilmez). */
  homepageSelection: HomepageSelectionDisplay | null;
  instagramPosts: InstagramPostSummary[];
  /** Girişli kullanıcının bu sayfada gösterilen ürünler içindeki favori id'leri — TEK sorguyla çözülür. */
  favoritedProductIds: ReadonlySet<string>;
  isLoggedIn: boolean;
  /** Ana sayfa bölüm sırası/görünürlüğü — bkz. `resolveHomepageSectionOrder`. */
  sectionOrder: ResolvedHomepageSection[];
}

export interface HomepageSelectionDisplay {
  eyebrow: string | null;
  title: string;
  description: string | null;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  imageAlt: string | null;
  products: ProductSummary[];
}

/**
 * Ana sayfanın TÜM verisini TEK bir yerden, tek `Promise.all` içinde toplar —
 * her section component'i kendi verisini ayrı ayrı SORGULAMAZ. Hiçbir yeni
 * repository sorgusu tanımlamaz; yalnızca mevcut `catalog-service`/`blog-service`/
 * `content-service` fonksiyonlarını birleştirir. Hero/Full-Width banner
 * yedek görselleri `bestSellingProducts`'tan türetilir — ek sorgu YOK.
 */
export async function getHomePageData(): Promise<HomePageData> {
  const [
    categories,
    bestSellingProducts,
    featuredPickProducts,
    activeDiscountProducts,
    bundleOffers,
    activeMarketingCampaign,
    heroBanners,
    fullWidthBanner,
    eventCards,
    blogResult,
    popularGroupRows,
    cerezDiscoveryRows,
    homepageSelectionRow,
    instagramPosts,
    user,
    homepageSectionRows,
  ] = await Promise.all([
    getActiveCategories(),
    getBestSellingProducts(BEST_SELLING_PRODUCTS_LIMIT),
    getFeaturedProductPicks(FEATURED_PICKS_LIMIT),
    getActiveDiscountedProducts(ACTIVE_DISCOUNTS_LIMIT),
    getBundleOffersForHomepage(BUNDLE_OFFERS_LIMIT),
    getHighestPriorityActiveCampaignWithProducts(ACTIVE_DISCOUNTS_LIMIT),
    getActiveHeroBanners(HERO_SLIDES_LIMIT),
    getActiveFullWidthBanner(),
    getActiveEventCards(EVENT_CARDS_LIMIT),
    listBlogPosts({ page: 1, pageSize: BLOG_PREVIEW_LIMIT }),
    Promise.all(
      POPULAR_GROUPS.map(async ({ categorySlug, groupSlug }): Promise<HomePopularGroupRow | null> => {
        const group = getMegaMenuGroup(categorySlug, groupSlug);
        if (!group) {
          return null;
        }
        const { items } = await listProductsByGroup({
          categorySlug,
          groupSlug,
          page: 1,
          pageSize: 1,
          sort: "default",
        });
        return {
          key: `${categorySlug}-${groupSlug}`,
          label: group.label,
          href: `${getCategoryHref(categorySlug)}?grup=${groupSlug}`,
          // Bkz. `resolveDiscoveryRow` — grubun küratörlü görseli ÖNCELİKLİDİR.
          image: toGroupCardImage(group.image) ?? items[0]?.primaryImage ?? null,
          categoryName: null,
          categorySlug,
        };
      }),
    ),
    Promise.all(CEREZ_DISCOVERY_ITEMS.map(resolveDiscoveryRow)),
    getActiveHomepageSelection(),
    getActiveInstagramPosts(INSTAGRAM_POSTS_LIMIT),
    betterAuthProvider.getCurrentUser(),
    listHomepageSections(),
  ]);

  const sectionOrder = resolveHomepageSectionOrder(homepageSectionRows);

  const fallbackImages = bestSellingProducts
    .map((product) => product.primaryImage)
    .filter((image): image is ProductImageSummary => image !== null);

  const categoryNameBySlug = new Map(categories.map((category) => [category.slug, category.name]));
  const popularGroups: HomePopularGroupCard[] = popularGroupRows
    .filter((row): row is HomePopularGroupRow => row !== null)
    .map((row) => ({ ...row, categoryName: categoryNameBySlug.get(row.categorySlug) ?? null }));

  // Grup satırları kendi görselini `listProductsByGroup`'tan zaten getirdi; yalnızca
  // kategori köküne bağlanan satırların (ör. "Lokumlar") görseli burada, `categories`
  // resolve olduktan SONRA, kategorinin kendi kapak görselinden doldurulur.
  const categoryImageBySlug = new Map(
    categories.map((category) => [
      category.slug,
      category.imageUrl ? { url: category.imageUrl, altText: category.imageAlt, isPrimary: true } : null,
    ]),
  );
  function toDiscoveryCard(row: HomeDiscoveryRow): HomePopularGroupCard {
    return {
      key: row.key,
      label: row.label,
      href: row.href,
      image: row.image ?? categoryImageBySlug.get(row.categorySlug) ?? null,
      categoryName: categoryNameBySlug.get(row.categorySlug) ?? null,
    };
  }
  const cerezDiscoveryCards = cerezDiscoveryRows.map(toDiscoveryCard);

  const discountDeadlineLabel = resolveSharedDiscountDeadlineLabel(activeDiscountProducts);

  // "OSSA'dan Seçtiklerimiz" — seçili ürünlerin GÜNCEL fiyat/stok verisi TEK
  // toplu sorguyla (`getProductSummariesByIds`) çözülür, ürün başına ayrı
  // sorgu YOK. `getProductSummariesByIds` giriş sırasını garanti etmediğinden
  // admin'in belirlediği `sortOrder` burada elle uygulanır.
  let homepageSelection: HomepageSelectionDisplay | null = null;
  if (homepageSelectionRow) {
    const selectedProducts = await getProductSummariesByIds(homepageSelectionRow.productIds);
    const productById = new Map(selectedProducts.map((product) => [product.id, product]));
    const orderedProducts = homepageSelectionRow.productIds
      .map((id) => productById.get(id))
      .filter((product): product is ProductSummary => product !== undefined);
    if (orderedProducts.length > 0) {
      homepageSelection = {
        eyebrow: homepageSelectionRow.eyebrow,
        title: homepageSelectionRow.title,
        description: homepageSelectionRow.description,
        ctaLabel: homepageSelectionRow.ctaLabel,
        ctaHref: homepageSelectionRow.ctaHref,
        imageUrl: homepageSelectionRow.imageUrl,
        imageAlt: homepageSelectionRow.imageAlt,
        products: orderedProducts,
      };
    }
  }

  // Ana sayfadaki ürün vitrinlerinin (En Çok Satanlar/Ayın Favorileri/Fırsatlar)
  // TÜM ürün id'leri için favori durumu TEK ek sorguyla çözülür — kart başına
  // ayrı sorgu YOK.
  const favoritedProductIds = user
    ? await listFavoritedProductIdSet(user.id, [
        ...bestSellingProducts.map((product) => product.id),
        ...featuredPickProducts.map((product) => product.id),
        ...activeDiscountProducts.map((product) => product.id),
        ...(activeMarketingCampaign?.products.map((product) => product.id) ?? []),
      ])
    : new Set<string>();

  return {
    categories,
    bestSellingProducts,
    featuredPickProducts,
    activeDiscountProducts,
    discountDeadlineLabel,
    activeMarketingCampaign,
    bundleOffers,
    heroSlides: buildHeroSlides(heroBanners, fallbackImages),
    fullWidthBanner,
    fullWidthBannerFallbackImage: fallbackImages[0] ?? null,
    eventCards,
    blogPosts: blogResult.items,
    popularGroups,
    cerezDiscoveryCards,
    homepageSelection,
    instagramPosts,
    favoritedProductIds,
    isLoggedIn: Boolean(user),
    sectionOrder,
  };
}
