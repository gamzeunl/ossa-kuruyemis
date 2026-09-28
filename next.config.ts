import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `/kargo-ve-teslimat` ve `/iade-ve-degisim` `/teslimat-iade` altında
  // birleştirildi (bkz. src/content/legal/teslimat-iade.ts) — eski linkler
  // (footer, arama motoru sonuçları, e-postalar) kırılmasın diye yönlendirilir.
  async redirects() {
    return [
      { source: "/kargo-ve-teslimat", destination: "/teslimat-iade", permanent: false },
      { source: "/iade-ve-degisim", destination: "/teslimat-iade", permanent: false },
    ];
  },
  // HSTS — tarayıcıya bu domain için HER ZAMAN HTTPS kullanmasını söyler
  // (bkz. CLAUDE.md güvenlik kuralı + iyzico başvuru hazırlığı görevi).
  // "Sahte SSL" DEĞİLDİR — Vercel/hosting HTTPS'i zaten sağlar, bu yalnızca
  // standart bir tarayıcı-seviyesi hardening başlığıdır. Header'ın kendisi
  // yalnızca zaten HTTPS üzerinden gelen yanıtlarda tarayıcı tarafından
  // dikkate alınır (spesifikasyon gereği) — düz HTTP üzerindeki localhost
  // development'ı ETKİLEMEZ/BOZMAZ.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default nextConfig;
