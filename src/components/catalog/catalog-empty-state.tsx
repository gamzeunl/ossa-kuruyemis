import Link from "next/link";
import { LeafIcon } from "@/components/ui/icons";

interface CatalogEmptyStateProps {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}

/**
 * Kategori/grup/filtre sonucunda ürün yoksa gösterilen ortak, kaliteli boş
 * durum — `ProductImage`'in placeholder deseniyle tutarlı `LeafIcon` ikonu +
 * mesaj + opsiyonel CTA. Boş beyaz alan yerine kullanılır.
 */
export function CatalogEmptyState({ message, ctaLabel, ctaHref }: CatalogEmptyStateProps) {
  return (
    <div
      role="status"
      className="border-border-muted bg-surface-muted flex flex-col items-center gap-3 rounded-2xl border p-10 text-center"
    >
      <span className="bg-brand/10 text-brand flex h-12 w-12 items-center justify-center rounded-full">
        <LeafIcon aria-hidden="true" className="h-6 w-6" />
      </span>
      <p className="text-foreground/70 text-sm">{message}</p>
      {ctaLabel && ctaHref ? (
        <Link
          href={ctaHref}
          className="border-brand text-brand hover:bg-brand hover:text-brand-foreground mt-1 inline-flex min-h-10 items-center justify-center rounded-full border px-5 text-sm font-semibold transition-colors"
        >
          {ctaLabel}
        </Link>
      ) : null}
    </div>
  );
}
