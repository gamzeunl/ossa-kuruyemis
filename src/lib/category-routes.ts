/**
 * Kategori slug'larını okunabilir sayfa rotalarına eşleyen tek merkezi kaynak.
 * Veritabanı kaydı/slug'ı değişmez — yalnızca müşteri arayüzünde üretilen
 * bağlantı hedefleri burada toplanır (bkz. `src/app/<slug>/page.tsx` rotaları).
 */
interface CategoryRoute {
  slug: string;
  href: string;
  label: string;
}

const CATEGORY_ROUTES: CategoryRoute[] = [
  { slug: "cerez", href: "/cerez", label: "Çerez" },
  { slug: "lokum", href: "/lokum", label: "Lokum" },
  { slug: "kurabiye-sekerleme", href: "/kurabiye-sekerleme", label: "Kurabiye & Şekerleme" },
  { slug: "cay-kahve", href: "/cay-kahve", label: "Çay & Kahve" },
  { slug: "baharat", href: "/baharat", label: "Baharat" },
  { slug: "hurma-kuru-meyve", href: "/hurma-kuru-meyve", label: "Hurma & Kuru Meyve" },
];

/**
 * Bir kategori slug'ı için müşteri arayüzünde kullanılacak bağlantıyı döner.
 * Okunabilir bir rotası olmayan kategoriler için (ör. "kampanyali-paketler" —
 * kendi sayfası yok) eski `/urunler?kategori=` biçimine düşer; bu eski biçim
 * hâlâ çalışır durumda, yalnızca yeni bağlantı üretiminde tercih edilmiyor.
 */
export function getCategoryHref(slug: string): string {
  const route = CATEGORY_ROUTES.find((entry) => entry.slug === slug);
  return route?.href ?? `/urunler?kategori=${slug}`;
}

/**
 * Kategori keşif bölümü (bkz. `CategoryDiscovery`) için `excludeSlug` hariç
 * ilk birkaç kategori rotasını döner — sıfır DB sorgusu, tamamen statik.
 */
export function getOtherCategoryRoutes(excludeSlug: string, limit = 3): CategoryRoute[] {
  return CATEGORY_ROUTES.filter((entry) => entry.slug !== excludeSlug).slice(0, limit);
}
