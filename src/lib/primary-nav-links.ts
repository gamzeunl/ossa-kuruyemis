/**
 * Header ana navigasyonunda kategori bağlantılarından SONRA gösterilen statik
 * sayfalar. Düz veri — `category-nav.tsx` ("use client") İÇİNDEN export
 * edilirse Server Component (`category-menu.tsx`) tarafındaki import bir
 * client-reference proxy'sine döner (`.map` çalışmaz, build hatası verir);
 * bu yüzden bağımsız, framework'ten bağımsız bir dosyada tutulur.
 */
export const SECONDARY_NAV_LINKS = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
] as const;
