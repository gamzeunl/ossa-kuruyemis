/**
 * `docs/PRODUCT_INFORMATION_RESEARCH_REPORT.md` araştırmasının kod hâli olan
 * `PRODUCT_INFORMATION` veri kümesinin yapısal doğruluğunu kontrol eder —
 * DB'ye hiç erişmez (saf veri testi), `prisma/seed.ts`'in `main()`'ini
 * TETİKLEMEZ (yalnızca saf veri dizilerini import eder).
 */
import { describe, expect, it } from "vitest";
import { products } from "../../prisma/seed";
import { PRODUCT_INFORMATION } from "../../prisma/seed-product-information";

describe("PRODUCT_INFORMATION veri kümesi", () => {
  it("seed.ts'teki TÜM ürünler için bir giriş içerir (hiçbiri sessizce atlanmadı)", () => {
    const missing = products.filter((product) => !PRODUCT_INFORMATION[product.slug]);
    expect(missing.map((product) => product.slug)).toEqual([]);
  });

  it("bilinmeyen/fazladan slug içermez", () => {
    const knownSlugs = new Set(products.map((product) => product.slug));
    const unknown = Object.keys(PRODUCT_INFORMATION).filter((slug) => !knownSlugs.has(slug));
    expect(unknown).toEqual([]);
  });

  it("hiçbir girişte originInfo alanı YOK — bu tur için 143/143 SUPPLIER_INFO_REQUIRED", () => {
    for (const [slug, entry] of Object.entries(PRODUCT_INFORMATION)) {
      expect(entry, slug).not.toHaveProperty("originInfo");
    }
  });

  it("nutrition doluysa 3 kaynak alanı + confidence + referenceType her zaman birlikte dolu", () => {
    for (const [slug, entry] of Object.entries(PRODUCT_INFORMATION)) {
      if (!entry.nutrition) continue;
      expect(entry.nutrition.sourceName, slug).toBeTruthy();
      expect(entry.nutrition.sourceUrl, slug).toBeTruthy();
      expect(entry.nutrition.sourceProduct, slug).toBeTruthy();
      expect(entry.nutrition.referenceType, slug).toBe("REFERENCE_AVERAGE");
      expect(["HIGH", "MEDIUM", "LOW"]).toContain(entry.nutrition.confidence);
    }
  });

  it("nutrition kaynak URL'leri güvenli (http/https) protokole sahiptir", () => {
    for (const [slug, entry] of Object.entries(PRODUCT_INFORMATION)) {
      if (!entry.nutrition) continue;
      expect(() => new URL(entry.nutrition!.sourceUrl), slug).not.toThrow();
      const protocol = new URL(entry.nutrition!.sourceUrl).protocol;
      expect(["http:", "https:"], slug).toContain(protocol);
    }
  });

  it("nutrition sayısal değerleri negatif veya mantıksız (>10000) değil", () => {
    const numericFields = [
      "energyKcal",
      "energyKj",
      "fat",
      "saturatedFat",
      "carbohydrate",
      "sugars",
      "fiber",
      "protein",
      "salt",
    ] as const;
    for (const [slug, entry] of Object.entries(PRODUCT_INFORMATION)) {
      if (!entry.nutrition) continue;
      for (const field of numericFields) {
        const value = entry.nutrition[field];
        if (value === undefined) continue;
        expect(value, `${slug}.${field}`).toBeGreaterThanOrEqual(0);
        expect(value, `${slug}.${field}`).toBeLessThan(10000);
      }
    }
  });

  it("her açıklama 80-160 kelime aralığındadır (şablon/yüzeysel metin bırakılmadı)", () => {
    const outOfRange: string[] = [];
    for (const [slug, entry] of Object.entries(PRODUCT_INFORMATION)) {
      if (!entry.description) continue;
      const wordCount = entry.description.trim().split(/\s+/).filter(Boolean).length;
      if (wordCount < 80 || wordCount > 160) {
        outOfRange.push(`${slug} (${wordCount} kelime)`);
      }
    }
    expect(outOfRange).toEqual([]);
  });

  it("allergenInfo yalnızca gerçekten sert kabuklu yemiş/susam olan ürünlerde dolu", () => {
    const allergenSlugs = Object.entries(PRODUCT_INFORMATION)
      .filter(([, entry]) => entry.allergenInfo)
      .map(([slug]) => slug);
    // Bu liste araştırma raporundaki "ürünün kendisi doğrudan alerjen" setiyle
    // birebir örtüşmeli — yeni bir ürün eklendiğinde bu test kırılırsa,
    // allergenInfo'nun GERÇEKTEN doğrudan/kesin olduğu elle doğrulanmalı.
    expect(allergenSlugs.length).toBeGreaterThan(0);
    for (const slug of allergenSlugs) {
      // Türkçe ünsüz yumuşaması nedeniyle "fıstık"→"fıstığı", "fındık"→"fındığı" olur.
      expect(PRODUCT_INFORMATION[slug].allergenInfo).toMatch(/badem|fındı[kğ]|ceviz|kaju|fıstı[kğ]|susam/i);
    }
  });
});
