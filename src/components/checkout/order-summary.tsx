"use client";

import { ProductImage } from "@/components/catalog/product-image";
import { PaymentTrustStrip } from "@/components/checkout/payment-trust-strip";
import {
  computeOrderTotal,
  formatShippingFee,
  resolveShippingFee,
  SHIPPING_FEE_PENDING_MESSAGE,
  type ShippingSettings,
} from "@/lib/checkout-shipping";
import { formatPrice } from "@/lib/format-money";
import { getCartItemLineTotal, resolveCartItemUnitPrice, useCartHydrated, useCartStore } from "@/stores/cart-store";

interface OrderSummaryProps {
  shippingSettings: ShippingSettings;
  isIyzicoConfigured: boolean;
}

export function OrderSummary({ shippingSettings, isIyzicoConfigured }: OrderSummaryProps) {
  const hydrated = useCartHydrated();
  const rawItems = useCartStore((state) => state.items);
  const rawSubtotal = useCartStore((state) => state.getSubtotal());
  // Rehydrate tamamlanana kadar sunucuyla eşleşen boş sepet gösterilir —
  // hydration mismatch'i önler (bkz. `useCartHydrated`). Sipariş toplamı
  // yine de her zaman sunucuda (`createDraftOrder`) yeniden hesaplanır.
  const items = hydrated ? rawItems : [];
  const subtotal = hydrated ? rawSubtotal : 0;
  const shipping = resolveShippingFee(shippingSettings, subtotal);
  // Yalnızca istemci tarafı gösterim — ödeme adımında sunucuda yeniden hesaplanmalı.
  const total = computeOrderTotal(subtotal, shipping);

  return (
    <aside className="border-border-muted bg-surface lg:sticky lg:top-6 flex h-fit flex-col gap-5 rounded-2xl border p-6 shadow-sm">
      <h2 className="text-foreground text-base font-bold">Sipariş Özeti</h2>

      <ul className="flex flex-col gap-4">
        {items.map((item) => {
          const bundleUnitPrice = resolveCartItemUnitPrice(item, items);
          const isBundleApplied = Boolean(item.bundleOfferId) && bundleUnitPrice < Number(item.unitPrice);
          return (
          <li key={item.variantId} className="flex gap-3">
            <div className="bg-surface-muted border-border-muted relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border">
              <ProductImage src={item.image} alt={item.name} sizes="64px" className="object-cover" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="text-foreground line-clamp-2 text-sm font-medium">{item.name}</p>
              <p className="text-foreground/50 text-xs">
                {item.variantName} · {item.quantity} adet
              </p>
              {isBundleApplied ? (
                <div className="flex items-center gap-1.5">
                  <span className="bg-brand/10 text-brand rounded-full px-1.5 py-0.5 text-[10px] font-semibold">
                    Birlikte Al Fırsatı
                  </span>
                  <p className="text-xs">
                    <span className="text-foreground/40 line-through">{formatPrice(item.unitPrice)}</span>{" "}
                    <span className="text-brand font-semibold">{formatPrice(bundleUnitPrice.toFixed(2))}</span> / adet
                  </p>
                </div>
              ) : (
                <p className="text-foreground/60 text-xs">{formatPrice(item.unitPrice)} / adet</p>
              )}
            </div>

            <p className="text-foreground shrink-0 text-sm font-semibold">
              {formatPrice(getCartItemLineTotal(item, items).toFixed(2))}
            </p>
          </li>
          );
        })}
      </ul>

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

      <div className="bg-surface-muted -mx-6 -mb-6 flex flex-col overflow-hidden rounded-b-2xl">
        <div className="border-border-muted flex items-center justify-between border-t px-6 py-4">
          <span className="text-foreground text-sm font-semibold">Genel Toplam</span>
          <span className="text-brand text-xl font-bold">
            {total !== null ? formatPrice(total.toFixed(2)) : "Henüz belirlenmedi"}
          </span>
        </div>

        {total === null ? (
          <p role="status" className="text-foreground/60 px-6 pb-4 text-xs leading-5">
            {SHIPPING_FEE_PENDING_MESSAGE}
          </p>
        ) : null}

        <PaymentTrustStrip isIyzicoConfigured={isIyzicoConfigured} />
      </div>
    </aside>
  );
}
