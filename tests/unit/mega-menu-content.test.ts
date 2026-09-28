import { describe, expect, it } from "vitest";
import { getMegaMenuContent, getMegaMenuGroup, normalizeProductName } from "@/lib/mega-menu-content";

/**
 * Önceden hiçbir gruba karşılık gelmeyen ürünlerin ("Toz kekik", "Pestil") iş
 * kararıyla netleştirilmiş grup eşleşmelerini doğrular — fuzzy/contains
 * eşleştirme YOK, `normalizeProductName` ile TAM ad eşleşmesi (mevcut mekanizma
 * korunuyor, bkz. `getMegaMenuGroup`). "Elvan Iceberg" katalog temizliği
 * görevinde (bkz. görev sonu raporu) "Çikolatalar" grubuyla birlikte tamamen
 * kaldırıldı — bkz. aşağıdaki "katalog temizliği" describe bloğu.
 */
describe("mega-menu-content — Toz kekik / Pestil grup eşleşmeleri", () => {
  it("Toz kekik → baharat / Ot Baharatları", () => {
    const group = getMegaMenuGroup("baharat", "ot-baharatlari");
    expect(group).not.toBeNull();
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).toContain(normalizeProductName("Toz kekik"));
  });

  it("Pestil → hurma-kuru-meyve / Geleneksel Tatlılar", () => {
    const group = getMegaMenuGroup("hurma-kuru-meyve", "geleneksel-tatlilar");
    expect(group).not.toBeNull();
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).toContain(normalizeProductName("Pestil"));
  });

  it("Toz kekik, baharat'ın BAŞKA bir grubuna (ör. Acı Baharatlar) sızmamış", () => {
    const group = getMegaMenuGroup("baharat", "aci-baharatlar");
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).not.toContain(normalizeProductName("Toz kekik"));
  });

  it("Pestil, hurma-kuru-meyve'nin BAŞKA bir grubuna (ör. Kuru Meyveler) sızmamış", () => {
    const group = getMegaMenuGroup("hurma-kuru-meyve", "kuru-meyveler");
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).not.toContain(normalizeProductName("Pestil"));
  });
});

/**
 * Mısır ürünlerinin (Soslu mısır, Patlatmalık mısır, Yağlı mısır) Çekirdekler'den
 * ayrı bir Mısır grubuna taşındığını doğrular — iş kararı: bu ürünler çekirdek
 * değil, mısır bazlı çerezlerdir.
 */
describe("mega-menu-content — cerez / Mısır grubu", () => {
  it("Mısır grubu doğru 4 ürünü içerir (gerçek fotoğraf entegrasyonuyla eklenen Mısırlı Cips dahil)", () => {
    const group = getMegaMenuGroup("cerez", "misir");
    expect(group).not.toBeNull();
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).toEqual(
      ["Soslu mısır", "Patlatmalık mısır", "Yağlı mısır", "Mısırlı Cips"].map(normalizeProductName),
    );
  });

  it("Çekirdekler artık mısır ürünlerini içermiyor", () => {
    const group = getMegaMenuGroup("cerez", "cekirdekler");
    expect(group).not.toBeNull();
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).not.toContain(normalizeProductName("Soslu mısır"));
    expect(normalizedNames).not.toContain(normalizeProductName("Patlatmalık mısır"));
    expect(normalizedNames).not.toContain(normalizeProductName("Yağlı mısır"));
  });

  it("Çekirdekler'de gerçek çekirdek ürünleri hâlâ duruyor", () => {
    const group = getMegaMenuGroup("cerez", "cekirdekler");
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).toContain(normalizeProductName("Kabak çekirdeği"));
    expect(normalizedNames).toContain(normalizeProductName("Dakota çekirdek"));
  });
});

/**
 * Kategori mimarisi sadeleştirme görevi: "Atıştırmalıklar" (kurabiye-sekerleme)
 * ve "Baharat ve Aroma" (cay-kahve) gruplarının tamamen kaldırıldığını, içindeki
 * ürünlerin KAYBOLMADAN mevcut gruplara taşındığını doğrular. "Atom çay
 * çeşitleri" ise herhangi bir gruba taşınmadı — yalnızca Bitki Çayları'ndan
 * çıkarıldı (ürün DB'de/genel grid'de kalmaya devam eder, `getMegaMenuGroup`
 * kapsamı dışında test edilir).
 */
describe("mega-menu-content — grup sadeleştirme (Atıştırmalıklar / Baharat ve Aroma kaldırıldı)", () => {
  it("'Atıştırmalıklar' grubu artık mevcut değil (kurabiye-sekerleme)", () => {
    expect(getMegaMenuGroup("kurabiye-sekerleme", "atistirmaliklar")).toBeNull();
  });

  it("Atıştırmalıklar'ın 4 ürünü Kurabiyeler'e taşındı", () => {
    const group = getMegaMenuGroup("kurabiye-sekerleme", "kurabiyeler");
    expect(group).not.toBeNull();
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    for (const name of ["Gofret", "Finger", "Kıbrıs gevreği", "Haşhaşlı Bal Patlak"]) {
      expect(normalizedNames).toContain(normalizeProductName(name));
    }
  });

  it("'Baharat ve Aroma' grubu artık mevcut değil (cay-kahve)", () => {
    expect(getMegaMenuGroup("cay-kahve", "baharat-aroma")).toBeNull();
  });

  it("Baharat ve Aroma'nın 5 ürünü Baharat / Aromatik Baharatlar'a taşındı (kullanıcı kararı: gerçek DB kategorisi de baharat)", () => {
    const cayKahveGroup = getMegaMenuGroup("cay-kahve", "bitki-caylari");
    const cayKahveNames = cayKahveGroup?.productNames.map(normalizeProductName) ?? [];
    const baharatGroup = getMegaMenuGroup("baharat", "aromatik-baharatlar");
    expect(baharatGroup).not.toBeNull();
    const baharatNames = baharatGroup?.productNames.map(normalizeProductName) ?? [];
    for (const name of ["Çubuk tarçın", "Zerdeçal", "Zencefil", "Zencefil Kökü", "Zerdeçal Kökü"]) {
      expect(baharatNames).toContain(normalizeProductName(name));
      expect(cayKahveNames).not.toContain(normalizeProductName(name));
    }
  });

  it("'Atom çay çeşitleri' Bitki Çayları'ndan çıkarıldı, başka bir gruba da eklenmedi", () => {
    const content = getMegaMenuGroup("cay-kahve", "bitki-caylari");
    const normalizedNames = content?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).not.toContain(normalizeProductName("Atom çay çeşitleri"));

    const kahvelerGroup = getMegaMenuGroup("cay-kahve", "kahveler");
    const kahvelerNames = kahvelerGroup?.productNames.map(normalizeProductName) ?? [];
    expect(kahvelerNames).not.toContain(normalizeProductName("Atom çay çeşitleri"));
  });
});

/**
 * Katalog temizliği görevi: 26 ürün kaldırıldı (bkz. görev sonu raporu).
 * "Çikolatalar" ve "Kadayıf Ürünleri" grupları TÜM üyeleri kaldırıldığı için
 * tamamen boşaldı ve mega-menu'den kaldırıldı; diğer etkilenen gruplar
 * (Şekerler, Sade ve Klasik Lokumlar, Fındıklı Lokumlar, Cevizli Lokumlar,
 * Lokumlu Atıştırmalıklar, Hurmalar) boş kalmadığı için listede kaldı, yalnızca
 * kaldırılan ürünler productNames'ten çıkarıldı.
 */
describe("mega-menu-content — katalog temizliği (26 ürün kaldırıldı)", () => {
  it("'Çikolatalar' grubu tamamen kaldırıldı (kurabiye-sekerleme) — 9/9 üye kaldırıldığı için boşaldı", () => {
    expect(getMegaMenuGroup("kurabiye-sekerleme", "cikolatalar")).toBeNull();
  });

  it("'Kadayıf Ürünleri' grubu tamamen kaldırıldı (kurabiye-sekerleme) — 3/3 üye kaldırıldığı için boşaldı", () => {
    expect(getMegaMenuGroup("kurabiye-sekerleme", "kadayif-urunleri")).toBeNull();
  });

  it("Şekerler grubundan Ülker Toffe/Kent şekerleri/Konak Mandule/Yummy Şeker çıkarıldı, kalan üyeler duruyor", () => {
    const group = getMegaMenuGroup("kurabiye-sekerleme", "sekerler");
    expect(group).not.toBeNull();
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    for (const name of ["Ülker Toffe", "Kent şekerleri", "Konak Mandule", "Yummy Şeker"]) {
      expect(normalizedNames).not.toContain(normalizeProductName(name));
    }
    for (const name of ["Bonibon", "Jelibon"]) {
      expect(normalizedNames).toContain(normalizeProductName(name));
    }
  });

  it("Sade ve Klasik Lokumlar'dan Saray lokum/Ay lokumları/Ay lokum paket çıkarıldı, kalan üyeler duruyor", () => {
    const group = getMegaMenuGroup("lokum", "sade-klasik-lokumlar");
    expect(group).not.toBeNull();
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    for (const name of ["Saray lokum", "Ay lokumları", "Ay lokum paket"]) {
      expect(normalizedNames).not.toContain(normalizeProductName(name));
    }
    expect(normalizedNames).toContain(normalizeProductName("Sade lokum"));
  });

  it("Fındıklı Lokumlar'dan Fındıklı mini lokum/OSSA Fındıklı Lokum çıkarıldı, Fındıklı lokum duruyor", () => {
    const group = getMegaMenuGroup("lokum", "findikli-lokumlar");
    expect(group).not.toBeNull();
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).not.toContain(normalizeProductName("Fındıklı mini lokum"));
    expect(normalizedNames).not.toContain(normalizeProductName("OSSA Fındıklı Lokum"));
    expect(normalizedNames).toContain(normalizeProductName("Fındıklı lokum"));
  });

  it("Cevizli Lokumlar'dan Cevizli lokum/Bol cevizli bandırma lokumu çıkarıldı, Cevizli bandırma lokumu duruyor", () => {
    const group = getMegaMenuGroup("lokum", "cevizli-lokumlar");
    expect(group).not.toBeNull();
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).not.toContain(normalizeProductName("Cevizli lokum"));
    expect(normalizedNames).not.toContain(normalizeProductName("Bol cevizli bandırma lokumu"));
    expect(normalizedNames).toContain(normalizeProductName("Cevizli bandırma lokumu"));
  });

  it("Lokumlu Atıştırmalıklar'dan Büyük lokumlu bisküvi çıkarıldı, Lokumlu bisküvi duruyor (grup boş kalmadı)", () => {
    const group = getMegaMenuGroup("lokum", "lokumlu-atistirmaliklar");
    expect(group).not.toBeNull();
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).not.toContain(normalizeProductName("Büyük lokumlu bisküvi"));
    expect(normalizedNames).toContain(normalizeProductName("Lokumlu bisküvi"));
  });

  it("Hurmalar'dan Paket hurma çıkarıldı, diğer hurma ürünleri duruyor", () => {
    const group = getMegaMenuGroup("hurma-kuru-meyve", "hurmalar");
    expect(group).not.toBeNull();
    const normalizedNames = group?.productNames.map(normalizeProductName) ?? [];
    expect(normalizedNames).not.toContain(normalizeProductName("Paket hurma"));
    expect(normalizedNames).toContain(normalizeProductName("M hurma"));
  });
});

/**
 * Mega-menu görsel kapsama görevi: gerçek ürün fotoğrafı olan gruplarda artık
 * yaprak placeholder gösterilmemeli. Bu bloğun asıl amacı REGRESYON KORUMASI —
 * ileride yeni bir grup eklenip görseli unutulursa bu test kırılır ve fark
 * edilir. Kaldırılmış ürünlerin dosya adlarına ASLA referans verilmemeli.
 */
describe("mega-menu-content — görsel kapsama (33/33 grup gerçek görsele sahip)", () => {
  const CATEGORY_SLUGS = ["cerez", "lokum", "kurabiye-sekerleme", "cay-kahve", "baharat", "hurma-kuru-meyve"];

  const REMOVED_PRODUCT_IMAGE_SLUGS = [
    "bol-cevizli-bandirma-lokumu", "saray-lokum", "cevizli-lokum", "buyuk-lokumlu-biskuvi",
    "findikli-mini-lokum", "ay-lokum-paket", "ay-lokumlari", "findikli-mini-cezerye",
    "kadayif", "porsiyon-kadayif", "findikli-kadayif", "seker-cikolata", "fondante-cikolata",
    "konak-cikolata", "elit-baton-cikolata", "elit-royal-findikli", "kalpli-gulen-yuz-cikolata",
    "rugano", "elvan-iceberg", "ulker-toffe", "kent-sekerleri", "konak-mandule", "yummy-seker",
    "ossa-findikli-lokum", "paket-hurma", "konak-findik-cikolata",
  ];

  it("6 ana kategorinin TÜM alt grupları `image` alanına sahip", () => {
    const groupsWithoutImage: string[] = [];
    for (const categorySlug of CATEGORY_SLUGS) {
      const content = getMegaMenuContent(categorySlug);
      expect(content, categorySlug).not.toBeNull();
      for (const group of content?.groups ?? []) {
        if (!group.image) {
          groupsWithoutImage.push(`${categorySlug} / ${group.label}`);
        }
      }
    }
    expect(groupsWithoutImage).toEqual([]);
  });

  it("hiçbir grup görseli kaldırılmış bir ürünün dosyasına referans vermiyor", () => {
    const leaked: string[] = [];
    for (const categorySlug of CATEGORY_SLUGS) {
      const content = getMegaMenuContent(categorySlug);
      for (const group of content?.groups ?? []) {
        if (!group.image) continue;
        for (const removedSlug of REMOVED_PRODUCT_IMAGE_SLUGS) {
          if (group.image.url.includes(`/${removedSlug}.webp`)) {
            leaked.push(`${categorySlug} / ${group.label} -> ${group.image.url}`);
          }
        }
      }
    }
    expect(leaked).toEqual([]);
  });
});
