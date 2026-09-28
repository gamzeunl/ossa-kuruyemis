"use client";

import { useState } from "react";
import { BagIcon } from "@/components/ui/icons";
import { useCartStore } from "@/stores/cart-store";
import type { BundleOfferDisplay, ProductVariantSummary } from "@/types/catalog";

interface AddBundleToCartButtonProps {
  offer: BundleOfferDisplay;
  primaryProductImage: string | null;
  primaryVariant: ProductVariantSummary;
}

/**
 * Sabit 1 ana + 1 tamamlayıcı ekler — üstteki asıl satın alma panelinin
 * varyant/adet seçiminden bağımsızdır (kampanya admin tarafından
 * tanımlanmış SABİT bir varyant çiftidir). `bundlePrice` yalnızca GÖSTERİM
 * ipucudur; sipariş oluşturma sunucuda `variantId`+`quantity` çiftinden
 * bağımsız olarak yeniden doğrulanır — bu buton hiçbir fiyatı sunucuya
 * "göndermez", yalnızca sepete iki satır ekler.
 */
export function AddBundleToCartButton({
  offer,
  primaryProductImage,
  primaryVariant,
}: AddBundleToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [justAdded, setJustAdded] = useState(false);

  function handleAdd() {
    addItem({
      productId: offer.primaryProductId,
      variantId: primaryVariant.id,
      slug: offer.primaryProductSlug,
      name: offer.primaryProductName,
      image: primaryProductImage,
      variantName: primaryVariant.name,
      unitPrice: primaryVariant.effectivePrice,
    });
    addItem({
      productId: offer.companionProductId,
      variantId: offer.companionVariantId,
      slug: offer.companionProductSlug,
      name: offer.companionProductName,
      image: offer.companionImage?.url ?? null,
      variantName: offer.companionVariantName,
      unitPrice: offer.companionRegularPrice,
      bundleOfferId: offer.id,
      bundlePrimaryVariantId: offer.primaryVariantId,
      bundlePrice: offer.companionBundlePrice,
    });
    setJustAdded(true);
  }

  return (
    <button
      type="button"
      onClick={handleAdd}
      className="group bg-brown-dark hover:bg-brand-dark inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold whitespace-nowrap text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
    >
      {justAdded ? (
        "Sepete Eklendi ✓"
      ) : (
        <>
          <BagIcon aria-hidden="true" className="h-4 w-4 shrink-0" />
          İkisini Birlikte Sepete Ekle
          <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
            →
          </span>
        </>
      )}
    </button>
  );
}
