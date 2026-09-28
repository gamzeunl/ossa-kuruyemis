import type { Metadata } from "next";
import Link from "next/link";
import { PageContainer } from "@/components/layout/container";
import { formatDate } from "@/lib/format-date";
import { formatPrice } from "@/lib/format-money";
import { ORDER_STATUS_LABELS } from "@/lib/order-status-labels";
import { requireUser } from "@/server/auth/guard";
import { listOrdersForUser, type CustomerOrderListRow } from "@/server/repositories/order-repository";

export const metadata: Metadata = { title: "Siparişlerim" };

const PAGE_SIZE = 10;
const SUMMARY_ITEM_LIMIT = 3;

function parsePage(value: string | undefined): number {
  const parsed = value ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function summarizeItems(items: CustomerOrderListRow["items"]): string {
  const shown = items
    .slice(0, SUMMARY_ITEM_LIMIT)
    .map((item) => `${item.productName} ×${item.quantity}`)
    .join(", ");
  const remaining = items.length - SUMMARY_ITEM_LIMIT;
  return remaining > 0 ? `${shown} +${remaining} ürün daha` : shown;
}

export default async function MyOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string }>;
}) {
  const user = await requireUser("/hesabim/siparisler");
  const { sayfa } = await searchParams;
  const page = parsePage(sayfa);
  const { rows, total } = await listOrdersForUser(user.id, { page, pageSize: PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer maxWidthClassName="max-w-[720px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Siparişlerim</h1>
        <p className="text-foreground/60 text-sm">{total} sipariş</p>
      </div>

      {rows.length === 0 ? (
        <div className="border-border-muted flex flex-col items-center gap-3 rounded-xl border p-12 text-center">
          <p className="text-foreground/60 text-sm">Henüz siparişiniz yok.</p>
          <Link href="/urunler" className="text-brand text-sm font-semibold underline underline-offset-2">
            Ürünleri İncele
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((order) => (
            <li key={order.id}>
              <Link
                href={`/hesabim/siparisler/${order.orderNumber}`}
                className="border-border-muted bg-surface hover:border-brand flex flex-col gap-2 rounded-2xl border p-5 shadow-sm transition-colors sm:p-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-foreground text-sm font-bold">{order.orderNumber}</span>
                  <span className="text-foreground/60 text-xs">{formatDate(order.createdAt)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-brand/10 text-brand rounded-full px-2.5 py-1 text-xs font-semibold">
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-foreground/50 text-xs">
                    {order.items.length} ürün
                  </span>
                </div>
                <p className="text-foreground/70 text-sm">{summarizeItems(order.items)}</p>
                <div className="border-border-muted flex items-center justify-between border-t pt-3">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-foreground/60 text-xs">Toplam</span>
                    <span className="text-foreground text-sm font-bold">
                      {order.totalStatus === "FINAL"
                        ? formatPrice(order.grandTotal.toString())
                        : "Henüz belirlenmedi"}
                    </span>
                  </div>
                  <span className="text-brand text-xs font-semibold">Detayları Gör →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Sayfalama" className="flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link
              href={`/hesabim/siparisler?sayfa=${page - 1}`}
              className="border-border-muted hover:border-brand rounded-full border px-4 py-2 text-sm font-medium"
            >
              Önceki
            </Link>
          ) : null}
          <span className="text-foreground/60 text-sm">
            Sayfa {page} / {totalPages}
          </span>
          {page < totalPages ? (
            <Link
              href={`/hesabim/siparisler?sayfa=${page + 1}`}
              className="border-border-muted hover:border-brand rounded-full border px-4 py-2 text-sm font-medium"
            >
              Sonraki
            </Link>
          ) : null}
        </nav>
      ) : null}
    </PageContainer>
  );
}
