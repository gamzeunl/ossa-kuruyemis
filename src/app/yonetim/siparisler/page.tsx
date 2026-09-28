import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatus } from "@/generated/prisma/client";
import { PageContainer } from "@/components/layout/container";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/format-date";
import { formatPrice } from "@/lib/format-money";
import { parseOrderAddressSnapshot } from "@/lib/order-address-snapshot";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TONE, SHIPPING_PRICE_STATUS_LABELS } from "@/lib/order-status-labels";
import { requireRole } from "@/server/auth/guard";
import { listOrdersForAdmin } from "@/server/repositories/order-repository";

export const metadata: Metadata = { title: "Sipariş Yönetimi" };

const PAGE_SIZE = 30;

const STATUS_OPTIONS = Object.values(OrderStatus);

function parsePage(value: string | undefined): number {
  const parsed = value ? Number.parseInt(value, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

interface SearchParams {
  sayfa?: string;
  durum?: string;
  odeme?: string;
  baslangic?: string;
  bitis?: string;
  ara?: string;
}

function buildUrl(params: SearchParams): string {
  const search = new URLSearchParams();
  if (params.durum) search.set("durum", params.durum);
  if (params.odeme) search.set("odeme", params.odeme);
  if (params.baslangic) search.set("baslangic", params.baslangic);
  if (params.bitis) search.set("bitis", params.bitis);
  if (params.ara) search.set("ara", params.ara);
  if (params.sayfa && params.sayfa !== "1") search.set("sayfa", params.sayfa);
  const query = search.toString();
  return query ? `/yonetim/siparisler?${query}` : "/yonetim/siparisler";
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  await requireRole("ADMIN", "/yonetim/siparisler");
  const params = await searchParams;
  const page = parsePage(params.sayfa);

  const status =
    params.durum && (STATUS_OPTIONS as string[]).includes(params.durum)
      ? (params.durum as OrderStatus)
      : undefined;
  const paymentStatus =
    params.odeme === "SUCCEEDED" || params.odeme === "PENDING" ? params.odeme : undefined;

  const { rows, total } = await listOrdersForAdmin({
    page,
    pageSize: PAGE_SIZE,
    status,
    paymentStatus,
    dateFrom: parseDate(params.baslangic),
    dateTo: parseDate(params.bitis),
    search: params.ara,
  });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <PageContainer maxWidthClassName="max-w-[1300px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim" className="text-brand w-fit text-xs font-semibold">
          ← Yönetim
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Sipariş Yönetimi</h1>
        <p className="text-foreground/60 text-sm">{total} sipariş</p>
      </div>

      <form
        method="get"
        className="border-border-muted bg-surface flex flex-wrap items-end gap-3 rounded-xl border p-4"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="durum" className="text-foreground/70 text-xs font-medium">
            Sipariş Durumu
          </label>
          <select
            id="durum"
            name="durum"
            defaultValue={params.durum ?? ""}
            className="border-border-muted min-h-9 rounded-lg border px-2 text-sm"
          >
            <option value="">Tümü</option>
            {STATUS_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {ORDER_STATUS_LABELS[value]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="odeme" className="text-foreground/70 text-xs font-medium">
            Ödeme Durumu
          </label>
          <select
            id="odeme"
            name="odeme"
            defaultValue={params.odeme ?? ""}
            className="border-border-muted min-h-9 rounded-lg border px-2 text-sm"
          >
            <option value="">Tümü</option>
            <option value="SUCCEEDED">Ödendi</option>
            <option value="PENDING">Ödeme bekleniyor</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="baslangic" className="text-foreground/70 text-xs font-medium">
            Başlangıç
          </label>
          <input
            id="baslangic"
            name="baslangic"
            type="date"
            defaultValue={params.baslangic ?? ""}
            className="border-border-muted min-h-9 rounded-lg border px-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="bitis" className="text-foreground/70 text-xs font-medium">
            Bitiş
          </label>
          <input
            id="bitis"
            name="bitis"
            type="date"
            defaultValue={params.bitis ?? ""}
            className="border-border-muted min-h-9 rounded-lg border px-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="ara" className="text-foreground/70 text-xs font-medium">
            Sipariş no / e-posta / telefon
          </label>
          <input
            id="ara"
            name="ara"
            type="text"
            defaultValue={params.ara ?? ""}
            placeholder="OSSA-2026..."
            className="border-border-muted min-h-9 rounded-lg border px-2 text-sm"
          />
        </div>

        <button
          type="submit"
          className="bg-brand hover:bg-brand-dark min-h-9 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors"
        >
          Filtrele
        </button>
        {params.durum || params.odeme || params.baslangic || params.bitis || params.ara ? (
          <Link
            href="/yonetim/siparisler"
            className="text-foreground/60 hover:text-brand text-xs font-semibold underline underline-offset-2"
          >
            Filtreleri temizle
          </Link>
        ) : null}
      </form>

      <div className="border-border-muted overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="bg-surface-muted text-foreground/60 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 font-semibold">Sipariş No</th>
              <th className="px-4 py-3 font-semibold">Tarih</th>
              <th className="px-4 py-3 font-semibold">Müşteri</th>
              <th className="px-4 py-3 font-semibold">E-posta</th>
              <th className="px-4 py-3 font-semibold">Telefon</th>
              <th className="px-4 py-3 font-semibold">Durum</th>
              <th className="px-4 py-3 font-semibold">Ödeme</th>
              <th className="px-4 py-3 font-semibold">Ara Toplam</th>
              <th className="px-4 py-3 font-semibold">Kargo</th>
              <th className="px-4 py-3 font-semibold">Toplam</th>
              <th className="px-4 py-3 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-border-muted divide-y">
            {rows.map((order) => {
              const address = parseOrderAddressSnapshot(order.shippingAddressSnapshot);
              const hasSucceededPayment = order.payments.length > 0;
              return (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{order.orderNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {address ? `${address.firstName} ${address.lastName}` : "—"}
                  </td>
                  <td className="px-4 py-3">{order.email}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{order.phone}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge label={ORDER_STATUS_LABELS[order.status]} tone={ORDER_STATUS_TONE[order.status]} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <StatusBadge
                      label={hasSucceededPayment ? "Ödendi" : "Ödeme bekleniyor"}
                      tone={hasSucceededPayment ? "success" : "warning"}
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{formatPrice(order.subtotal.toString())}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {SHIPPING_PRICE_STATUS_LABELS[order.shippingPriceStatus]}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {order.totalStatus === "FINAL"
                      ? formatPrice(order.grandTotal.toString())
                      : "Henüz belirlenmedi"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Link
                      href={`/yonetim/siparisler/${order.id}`}
                      className="text-brand font-semibold underline underline-offset-2"
                    >
                      Detay
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {rows.length === 0 ? (
        <div
          role="status"
          className="border-border-muted text-foreground/60 rounded-md border p-8 text-center text-sm"
        >
          Bu filtrelerle eşleşen sipariş bulunmuyor.
        </div>
      ) : null}

      {totalPages > 1 ? (
        <nav aria-label="Sayfalama" className="flex items-center justify-center gap-4">
          {page > 1 ? (
            <Link
              href={buildUrl({ ...params, sayfa: String(page - 1) })}
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
              href={buildUrl({ ...params, sayfa: String(page + 1) })}
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
