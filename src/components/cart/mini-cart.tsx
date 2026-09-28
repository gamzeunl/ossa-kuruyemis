"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ProductImage } from "@/components/catalog/product-image";
import { formatPrice } from "@/lib/format-money";
import { getCartItemLineTotal, resolveCartItemUnitPrice, useCartHydrated, useCartStore } from "@/stores/cart-store";

export function MiniCart() {
  const hydrated = useCartHydrated();
  const isOpen = useCartStore((state) => state.isDrawerOpen);
  const rawItems = useCartStore((state) => state.items);
  const closeDrawer = useCartStore((state) => state.closeDrawer);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const rawSubtotal = useCartStore((state) => state.getSubtotal());
  // Rehydrate tamamlanana kadar sunucuyla eşleşen boş sepet gösterilir —
  // hydration mismatch'i önler (bkz. `useCartHydrated`). Drawer kapalıyken
  // bile bu içerik DOM'dadır (yalnızca görsel olarak kaydırılmıştır), bu
  // yüzden ilk render'da gerçek/uyumsuz veri sızdırmamak önemlidir.
  const items = hydrated ? rawItems : [];
  const subtotal = hydrated ? rawSubtotal : 0;

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDrawer();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeDrawer]);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-100 overflow-hidden ${isOpen ? "" : "pointer-events-none"}`}
    >
      <div
        onClick={closeDrawer}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sepetim"
        className={`bg-background absolute top-0 right-0 flex h-full w-full max-w-[420px] flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="border-border-muted flex items-center justify-between border-b p-5">
          <h2 className="text-foreground text-lg font-bold">Sepetim ({items.length})</h2>
          <button
            type="button"
            onClick={closeDrawer}
            aria-label="Kapat"
            className="text-foreground/60 hover:text-foreground text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="text-foreground/60 text-sm">Sepetiniz boş.</p>
            <Link
              href="/urunler"
              onClick={closeDrawer}
              className="text-brand text-sm font-semibold underline underline-offset-2"
            >
              Alışverişe Başla
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
              {items.map((item) => {
                const bundleUnitPrice = resolveCartItemUnitPrice(item, items);
                const isBundleApplied = Boolean(item.bundleOfferId) && bundleUnitPrice < Number(item.unitPrice);
                return (
                <li key={item.variantId} className="flex gap-3">
                  <div className="bg-surface-muted relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                    <ProductImage src={item.image} alt={item.name} sizes="80px" className="object-cover" />
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="text-foreground line-clamp-2 text-sm font-medium">{item.name}</p>
                    <p className="text-foreground/50 text-xs">{item.variantName}</p>
                    {isBundleApplied ? (
                      <span className="bg-brand/10 text-brand w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        Birlikte Al Fırsatı
                      </span>
                    ) : null}

                    <div className="mt-auto flex items-center justify-between gap-2">
                      <div className="border-border-muted flex items-center rounded-full border">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.variantId)}
                          disabled={item.quantity <= 1}
                          aria-label="Adedi azalt"
                          className="flex h-8 w-8 items-center justify-center text-sm disabled:opacity-30"
                        >
                          –
                        </button>
                        <span className="w-6 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => increaseQuantity(item.variantId)}
                          aria-label="Adedi artır"
                          className="flex h-8 w-8 items-center justify-center text-sm"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-brand text-sm font-bold">
                        {formatPrice(getCartItemLineTotal(item, items).toFixed(2))}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.variantId)}
                    aria-label={`${item.name} ürününü sepetten kaldır`}
                    className="text-foreground/40 self-start text-xs font-medium hover:text-red-600"
                  >
                    Sil
                  </button>
                </li>
                );
              })}
            </ul>

            <div className="border-border-muted flex flex-col gap-3 border-t p-5">
              <div className="flex items-center justify-between">
                <span className="text-foreground/70 text-sm font-medium">Ara Toplam</span>
                <span className="text-foreground text-lg font-bold">
                  {formatPrice(subtotal.toFixed(2))}
                </span>
              </div>
              <Link
                href="/sepet"
                onClick={closeDrawer}
                className="bg-brand text-brand-foreground w-full rounded-full px-6 py-3.5 text-center text-sm font-bold"
              >
                Sepete Git
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
