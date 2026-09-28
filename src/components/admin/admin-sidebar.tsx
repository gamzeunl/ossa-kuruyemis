"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  /** Varsayılan (`pathname === href` veya alt yol) eşleşmesi yeterli değilse özel eşleşme mantığı. */
  matches?: (pathname: string) => boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Anasayfa'yla ilgili TÜM editörler (hero/banner/etkinlik/instagram/anasayfa
 * seçkisi) artık sidebar'da ayrı madde değil — "Anasayfa Yönetimi" TEK
 * merkezinden erişiliyor (bkz. `/yonetim/anasayfa`). Bu prefix'ler, o alt
 * sayfalardayken sidebar'da "Anasayfa Yönetimi"nin aktif görünmesi içindir;
 * route'ların kendisi SİLİNMEDİ, yalnızca sidebar'dan kaldırıldı.
 */
const HOMEPAGE_HUB_RELATED_PREFIXES = [
  "/yonetim/anasayfa",
  "/yonetim/anasayfa-seckisi",
  "/yonetim/icerik",
  "/yonetim/instagram",
];

function isHomepageHubActive(pathname: string): boolean {
  return HOMEPAGE_HUB_RELATED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Genel",
    items: [{ label: "Dashboard", href: "/yonetim", matches: (pathname) => pathname === "/yonetim" }],
  },
  {
    label: "Siparişler",
    items: [{ label: "Siparişler", href: "/yonetim/siparisler" }],
  },
  {
    label: "Katalog",
    items: [
      { label: "Ürünler", href: "/yonetim/urunler" },
      { label: "Kategoriler", href: "/yonetim/kategoriler" },
      { label: "Stok Yönetimi", href: "/yonetim/stok" },
      { label: "Yorumlar", href: "/yonetim/yorumlar" },
    ],
  },
  {
    label: "Pazarlama",
    items: [
      // "Kampanyalar" — Ayın Favorileri/Birlikte Daha Güzel/Haftanın Fırsatları/
      // Müşteri Favorileri/En Çok Satanlar hepsi bu hub'ın altından erişilir
      // (bkz. `/yonetim/kampanyalar` sayfası), sidebar'da ayrı madde DEĞİL.
      { label: "Kampanyalar", href: "/yonetim/kampanyalar" },
      { label: "Anasayfa Yönetimi", href: "/yonetim/anasayfa", matches: isHomepageHubActive },
    ],
  },
  {
    label: "Müşteri",
    items: [{ label: "İletişim Talepleri", href: "/yonetim/iletisim" }],
  },
  {
    label: "İçerik",
    items: [{ label: "Blog", href: "/yonetim/blog" }],
  },
];

function defaultMatches(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Yönetim paneli sol navigasyonu — Genel/Siparişler/Katalog/Pazarlama/Müşteri/
 * İçerik bilgi mimarisi, TAMAMEN mevcut route'lara bağlanır, yeni route
 * üretmez. Anasayfa'ya bağlı 8-9 ayrı editör (hero/banner/etkinlik/instagram/
 * anasayfa seçkisi + Ayın Favorileri/Birlikte Daha Güzel gibi kampanya
 * araçları) artık burada TEK TEK listelenmiyor — hepsi "Anasayfa Yönetimi"
 * (bkz. `/yonetim/anasayfa`) veya "Kampanyalar" hub'ı üzerinden erişiliyor;
 * route'ların kendisi silinmedi, yalnızca sidebar sadeleştirildi. Aktif route
 * `usePathname` ile belirlenir (site header'ındaki `CategoryNav` ile AYNI
 * yaklaşım). `onNavigate`, mobil drawer'ın bir linke tıklanınca kapanması içindir.
 */
export function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Yönetim navigasyonu" className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <span className="text-foreground/40 px-3 text-xs font-bold tracking-[0.12em] uppercase">
            {group.label}
          </span>
          {group.items.map((item) => {
            const active = item.matches ? item.matches(pathname) : defaultMatches(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-brand/10 text-brand font-bold"
                    : "text-foreground/70 hover:bg-surface-muted hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
