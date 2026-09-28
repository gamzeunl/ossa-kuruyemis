/**
 * Ana sayfa bölümlerinin TEK statik kaynağı — stabil `key`, görünen ad ve
 * (varsa) mevcut yönetim ekranına giden link. `HomepageSection` DB tablosu
 * yalnızca `key` başına `sortOrder`/`isActive` tutar; içerik burada DEĞİL,
 * her bölümün kendi gerçek modelinde yaşar (bkz. `src/app/page.tsx`).
 *
 * `toggleable: false` olan bölümler (Hero, Ana Kategoriler, Fırsatlar Rafı,
 * Çok Tercih Edilenler, Popüler Seçimler, Keşif Bloğu, Son CTA) gerçek/canlı
 * veriye dayalı temel mağaza deneyimi parçalarıdır — admin bunları
 * pasifleştiremez (yanlışlıkla ana navigasyonu/satış rafını kapatma riski),
 * yalnızca SIRASINI değiştirebilir. Yalnızca editoryal/küratörlü bölümler
 * (`toggleable: true`) tamamen gizlenebilir; hepsinin zaten kendi
 * "boşsa/pasifse render etme" güvenli varsayılanı vardır.
 */
export interface HomepageSectionConfig {
  key: string;
  label: string;
  description: string;
  toggleable: boolean;
  editHref: string | null;
}

export const HOMEPAGE_SECTIONS: HomepageSectionConfig[] = [
  {
    key: "hero",
    label: "Hero",
    description: "Ana sayfa en üstündeki otomatik slayt.",
    toggleable: false,
    editHref: "/yonetim/icerik/hero-banner",
  },
  {
    key: "main-categories",
    label: "Ana Kategoriler",
    description: "6 ana kategori kartı — temel navigasyon, gizlenemez.",
    toggleable: false,
    editHref: "/yonetim/kategoriler",
  },
  {
    key: "deals-shelf",
    label: "Fırsatlar Rafı",
    description: "Aktif kampanya varsa o, yoksa gerçek indirimli ürünler.",
    toggleable: false,
    editHref: "/yonetim/kampanyalar",
  },
  {
    key: "monthly-favorites",
    label: "Ayın Favorileri",
    description: "Admin küratörlü öne çıkan ürün seçkisi.",
    toggleable: true,
    editHref: "/yonetim/kampanyalar/ayin-favorileri",
  },
  {
    key: "best-sellers",
    label: "En Çok Tercih Edilenler",
    description: "Gerçek satış verisine göre otomatik oluşur.",
    toggleable: false,
    editHref: null,
  },
  {
    key: "better-together",
    label: "Birlikte Daha Güzel",
    description: "Ürün ikili kampanya paketleri.",
    toggleable: true,
    editHref: "/yonetim/kampanyalar/birlikte-al",
  },
  {
    key: "event-snacks",
    label: "Kına ve Düğün Çerezleri",
    description: "Etkinlik kartları bölümü.",
    toggleable: true,
    editHref: "/yonetim/icerik/etkinlik-kartlari",
  },
  {
    key: "popular-groups",
    label: "Popüler Seçimler",
    description: "Mega-menu gruplarından otomatik oluşan kısayollar.",
    toggleable: false,
    editHref: null,
  },
  {
    key: "editorial-selection",
    label: "OSSA'dan Seçtiklerimiz",
    description: "Admin küratörlü editoryal ürün seçkisi.",
    toggleable: true,
    editHref: "/yonetim/anasayfa-seckisi",
  },
  {
    key: "discovery-links",
    label: "Çerez Sofrasını Tamamla",
    description: "Sabit kategori/grup keşif kartları.",
    toggleable: false,
    editHref: null,
  },
  {
    key: "editorial-banner",
    label: "Tam Genişlik Banner",
    description: "Ana sayfadaki büyük görsel banner.",
    toggleable: true,
    editHref: "/yonetim/icerik/banner",
  },
  {
    key: "instagram",
    label: "Instagram Vitrini",
    description: "Admin küratörlü Instagram gönderi vitrini.",
    toggleable: true,
    editHref: "/yonetim/instagram",
  },
  {
    key: "why-ossa",
    label: "Neden OSSA?",
    description: "Sabit güven/avantaj metin bloğu.",
    toggleable: true,
    editHref: null,
  },
  {
    key: "blog",
    label: "Blog",
    description: "Yayınlanmış son blog yazıları.",
    toggleable: true,
    editHref: "/yonetim/blog",
  },
  {
    key: "final-cta",
    label: "Son CTA",
    description: "Sayfa sonundaki kapanış çağrısı.",
    toggleable: false,
    editHref: null,
  },
];

export const HOMEPAGE_SECTION_KEYS = HOMEPAGE_SECTIONS.map((section) => section.key);

export function getHomepageSectionConfig(key: string): HomepageSectionConfig | null {
  return HOMEPAGE_SECTIONS.find((section) => section.key === key) ?? null;
}

export interface ResolvedHomepageSection {
  key: string;
  sortOrder: number;
  isActive: boolean;
}

/**
 * DB satırlarını (`HomepageSection`) statik varsayılan sırayla birleştirir —
 * DB'de kaydı olan bir `key` DB'nin `sortOrder`/`isActive` değerini kullanır;
 * hiç seed edilmemiş (satırı olmayan) bir `key` koddaki varsayılan index'i ve
 * `isActive: true`'yu kullanır. Böylece `db:seed` hiç çalışmamış olsa bile
 * ana sayfa doğru sırada, hiçbir bölüm eksilmeden render edilir — DB satırı
 * yalnızca bir OPTİMİZASYON/kalıcılık katmanıdır, tek gerçek kaynak değildir.
 * Koddan silinmiş (artık `HOMEPAGE_SECTIONS`'ta olmayan) DB satırları yok sayılır.
 */
export function resolveHomepageSectionOrder(dbRows: ResolvedHomepageSection[]): ResolvedHomepageSection[] {
  const byKey = new Map(dbRows.map((row) => [row.key, row]));
  return HOMEPAGE_SECTIONS.map((section, index) => {
    const dbRow = byKey.get(section.key);
    return dbRow ?? { key: section.key, sortOrder: index, isActive: true };
  }).sort((a, b) => a.sortOrder - b.sortOrder);
}
