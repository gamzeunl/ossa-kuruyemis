"use client";

import { useState } from "react";
import { BagIcon, LeafIcon, ShieldIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/format-money";
import { formatVariantWeight } from "@/lib/format-weight";
import { useCartStore } from "@/stores/cart-store";
import type { ProductVariantSummary } from "@/types/catalog";

const MAX_QUANTITY = 10;

const trustBadges = [
  { icon: BagIcon, label: "Özenli Paketleme" },
  { icon: ShieldIcon, label: "Güvenli Ödeme" },
  { icon: LeafIcon, label: "Taze Ürün Garantisi" },
];

function variantLabel(variant: ProductVariantSummary): string {
  return formatVariantWeight(variant.weightGram) ?? variant.name;
}

interface ProductPurchasePanelProps {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  variants: ProductVariantSummary[];
  /** Kartlarla tutarlı olsun diye aynı seçim mantığı (`pickDefaultVariant`) yeniden kullanılır. */
  defaultVariantId: string | null;
}

export function ProductPurchasePanel({
  productId,
  slug,
  name,
  image,
  variants,
  defaultVariantId,
}: ProductPurchasePanelProps) {
  const addItem = useCartStore((state) => state.addItem);
  const [selectedVariantId, setSelectedVariantId] = useState(
    defaultVariantId ?? variants[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? null;
  const isAvailable = selectedVariant?.isAvailable ?? false;

  function handleSelectVariant(variant: ProductVariantSummary) {
    setSelectedVariantId(variant.id);
    setQuantity(1);
    setJustAdded(false);
  }

  function handleAddToCart() {
    if (!selectedVariant || !isAvailable) {
      return;
    }
    addItem({
      productId,
      variantId: selectedVariant.id,
      slug,
      name,
      image,
      variantName: selectedVariant.name,
      unitPrice: selectedVariant.effectivePrice,
      quantity,
    });
    setJustAdded(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="border-border-muted bg-surface flex flex-col gap-5 rounded-2xl border p-5 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-3">
            <p className="text-brand text-3xl font-bold sm:text-4xl">
              {selectedVariant ? formatPrice(selectedVariant.effectivePrice) : "Fiyat bilgisi yok"}
            </p>
            {selectedVariant?.hasActiveDiscount ? (
              <p className="text-foreground/40 text-base font-medium line-through">
                {formatPrice(selectedVariant.regularPrice)}
              </p>
            ) : null}
          </div>
          {selectedVariant?.discountPercentage ? (
            <span className="bg-brand text-brand-foreground w-fit rounded-full px-2.5 py-1 text-xs font-semibold">
              %{selectedVariant.discountPercentage} indirim
            </span>
          ) : null}
          {selectedVariant?.stockStatus === "OUT_OF_STOCK" ? (
            <span className="w-fit text-sm font-semibold text-red-700">Tükendi</span>
          ) : null}
        </div>

        {variants.length > 0 ? (
          <div className="flex flex-col gap-2">
            <span className="text-foreground text-sm font-semibold">Gramaj</span>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => {
                const isSelected = variant.id === selectedVariantId;
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={!variant.isAvailable}
                    onClick={() => handleSelectVariant(variant)}
                    aria-pressed={isSelected}
                    className={`rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      isSelected
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border-muted text-foreground hover:border-brand"
                    }`}
                  >
                    {variantLabel(variant)}
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="flex flex-col gap-2">
          <span className="text-foreground text-sm font-semibold">Adet</span>
          <div className="border-border-muted flex w-fit items-center rounded-full border">
            <button
              type="button"
              onClick={() => {
                setQuantity((value) => Math.max(1, value - 1));
                setJustAdded(false);
              }}
              disabled={quantity <= 1}
              aria-label="Adedi azalt"
              className="text-foreground flex h-11 w-11 items-center justify-center text-lg font-semibold disabled:opacity-30"
            >
              –
            </button>
            <span className="w-10 text-center text-sm font-semibold" aria-live="polite">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => {
                setQuantity((value) => Math.min(MAX_QUANTITY, value + 1));
                setJustAdded(false);
              }}
              disabled={quantity >= MAX_QUANTITY}
              aria-label="Adedi artır"
              className="text-foreground flex h-11 w-11 items-center justify-center text-lg font-semibold disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={!isAvailable}
          className={`bg-brand text-brand-foreground w-full rounded-full px-6 py-3.5 text-base font-bold whitespace-nowrap transition-all duration-250 ${
            isAvailable ? "hover:bg-brand-dark hover:-translate-y-0.5" : "cursor-not-allowed opacity-50"
          }`}
        >
          {!isAvailable ? "Tükendi" : justAdded ? "Sepete Eklendi ✓" : "Sepete Ekle"}
        </button>
      </div>

      <div className="border-border-muted bg-surface divide-border-muted flex divide-x rounded-xl border">
        {trustBadges.map((badge) => (
          <div key={badge.label} className="flex flex-1 flex-col items-center gap-1 px-2 py-2.5 text-center">
            <badge.icon className="text-brand h-4 w-4" />
            <span className="text-foreground/70 text-[11px] leading-tight font-medium">{badge.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
