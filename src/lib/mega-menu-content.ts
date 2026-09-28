/**
 * Header mega menüsünün sol sütunundaki ("Öne Çıkanlar") tıklanabilir grup
 * başlıkları ve alt kısımdaki kategori CTA metinleri tek merkezden yönetilir —
 * component içinde tekrar eden hardcode string üretilmez.
 *
 * `productNames`, aynı zamanda kategori sayfasındaki `?grup=` filtresinin gerçek
 * eşleştirme kaynağıdır (bkz. `src/components/category/category-page-view.tsx` ve
 * `src/server/services/catalog-service.ts`): bir ürün, adı `normalizeProductName`
 * ile normalize edildiğinde bu listedeki adlardan biriyle BİREBİR eşleşirse ilgili
 * gruba dahil edilir (belirsiz "contains" eşleştirmesi kullanılmaz).
 *
 * Listeler, gerçek OSSA katalog verisi (`Product.name`, veritabanından tek tek
 * doğrulandı) esas alınarak elle oluşturuldu. Görev sırasında verilen taslak
 * isimlerden bazıları gerçek veritabanı kayıtlarıyla birebir örtüşmüyordu; bu
 * farklar gerçek DB adına göre düzeltildi (bkz. görev sonu raporu):
 *  - Çerez / Leblebiler: "Sarı leblebi (tuzsuz)" → DB'de "Tuzsuz sarı leblebi"
 *  - Çerez / Kuru Meyveler: "Kuru üzüm çekirdeği" → DB'de "Kuru üzüm"
 *  - Lokum / Cevizli Lokumlar: "Bol cevizli bandırma lokum" → DB'de "...lokumu"
 *  - Lokum / Diğer Geleneksel Tatlılar: "Jöle lokumlar" → DB'de "Jole lokumlar"
 *  - Baharat / Ot Baharatları: "Nane kurusu" → DB'de yalnızca "Nane" var;
 *    "Kekik (Sahter)" adında ayrı bir ürün DB'de yok, eklenmedi.
 *  - Baharat / Tohumlar: "Çörek otu" → DB'de bitişik "Çörekotu"
 *  - Hurma & Kuru Meyve / Hurmalar: "Lüx hurma" → DB'de "Lüks hurma";
 *    "Paket hurma 2" adında ikinci bir ürün DB'de yok, eklenmedi.
 *  - Hurma & Kuru Meyve / Geleneksel Tatlılar: "Pestil tatlısı" → DB'de "Pestil"
 *  - Kurabiye & Şekerleme / Geleneksel Tatlılar: DB'de kategoriye ait "Pestil"
 *    (veya "Pestil tatlısı") adında bir ürün yok — grup hiç eklenmedi.
 *
 * Önceden hiçbir gruba karşılık gelmeyen (uydurma bir gruba zorlanmadan
 * atanmadan bırakılan), sonradan iş kararıyla netleştirilen ürünler:
 *  - "Elvan Iceberg" → Kurabiye & Şekerleme / Çikolatalar
 *  - "Toz kekik" → Baharat / Ot Baharatları
 *
 * Sonraki bir iş kararıyla: "Soslu mısır", "Patlatmalık mısır", "Yağlı mısır"
 * Çerez / Çekirdekler'den çıkarılıp kendi Çerez / Mısır grubuna taşındı —
 * bu üç ürün çekirdek değil, mısır bazlı çerezler.
 *
 * Navigasyon sadeleştirme kararı (kategori mimarisi görevi):
 *  - Kurabiye & Şekerleme / "Atıştırmalıklar" grubu kaldırıldı; içindeki
 *    5 ürün ("Gofret", "Finger", "Kıbrıs gevreği", "Haşhaşlı Bal Patlak")
 *    Kurabiyeler'e, "Konak Mandule" Şekerler'e taşındı — ürünler kaybolmadı.
 *  - Çay & Kahve / "Baharat ve Aroma" grubu kaldırıldı ve kalıcı olarak
 *    kaldırılmış durumda kalacak. "Çubuk tarçın", "Zerdeçal", "Zencefil"
 *    (ve DRAFT kök ürünleri "Zencefil Kökü", "Zerdeçal Kökü") kullanıcı
 *    talebiyle GERÇEK DB kategorisi olarak da `cay-kahve`'den `baharat`'a
 *    taşındı (bkz. `prisma/seed.ts` — `CATEGORY_OVERRIDES`,
 *    `prisma/seed-real-photo-products.ts`). Bu 5 ürün artık Çay & Kahve'de
 *    hiçbir grup/listede görünmez; Baharat / "Aromatik Baharatlar" grubuna
 *    eklendi (Toz tarçın/Karanfil ile aynı ısıtıcı-aromatik baharat ailesi).
 *  - "Atom çay çeşitleri" Bitki Çayları'ndan çıkarıldı (herhangi bir gruba
 *    taşınmadı) — ürün DB'de/kategori sayfasının genel grid'inde duruyor,
 *    yalnızca mega-menu/`?grup=` filtresinden kaldırıldı.
 *  - Katalog temizliği (26 ürün kaldırıldı — bkz. görev sonu raporu): Kurabiye
 *    & Şekerleme / "Çikolatalar" (9/9 üye) ve "Kadayıf Ürünleri" (3/3 üye)
 *    grupları TAMAMEN boşaldığı için kaldırıldı. "Şekerler" grubundan Ülker
 *    Toffe/Kent şekerleri/Konak Mandule/Yummy Şeker; Lokum'un "Sade ve Klasik
 *    Lokumlar" grubundan Saray lokum/Ay lokumları/Ay lokum paket; "Fındıklı
 *    Lokumlar"dan Fındıklı mini lokum/OSSA Fındıklı Lokum; "Cevizli
 *    Lokumlar"dan Cevizli lokum/Bol cevizli bandırma lokumu; "Lokumlu
 *    Atıştırmalıklar"dan Büyük lokumlu bisküvi; Hurma & Kuru Meyve /
 *    "Hurmalar"dan Paket hurma çıkarıldı — kalan üyelerle gruplar boş
 *    kalmadığından listede tutuldu. "Fındıklı Mini Cezerye" hiçbir mega-menu
 *    grubuna üye değildi (genel grid'de duruyordu), kaldırılacak liste
 *    değişikliği gerektirmedi.
 *  - "Jole lokumlar" kaldırıldı (hiçbir geçmiş sipariş/inceleme/kampanya
 *    ilişkisi yoktu, güvenle hard-delete edildi — bkz. görev sonu raporu).
 *    Lokum / "Diğer Geleneksel Tatlılar" grubundan çıkarıldı; grup kalan
 *    üyelerle (Pişmaniye, Antep mini cezerye, Fitilli lokum, Küp Cezerye,
 *    Yaprak Cezerye) boş kalmadığından listede tutuldu.
 */

/** Türkçe karaktere duyarlı, büyük/küçük harf ve boşluk farklarını yok sayan karşılaştırma anahtarı üretir. */
export function normalizeProductName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");
}

export interface MegaMenuGroupImage {
  url: string;
  altText: string;
}

/**
 * Grubun mega-menu/anasayfa kartlarında gösterilecek TEK küratörlü temsilci
 * görseli — grubun GERÇEKTEN içindeki (yukarıdaki `productNames`'ten), gerçek
 * fotoğrafı olan bir ürün elle seçilerek atanır. Grupta gerçek fotoğraflı hiç
 * ürün yoksa `image` alanı hiç YOK — bu durumda tüketiciler mevcut fallback'e
 * (ör. `ProductImage`'ın ikon placeholder'ı) düşer, uydurma/rastgele bir görsel
 * ATANMAZ.
 */
export interface MegaMenuGroup {
  label: string;
  groupSlug: string;
  productNames: string[];
  image?: MegaMenuGroupImage;
}

export interface MegaMenuCategoryContent {
  groups: MegaMenuGroup[];
  ctaLabel: string;
}

const MEGA_MENU_CONTENT: Record<string, MegaMenuCategoryContent> = {
  cerez: {
    ctaLabel: "Tüm Çerezleri Gör",
    groups: [
      {
        label: "Çekirdekler",
        groupSlug: "cekirdekler",
        image: { url: "/images/products/kabak-cekirdegi.webp", altText: "OSSA Kabak çekirdeği" },
        productNames: [
          "Kabak çekirdeği",
          "Dakota çekirdek",
          "Salamura kabak",
          "Çiğ kabak",
          "Siyah Çekirdek",
          "Tuzsuz Siyah Çekirdek",
        ],
      },
      {
        label: "Mısır",
        groupSlug: "misir",
        image: { url: "/images/products/soslu-misir.webp", altText: "OSSA Soslu mısır" },
        productNames: ["Soslu mısır", "Patlatmalık mısır", "Yağlı mısır", "Mısırlı Cips"],
      },
      {
        label: "Leblebiler",
        groupSlug: "leblebiler",
        image: { url: "/images/products/beyaz-leblebi.webp", altText: "OSSA Beyaz leblebi" },
        productNames: [
          "Sarı leblebi",
          "Tuzsuz sarı leblebi",
          "Beyaz leblebi",
          "Çıtır leblebi",
          "Şekerli leblebi",
          "Köy leblebisi",
          "Ballı Susamlı Leblebi",
        ],
      },
      {
        label: "Fıstık Çeşitleri",
        groupSlug: "fistik-cesitleri",
        image: { url: "/images/products/fistik-ici.webp", altText: "OSSA Fıstık içi" },
        productNames: [
          "Fıstık içi",
          "Fırt fıstık",
          "Pastalık fıstık",
          "Çiğ fırt fıstık",
          "Soslu fıstık",
        ],
      },
      {
        label: "Kaju, Badem ve Fındık",
        groupSlug: "kaju-badem-findik",
        image: { url: "/images/products/cig-kaju.webp", altText: "OSSA Çiğ kaju" },
        productNames: [
          "Çiğ kaju",
          "Zar kabuklu kaju",
          "Çiğ badem",
          "Çiğ fındık içi",
          "Giresun Fındığı",
          "Kabuklu El Bademi",
        ],
      },
      {
        label: "Cevizler",
        groupSlug: "cevizler",
        image: { url: "/images/products/ceviz-ici.webp", altText: "OSSA Ceviz içi" },
        productNames: ["Ceviz içi", "Kabuklu ceviz"],
      },
      {
        label: "Kuru Meyveler",
        groupSlug: "kuru-meyveler",
        image: { url: "/images/products/siyah-uzum.webp", altText: "OSSA Siyah üzüm" },
        productNames: ["Siyah üzüm", "Özbek üzümü", "Kuş üzümü", "Kuru üzüm", "Çekirdeksiz Sarı Üzüm"],
      },
      {
        label: "Geleneksel Atıştırmalıklar",
        groupSlug: "geleneksel-atistirmaliklar",
        image: { url: "/images/products/kavurga.webp", altText: "OSSA Kavurga" },
        productNames: ["Buğday", "Kavurga", "Menengiç"],
      },
    ],
  },
  lokum: {
    ctaLabel: "Tüm Lokumları Gör",
    groups: [
      {
        label: "Sade ve Klasik Lokumlar",
        groupSlug: "sade-klasik-lokumlar",
        image: { url: "/images/products/sade-lokum.webp", altText: "OSSA Sade lokum" },
        productNames: [
          "Sade lokum",
          "Güllü lokum",
          "Mini güllü lokum",
          "Meyveli kuş lokum",
          "Sütlü Mini Lokum",
          "Baklava Lokum",
        ],
      },
      {
        label: "Fındıklı Lokumlar",
        groupSlug: "findikli-lokumlar",
        image: { url: "/images/products/findikli-lokum.webp", altText: "OSSA Fındıklı lokum" },
        productNames: ["Fındıklı lokum", "Fındıklı yaprak lokum", "Fındıklı mini cevizli lokum"],
      },
      {
        label: "Antep Fıstıklı Lokumlar",
        groupSlug: "antep-fistikli-lokumlar",
        image: { url: "/images/products/ossa-antep-fistikli-lokum.webp", altText: "OSSA Antep Fıstıklı Lokum" },
        productNames: ["OSSA Antep Fıstıklı Lokum"],
      },
      {
        label: "Hindistan Cevizli Lokumlar",
        groupSlug: "hindistan-cevizli-lokumlar",
        image: { url: "/images/products/hindistan-cevizli-lokum.webp", altText: "OSSA Hindistan cevizli lokum" },
        productNames: ["Hindistan cevizli lokum", "Hindistan cevizli bandırma"],
      },
      {
        label: "Cevizli Lokumlar",
        groupSlug: "cevizli-lokumlar",
        image: { url: "/images/products/narli-cevizli-sucuk.webp", altText: "OSSA Narlı cevizli sucuk" },
        productNames: ["Cevizli bandırma lokumu", "Narlı cevizli sucuk", "Cevizli Sucuk"],
      },
      {
        label: "Susamlı Lokumlar",
        groupSlug: "susamli-lokumlar",
        image: { url: "/images/products/susamli-lokum.webp", altText: "OSSA Susamlı lokum" },
        productNames: ["Ballı susamlı lokum", "Susamlı lokum"],
      },
      {
        label: "Lokumlu Atıştırmalıklar",
        groupSlug: "lokumlu-atistirmaliklar",
        image: { url: "/images/products/lokumlu-biskuvi.webp", altText: "OSSA Lokumlu bisküvi" },
        productNames: ["Lokumlu bisküvi"],
      },
      {
        label: "Diğer Geleneksel Tatlılar",
        groupSlug: "diger-geleneksel-tatlilar",
        image: { url: "/images/products/fitilli-lokum.webp", altText: "OSSA Fitilli lokum" },
        productNames: [
          "Pişmaniye",
          "Antep mini cezerye",
          "Fitilli lokum",
          "Küp Cezerye",
          "Yaprak Cezerye",
        ],
      },
    ],
  },
  "kurabiye-sekerleme": {
    ctaLabel: "Tüm Kurabiye ve Şekerlemeleri Gör",
    groups: [
      {
        label: "Kurabiyeler",
        groupSlug: "kurabiyeler",
        image: { url: "/images/products/kurabiye.webp", altText: "OSSA Kurabiye" },
        productNames: [
          "Kurabiye",
          "Bardak kurabiye",
          "Ballı susamlı kurabiye",
          "Haşhaşlı ballı kurabiye",
          "Gofret",
          "Finger",
          "Kıbrıs gevreği",
          "Haşhaşlı Bal Patlak",
        ],
      },
      {
        label: "Şekerler",
        groupSlug: "sekerler",
        image: { url: "/images/products/jelibon.webp", altText: "OSSA Jelibon" },
        productNames: [
          "Bonibon",
          "Jelibon",
          "Çakıl taşı",
          "Elma Dilimi Jelibon",
          "Kalpli Jelibon",
          "Orman Meyveli Jelibon",
          "Leblebili Bonibon",
          "Oval Bonibon",
          "Renkli Bonibon",
        ],
      },
      {
        label: "Drajeler",
        groupSlug: "drajeler",
        image: { url: "/images/products/karisik-draje.webp", altText: "OSSA Karışık draje" },
        productNames: ["Karışık draje", "Fındıklı draje"],
      },
      {
        label: "Badem Şekerleri",
        groupSlug: "badem-sekerleri",
        image: { url: "/images/products/badem-sekeri.webp", altText: "OSSA Badem şekeri" },
        productNames: ["Badem şekeri", "Lüx badem şekeri", "Renkli Badem Şekeri"],
      },
      {
        label: "Helva ve Ezmeler",
        groupSlug: "helva-ezmeler",
        image: { url: "/images/products/fistik-ezmesi.webp", altText: "OSSA Fıstık ezmesi" },
        productNames: ["Fıstık ezmesi", "Çekilmiş tahin"],
      },
    ],
  },
  "cay-kahve": {
    ctaLabel: "Tüm Çay ve Kahveleri Gör",
    groups: [
      {
        label: "Bitki Çayları",
        groupSlug: "bitki-caylari",
        image: { url: "/images/products/ihlamur.webp", altText: "OSSA Ihlamur" },
        productNames: [
          "Papatya çayı",
          "Ihlamur",
          "Kış çayı",
          "Biberiye çayı",
          "Hibiskus çayı",
          "Rezene",
          "Yeşil çay",
          "Ada Çayı",
        ],
      },
      {
        label: "Kahveler",
        groupSlug: "kahveler",
        image: { url: "/images/products/turk-kahvesi.webp", altText: "OSSA Türk kahvesi" },
        productNames: [
          "Türk kahvesi",
          "Osmanlı dibek kahvesi",
          "OSSA Kahve Çeşnisi",
          "Nescafe 48'li",
        ],
      },
    ],
  },
  baharat: {
    ctaLabel: "Tüm Baharatları Gör",
    groups: [
      {
        label: "Acı Baharatlar",
        groupSlug: "aci-baharatlar",
        image: { url: "/images/products/karabiber.webp", altText: "OSSA Karabiber" },
        productNames: ["Karabiber", "İsot", "Pul biber", "Toz biber", "Acı Pul Biber", "Tatlı Pul Biber"],
      },
      {
        label: "Yemek Baharatları",
        groupSlug: "yemek-baharatlari",
        image: { url: "/images/products/kimyon.webp", altText: "OSSA Kimyon" },
        productNames: ["Kimyon", "Köri", "Yedibahar", "Çemen tozu"],
      },
      {
        label: "Ot Baharatları",
        groupSlug: "ot-baharatlari",
        image: { url: "/images/products/kekik.webp", altText: "OSSA Kekik" },
        productNames: ["Kekik", "Nane", "Toz kekik"],
      },
      {
        label: "Aromatik Baharatlar",
        groupSlug: "aromatik-baharatlar",
        image: { url: "/images/products/karanfil.webp", altText: "OSSA Karanfil" },
        productNames: [
          "Karanfil",
          "Toz tarçın",
          "Hindistan cevizi",
          "Çubuk tarçın",
          "Zerdeçal",
          "Zencefil",
          "Zencefil Kökü",
          "Zerdeçal Kökü",
        ],
      },
      {
        label: "Tohumlar",
        groupSlug: "tohumlar",
        image: { url: "/images/products/susam.webp", altText: "OSSA Susam" },
        productNames: ["Susam", "Çörekotu"],
      },
      {
        label: "Yöresel Ürünler",
        groupSlug: "yoresel-urunler",
        image: { url: "/images/products/yayla-sumagi.webp", altText: "OSSA Yayla sumağı" },
        productNames: ["Yayla sumağı", "Maraş tarhanası"],
      },
      {
        label: "Yardımcı Ürünler",
        groupSlug: "yardimci-urunler",
        image: { url: "/images/products/limon-tuzu.webp", altText: "OSSA Limon tuzu" },
        productNames: ["Limon tuzu"],
      },
    ],
  },
  "hurma-kuru-meyve": {
    ctaLabel: "Tüm Hurma ve Kuru Meyveleri Gör",
    groups: [
      {
        label: "Hurmalar",
        groupSlug: "hurmalar",
        image: { url: "/images/products/luks-hurma.webp", altText: "OSSA Lüks hurma" },
        productNames: [
          "Premium hurma",
          "Jumbo hurma",
          "Bonbon hurma",
          "Yaş hurma",
          "Lüks Suudi hurma",
          "Lüks hurma",
          "M hurma",
        ],
      },
      {
        label: "Kuru Meyveler",
        groupSlug: "kuru-meyveler",
        image: { url: "/images/products/kayisi-kurusu.webp", altText: "OSSA Kayısı kurusu" },
        productNames: ["Kayısı kurusu", "İncir kurusu", "Domates kurusu"],
      },
      {
        label: "Geleneksel Tatlılar",
        groupSlug: "geleneksel-tatlilar",
        image: { url: "/images/products/pestil.webp", altText: "OSSA Pestil" },
        productNames: ["Pestil"],
      },
    ],
  },
};

/** Slug için mega menü içeriğini döner; tanımlı değilse `null`. */
export function getMegaMenuContent(categorySlug: string): MegaMenuCategoryContent | null {
  return MEGA_MENU_CONTENT[categorySlug] ?? null;
}

/** Kategori + grup slug'ı için tekil grup tanımını döner; bulunamazsa `null`. */
export function getMegaMenuGroup(
  categorySlug: string,
  groupSlug: string | undefined,
): MegaMenuGroup | null {
  if (!groupSlug) {
    return null;
  }
  const content = getMegaMenuContent(categorySlug);
  return content?.groups.find((group) => group.groupSlug === groupSlug) ?? null;
}
