import Link from "next/link";
import { getCategoryDisplayName } from "@/lib/category-display";
import { getCategoryHref } from "@/lib/category-routes";
import type { CategorySummary } from "@/types/catalog";

interface ProductFiltersProps {
  categories: CategorySummary[];
  activeCategorySlug?: string;
  /** Mobilde kategori seçimi artık üstteki `PillNav`'da yapıldığında (bkz.
   * `/urunler`), aynı listenin burada tekrarlanmaması için. */
  hideCategories?: boolean;
}

function categoryLinkClassName(active: boolean): string {
  const base = "block rounded-lg px-3 py-2 text-sm font-medium transition-colors";
  return active
    ? `${base} bg-brand text-brand-foreground`
    : `${base} text-foreground/70 hover:bg-surface-muted hover:text-foreground`;
}

const weightOptions = ["250 g", "500 g", "1 kg"];

/**
 * Sol filtre paneli. "Kategoriler" artık kendi okunabilir sayfasına
 * (`getCategoryHref`) doğrudan yönlendirir — `/urunler` içinde filtre
 * uygulamaz. Fiyat/Gramaj henüz bağlı değil, bu yüzden `disabled` + "Yakında"
 * olarak gösterilir (Sepetim/Favoriler ile aynı desen). Stok bilgisi müşteri
 * tarafında hiç kullanılmadığından burada stok filtresi/göstergesi YOKTUR —
 * yalnızca sunucu tarafı sipariş/stok kontrolleri (bkz. `checkout.ts`) korunur.
 */
export function ProductFilters({
  categories,
  activeCategorySlug,
  hideCategories = false,
}: ProductFiltersProps) {
  return (
    <aside className="flex flex-col gap-6">
      {!hideCategories ? (
        <div>
          <h2 className="text-foreground mb-3 text-sm font-bold tracking-wide uppercase">
            Kategoriler
          </h2>
          <ul className="flex flex-col gap-1">
            <li>
              <Link href="/urunler" className={categoryLinkClassName(!activeCategorySlug)}>
                Tüm Ürünler
              </Link>
            </li>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={getCategoryHref(category.slug)}
                  className={categoryLinkClassName(activeCategorySlug === category.slug)}
                >
                  {getCategoryDisplayName(category)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="border-border-muted border-t pt-6 first:border-t-0 first:pt-0">
        <h2 className="text-foreground mb-3 text-sm font-bold tracking-wide uppercase">Fiyat</h2>
        <div className="flex items-center gap-2" title="Yakında kullanıma açılacak">
          <input
            type="number"
            disabled
            aria-disabled="true"
            placeholder="Min"
            className="border-border-muted text-foreground/50 w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-current"
          />
          <span className="text-foreground/30" aria-hidden="true">
            –
          </span>
          <input
            type="number"
            disabled
            aria-disabled="true"
            placeholder="Maks"
            className="border-border-muted text-foreground/50 w-full rounded-lg border bg-white px-3 py-2 text-sm placeholder:text-current"
          />
        </div>
      </div>

      <div className="border-border-muted border-t pt-6">
        <h2 className="text-foreground mb-3 text-sm font-bold tracking-wide uppercase">Gramaj</h2>
        <div className="flex flex-col gap-2" title="Yakında kullanıma açılacak">
          {weightOptions.map((label) => (
            <label
              key={label}
              className="text-foreground/50 flex cursor-not-allowed items-center gap-2 text-sm"
            >
              <input type="checkbox" disabled aria-disabled="true" />
              {label}
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
}
