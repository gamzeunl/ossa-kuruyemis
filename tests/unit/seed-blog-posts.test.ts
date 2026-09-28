/**
 * Blog seed verisinin bütünlük testi — `prisma/seed.ts`'in saf veri
 * dizilerini (`products`) ve `prisma/seed-blog-posts.ts`'in `SEED_BLOG_POSTS`
 * dizisini import eder (DB'ye yazmaz — `seed-category-mapping.test.ts` ile
 * aynı desen). Görevin kendi yasakladığı sağlık iddialarının hiçbir yazıda
 * geçmediğini de burada doğrular.
 */
import { describe, expect, it } from "vitest";
import { products } from "../../prisma/seed";
import { SEED_BLOG_POSTS } from "../../prisma/seed-blog-posts";

const FORBIDDEN_PHRASES = [
  "kas yapar",
  "performansı artırır",
  "yağ yakar",
  "antrenmandan önce kesin yiyin",
  "zayıflatır",
  "kilo verdirir",
  "metabolizmayı hızlandırır",
  "anne sütünü artırır",
  "ceviz süt yapar",
  "hurma süt artırır",
  "bebeğin zekasını geliştirir",
  "bebeğin zekâsını geliştirir",
  "kesin tüketilmelidir",
];

describe("SEED_BLOG_POSTS — veri bütünlüğü", () => {
  it("tam olarak 4 yazı içerir", () => {
    expect(SEED_BLOG_POSTS).toHaveLength(4);
  });

  it("tüm slug'lar tekildir", () => {
    const slugs = SEED_BLOG_POSTS.map((post) => post.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("beklenen 4 slug birebir mevcut", () => {
    const slugs = SEED_BLOG_POSTS.map((post) => post.slug).sort();
    expect(slugs).toEqual(
      [
        "hurma-cesitleri-rehberi",
        "spor-yapanlar-icin-kuruyemis-secimi",
        "diyet-yaparken-kuruyemis",
        "emzirme-doneminde-kuruyemis-kuru-meyve",
      ].sort(),
    );
  });

  it("her yazının title/excerpt/metaTitle/metaDescription alanı dolu", () => {
    for (const post of SEED_BLOG_POSTS) {
      expect(post.title.length).toBeGreaterThan(0);
      expect(post.excerpt.length).toBeGreaterThan(0);
      expect(post.metaTitle.length).toBeGreaterThan(0);
      expect(post.metaDescription.length).toBeGreaterThan(0);
    }
  });

  it("her yazının içeriği en az 700 kelime (yaklaşık 1000-1600 hedefine makul yakınlık)", () => {
    for (const post of SEED_BLOG_POSTS) {
      const wordCount = post.content.split(/\s+/).filter(Boolean).length;
      expect(wordCount).toBeGreaterThanOrEqual(700);
    }
  });

  it("her yazının en az bir Kaynaklar bölümü var", () => {
    for (const post of SEED_BLOG_POSTS) {
      expect(post.content).toContain("## Kaynaklar");
    }
  });

  it("her yazının productNames listesindeki TÜM ürünler gerçek katalogda (seed.ts products) mevcut", () => {
    const realProductNames = new Set(products.map((product) => product.name));
    for (const post of SEED_BLOG_POSTS) {
      expect(post.productNames.length).toBeGreaterThan(0);
      for (const name of post.productNames) {
        expect(realProductNames.has(name), `"${name}" gerçek katalogda bulunamadı (${post.slug})`).toBe(true);
      }
    }
  });

  it("hiçbir yazıda görevin yasakladığı sağlık iddiaları geçmiyor", () => {
    for (const post of SEED_BLOG_POSTS) {
      const haystack = post.content.toLocaleLowerCase("tr-TR");
      for (const phrase of FORBIDDEN_PHRASES) {
        expect(haystack.includes(phrase.toLocaleLowerCase("tr-TR")), `"${phrase}" ifadesi "${post.slug}" içinde geçiyor`).toBe(
          false,
        );
      }
    }
  });

  it("emzirme yazısında dengeli/temkinli bir bilgilendirme notu var", () => {
    const post = SEED_BLOG_POSTS.find((p) => p.slug === "emzirme-doneminde-kuruyemis-kuru-meyve");
    expect(post?.content).toContain("sağlık profesyoneline danışılması önerilir");
  });
});
