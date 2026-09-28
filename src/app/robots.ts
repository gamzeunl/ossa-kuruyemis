import type { MetadataRoute } from "next";
import { publicEnv } from "@/config/env";

/**
 * `/hesabim/**`/`/yonetim/**` gibi özel sayfalar için asıl koruma auth
 * redirect'i (bkz. `src/server/auth/guard.ts`) — `disallow` yalnızca uyumlu
 * botların bu yolları hiç TARAMASINI önler (zaten indekslenmiş bir URL'i
 * kaldırmaz, bunun için ilgili sayfaların `robots: { index: false }`
 * metadata'sı gerekir).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/yonetim", "/hesabim", "/giris", "/kayit", "/sepet", "/odeme", "/api"],
    },
    sitemap: `${publicEnv.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
