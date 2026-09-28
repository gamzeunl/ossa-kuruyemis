try {
  process.loadEnvFile();
} catch {
  // .env bulunamadı — gerçek ortamlarda beklenen durum.
}

import { pathToFileURL } from "node:url";
import { generateProductDescription } from "@/lib/product-description-generator";
import { HOMEPAGE_SECTIONS } from "@/lib/homepage-sections";
import { SEED_BLOG_POSTS } from "./seed-blog-posts";
import { NEW_REAL_PHOTO_PRODUCTS, REAL_CATEGORY_IMAGE_MAP, REAL_PRODUCT_IMAGE_MAP } from "./seed-real-photo-products";
import { PRODUCT_INFORMATION } from "./seed-product-information";

export interface SeedCategory {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  imageUrl?: string;
}

interface SeedStock {
  quantityAvailable: number;
  quantityReserved: number;
  lowStockThreshold: number;
}

interface SeedVariant {
  id: string;
  sku: string;
  name: string;
  weightGram: number;
  price: string;
  sortOrder: number;
  stock: SeedStock;
}

export interface SeedProduct {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  /** Yalnızca eski tek-cümlelik şablonla üretilmiş, hiç düzenlenmemiş açıklamaları güvenle tespit etmek için. */
  legacyDescription: string;
  ingredients: string;
  storageConditions: string;
  categoryId: string;
  sortOrder: number;
  isFeatured?: boolean;
  imageUrl: string;
  variants: SeedVariant[];
}

// Faz 4B'nin demo katalog verisi, ardından Faz 4B.1'in geçici gerçek-taksonomi
// denemesi bu listede temizlenir. İlk çalıştırmadan sonra hep no-op olur.
// NOT: "antep-fistigi", "cevizli-lokum", "badem-sekeri", "pul-biber", "kekik",
// "turk-kahvesi" bu listeden ÇIKARILDI (2026-08-14) — bunlar artık gerçek/aktif
// katalog ürünleridir (bkz. `docs/CATALOG_PRICE_UPDATE_MATCHING_REPORT.md`).
// Listede tutulmaya devam etselerdi her `db:seed` çalıştırmasında bu 6 GERÇEK
// ürün silinip yeniden oluşturulur (cascade ile geçmiş sipariş/favori/yorum
// ilişkileri kopardı) — bu, keşfedilen ÖNCEDEN VAR OLAN bir hataydı.
const LEGACY_DEMO_PRODUCT_SLUGS = [
  "kinalik-karisik-cerez",
  "dugun-sekeri",
  "hediyelik-kina-gecesi-kutusu",
  "ic-findik",
  "kabuklu-findik",
  "badem",
  "kaju",
  "ceviz",
  "leblebi",
  "fistikli-lokum",
  "meyve-sekeri",
  "kakaolu-kuru-pasta",
  "cevizli-kurabiye",
  "un-kurabiyesi",
  "karabiber-ogutulmus",
  "medine-hurmasi",
  "deglet-nur-hurma",
  "menengic-kahvesi",
  "siyah-cay",
];
const LEGACY_DEMO_CATEGORY_SLUGS = [
  "kina-ve-dugun-cerezi",
  "kuruyemisler",
  "lokum-ve-sekerlemeler",
  "kuru-pasta",
  "baharatlar",
  "hurma",
  "kahve-cay",
];

// Türkçe karakterleri ASCII'ye çevirip URL-güvenli slug üretir. `toLowerCase()`
// yerine önce açık karakter eşlemesi yapılır — aksi halde "İ" gibi harfler
// JS'in yerelden bağımsız küçük harfe çevrimiyle "i̇" (nokta + birleşik işaret)
// gibi hatalı sonuçlar üretir.
const TURKISH_CHAR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

function slugify(value: string): string {
  return value
    .split("")
    .map((char) => TURKISH_CHAR_MAP[char] ?? char)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Gerçek OSSA fiyat/ürün listesindeki (2026-08-14, 146 satır) bir satırın karşılığı
 * — bkz. `docs/CATALOG_PRICE_UPDATE_MATCHING_REPORT.md` (eşleştirme gerekçesi,
 * TL/kg vs TL/adet ayrımı, AMBIGUOUS/DB_ONLY notları). Yalnızca biri dolu olur:
 * `pricePerKg` (varyant fiyatı = pricePerKg × gramaj/1000 ile hesaplanır) veya
 * `pricePerUnit` (TÜM varyantlara bu sabit fiyat doğrudan uygulanır, kg dönüşümü YOK).
 */
interface SeedProductEntry {
  name: string;
  pricePerKg?: number;
  pricePerUnit?: number;
}

interface CategoryContentPlan {
  id: string;
  slug: string;
  name: string;
  description: string;
  sortOrder: number;
  /** Tek ağırlık = tek varyant. İki ağırlık (yalnızca Çerez) = iki varyant. */
  weightsGram: number[];
  products: SeedProductEntry[];
}

// Fiyatlar 2026-08-14 tarihli gerçek OSSA fiyat listesinden — bkz.
// `docs/CATALOG_PRICE_UPDATE_MATCHING_REPORT.md`. "UNRESOLVED" yorumlu satırlar
// yeni listede güvenle eşleştirilemedi (AMBIGUOUS); bu ürünler eski/mevcut
// fiyatlarını korur, gerçek değer netleşince güncellenecek. Stok ve açıklama
// metinleri hâlâ geliştirme amaçlı DEMO veridir. Ürün isimleri OSSA Kuruyemiş'in gerçek ürün
// listesidir (bazıları üçüncü taraf marka ürünüdür — bu ürünlerin gerçek stoklu
// bayi/perakende ürünleri olduğu varsayılır).
export const CATEGORY_PLANS: CategoryContentPlan[] = [
  {
    id: "cat-cerez",
    slug: "cerez",
    name: "Çerez",
    description: "Kavrulmuş, çiğ ve tuzlu çerez çeşitleri.",
    sortOrder: 1,
    weightsGram: [500, 1000],
    products: [
      { name: "Kabak çekirdeği", pricePerKg: 450 },
      { name: "Salamura kabak", pricePerKg: 500 },
      { name: "Dakota çekirdek", pricePerKg: 180 },
      { name: "Fıstık içi", pricePerKg: 300 },
      { name: "Fırt fıstık", pricePerKg: 200 },
      { name: "Pastalık fıstık", pricePerKg: 150 },
      { name: "Soslu mısır", pricePerKg: 150 },
      { name: "Soslu fıstık", pricePerKg: 250 },
      { name: "Şekerli leblebi", pricePerKg: 180 },
      { name: "Beyaz leblebi", pricePerKg: 225 },
      { name: "Çıtır leblebi", pricePerKg: 180 },
      { name: "Tuzsuz sarı leblebi", pricePerKg: 225 },
      { name: "Köy leblebisi", pricePerKg: 190 },
      { name: "Sarı leblebi", pricePerKg: 225 },
      { name: "Çiğ kaju", pricePerKg: 750 },
      { name: "Çiğ fırt fıstık", pricePerKg: 150 },
      { name: "Çiğ kabak", pricePerKg: 400 },
      { name: "Çiğ fındık içi", pricePerKg: 1250 },
      { name: "Çiğ badem", pricePerKg: 750 },
      { name: "Patlatmalık mısır", pricePerKg: 50 },
      { name: "Kuru üzüm", pricePerKg: 330 },
      { name: "Siyah üzüm", pricePerKg: 440 },
      { name: "Ceviz içi", pricePerKg: 750 },
      { name: "Buğday", pricePerKg: 75 },
      { name: "Yağlı mısır", pricePerKg: 160 },
      { name: "Kavurga", pricePerKg: 140 },
      { name: "Zar kabuklu kaju", pricePerKg: 900 },
      { name: "Kabuklu ceviz", pricePerKg: 350 },
      { name: "Özbek üzümü", pricePerKg: 550 },
      { name: "Kuş üzümü", pricePerKg: 750 },
      { name: "Menengiç", pricePerKg: 550 },
      { name: "Antep Fıstığı", pricePerKg: 1400 },
      { name: "Siirt Fıstığı", pricePerKg: 1400 },
      { name: "Lüks Karışık", pricePerKg: 1100 },
      { name: "Spesiyal Karışık", pricePerKg: 600 },
      { name: "Mix Çerez", pricePerKg: 850 },
      { name: "Karışık Çerez", pricePerKg: 200 },
    ],
  },
  {
    id: "cat-lokum",
    slug: "lokum",
    name: "Lokum",
    description: "Geleneksel ve OSSA'ya özel lokum çeşitleri.",
    sortOrder: 2,
    weightsGram: [400],
    products: [
      { name: "Hindistan cevizli lokum", pricePerKg: 130 },
      { name: "Fındıklı yaprak lokum", pricePerKg: 300 },
      { name: "Sade lokum", pricePerKg: 120 },
      { name: "Güllü lokum", pricePerKg: 120 },
      { name: "Mini güllü lokum", pricePerKg: 150 },
      { name: "Meyveli kuş lokum", pricePerKg: 130 },
      { name: "Fındıklı mini cevizli lokum", pricePerKg: 354.75 }, // UNRESOLVED (DB_ONLY) — mevcut fiyatı korur
      { name: "Fındıklı lokum", pricePerKg: 300 },
      { name: "Cevizli bandırma lokumu", pricePerKg: 195 },
      { name: "Ballı susamlı lokum", pricePerKg: 225 },
      { name: "Lokumlu bisküvi", pricePerUnit: 75 },
      { name: "Pişmaniye", pricePerUnit: 110 },
      { name: "OSSA Antep Fıstıklı Lokum", pricePerKg: 790 },
      { name: "Antep mini cezerye", pricePerKg: 450 },
      { name: "Hindistan cevizli bandırma", pricePerKg: 415 },
      { name: "Susamlı lokum", pricePerKg: 195 },
      { name: "Narlı cevizli sucuk", pricePerKg: 330 },
      { name: "Fitilli lokum", pricePerKg: 360 },
    ],
  },
  {
    id: "cat-kurabiye-sekerleme",
    slug: "kurabiye-sekerleme",
    name: "Kurabiye & Şekerleme",
    description: "Kurabiye, çikolata ve şekerleme çeşitleri.",
    sortOrder: 3,
    weightsGram: [250],
    products: [
      { name: "Çakıl taşı", pricePerKg: 220 },
      { name: "Bonibon", pricePerKg: 220 },
      { name: "Karışık draje", pricePerUnit: 60 },
      { name: "Kurabiye", pricePerKg: 175 },
      { name: "Gofret", pricePerKg: 130 },
      { name: "Haşhaşlı ballı kurabiye", pricePerKg: 200 },
      { name: "Ballı susamlı kurabiye", pricePerKg: 265 },
      { name: "Fıstık ezmesi", pricePerKg: 150 },
      { name: "Çekilmiş tahin", pricePerUnit: 200 },
      { name: "Finger", pricePerUnit: 90 },
      { name: "Kıbrıs gevreği", pricePerUnit: 160 },
      { name: "Bardak kurabiye", pricePerUnit: 60 },
      { name: "Lüx badem şekeri", pricePerKg: 525 },
      { name: "Badem şekeri", pricePerKg: 390 },
      { name: "Jelibon", pricePerKg: 225 },
      { name: "Fındıklı draje", pricePerKg: 750 },
      // NOT: Konak Fındık Çikolata gerçek sipariş geçmişine sahip olduğu için
      // hard-delete edilmedi, DB'de ARCHIVED yapıldı — burada da kaldırılmazsa
      // bir sonraki `db:seed` status'u zorla ACTIVE'e çevirirdi (bkz. upsert
      // `update` bloğu), bu yüzden diğer 25 kaldırılan ürünle aynı muameleyi görür.
    ],
  },
  {
    id: "cat-cay-kahve",
    slug: "cay-kahve",
    name: "Çay & Kahve",
    description: "Türk kahvesi, filtre kahve ve çay çeşitleri.",
    sortOrder: 4,
    weightsGram: [250],
    products: [
      { name: "Papatya çayı", pricePerKg: 900 },
      { name: "Ihlamur", pricePerKg: 2200 },
      { name: "Türk kahvesi", pricePerKg: 800 },
      { name: "Kış çayı", pricePerUnit: 70 },
      { name: "Çubuk tarçın", pricePerKg: 525 },
      { name: "Zerdeçal", pricePerKg: 230 },
      { name: "Zencefil", pricePerKg: 450 },
      { name: "Osmanlı dibek kahvesi", pricePerKg: 450 },
      { name: "Biberiye çayı", pricePerKg: 1800 },
      { name: "OSSA Kahve Çeşnisi", pricePerUnit: 80 },
      { name: "Hibiskus çayı", pricePerKg: 400 },
      { name: "Rezene", pricePerKg: 300 },
      { name: "Yeşil çay", pricePerKg: 525 },
      { name: "Nescafe 48'li", pricePerUnit: 450 },
    ],
  },
  {
    id: "cat-baharat",
    slug: "baharat",
    name: "Baharat",
    description: "Günlük mutfak kullanımı için temel baharat çeşitleri.",
    sortOrder: 5,
    weightsGram: [100],
    products: [
      { name: "Karabiber", pricePerKg: 830 },
      { name: "İsot", pricePerKg: 440 },
      { name: "Karanfil", pricePerKg: 900 },
      { name: "Toz biber", pricePerKg: 420 },
      { name: "Pul biber", pricePerKg: 490 },
      { name: "Kimyon", pricePerKg: 600 },
      { name: "Toz kekik", pricePerKg: 700 },
      { name: "Yayla sumağı", pricePerKg: 750 },
      { name: "Hindistan cevizi", pricePerKg: 490 },
      { name: "Susam", pricePerKg: 210 },
      { name: "Çörekotu", pricePerKg: 375 },
      { name: "Kekik", pricePerKg: 269 }, // UNRESOLVED (AMBIGUOUS: "Kekik Zahter" mi?) — mevcut fiyatı korur
      { name: "Toz tarçın", pricePerKg: 450 },
      { name: "Çemen tozu", pricePerKg: 225 },
      { name: "Nane", pricePerKg: 375 },
      { name: "Limon tuzu", pricePerKg: 190 },
      { name: "Köri", pricePerKg: 375 },
      { name: "Yedibahar", pricePerKg: 450 },
      { name: "Maraş tarhanası", pricePerUnit: 300 },
    ],
  },
  {
    id: "cat-hurma-kuru-meyve",
    slug: "hurma-kuru-meyve",
    name: "Hurma & Kuru Meyve",
    description: "Hurma ve kuru meyve çeşitleri.",
    sortOrder: 6,
    weightsGram: [500],
    products: [
      { name: "Premium hurma", pricePerKg: 540 },
      { name: "Jumbo hurma", pricePerKg: 675 },
      { name: "Bonbon hurma", pricePerKg: 400 },
      { name: "Yaş hurma", pricePerUnit: 150 },
      { name: "Lüks Suudi hurma", pricePerKg: 350 },
      { name: "Lüks hurma", pricePerKg: 700 },
      // NOT: Paket hurma bir blog yazısında referanslandığı için hard-delete
      // edilmedi, DB'de ARCHIVED yapıldı — burada da kaldırılmazsa bir sonraki
      // `db:seed` status'u zorla ACTIVE'e çevirirdi (bkz. upsert `update` bloğu).
      { name: "M hurma", pricePerKg: 650 },
      { name: "Kayısı kurusu", pricePerKg: 361.8 }, // UNRESOLVED (AMBIGUOUS: "Kayısı İncir Kurusu" birleşik satır) — mevcut fiyatı korur
      { name: "İncir kurusu", pricePerKg: 365.8 }, // UNRESOLVED (AMBIGUOUS: "Kayısı İncir Kurusu" birleşik satır) — mevcut fiyatı korur
      { name: "Domates kurusu", pricePerKg: 330 },
      { name: "Pestil", pricePerKg: 270 },
    ],
  },
];

export const categories: SeedCategory[] = [
  {
    id: "cat-kampanyali-paketler",
    slug: "kampanyali-paketler",
    name: "Kampanyalı Paketler",
    description: "Bu haftaya özel indirimli ürün seçkisi.",
    sortOrder: 0,
    imageUrl: "/images/categories/kampanyali-paketler.svg",
  },
  ...CATEGORY_PLANS.map((plan): SeedCategory => ({
    id: plan.id,
    slug: plan.slug,
    name: plan.name,
    description: plan.description,
    sortOrder: plan.sortOrder,
    imageUrl: `/images/categories/${plan.slug}.svg`,
  })),
];

function weightLabel(weightGram: number): string {
  return weightGram >= 1000 ? `${weightGram / 1000} kg` : `${weightGram} g`;
}

/**
 * Gerçek fiyat hesaplaması — `docs/CATALOG_PRICE_UPDATE_MATCHING_REPORT.md`'teki
 * kuralla birebir aynı: `pricePerKg` doluysa varyant fiyatı `pricePerKg × gramaj/1000`
 * ile ORANTILI hesaplanır (500 g/1 kg gibi farklı varyantlarda farklı fiyat çıkar);
 * `pricePerUnit` doluysa TÜM varyantlara bu sabit paket/adet fiyatı DOĞRUDAN
 * uygulanır — kg dönüşümü YAPILMAZ.
 */
function computeVariantPrice(entry: SeedProductEntry, weightGram: number): string {
  if (entry.pricePerUnit !== undefined) {
    return entry.pricePerUnit.toFixed(2);
  }
  const price = (entry.pricePerKg! * weightGram) / 1000;
  return price.toFixed(2);
}

// quantityAvailable hâlâ deterministik DEMO veridir — aynı index her zaman aynı
// sonucu verir, seed script'i güvenle tekrar tekrar çalıştırılabilir. quantityReserved
// artık gerçek StockReservation kayıtları tarafından yönetiliyor; seed sırasında henüz
// hiçbir sipariş/rezervasyon yok, bu yüzden 0 dışında bir değer sahte kıtlık üretir.

function computeStock(index: number): SeedStock {
  return {
    quantityAvailable: 30 + (index % 8) * 10,
    quantityReserved: 0,
    lowStockThreshold: index % 3 === 0 ? 15 : 10,
  };
}

function buildShortDescription(name: string): string {
  return `${name}, OSSA Kuruyemiş güvencesiyle özenle hazırlanır.`;
}

/** Faz 4B'nin eski tek-cümlelik şablon açıklaması — artık üretim için değil, DB'deki hiç düzenlenmemiş placeholder'ları güvenle tespit etmek için kullanılır. */
function buildLegacyPlaceholderDescription(name: string, categoryName: string): string {
  return `${name}, OSSA Kuruyemiş'in ${categoryName} kategorisinde özenle seçilip müşterilerimize taze şekilde sunulur.`;
}

// Tüm kategoriler için doğrulanmış, tek kaynak saklama koşulu metni — ürün
// türüne göre farklılaştırmayı gerektirecek gerçek bir veri olmadığından
// (nem/sıcaklık/koku hassasiyeti tüm kuruyemiş/kuru meyve/lokum/baharat/çay-kahve
// çeşitleri için genel geçer) tek metin kullanılır.
const STORAGE_CONDITIONS_TEXT =
  "Ürünü serin, kuru ve doğrudan güneş ışığı almayan bir ortamda muhafaza ediniz. Nem ve yüksek sıcaklık ürünün dokusunu ve tazeliğini olumsuz etkileyebilir. Ambalaj açıldıktan sonra ağzını sıkıca kapatarak veya ürünü hava almayan kapaklı bir saklama kabına aktararak muhafaza etmeniz önerilir. Yoğun kokulu gıdalarla aynı ortamda saklamamaya dikkat ediniz.";

/**
 * Yalnızca sayfaya özgü kısmı döner — kök `metadata.title.template` (`src/app/layout.tsx`)
 * zaten " | OSSA Kuruyemiş" ekler; burada marka eklenirse başlık iki kez tekrarlanır.
 */
function buildMetaTitle(name: string): string {
  return name;
}

function buildMetaDescription(name: string): string {
  return `${name} ürününü OSSA Kuruyemiş'te inceleyin. Taze, güvenilir alışveriş ve hızlı kargo.`;
}

function buildSeedProduct(
  entry: SeedProductEntry,
  plan: CategoryContentPlan,
  indexInCategory: number,
): SeedProduct {
  const name = entry.name;
  const slug = slugify(name);
  const id = `prod-${slug}`;

  const variants: SeedVariant[] = plan.weightsGram.map((weightGram, variantIndex) => ({
    id: `var-${slug}-${weightGram}g`,
    sku: `OSSA-${slug.toUpperCase()}-${weightGram}`,
    name: weightLabel(weightGram),
    weightGram,
    price: computeVariantPrice(entry, weightGram),
    sortOrder: variantIndex + 1,
    stock: computeStock(indexInCategory + variantIndex),
  }));

  return {
    id,
    slug,
    name,
    shortDescription: buildShortDescription(name),
    description: generateProductDescription(name, plan.slug),
    legacyDescription: buildLegacyPlaceholderDescription(name, plan.name),
    // Gerçek reçete/bileşen verisi olmadığından hayali içerik üretilmez —
    // görevin belirttiği güvenli yedek: ürünün kendi adı.
    ingredients: name,
    storageConditions: STORAGE_CONDITIONS_TEXT,
    categoryId: plan.id,
    sortOrder: indexInCategory + 1,
    isFeatured: indexInCategory === 0,
    // Gerçek ürün fotoğrafı varsa (bkz. `REAL_PRODUCT_IMAGE_MAP`) SVG
    // placeholder yerine onun ilk (primary) görseli kullanılır.
    imageUrl: REAL_PRODUCT_IMAGE_MAP[slug]?.[0]?.url ?? `/images/products/${slug}.svg`,
    variants,
  };
}

export const products: SeedProduct[] = CATEGORY_PLANS.flatMap((plan) =>
  plan.products.map((entry, index) => buildSeedProduct(entry, plan, index)),
);

/**
 * Kategori düzeltmesi (iş kararı) — Çubuk tarçın/Zerdeçal/Zencefil GERÇEKTEN
 * Baharat kategorisine ait (kullanıcı talebi), ama gerçek fiyatları/varyant
 * gramajı (250g, cay-kahve fiyat listesindeki `pricePerKg`) DEĞİŞMEMELİ —
 * bu yüzden `CATEGORY_PLANS`'teki `cat-cay-kahve` bloğu (fiyat/varyant kaynağı)
 * BİLEREK değiştirilmedi; yalnızca üretilen `SeedProduct`'ın `categoryId`'si
 * burada hedef kategoriye override edilir. `sortOrder`, Baharat'ın kendi
 * ürün listesinin SONUNA eklenecek şekilde yeniden hesaplanır (eski
 * cay-kahve konumundan miras kalan, yanıltıcı bir sıra numarası KULLANILMAZ).
 */
const CATEGORY_OVERRIDES: Record<string, string> = {
  "cubuk-tarcin": "cat-baharat",
  zerdecal: "cat-baharat",
  zencefil: "cat-baharat",
};
const baharatPlan = CATEGORY_PLANS.find((plan) => plan.id === "cat-baharat");
if (!baharatPlan) {
  throw new Error("cat-baharat CATEGORY_PLANS içinde bulunamadı — kategori override'ı uygulanamıyor.");
}
let categoryOverrideCount = 0;
for (const product of products) {
  const overrideCategoryId = CATEGORY_OVERRIDES[product.slug];
  if (overrideCategoryId) {
    product.categoryId = overrideCategoryId;
    categoryOverrideCount += 1;
    product.sortOrder = baharatPlan.products.length + categoryOverrideCount;
  }
}

// Üretilen ~136 ürün arasında yanlışlıkla aynı slug'ın oluşmadığını garanti eder
// (aynı isim iki kategoriye yazılmış olsaydı `Product.slug` unique kısıtı upsert
// sırasında sessizce üzerine yazardı — bunun yerine erken ve net hata verir).
const seenProductSlugs = new Set<string>();
for (const product of products) {
  if (seenProductSlugs.has(product.slug)) {
    throw new Error(`Seed verisinde tekrarlanan ürün slug'ı bulundu: ${product.slug}`);
  }
  seenProductSlugs.add(product.slug);
}
for (const product of NEW_REAL_PHOTO_PRODUCTS) {
  if (seenProductSlugs.has(product.slug)) {
    throw new Error(`NEW_REAL_PHOTO_PRODUCTS slug'ı mevcut katalogla çakışıyor: ${product.slug}`);
  }
  seenProductSlugs.add(product.slug);
}

/**
 * `db:seed`/`prisma migrate`'in seed hook'u BUNU çağırır (bkz. aşağıdaki
 * doğrudan-çalıştırma koruması). Testler bu fonksiyonu ve yukarıdaki saf veri
 * dizilerini (`categories`/`products`/`CATEGORY_PLANS`) YAN ETKİSİZ olarak
 * import edebilir — modül import edildiğinde `main()` KENDİLİĞİNDEN çalışmaz,
 * yalnızca bu dosya doğrudan çalıştırıldığında (aşağıdaki blok) tetiklenir.
 */
export async function main() {
  const { Prisma, RoleKey, ProductStatus, BlogPostStatus } = await import("@/generated/prisma/client");
  const { prisma } = await import("@/server/db/prisma");

  try {
    await prisma.role.upsert({
      where: { key: RoleKey.CUSTOMER },
      update: { name: "Müşteri" },
      create: { key: RoleKey.CUSTOMER, name: "Müşteri" },
    });
    await prisma.role.upsert({
      where: { key: RoleKey.STAFF },
      update: { name: "Personel" },
      create: { key: RoleKey.STAFF, name: "Personel" },
    });
    await prisma.role.upsert({
      where: { key: RoleKey.ADMIN },
      update: { name: "Yönetici" },
      create: { key: RoleKey.ADMIN, name: "Yönetici" },
    });

    await prisma.siteSetting.upsert({
      where: { key: "store.name" },
      update: { value: "OSSA Kuruyemiş" },
      create: { key: "store.name", value: "OSSA Kuruyemiş" },
    });
    await prisma.siteSetting.upsert({
      where: { key: "store.currency" },
      update: { value: "TRY" },
      create: { key: "store.currency", value: "TRY" },
    });
    await prisma.siteSetting.upsert({
      where: { key: "shipping.freeThreshold" },
      update: { value: Prisma.JsonNull },
      create: { key: "shipping.freeThreshold", value: Prisma.JsonNull },
    });
    await prisma.siteSetting.upsert({
      where: { key: "shipping.basePrice" },
      update: { value: Prisma.JsonNull },
      create: { key: "shipping.basePrice", value: Prisma.JsonNull },
    });

    // Önceki fazların demo/geçici kataloğunun kalıntılarını temizle (varsa).
    // İkinci ve sonraki çalıştırmalarda bu slug'lar zaten bulunamayacağı için no-op'tur.
    await prisma.product.deleteMany({ where: { slug: { in: LEGACY_DEMO_PRODUCT_SLUGS } } });
    await prisma.category.deleteMany({ where: { slug: { in: LEGACY_DEMO_CATEGORY_SLUGS } } });

    for (const category of categories) {
      const svgPlaceholderUrl = category.imageUrl ?? null;
      const realImage = REAL_CATEGORY_IMAGE_MAP[category.slug];
      const existingCategory = await prisma.category.findUnique({
        where: { slug: category.slug },
        select: { imageUrl: true, imageAlt: true },
      });
      // Yalnızca DB'deki mevcut görsel HÂLÂ eski SVG placeholder'a eşitse
      // (admin `/yonetim/kategoriler`'den gerçek bir görsel yüklemediyse)
      // gerçek fotoğrafla değiştirilir — admin'in manuel yüklediği görsel
      // asla ezilmez (bkz. ProductImage'daki AYNI idempotency deseni).
      const imageIsSafeToUpdate = !existingCategory || existingCategory.imageUrl === svgPlaceholderUrl;

      await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          description: category.description,
          sortOrder: category.sortOrder,
          isActive: true,
          ...(imageIsSafeToUpdate
            ? { imageUrl: realImage?.url ?? svgPlaceholderUrl, imageAlt: realImage?.altText ?? null }
            : {}),
        },
        create: {
          id: category.id,
          slug: category.slug,
          name: category.name,
          description: category.description,
          sortOrder: category.sortOrder,
          imageUrl: realImage?.url ?? svgPlaceholderUrl,
          imageAlt: realImage?.altText ?? null,
          isActive: true,
        },
      });
    }

    // Mevcut ürünlerin açıklama/içerik alanlarını TEK sorguda çekip, aşağıdaki
    // upsert döngüsünde gerçek admin düzenlemelerini asla ezmeyecek şekilde
    // koşullu güncelleme yapılmasını sağlar (bkz. güvenli backfill mantığı).
    const existingProductRows = await prisma.product.findMany({
      where: { slug: { in: products.map((product) => product.slug) } },
      select: {
        slug: true,
        description: true,
        shortDescription: true,
        ingredients: true,
        storageConditions: true,
        usageSuggestion: true,
        allergenInfo: true,
        nutritionConfidence: true,
      },
    });
    const existingProductBySlug = new Map(existingProductRows.map((row) => [row.slug, row] as const));

    for (const product of products) {
      const existing = existingProductBySlug.get(product.slug);
      const info = PRODUCT_INFORMATION[product.slug];
      // Yalnızca DB'de hâlâ boş VEYA eski/hiç düzenlenmemiş şablon değeriyle
      // birebir eşleşen alanlar güncellenir — gerçek bir admin düzenlemesi
      // (seed'in ürettiğinden farklı herhangi bir değer) asla ezilmez. Bu
      // sayede `db:seed` hem şu anki placeholder verinin tek seferlik
      // backfill'ini yapar hem de bundan sonra sonsuza dek güvenle tekrar
      // çalıştırılabilir. `descriptionSafe`/`storageConditionsSafe` hem eski
      // tek-cümlelik `legacyDescription`'a HEM DE mevcut (bu görevden önceki)
      // şablon-üretilmiş `product.description`/`product.storageConditions`
      // değerine karşı kontrol eder — böylece araştırma metni ilk çalıştırmada
      // eski şablonun üzerine güvenle yazılır, ama bir kez yazıldıktan sonra
      // (veya admin elle değiştirirse) bir daha ASLA ezilmez.
      const shortDescriptionSafe = !existing || existing.shortDescription === null || existing.shortDescription === buildShortDescription(product.name);
      const descriptionSafe =
        !existing ||
        existing.description === null ||
        existing.description === product.legacyDescription ||
        existing.description === product.description;
      // KÖK NEDEN DÜZELTMESİ: `ingredients` TÜM ürünlerde `product.name` ile
      // (asla boş) dolu olduğundan eski `!existing.ingredients` koşulu HİÇBİR
      // ZAMAN true dönmüyordu — placeholder bileşim hiç güncellenmiyordu. Artık
      // "hâlâ placeholder'a (ürün adına) eşitse" de güvenli sayılır.
      const ingredientsSafe = !existing || !existing.ingredients || existing.ingredients === product.name;
      const storageConditionsSafe =
        !existing || !existing.storageConditions || existing.storageConditions === product.storageConditions;
      const usageSuggestionSafe = !existing || existing.usageSuggestion === null;
      const allergenInfoSafe = !existing || existing.allergenInfo === null;
      // Besin değerleri + kaynak alanları TEK blok olarak yazılır/atlanır —
      // yarım (ör. enerji dolu ama kaynak boş) bir durum asla oluşmaz.
      const nutritionSafe = !existing || existing.nutritionConfidence === null;

      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          name: product.name,
          sortOrder: product.sortOrder,
          isFeatured: product.isFeatured ?? false,
          metaTitle: buildMetaTitle(product.name),
          metaDescription: buildMetaDescription(product.name),
          status: ProductStatus.ACTIVE,
          ...(shortDescriptionSafe ? { shortDescription: product.shortDescription } : {}),
          ...(descriptionSafe ? { description: info?.description ?? product.description } : {}),
          ...(ingredientsSafe ? { ingredients: info?.ingredients ?? null } : {}),
          ...(storageConditionsSafe ? { storageConditions: info?.storageConditions ?? product.storageConditions } : {}),
          ...(usageSuggestionSafe ? { usageSuggestion: info?.usageSuggestion ?? null } : {}),
          ...(allergenInfoSafe ? { allergenInfo: info?.allergenInfo ?? null } : {}),
          ...(nutritionSafe
            ? {
                nutritionEnergyKcal: info?.nutrition?.energyKcal ?? null,
                nutritionEnergyKj: info?.nutrition?.energyKj ?? null,
                nutritionFat: info?.nutrition?.fat ?? null,
                nutritionSaturatedFat: info?.nutrition?.saturatedFat ?? null,
                nutritionCarbohydrate: info?.nutrition?.carbohydrate ?? null,
                nutritionSugars: info?.nutrition?.sugars ?? null,
                nutritionFiber: info?.nutrition?.fiber ?? null,
                nutritionProtein: info?.nutrition?.protein ?? null,
                nutritionSalt: info?.nutrition?.salt ?? null,
                nutritionSourceName: info?.nutrition?.sourceName ?? null,
                nutritionSourceUrl: info?.nutrition?.sourceUrl ?? null,
                nutritionSourceProduct: info?.nutrition?.sourceProduct ?? null,
                nutritionReferenceType: info?.nutrition?.referenceType ?? null,
                nutritionConfidence: info?.nutrition?.confidence ?? null,
              }
            : {}),
        },
        create: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          shortDescription: product.shortDescription,
          description: info?.description ?? product.description,
          ingredients: info?.ingredients ?? null,
          storageConditions: info?.storageConditions ?? product.storageConditions,
          usageSuggestion: info?.usageSuggestion ?? null,
          allergenInfo: info?.allergenInfo ?? null,
          nutritionEnergyKcal: info?.nutrition?.energyKcal ?? null,
          nutritionEnergyKj: info?.nutrition?.energyKj ?? null,
          nutritionFat: info?.nutrition?.fat ?? null,
          nutritionSaturatedFat: info?.nutrition?.saturatedFat ?? null,
          nutritionCarbohydrate: info?.nutrition?.carbohydrate ?? null,
          nutritionSugars: info?.nutrition?.sugars ?? null,
          nutritionFiber: info?.nutrition?.fiber ?? null,
          nutritionProtein: info?.nutrition?.protein ?? null,
          nutritionSalt: info?.nutrition?.salt ?? null,
          nutritionSourceName: info?.nutrition?.sourceName ?? null,
          nutritionSourceUrl: info?.nutrition?.sourceUrl ?? null,
          nutritionSourceProduct: info?.nutrition?.sourceProduct ?? null,
          nutritionReferenceType: info?.nutrition?.referenceType ?? null,
          nutritionConfidence: info?.nutrition?.confidence ?? null,
          sortOrder: product.sortOrder,
          isFeatured: product.isFeatured ?? false,
          metaTitle: buildMetaTitle(product.name),
          metaDescription: buildMetaDescription(product.name),
          status: ProductStatus.ACTIVE,
        },
      });

      // Bu ürünün seed-yönetimli görseli/görselleri — gerçek fotoğrafı varsa
      // `REAL_PRODUCT_IMAGE_MAP`'teki TÜMÜ (primary + varsa gallery), yoksa tek
      // SVG placeholder. `update` bloğunda BİLEREK yalnızca `url`/`altText` var —
      // `isPrimary`/`sortOrder` YOK: admin bu görseli sonradan ikincil yapar veya
      // sırasını değiştirirse bir sonraki `db:seed` bunu EZMEZ (yalnızca ilk
      // oluşturmada, `create` dalında primary/sıra atanır).
      const realImages = REAL_PRODUCT_IMAGE_MAP[product.slug];
      const seedImages = realImages ?? [{ url: product.imageUrl, altText: product.name }];
      for (const [index, image] of seedImages.entries()) {
        const imageId = index === 0 ? `img-${product.id}` : `img-${product.id}-${index + 1}`;
        await prisma.productImage.upsert({
          where: { id: imageId },
          update: { url: image.url, altText: image.altText },
          create: {
            id: imageId,
            productId: product.id,
            url: image.url,
            altText: image.altText,
            isPrimary: index === 0,
            sortOrder: index,
          },
        });
      }

      // `ProductCategory.productId` şemada `@unique` (ürün başına tek kategori) —
      // bu yüzden `productId` üzerinden upsert edilir: kategori değişirse (ör.
      // Baharat override'ı) AYNI satırın `categoryId`'si güncellenir. Eski kompozit
      // `productId_categoryId` anahtarıyla upsert, categoryId değiştiğinde eski
      // satırı bulamayıp `create`'e düşer ve `productId` unique kısıtına çarpardı.
      await prisma.productCategory.upsert({
        where: { productId: product.id },
        update: { categoryId: product.categoryId, sortOrder: product.sortOrder },
        create: {
          productId: product.id,
          categoryId: product.categoryId,
          sortOrder: product.sortOrder,
        },
      });

      for (const variant of product.variants) {
        await prisma.productVariant.upsert({
          where: { sku: variant.sku },
          update: {
            name: variant.name,
            weightGram: variant.weightGram,
            price: variant.price,
            sortOrder: variant.sortOrder,
            isActive: true,
          },
          create: {
            id: variant.id,
            productId: product.id,
            sku: variant.sku,
            name: variant.name,
            weightGram: variant.weightGram,
            price: variant.price,
            sortOrder: variant.sortOrder,
            isActive: true,
          },
        });

        await prisma.inventory.upsert({
          where: { variantId: variant.id },
          update: {
            quantityAvailable: variant.stock.quantityAvailable,
            quantityReserved: variant.stock.quantityReserved,
            lowStockThreshold: variant.stock.lowStockThreshold,
          },
          create: {
            variantId: variant.id,
            quantityAvailable: variant.stock.quantityAvailable,
            quantityReserved: variant.stock.quantityReserved,
            lowStockThreshold: variant.stock.lowStockThreshold,
          },
        });
      }
    }

    // Gerçek fotoğrafı olan ama gerçek fiyatı BİLİNMEYEN yeni ürünler — her
    // zaman DRAFT + varyantsız (bkz. `seed-real-photo-products.ts` başlık
    // yorumu: sahte/kopya fiyat üretilmez). Aynı idempotent upsert deseni;
    // `update`'te de status bilerek DRAFT'ta sabit tutulur — admin bu ürüne
    // gerçek fiyat/varyant girip elle ACTIVE'e çektiyse bunu EZMEMEK için
    // status alanı yalnızca `create` dalında yazılır.
    for (const product of NEW_REAL_PHOTO_PRODUCTS) {
      const existing = await prisma.product.findUnique({ where: { slug: product.slug }, select: { id: true } });

      await prisma.product.upsert({
        where: { slug: product.slug },
        update: {
          name: product.name,
          sortOrder: product.sortOrder,
          metaTitle: buildMetaTitle(product.name),
          metaDescription: buildMetaDescription(product.name),
          ...(existing
            ? {}
            : {
                shortDescription: buildShortDescription(product.name),
                description: generateProductDescription(product.name, product.categoryId.replace("cat-", "")),
                ingredients: product.name,
                storageConditions: STORAGE_CONDITIONS_TEXT,
              }),
        },
        create: {
          id: product.id,
          slug: product.slug,
          name: product.name,
          shortDescription: buildShortDescription(product.name),
          description: generateProductDescription(product.name, product.categoryId.replace("cat-", "")),
          ingredients: product.name,
          storageConditions: STORAGE_CONDITIONS_TEXT,
          sortOrder: product.sortOrder,
          isFeatured: false,
          metaTitle: buildMetaTitle(product.name),
          metaDescription: buildMetaDescription(product.name),
          status: ProductStatus.DRAFT,
        },
      });

      await prisma.productImage.upsert({
        where: { id: `img-${product.id}` },
        update: { url: product.imageUrl, altText: product.altText },
        create: {
          id: `img-${product.id}`,
          productId: product.id,
          url: product.imageUrl,
          altText: product.altText,
          isPrimary: true,
          sortOrder: 0,
        },
      });

      // `update: {}` DEĞİL: kategori düzeltmesi (ör. Zencefil Kökü/Zerdeçal Kökü
      // → Baharat) seed verisinde değiştiğinde var olan satıya da yansımalı,
      // yoksa `db:seed` tekrar çalıştırıldığında eski kategori kalıcı olur.
      await prisma.productCategory.upsert({
        where: { productId: product.id },
        update: { categoryId: product.categoryId },
        create: { productId: product.id, categoryId: product.categoryId, sortOrder: 0 },
      });
    }

    // Blog yazıları — idempotent: slug zaten varsa (gerçek admin düzenlemesi
    // olabilir) DOKUNULMAZ, yalnızca hiç yoksa oluşturulur. `authorId` ortamdan
    // bağımsız şekilde ilk ADMIN kullanıcıdan çözülür (hardcode edilmiş bir
    // kullanıcı ID'si YOK); ortamda hiç admin yoksa blog seed'i uyarıyla
    // atlanır, seed'in geri kalanı başarısız OLMAZ.
    const productIdByName = new Map(products.map((product) => [product.name, product.id]));
    const admin = await prisma.user.findFirst({ where: { role: { key: RoleKey.ADMIN } } });
    let createdBlogPostCount = 0;

    if (!admin) {
      console.warn(
        "[seed] Blog yazıları atlandı — ortamda ADMIN rolüne sahip bir kullanıcı bulunamadı.",
      );
    } else {
      for (const post of SEED_BLOG_POSTS) {
        const existing = await prisma.blogPost.findUnique({ where: { slug: post.slug }, select: { id: true } });
        if (existing) {
          continue;
        }

        const productIds: string[] = [];
        for (const name of post.productNames) {
          const productId = productIdByName.get(name);
          if (!productId) {
            console.warn(`[seed] Blog "${post.slug}" için ürün bulunamadı, atlandı: "${name}"`);
            continue;
          }
          productIds.push(productId);
        }

        const created = await prisma.blogPost.create({
          data: {
            authorId: admin.id,
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content: post.content,
            coverImageUrl: post.coverImageUrl,
            status: BlogPostStatus.PUBLISHED,
            publishedAt: new Date(),
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
          },
        });

        if (productIds.length > 0) {
          await prisma.blogPostProduct.createMany({
            data: productIds.map((productId, index) => ({ blogPostId: created.id, productId, sortOrder: index })),
          });
        }

        createdBlogPostCount += 1;
      }
    }

    // Ana sayfa bölüm sırası/görünürlüğü — yalnızca EKSİK `key`'leri ekler
    // (`skipDuplicates`), admin'in değiştirdiği mevcut sıra/aktiflik ASLA
    // ezilmez (bkz. `homepage-section-repository.ts`'teki aynı deseni izler).
    await prisma.homepageSection.createMany({
      data: HOMEPAGE_SECTIONS.map((section, index) => ({ key: section.key, sortOrder: index, isActive: true })),
      skipDuplicates: true,
    });

    console.log(
      `Seed tamamlandı: 3 rol, 4 site ayarı, ${categories.length} kategori, ${products.length} ürün, ${NEW_REAL_PHOTO_PRODUCTS.length} yeni (DRAFT) ürün, ${createdBlogPostCount} yeni blog yazısı.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Yalnızca bu dosya DOĞRUDAN çalıştırıldığında (`npm run db:seed` / `tsx prisma/seed.ts`)
// otomatik tetiklenir — bir test dosyası `main`/`products`/`categories`'i import
// ettiğinde bu blok ÇALIŞMAZ (aksi hâlde salt veri okuyan bir testin gerçek DB'ye
// yazması gibi istenmeyen bir yan etki oluşurdu).
const isDirectRun = process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
if (isDirectRun) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
