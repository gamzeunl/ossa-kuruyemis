"use client";

import type { MouseEvent } from "react";
import { useCartStore } from "@/stores/cart-store";
import type { ProductSummary } from "@/types/catalog";

/**
 * `ProductListCard`'daki "Sepete Ekle" — ürünün varsayılan varyantını sepete ekler.
 * Kart bazen bir `Link` içine sarmalanır (ör. PDP "Benzer Ürünler"); tıklama
 * olayının üst `Link`'e sızıp sayfa yönlendirmesi tetiklememesi için durdurulur.
 */
export function AddToCartButton({ product }: { product: ProductSummary }) {
  const addItem = useCartStore((state) => state.addItem);
  const variant = product.defaultVariant;
  const isAvailable = variant?.isAvailable ?? false;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (!variant || !isAvailable) {
      return;
    }
    addItem({
      productId: product.id,
      variantId: variant.id,
      slug: product.slug,
      name: product.name,
      image: product.primaryImage?.url ?? null,
      variantName: variant.name,
      unitPrice: variant.effectivePrice,
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isAvailable}
      className="bg-brand text-brand-foreground hover:bg-brand-dark w-full rounded-full px-3 py-2.5 text-xs font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:bg-foreground/20 disabled:text-foreground/50"
    >
      {isAvailable ? "Sepete Ekle" : "Tükendi"}
    </button>
  );
}
