import type { ComponentType, SVGProps } from "react";
import { BagIcon, LeafIcon, TruckIcon } from "@/components/ui/icons";
import { FREE_SHIPPING_THRESHOLD_TRY } from "@/lib/checkout-shipping";
import { formatPrice } from "@/lib/format-money";

interface TopBarItem {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
}

/**
 * Üç sabit avantaj mesajı — kargo eşiği `FREE_SHIPPING_THRESHOLD_TRY`'den
 * (`@/lib/checkout-shipping`, sabit iş kuralı, tek kaynak) okunur. Bu artık
 * DB'ye gitmeyen bir sabit olduğundan (bkz. `site-setting-service.ts`) bu
 * bileşen senkron kalabilir — hata yutma/`async` gerekmez.
 */
const items: TopBarItem[] = [
  { icon: LeafIcon, label: "Özenle Seçilen Ürünler" },
  { icon: BagIcon, label: "Kolay Sipariş" },
  {
    icon: TruckIcon,
    label: `${formatPrice(String(FREE_SHIPPING_THRESHOLD_TRY))} ve üzeri siparişlerde ücretsiz kargo`,
  },
];

export function TopBar() {
  return (
    <section
      aria-label="Alışveriş avantajları"
      className="border-gold/10 bg-gradient-to-r from-gold-light/70 via-gold-light/45 to-gold-light/70 hidden border-b backdrop-blur-sm sm:block"
    >
      <div className="mx-auto flex w-full max-w-[1320px] flex-wrap items-center justify-center gap-x-8 gap-y-1 px-4 py-1.5 sm:flex-nowrap sm:px-8 xl:px-12">
        {items.map((item) => (
          <div key={item.label} className="flex min-w-0 items-center justify-center gap-1.5">
            <item.icon aria-hidden="true" className="text-gold h-3.5 w-3.5 shrink-0" />
            <p className="text-foreground truncate text-[11px] leading-none font-semibold sm:text-xs">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
