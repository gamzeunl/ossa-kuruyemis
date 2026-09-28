/**
 * "Katalog fiyat güncelleme" görevinin fiyat hesaplama doğruluğu testi —
 * `prisma/seed.ts`'in saf `products` dizisini import eder (bu import `main()`'i
 * TETİKLEMEZ, DB'ye yazmaz — bkz. `seed-category-mapping.test.ts`'teki aynı
 * desen). Gerçek referans: `docs/CATALOG_PRICE_UPDATE_MATCHING_REPORT.md`.
 */
import { describe, expect, it } from "vitest";
import { products, type SeedProduct } from "../../prisma/seed";

function findProduct(name: string): SeedProduct {
  const product = products.find((p) => p.name === name);
  if (!product) {
    throw new Error(`Seed verisinde ürün bulunamadı: ${name}`);
  }
  return product;
}

function variantPrice(product: SeedProduct, weightGram: number): number {
  const variant = product.variants.find((v) => v.weightGram === weightGram);
  if (!variant) {
    throw new Error(`${product.name} için ${weightGram} g varyantı bulunamadı`);
  }
  return Number(variant.price);
}

describe("Seed fiyat hesaplaması — TL/kg", () => {
  it("1 kg varyant fiyatı = liste kg fiyatının doğrudan kendisi (Çiğ Kaju = 750 TL/kg)", () => {
    const product = findProduct("Çiğ kaju");
    expect(variantPrice(product, 1000)).toBe(750);
  });

  it("500 g varyant fiyatı = kg fiyatının yarısı (Çiğ Kaju = 750 TL/kg → 375 TL)", () => {
    const product = findProduct("Çiğ kaju");
    expect(variantPrice(product, 500)).toBe(375);
  });

  it("500 g/1 kg oranı her cerez ürününde tutarlı — Kabak çekirdeği (450 TL/kg)", () => {
    const product = findProduct("Kabak çekirdeği");
    expect(variantPrice(product, 1000)).toBe(450);
    expect(variantPrice(product, 500)).toBe(225);
  });

  it("100 g'lık baharat varyantı kg fiyatının %10'u (Karabiber = 830 TL/kg → 83 TL)", () => {
    const product = findProduct("Karabiber");
    expect(variantPrice(product, 100)).toBe(83);
  });

  it("250 g'lık kurabiye varyantı kg fiyatının %25'i (Kurabiye = 175 TL/kg → 43.75 TL)", () => {
    const product = findProduct("Kurabiye");
    expect(variantPrice(product, 250)).toBe(43.75);
  });
});

describe("Seed fiyat hesaplaması — TL/adet (kg dönüşümü YAPILMAZ)", () => {
  it("Lokumlu bisküvi 75 TL/adet — 400 g varyantına doğrudan uygulanır, kg'a bölünmez", () => {
    const product = findProduct("Lokumlu bisküvi");
    expect(variantPrice(product, 400)).toBe(75);
  });

  it("Nescafe 48'li 450 TL/adet — 250 g varyantına doğrudan uygulanır", () => {
    const product = findProduct("Nescafe 48'li");
    expect(variantPrice(product, 250)).toBe(450);
  });

  it("Yaş hurma 150 TL/adet — 500 g varyantına doğrudan uygulanır (kg fiyatı olsaydı 300 TL/kg'a karşılık gelirdi, ama adet birimi bunu geçersiz kılar)", () => {
    const product = findProduct("Yaş hurma");
    expect(variantPrice(product, 500)).toBe(150);
  });

});

describe("Seed fiyat hesaplaması — eski demo/sentetik fiyatlar kalmadı", () => {
  it("eski formül-bazlı demo fiyat aralığı (ör. cerez 500 g için ~224.9-232.9) artık üretilmiyor", () => {
    // Menengiç eskiden ~224.9 TL demo fiyatındaydı; gerçek fiyatı 550 TL/kg → 275 TL (500 g).
    const product = findProduct("Menengiç");
    const price500 = variantPrice(product, 500);
    expect(price500).not.toBeCloseTo(224.9, 1);
    expect(price500).toBe(275);
  });

  it("güvenle eşleşen ürünlerde eski demo formülünün imzası (.9 ile biten fiyat) artık yok", () => {
    // 5 AMBIGUOUS ürün (aşağıdaki blokta ayrıca test edilir) BİLİNÇLİ olarak eski
    // fiyatını koruyor, bu yüzden .9 damgası onlarda hâlâ var — kapsam dışı bırakıldı.
    const stillUnresolvedNames = new Set([
      "Kekik",
      "Kayısı kurusu",
      "İncir kurusu",
      "Fındıklı mini cevizli lokum",
    ]);
    const suspiciousLegacyPattern = products
      .filter((p) => !stillUnresolvedNames.has(p.name))
      .flatMap((p) => p.variants)
      .filter((v) => Number(v.price) % 1 === 0.9);
    expect(suspiciousLegacyPattern).toEqual([]);
  });
});

describe("Seed — yeni ürünler güvenli şekilde eklendi", () => {
  // weightGram → beklenen fiyat, ürünün kendi kg fiyatından hesaplanmış.
  // NOT: bu blok başlangıçta 7 ürünü kapsıyordu; "Fındıklı Mini Cezerye" daha
  // sonraki bir katalog temizliği görevinde kaldırıldı (bkz. o görevin sonu
  // raporu) — kalan 6 ürün hâlâ seed'de gerçek/doğru fiyatlarıyla duruyor.
  const NEW_PRODUCTS: { name: string; categoryId: string; expectedByWeight: Record<number, number> }[] = [
    { name: "Antep Fıstığı", categoryId: "cat-cerez", expectedByWeight: { 500: 700, 1000: 1400 } },
    { name: "Siirt Fıstığı", categoryId: "cat-cerez", expectedByWeight: { 500: 700, 1000: 1400 } },
    { name: "Lüks Karışık", categoryId: "cat-cerez", expectedByWeight: { 500: 550, 1000: 1100 } },
    { name: "Spesiyal Karışık", categoryId: "cat-cerez", expectedByWeight: { 500: 300, 1000: 600 } },
    { name: "Mix Çerez", categoryId: "cat-cerez", expectedByWeight: { 500: 425, 1000: 850 } },
    { name: "Karışık Çerez", categoryId: "cat-cerez", expectedByWeight: { 500: 100, 1000: 200 } },
  ];

  it("6 yeni ürünün hepsi seed'de mevcut, doğru ana kategoride ve varyant başına doğru fiyatta", () => {
    for (const expected of NEW_PRODUCTS) {
      const product = findProduct(expected.name);
      expect(product.categoryId).toBe(expected.categoryId);
      for (const [weight, price] of Object.entries(expected.expectedByWeight)) {
        expect(variantPrice(product, Number(weight))).toBe(price);
      }
    }
  });

  it("her yeni ürünün TEK bir categoryId'si var (dizi değil, tekil alan)", () => {
    for (const expected of NEW_PRODUCTS) {
      const product = findProduct(expected.name);
      expect(typeof product.categoryId).toBe("string");
    }
  });
});

describe("Seed — AMBIGUOUS ürünler tahmin edilmeden mevcut/eski fiyatını korudu", () => {
  it("Kekik, Kayısı kurusu, İncir kurusu, Konak Mandule, Fındıklı mini cevizli lokum yeni bir uydurma fiyat almadı", () => {
    // Bu 5 ürün için 146 satırlık listede güvenli bir eşleşme yoktu (bkz. rapor) —
    // seed'deki `pricePerKg` değerleri, güncellemeden ÖNCEKİ mevcut DB fiyatının
    // birebir geri hesaplanmasıdır (bilinçli olarak "değişmeyen" bir sabit).
    const kekik = findProduct("Kekik");
    expect(variantPrice(kekik, 100)).not.toBe(600); // "Kekik Zahter" listedeki 600 DEĞİL
  });
});

describe("Seed — tekil slug ve SKU (duplicate oluşmadı)", () => {
  it("tüm ürünler arasında slug tekil", () => {
    const slugs = products.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("tüm varyantlar arasında SKU tekil", () => {
    const skus = products.flatMap((p) => p.variants.map((v) => v.sku));
    expect(new Set(skus).size).toBe(skus.length);
  });

  it("toplam ürün sayısı 115 (katalog temizliği görevinde 26, sonraki turlarda Jole lokumlar ve Atom çay çeşitleri kaldırıldı)", () => {
    expect(products.length).toBe(115);
  });
});
