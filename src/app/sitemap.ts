import type { MetadataRoute } from "next";
import { publicEnv } from "@/config/env";
import { listPublishedPostSlugsForSitemap } from "@/server/repositories/blog-repository";
import { listActiveProductSlugsForSitemap } from "@/server/repositories/product-repository";

const STATIC_CATEGORY_PATHS = ["/cerez", "/baharat", "/cay-kahve", "/hurma-kuru-meyve", "/kurabiye-sekerleme", "/lokum"];

const STATIC_INFO_PATHS = [
  "/hakkimizda",
  "/iletisim",
  "/sss",
  "/kvkk",
  "/gizlilik-politikasi",
  "/kullanim-kosullari",
  "/mesafeli-satis-sozlesmesi",
  "/on-bilgilendirme-formu",
  "/teslimat-iade",
  "/siparis-takibi",
];

/**
 * Yalnızca gerçekten herkese açık/indekslenmesi istenen sayfalar — `/hesabim`,
 * `/yonetim`, `/giris`, `/kayit`, `/sepet`, `/odeme`, `/siparis-sonucu/**`
 * bilinçli olarak DIŞARIDA bırakılır (bkz. `robots.ts` disallow listesi).
 * Ürün/blog sorguları yalnızca ACTIVE/PUBLISHED kayıtları döner — DRAFT içerik
 * asla sitemap'e sızmaz (bkz. `listActiveProductSlugsForSitemap`/
 * `listPublishedPostSlugsForSitemap`).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = publicEnv.NEXT_PUBLIC_SITE_URL;
  const [products, posts] = await Promise.all([
    listActiveProductSlugsForSitemap(),
    listPublishedPostSlugsForSitemap(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/urunler`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: "daily", priority: 0.6 },
    ...STATIC_CATEGORY_PATHS.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...STATIC_INFO_PATHS.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    })),
  ];

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${base}/urunler/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  return [...staticEntries, ...productEntries, ...blogEntries];
}
