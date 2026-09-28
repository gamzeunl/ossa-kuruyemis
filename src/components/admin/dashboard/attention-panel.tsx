import Link from "next/link";
import { DashboardCard } from "@/components/admin/dashboard/dashboard-card";
import { EmptyState } from "@/components/admin/dashboard/empty-state";

interface AttentionItem {
  label: string;
  count: number;
  href: string;
}

/**
 * "Dikkat Gerektirenler" — işletme sahibinin şu an harekete geçmesi gereken
 * 3 gerçek DB sayacı (tükenen ürün / bekleyen sipariş / yeni iletişim talebi),
 * ilgili ekrana doğrudan link. Sahte/tahmini veri YOK — sayı 0 ise madde
 * "temiz" gösterilir, uydurma bir uyarı üretilmez.
 */
export function AttentionPanel({
  outOfStockProductCount,
  pendingOrderCount,
  newContactRequestCount,
}: {
  outOfStockProductCount: number;
  pendingOrderCount: number;
  newContactRequestCount: number;
}) {
  const items: AttentionItem[] = [
    { label: "Tükenen ürün", count: outOfStockProductCount, href: "/yonetim/urunler?durum=OUT_OF_STOCK" },
    { label: "Bekleyen sipariş", count: pendingOrderCount, href: "/yonetim/siparisler?durum=PENDING" },
    { label: "Yeni iletişim talebi", count: newContactRequestCount, href: "/yonetim/iletisim" },
  ];

  const hasAnyAttention = items.some((item) => item.count > 0);

  return (
    <DashboardCard title="Dikkat Gerektirenler">
      {!hasAnyAttention ? (
        <EmptyState message="Şu an dikkat gerektiren bir şey yok." />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li
              key={item.label}
              className="border-border-muted flex items-center justify-between gap-3 rounded-xl border p-3"
            >
              <span className="text-foreground text-sm font-medium">{item.label}</span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm font-bold ${item.count > 0 ? "text-red-700" : "text-foreground/40"}`}
                >
                  {item.count}
                </span>
                <Link
                  href={item.href}
                  className="border-border-muted hover:border-brand min-h-8 rounded-lg border px-3 py-1.5 text-xs font-semibold whitespace-nowrap"
                >
                  Görüntüle
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
