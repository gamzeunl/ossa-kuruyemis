import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";

interface CategoryCardProps {
  href: string;
  name: string;
  imageUrl: string | null;
  imageAlt?: string | null;
}

/**
 * Ana Kategoriler kartı — görsel kartın TAMAMINI kaplar, kategori adı görsel
 * üzerinde alt-gradient üstünde beyaz metinle gösterilir (mekanik katalog
 * hissi yerine premium/editorial görünüm). "Popüler Seçimler" kartından
 * (`popular-group-card.tsx`) BİLİNÇLİ olarak farklı tasarımdır.
 */
export function CategoryCard({ href, name, imageUrl, imageAlt }: CategoryCardProps) {
  return (
    <Link
      href={href}
      className="group border-border-muted relative flex aspect-3/4 w-full overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <ProductImage
        src={imageUrl}
        alt={imageAlt ?? name}
        sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

      <div className="relative z-10 mt-auto flex w-full flex-col gap-0.5 p-4">
        <h3 className="line-clamp-2 text-sm leading-snug font-bold text-white sm:text-base">{name}</h3>
        <span className="text-gold-light inline-flex items-center gap-1 text-xs font-semibold">
          Keşfet
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
