import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";

interface PopularGroupCardProps {
  href: string;
  label: string;
  categoryName: string | null;
  imageUrl: string | null;
}

/**
 * "Popüler Seçimler" kartı — Ana Kategoriler'in (`category-card.tsx`, tam
 * kaplayan görsel+overlay) tam tersine, yatay/4:3 görsel + metin ALTTA kart
 * tasarımıdır; bilinçli olarak farklı görünür. Kartın TAMAMI tıklanabilir.
 */
export function PopularGroupCard({ href, label, categoryName, imageUrl }: PopularGroupCardProps) {
  return (
    <Link
      href={href}
      className="group border-border-muted bg-surface hover:border-brand/50 flex flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
    >
      <div className="bg-surface-muted relative aspect-4/3 w-full overflow-hidden">
        <ProductImage
          src={imageUrl}
          alt={label}
          sizes="(min-width: 1024px) 22vw, (min-width: 640px) 25vw, 45vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-col gap-0.5 p-3">
        {categoryName ? (
          <span className="text-muted-text text-[10px] font-semibold tracking-wide uppercase">{categoryName}</span>
        ) : null}
        <h3 className="text-foreground group-hover:text-brand line-clamp-2 text-sm leading-snug font-semibold transition-colors">
          {label}
        </h3>
        <span className="text-brand mt-0.5 inline-flex items-center gap-1 text-xs font-semibold">
          Keşfet
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
