"use client";

import Link from "next/link";
import { DeliveryForm } from "@/components/checkout/delivery-form";
import { OrderSummary } from "@/components/checkout/order-summary";
import type { ShippingSettings } from "@/lib/checkout-shipping";
import { useCartHydrated, useCartStore } from "@/stores/cart-store";
import type { Address } from "@/generated/prisma/client";

interface CheckoutPageContentProps {
  shippingSettings: ShippingSettings;
  savedAddresses: Address[];
  isLoggedIn: boolean;
  isIyzicoConfigured: boolean;
}

export function CheckoutPageContent({
  shippingSettings,
  savedAddresses,
  isLoggedIn,
  isIyzicoConfigured,
}: CheckoutPageContentProps) {
  const hydrated = useCartHydrated();
  const rawItems = useCartStore((state) => state.items);
  // Rehydrate tamamlanana kadar sunucuyla eşleşen boş sepet gösterilir —
  // hydration mismatch'i önler (bkz. `useCartHydrated`).
  const items = hydrated ? rawItems : [];

  if (items.length === 0) {
    return (
      <div className="border-border-muted bg-surface flex flex-col items-center gap-3 rounded-2xl border p-12 text-center shadow-sm">
        <p className="text-foreground/60 text-sm">Sepetiniz boş.</p>
        <Link
          href="/urunler"
          className="text-brand text-sm font-semibold underline underline-offset-2"
        >
          Ürünleri İncele
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px] lg:gap-10">
      <DeliveryForm savedAddresses={savedAddresses} isLoggedIn={isLoggedIn} />
      <OrderSummary shippingSettings={shippingSettings} isIyzicoConfigured={isIyzicoConfigured} />
    </div>
  );
}
