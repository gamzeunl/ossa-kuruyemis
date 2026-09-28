"use client";

import Link from "next/link";
import { ProductImage } from "@/components/catalog/product-image";
import { BagIcon } from "@/components/ui/icons";
import {
  computeOrderTotal,
  formatShippingFee,
  resolveShippingFee,
  SHIPPING_FEE_PENDING_MESSAGE,
  type ShippingSettings,
} from "@/lib/checkout-shipping";
import { formatPrice } from "@/lib/format-money";
import { getCartItemLineTotal, resolveCartItemUnitPrice, useCartHydrated, useCartStore } from "@/stores/cart-store";

const MAX_QUANTITY = 10;

interface CartPageContentProps {
  shippingSettings: ShippingSettings;
}

function FreeShippingProgress({
  subtotal,
  shippingSettings,
}: {
  subtotal: number;
  shippingSettings: ShippingSettings;
}) {
  const threshold = shippingSettings.freeShippingThreshold;
  if (threshold === null) {
    return null;
  }

  const remaining = Math.max(0, threshold - subtotal);
  const percent = Math.min(100, Math.round((subtotal / threshold) * 100));

  return (
    <div className="flex flex-col gap-2">
      <p className="text-foreground text-sm font-medium">
        {remaining > 0 ? (
          <>Ücretsiz kargoya {formatPrice(remaining.toFixed(2))} kaldı</>
        ) : (
          "Ücretsiz kargo kazandınız."
        )}
      </p>
      <div className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full">
        <div className="bg-brand h-full rounded-full transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function CartPageContent({ shippingSettings }: CartPageContentProps) {
  const hydrated = useCartHydrated();
  const rawItems = useCartStore((state) => state.items);
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const rawSubtotal = useCartStore((state) => state.getSubtotal());
  // Rehydrate tamamlanana kadar sunucuyla eşleşen boş sepet gösterilir —
  // hydration mismatch'i önler (bkz. `useCartHydrated`).
  const items = hydrated ? rawItems : [];
  const subtotal = hydrated ? rawSubtotal : 0;

  if (items.length === 0) {
    return (
      <div className="border-border-muted bg-surface flex flex-col items-center gap-4 rounded-2xl border p-14 text-center shadow-sm">
        <span className="bg-surface-muted flex h-14 w-14 items-center justify-center rounded-full">
          <BagIcon className="text-foreground/40 h-7 w-7" />
        </span>
        <div className="flex flex-col gap-1">
          <p className="text-foreground text-base font-semibold">Sepetiniz boş.</p>
          <p className="text-foreground/60 text-sm">Beğendiğiniz ürünleri sepetinize ekleyerek alışverişe başlayın.</p>
        </div>
        <Link
          href="/urunler"
          className="bg-brand text-brand-foreground hover:bg-brand-dark mt-1 inline-flex min-h-11 items-center justify-center rounded-full px-7 text-sm font-bold transition-colors"
        >
          Alışverişe Başla
        </Link>
      </div>
    );
  }

  const shipping = resolveShippingFee(shippingSettings, subtotal);
  const total = computeOrderTotal(subtotal, shipping);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      <ul className="flex flex-col gap-4">
        {items.map((item) => {
          const bundleUnitPrice = resolveCartItemUnitPrice(item, items);
          const isBundleApplied = Boolean(item.bundleOfferId) && bundleUnitPrice < Number(item.unitPrice);
          return (
          <li
            key={item.variantId}
            className="border-border-muted bg-surface flex gap-4 rounded-2xl border p-4 shadow-sm sm:p-5"
          >
            <div className="bg-surface-muted relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
              <ProductImage src={item.image} alt={item.name} sizes="96px" className="object-cover" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/urunler/${item.slug}`}
                    className="text-foreground hover:text-brand line-clamp-2 text-sm font-semibold transition-colors wrap-break-word"
                  >
                    {item.name}
                  </Link>
                  <p className="text-foreground/50 text-xs">{item.variantName}</p>
                  {isBundleApplied ? (
                    <div className="mt-1 flex flex-col gap-0.5">
                      <span className="bg-brand/10 text-brand w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold">
                        Birlikte Al Fırsatı
                      </span>
                      <p className="text-xs">
                        <span className="text-foreground/40 line-through">{formatPrice(item.unitPrice)}</span>{" "}
                        <span className="text-brand font-semibold">{formatPrice(bundleUnitPrice.toFixed(2))}</span> /
                        adet
                      </p>
                    </div>
                  ) : (
                    <p className="text-foreground/60 mt-0.5 text-xs">{formatPrice(item.unitPrice)} / adet</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  aria-label={`${item.name} ürününü sepetten kaldır`}
                  className="text-foreground/40 shrink-0 text-xs font-medium hover:text-red-600"
                >
                  Sil
                </button>
              </div>

              <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                <div className="border-border-muted flex items-center rounded-full border">
                  <button
                    type="button"
                    onClick={() => decreaseQuantity(item.variantId)}
                    disabled={item.quantity <= 1}
                    aria-label="Adedi azalt"
                    className="flex h-9 w-9 items-center justify-center text-base disabled:opacity-30"
                  >
                    –
                  </button>
                  <span className="w-8 text-center text-sm font-semibold" aria-live="polite">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => increaseQuantity(item.variantId)}
                    disabled={item.quantity >= MAX_QUANTITY}
                    aria-label="Adedi artır"
                    className="flex h-9 w-9 items-center justify-center text-base disabled:opacity-30"
                  >
                    +
                  </button>
                </div>

                <p className="text-brand text-base font-bold">
                  {formatPrice(getCartItemLineTotal(item, items).toFixed(2))}
                </p>
              </div>
            </div>
          </li>
          );
        })}
      </ul>

      <aside className="border-border-muted bg-surface lg:sticky lg:top-6 flex h-fit flex-col gap-5 rounded-2xl border p-6 shadow-sm">
        <h2 className="text-foreground text-base font-bold">Sipariş Özeti</h2>

        <FreeShippingProgress subtotal={subtotal} shippingSettings={shippingSettings} />

        <div className="border-border-muted flex flex-col gap-2 border-t pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground/70">Ara Toplam</span>
            <span className="text-foreground font-medium">{formatPrice(subtotal.toFixed(2))}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/70">Kargo</span>
            <span className="text-foreground font-medium">{formatShippingFee(shipping)}</span>
          </div>
        </div>

        <div className="border-border-muted bg-surface-muted -mx-6 -mb-6 flex items-center justify-between rounded-b-2xl border-t px-6 py-4">
          <span className="text-foreground text-sm font-semibold">Genel Toplam</span>
          <span className="text-brand text-xl font-bold">
            {total !== null ? formatPrice(total.toFixed(2)) : "Henüz belirlenmedi"}
          </span>
        </div>

        {total === null ? (
          <p role="status" className="text-foreground/60 -mt-3 text-xs leading-5">
            {SHIPPING_FEE_PENDING_MESSAGE}
          </p>
        ) : null}

        <div className="flex flex-col gap-2.5">
          <Link
            href="/odeme"
            className="bg-brand text-brand-foreground hover:bg-brand-dark w-full rounded-full px-6 py-3.5 text-center text-sm font-bold transition-colors"
          >
            Alışverişi Tamamla
          </Link>
          <Link
            href="/urunler"
            className="border-border-muted text-foreground hover:border-brand w-full rounded-full border px-6 py-3 text-center text-sm font-semibold transition-colors"
          >
            Alışverişe Devam Et
          </Link>
        </div>
      </aside>
    </div>
  );
}
