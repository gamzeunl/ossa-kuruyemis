/**
 * "Ürünlerin yanlış kategorilere atanması" düzeltmesinin veri doğruluğu testi —
 * `prisma/seed.ts`'in saf veri dizilerini (`categories`/`products`/`CATEGORY_PLANS`)
 * import eder (bu import'un `main()`'i TETİKLEMEDİĞİ, dolayısıyla DB'ye hiç
 * yazmadığı `seed.ts`'teki doğrudan-çalıştırma korumasıyla garanti edilir).
 * Kanonik ürün→kategori eşleşmesi görevde verilen listenin BİREBİR
 * transkripsiyonudur — burada fuzzy/contains/tahmin YOKTUR.
 */
import { describe, expect, it } from "vitest";
import { categories, products, type SeedProduct } from "../../prisma/seed";

const EXPECTED_MAIN_CATEGORY_SLUGS = [
  "cerez",
  "lokum",
  "kurabiye-sekerleme",
  "cay-kahve",
  "baharat",
  "hurma-kuru-meyve",
] as const;

/** Görevin "Doğru kategori eşleştirme kaynağı" listesinin birebir transkripsiyonu. */
const CANONICAL_MAP: Record<string, string> = {};
function assign(categorySlug: string, names: string[]) {
  for (const name of names) {
    CANONICAL_MAP[name] = categorySlug;
  }
}

assign("cerez", [
  "Kabak çekirdeği",
  "Dakota çekirdek",
  "Salamura kabak",
  "Çiğ kabak",
  "Patlatmalık mısır",
  "Yağlı mısır",
  "Soslu mısır",
  "Sarı leblebi",
  "Tuzsuz sarı leblebi",
  "Beyaz leblebi",
  "Çıtır leblebi",
  "Şekerli leblebi",
  "Köy leblebisi",
  "Fıstık içi",
  "Fırt fıstık",
  "Pastalık fıstık",
  "Çiğ fırt fıstık",
  "Soslu fıstık",
  "Çiğ kaju",
  "Zar kabuklu kaju",
  "Çiğ badem",
  "Çiğ fındık içi",
  "Ceviz içi",
  "Kabuklu ceviz",
  "Siyah üzüm",
  "Özbek üzümü",
  "Kuş üzümü",
  "Kuru üzüm",
  "Buğday",
  "Kavurga",
  "Menengiç",
]);

assign("lokum", [
  "Sade lokum",
  "Güllü lokum",
  "Mini güllü lokum",
  "Meyveli kuş lokum",
  "Fındıklı lokum",
  "Fındıklı yaprak lokum",
  "Fındıklı mini cevizli lokum",
  "OSSA Antep Fıstıklı Lokum",
  "Hindistan cevizli lokum",
  "Hindistan cevizli bandırma",
  "Cevizli bandırma lokumu",
  "Narlı cevizli sucuk",
  "Ballı susamlı lokum",
  "Susamlı lokum",
  "Lokumlu bisküvi",
  "Pişmaniye",
  "Antep mini cezerye",
  "Fitilli lokum",
]);

assign("kurabiye-sekerleme", [
  "Kurabiye",
  "Bardak kurabiye",
  "Ballı susamlı kurabiye",
  "Haşhaşlı ballı kurabiye",
  "Bonibon",
  "Jelibon",
  "Çakıl taşı",
  "Karışık draje",
  "Fındıklı draje",
  "Badem şekeri",
  "Lüx badem şekeri",
  "Fıstık ezmesi",
  "Çekilmiş tahin",
  "Gofret",
  "Finger",
  "Kıbrıs gevreği",
]);

assign("cay-kahve", [
  "Papatya çayı",
  "Ihlamur",
  "Kış çayı",
  "Biberiye çayı",
  "Hibiskus çayı",
  "Rezene",
  "Yeşil çay",
  "Türk kahvesi",
  "Osmanlı dibek kahvesi",
  "OSSA Kahve Çeşnisi",
  "Nescafe 48'li",
]);

// Sonraki bir kullanıcı kararıyla (görev sonrası düzeltme): "Çubuk tarçın",
// "Zerdeçal", "Zencefil" görevin orijinal kanonik listesinde `cay-kahve`
// altındaydı, ancak kullanıcı bunların GERÇEKTEN Baharat kategorisinde
// listelenmesini istedi — bu liste artık o düzeltmeyi yansıtır.
assign("baharat", [
  "Çubuk tarçın",
  "Zerdeçal",
  "Zencefil",
  "Karabiber",
  "İsot",
  "Pul biber",
  "Toz biber",
  "Kimyon",
  "Köri",
  "Yedibahar",
  "Çemen tozu",
  "Kekik",
  "Nane",
  "Karanfil",
  "Toz tarçın",
  "Hindistan cevizi",
  "Susam",
  "Çörekotu",
  "Yayla sumağı",
  "Maraş tarhanası",
  "Limon tuzu",
]);

assign("hurma-kuru-meyve", [
  "Premium hurma",
  "Jumbo hurma",
  "Bonbon hurma",
  "Yaş hurma",
  "Lüks Suudi hurma",
  "Lüks hurma",
  "M hurma",
  "Kayısı kurusu",
  "İncir kurusu",
  "Domates kurusu",
  // "Pestil" kasıtlı olarak burada YOK — bkz. aşağıdaki ayrı ambiguity testi.
]);

/**
 * Görevin kendi listesinde "Pestil" hem Kurabiye & Şekerleme hem Hurma & Kuru
 * Meyve altında yer alıyor (çelişki, görevin kendi metninde de mevcut — bkz.
 * "riskli ürünler" bölümü). Zorla tek bir tarafa "düzeltilmez"; mevcut/seed
 * atamasının (hurma-kuru-meyve) KORUNDUĞU, değiştirilmediği doğrulanır.
 */
const AMBIGUOUS_PRODUCT_NAME = "Pestil";
const AMBIGUOUS_PRODUCT_EXPECTED_SLUG = "hurma-kuru-meyve";

/**
 * Kanonik listede YER ALMAYAN, dolayısıyla zorla atanmaması gereken ürünler.
 * NOT: "Elvan Iceberg" burada da yer alıyordu; katalog temizliği görevinde
 * ürünün kendisi tamamen kaldırıldığı için (bkz. o görevin sonu raporu) artık
 * `products` içinde yok — bu listeden de çıkarıldı.
 */
const UNMATCHED_PRODUCT_NAMES = ["Toz kekik"];

function categorySlugById(id: string): string {
  const category = categories.find((c) => c.id === id);
  if (!category) {
    throw new Error(`Seed verisinde kategori bulunamadı: ${id}`);
  }
  return category.slug;
}

function findProduct(name: string): SeedProduct {
  const product = products.find((p) => p.name === name);
  if (!product) {
    throw new Error(`Seed verisinde ürün bulunamadı: ${name}`);
  }
  return product;
}

describe("Seed kategori eşleşmesi — görevin kanonik listesiyle birebir doğrulama", () => {
  it("beklenen 6 ana kategori gerçek slug'larla birebir mevcut", () => {
    const activeSlugs = categories.filter((c) => c.id !== "cat-kampanyali-paketler").map((c) => c.slug);
    for (const slug of EXPECTED_MAIN_CATEGORY_SLUGS) {
      expect(activeSlugs).toContain(slug);
    }
  });

  it("kanonik listedeki HER ürün seed'de beklenen ana kategoriye bağlı", () => {
    const wrong: { name: string; expected: string; actual: string }[] = [];
    for (const [name, expectedSlug] of Object.entries(CANONICAL_MAP)) {
      const product = findProduct(name);
      const actualSlug = categorySlugById(product.categoryId);
      if (actualSlug !== expectedSlug) {
        wrong.push({ name, expected: expectedSlug, actual: actualSlug });
      }
    }
    expect(wrong).toEqual([]);
  });

  it("hiçbir ürün birden fazla ana kategoriye bağlı değil (seed kaynağında tekil isim/slug)", () => {
    const namesSeen = new Set<string>();
    const duplicates: string[] = [];
    for (const product of products) {
      if (namesSeen.has(product.name)) {
        duplicates.push(product.name);
      }
      namesSeen.add(product.name);
    }
    expect(duplicates).toEqual([]);
    // Her ürünün TEK bir categoryId alanı vardır (şema düzeyinde de tekil — bkz.
    // ProductCategory.productId @unique) — burada seed kaynağının da yapısal
    // olarak birden-fazla-kategori ÜRETEMEDİĞİ doğrulanır (tek alan, dizi değil).
    for (const product of products) {
      expect(typeof product.categoryId).toBe("string");
      expect(product.categoryId.length).toBeGreaterThan(0);
    }
  });

  it("artık hiçbir ürün 'kampanyali-paketler' kategorisine (eski ikincil etiket) bağlı değil", () => {
    const campaignTagged = products.filter((p) => p.categoryId === "cat-kampanyali-paketler");
    expect(campaignTagged).toEqual([]);
  });

  it("ambiguous ürün (Pestil): görevin kendi listesinde çelişki var, mevcut atama korunuyor, zorla değiştirilmedi", () => {
    const product = findProduct(AMBIGUOUS_PRODUCT_NAME);
    expect(categorySlugById(product.categoryId)).toBe(AMBIGUOUS_PRODUCT_EXPECTED_SLUG);
  });

  it("kanonik listede eşleşmeyen ürünler var olmaya devam ediyor ama kanonik eşleştirmenin PARÇASI değil (zorla atanmadı)", () => {
    for (const name of UNMATCHED_PRODUCT_NAMES) {
      expect(CANONICAL_MAP[name]).toBeUndefined();
      // Ürün seed'de gerçekten var (silinmedi/kaldırılmadı) — yalnızca kanonik
      // eşleştirmenin dışında bırakıldı, manuel iş onayı bekliyor.
      expect(() => findProduct(name)).not.toThrow();
    }
  });

  it("riskli ürünler (görev bölüm 5) tek tek doğrulandı — isim olarak yanıltıcı ama doğru kategoride", () => {
    const riskyExpectations: [string, string][] = [
      ["Pestil", "hurma-kuru-meyve"],
      ["Hindistan cevizi", "baharat"],
      ["Zerdeçal", "baharat"],
      ["Zencefil", "baharat"],
      ["Çubuk tarçın", "baharat"],
      ["Kuru üzüm", "cerez"],
      ["Menengiç", "cerez"],
      ["Narlı cevizli sucuk", "lokum"],
      ["Lokumlu bisküvi", "lokum"],
      ["Fıstık ezmesi", "kurabiye-sekerleme"],
      ["Çekilmiş tahin", "kurabiye-sekerleme"],
    ];
    for (const [name, expectedSlug] of riskyExpectations) {
      const product = findProduct(name);
      expect(categorySlugById(product.categoryId)).toBe(expectedSlug);
    }
  });
});
