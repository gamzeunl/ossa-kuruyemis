import { DashboardCard } from "@/components/admin/dashboard/dashboard-card";
import { EmptyState } from "@/components/admin/dashboard/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/format-date";
import { formatPrice } from "@/lib/format-money";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE } from "@/lib/order-status-labels";
import type { DashboardOrderRow } from "@/server/services/dashboard-service";

export function RecentOrdersCard({ orders }: { orders: DashboardOrderRow[] }) {
  return (
    <DashboardCard title="Son Siparişler" action={{ label: "Tüm Siparişleri Gör", href: "/yonetim/siparisler" }}>
      {orders.length === 0 ? (
        <EmptyState message="Henüz sipariş bulunmuyor." />
      ) : (
        <div className="border-border-muted overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 font-semibold">Sipariş No</th>
                <th className="px-4 py-3 font-semibold">Müşteri</th>
                <th className="px-4 py-3 font-semibold">Tarih</th>
                <th className="px-4 py-3 font-semibold">Durum</th>
                <th className="px-4 py-3 font-semibold">Tutar</th>
              </tr>
            </thead>
            <tbody className="divide-border-muted divide-y">
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{order.orderNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{order.customerName}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge label={ORDER_STATUS_LABELS[order.status]} tone={ORDER_STATUS_TONE[order.status]} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {order.grandTotal ? formatPrice(order.grandTotal) : "Henüz belirlenmedi"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardCard>
  );
}
