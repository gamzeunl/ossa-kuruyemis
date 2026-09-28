import Link from "next/link";
import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { ProductBadgePills } from "@/components/catalog/product-badge-pills";
import { ProductImage } from "@/components/catalog/product-image";
import { formatShortDateTime } from "@/lib/format-date";
import { formatPrice } from "@/lib/format-money";
import { formatVariantWeight } from "@/lib/format-weight";
import type { ProductSummary } from "@/types/catalog";

interface ProductListCardProps {
  product: ProductSummary;
  /** Bu ürün geçerli kullanıcının favorisinde mi — sayfa kendi mevcut veri
   * çekme noktasında TEK sorguyla (`listFavoritedProductIdSet`) çözer. */
  isFavorited?: boolean;
  isLoggedIn?: boolean;
  /** "Kaçırılmayacak Fırsatlar" vitrini için: gerçek aktif indirimde küçük
   * "Fırsat" etiketi + belirgin yüzde + (varsa) bitiş zamanı gösterir. İkinci
   * bir kart sistemi DEĞİL, bu bileşenin opsiyonel, geriye-dönük-uyumlu bir genişlemesidir. */
  highlightDeal?: boolean;
}

/**
 * Katalogdaki TEK ürün kartı bileşeni — ana sayfa vitrinleri (`ProductShelf`),
 * kategori/`/urunler` listeleri ve PDP "Benzer Ürünler" hepsi bunu kullanır.
 * Ürün detayına giden `Link` bu bileşenin kendi içinde yönetilir — dışarıdan
 * ayrıca bir `Link` ile sarmalanmamalıdır (iç içe `<a>` oluşur).
 */
export function ProductListCard({
  product,
  isFavorited = false,
  isLoggedIn = false,
  highlightDeal = false,
}: ProductListCardProps) {
  const href = `/urunler/${product.slug}`;
  // Rozet/indirim gösterimi yalnızca indirimli varyant AYNI ZAMANDA kartın
  // başlık fiyatını (`minPrice`) üretiyorsa yapılır — farklı bir varyantın
  // indirimi, gösterilen fiyatla tutarsız bir üstü-çizili rakam oluşturmaz.
  const hasVisibleDiscount =
    product.defaultVariant?.hasActiveDiscount &&
    product.defaultVariant.effectivePrice === product.minPrice;
  const visibleRegularPrice = hasVisibleDiscount ? product.defaultVariant!.regularPrice : null;
  const weightLabel = product.defaultVariant ? formatVariantWeight(product.defaultVariant.weightGram) : null;
  const showDeal = highlightDeal && hasVisibleDiscount;
  // Fırsat vitrininde (`ProductShelf variant="deal"`) kart aynı bileşen kalır,
  // yalnızca ince bir marka rengi çerçevesiyle normal ürün gridinden ayrışır —
  // ikinci bir kart sistemi OLUŞTURULMAZ.
  const cardBorderClassName = showDeal ? "border-brand/30 hover:border-brand/60" : "border-border-muted";

  return (
    <article
      className={`group ${cardBorderClassName} bg-surface flex h-full flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}
    >
      <Link href={href} className="bg-surface-muted relative block aspect-square overflow-hidden">
        <ProductImage
          src={product.primaryImage?.url ?? null}
          alt={product.primaryImage?.altText ?? product.name}
          sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className={`object-cover transition-transform duration-300 group-hover:scale-105 ${product.isOutOfStock ? "opacity-60 grayscale" : ""}`}
        />
        {product.isOutOfStock ? (
          <span className="bg-foreground/80 text-surface pointer-events-none absolute top-2 right-2 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap shadow-sm">
            Tükendi
          </span>
        ) : null}
        <ProductBadgePills badges={product.badges} />
        <FavoriteButton
          productId={product.id}
          productPath={href}
          initialFavorited={isFavorited}
          isLoggedIn={isLoggedIn}
        />
      </Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <h3 className="text-foreground group-hover:text-brand line-clamp-2 text-sm font-semibold transition-colors sm:text-[15px]">
          <Link href={href}>{product.name}</Link>
        </h3>
        {weightLabel ? <p className="text-foreground/50 text-xs">{weightLabel}</p> : null}

        <div className="mt-auto flex flex-col gap-3 pt-3">
          {showDeal ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="bg-brand text-brand-foreground rounded-full px-2 py-0.5 text-[11px] font-bold whitespace-nowrap">
                Fırsat
              </span>
              {product.defaultVariant?.discountPercentage ? (
                <span className="text-brand text-xs font-bold">
                  %{product.defaultVariant.discountPercentage} indirim
                </span>
              ) : null}
            </div>
          ) : null}

          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <p
              className={`text-brand font-bold ${showDeal ? "text-lg sm:text-xl" : "text-base sm:text-lg"}`}
            >
              {product.minPrice ? formatPrice(product.minPrice) : "Fiyat bilgisi yok"}
            </p>
            {visibleRegularPrice ? (
              <p className={`text-foreground/40 font-medium line-through ${showDeal ? "text-sm" : "text-xs"}`}>
                {formatPrice(visibleRegularPrice)}
              </p>
            ) : null}
          </div>

          {showDeal && product.defaultVariant?.discountEndsAt ? (
            <p className="text-foreground/50 text-[11px]">
              Son fırsat: {formatShortDateTime(product.defaultVariant.discountEndsAt)}
            </p>
          ) : null}

          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}
