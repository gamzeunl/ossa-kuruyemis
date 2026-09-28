"use client";

import { BagIcon } from "@/components/ui/icons";
import { useCartHydrated, useCartStore } from "@/stores/cart-store";

/** Header'daki sepet ikonu — canlı ürün sayısı gösterir, tıklanınca Mini Cart açılır. */
export function CartTrigger() {
  const hydrated = useCartHydrated();
  const rawItemCount = useCartStore((state) => state.getItemCount());
  const openDrawer = useCartStore((state) => state.openDrawer);
  // İlk client render'ı sunucuyla (her zaman 0) eşleşsin diye rehydrate
  // tamamlanana kadar 0 gösterilir — hydration mismatch'i önler (bkz. `useCartHydrated`).
  const itemCount = hydrated ? rawItemCount : 0;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={itemCount > 0 ? `Sepetim, ${itemCount} ürün` : "Sepetim"}
      className="group hover:bg-surface-muted relative flex min-h-[50px] items-center gap-2 rounded-xl px-2.5 transition-colors sm:px-3"
    >
      <span className="border-border-muted group-hover:border-brand flex h-10 w-10 items-center justify-center rounded-full border bg-white transition-colors">
        <BagIcon className="text-brand h-5.5 w-5.5" />

        {itemCount > 0 ? (
          <span className="bg-brand text-brand-foreground absolute top-0.5 left-9 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold sm:left-10">
            {itemCount > 99 ? "99+" : itemCount}
          </span>
        ) : null}
      </span>

      <span className="hidden leading-tight lg:block">
        <span className="text-muted-text block text-[11px] font-medium">Sepet</span>
        <span className="text-foreground block text-sm font-bold">Sepetim</span>
      </span>
    </button>
  );
}
