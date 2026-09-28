import type { ProductBadge, ProductBadgeKey } from "@/lib/product-badges";

const BADGE_STYLES: Record<ProductBadgeKey, string> = {
  // Çok hafif, sürekli bir "kampanya" vurgusu — yalnızca indirim rozetinde.
  discount: "bg-brand text-brand-foreground animate-[badge-pulse-glow_2.4s_ease-in-out_infinite]",
  recommended: "bg-gold text-gold-foreground",
  bestSeller: "bg-surface-muted text-foreground border border-border-muted",
  new: "bg-surface/90 text-foreground/70 border border-border-muted",
};

/**
 * Rozet pillerinin TEK render kaynağı — `ProductCard`/`ProductListCard`/PDP
 * satın alma paneli aynı bileşeni kullanır, stil tekrar edilmez. Rozet
 * seçim/öncelik mantığı burada DEĞİL, `resolveProductBadges`'tedir (`@/lib/product-badges`)
 * — bu bileşen yalnızca sonucu render eder.
 */
interface ProductBadgePillsProps {
  badges: ProductBadge[];
  /** `true`: PDP başlık alanı gibi statik/inline yerleşim (bindirme yok). Varsayılan `false` — kart görseli üzerine bindirme. */
  inline?: boolean;
}

export function ProductBadgePills({ badges, inline = false }: ProductBadgePillsProps) {
  if (badges.length === 0) {
    return null;
  }

  const wrapperClassName = inline
    ? "flex flex-wrap gap-1.5"
    : "pointer-events-none absolute top-2 left-2 flex flex-wrap gap-1.5";

  return (
    <div className={wrapperClassName}>
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shadow-sm ${BADGE_STYLES[badge.key]}`}
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}
