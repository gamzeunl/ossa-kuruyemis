import Link from "next/link";

export interface PillNavItem {
  key: string;
  label: string;
  href: string;
  active: boolean;
}

/**
 * Genel amaçlı yatay pill/tab navigasyonu — kategori sayfasındaki alt grup
 * filtresi (`?grup=`) ve `/urunler` mobil kategori filtresi (`?kategori=`)
 * AYNI görsel bileşeni paylaşır. Server Component: "aktif" durum çağıran
 * tarafından (zaten sunucuda bilinen `searchParams`'tan) hesaplanıp verilir,
 * client state gerekmez. Masaüstünde taşarsa/mobilde `hide-scrollbar` ile
 * kaba bir scrollbar göstermeden yatay kaydırılabilir.
 */
export function PillNav({ items, ariaLabel }: { items: PillNavItem[]; ariaLabel: string }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label={ariaLabel} className="-mx-1">
      <ul className="hide-scrollbar flex items-center gap-2 overflow-x-auto px-1 pb-1">
        {items.map((item) => (
          <li key={item.key} className="shrink-0">
            <Link
              href={item.href}
              aria-current={item.active ? "true" : undefined}
              className={`focus-visible:outline-brand inline-flex min-h-9 items-center justify-center rounded-full border px-3.5 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${
                item.active
                  ? "bg-brand border-brand text-brand-foreground"
                  : "border-border-muted text-foreground/70 hover:border-brand hover:text-brand"
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
