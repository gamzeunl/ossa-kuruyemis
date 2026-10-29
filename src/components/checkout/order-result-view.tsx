import Link from "next/link";
import { OrderStatusTimeline } from "@/components/account/order-status-timeline";
import { formatDate } from "@/lib/format-date";
import { formatPrice } from "@/lib/format-money";
import { parseOrderAddressSnapshot } from "@/lib/order-address-snapshot";
import {
  INVOICE_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  SHIPPING_PRICE_STATUS_LABELS,
} from "@/lib/order-status-labels";
import type { CustomerOrderViewRow } from "@/server/repositories/order-repository";

const cardClassName = "border-border-muted bg-surface rounded-2xl border p-5 shadow-sm sm:p-6";

function shippingLabel(order: CustomerOrderViewRow): string {
  if (order.shippingPriceStatus === "FREE") {
    return "Ücretsiz";
  }
  if (order.shippingTotal !== null) {
    return formatPrice(order.shippingTotal.toString());
  }
  return SHIPPING_PRICE_STATUS_LABELS[order.shippingPriceStatus];
}

interface OrderResultViewProps {
  order: CustomerOrderViewRow;
  /** Görüntüleyen kullanıcının oturum durumu — "Siparişlerime Git" yalnızca girişliyse gösterilir. */
  isLoggedIn?: boolean;
  /** Yalnızca Hesabım > Siparişlerim detayında görsel durum takibi gösterilir. */
  showStatusTimeline?: boolean;
}

/**
 * Misafir (`/siparis-sonucu/[orderNumber]`) ve girişli (`/hesabim/siparisler/[orderNumber]`)
 * sipariş görüntüleme sayfalarının ortak içeriği. "Ödeme başarılı"/"siparişiniz
 * tamamlandı" DENMEZ — canlı ödeme entegrasyonu henüz yok.
 */
export function OrderResultView({ order, isLoggedIn = false, showStatusTimeline = false }: OrderResultViewProps) {
  const shippingAddress = parseOrderAddressSnapshot(order.shippingAddressSnapshot);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-brand/30 bg-brand/5 rounded-2xl border p-6">
        <p className="text-foreground text-lg font-bold">
          {order.status === "PAID" ? "Ödemeniz başarıyla alındı." : "Sipariş durumunuz"}
        </p>
        <p className="text-foreground/70 mt-1 text-sm">
          {order.status === "PAID"
            ? "Siparişiniz alındı ve ödemeniz onaylandı."
            : "Ödemeniz henüz onaylanmadı. Sipariş durumunuzu aşağıdan takip edebilirsiniz."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className={cardClassName}>
          <p className="text-foreground/60 text-xs font-semibold uppercase">Sipariş Numarası</p>
          <p className="text-foreground mt-1 text-lg font-bold">{order.orderNumber}</p>
        </div>
        <div className={cardClassName}>
          <p className="text-foreground/60 text-xs font-semibold uppercase">Tarih</p>
          <p className="text-foreground mt-1 text-sm font-semibold">{formatDate(order.createdAt)}</p>
        </div>
        <div className={cardClassName}>
          <p className="text-foreground/60 text-xs font-semibold uppercase">Durum</p>
          <p className="text-foreground mt-1 text-sm font-semibold">{ORDER_STATUS_LABELS[order.status]}</p>
        </div>
      </div>

      {showStatusTimeline ? (
        <div className={cardClassName}>
          <h2 className="text-foreground mb-4 text-base font-bold">Sipariş Takibi</h2>
          <OrderStatusTimeline status={order.status} />
        </div>
      ) : null}

      <div className={`${cardClassName} flex flex-col gap-3`}>
        <h2 className="text-foreground text-base font-bold">Ürünler</h2>
        <ul className="flex flex-col gap-3">
          {order.items.map((item) => (
            <li key={item.id} className="border-border-muted flex items-start justify-between gap-3 border-b pb-3 text-sm last:border-b-0 last:pb-0">
              <span className="min-w-0">
                <span className="text-foreground font-medium">{item.productName}</span>
                <span className="text-foreground/50">
                  {" "}
                  ({item.variantName}) × {item.quantity}
                </span>
                <span className="text-foreground/50 block text-xs">{formatPrice(item.unitPrice.toString())} / adet</span>
              </span>
              <span className="shrink-0 font-medium">{formatPrice(item.lineTotal.toString())}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${cardClassName} grid grid-cols-1 gap-4 sm:grid-cols-2`}>
        {shippingAddress ? (
          <div className="flex flex-col gap-1">
            <h2 className="text-foreground text-base font-bold">Teslimat Adresi</h2>
            <p className="text-foreground/80 text-sm">
              {shippingAddress.firstName} {shippingAddress.lastName}
            </p>
            <p className="text-foreground/60 text-sm">{shippingAddress.phone}</p>
            <p className="text-foreground/60 text-sm">
              {shippingAddress.addressLine}, {shippingAddress.neighborhood} {shippingAddress.district}/
              {shippingAddress.city}
            </p>
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          <h2 className="text-foreground text-base font-bold">Fatura Tipi</h2>
          <p className="text-foreground/80 text-sm">{INVOICE_TYPE_LABELS[order.invoiceType]}</p>
          {order.invoiceType === "CORPORATE" ? (
            <>
              <p className="text-foreground/60 text-sm">{order.invoiceCompanyName}</p>
              <p className="text-foreground/60 text-sm">
                {order.invoiceTaxOffice} · {order.invoiceTaxNumber}
              </p>
            </>
          ) : null}
        </div>
      </div>

      <div className={`${cardClassName} flex flex-col gap-1.5 text-sm`}>
        <div className="flex items-center justify-between">
          <span className="text-foreground/60">Ara Toplam</span>
          <span className="font-medium">{formatPrice(order.subtotal.toString())}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-foreground/60">Kargo</span>
          <span className="font-medium">{shippingLabel(order)}</span>
        </div>
        <div className="border-border-muted flex items-center justify-between border-t pt-2">
          <span className="text-foreground font-semibold">Genel Toplam</span>
          <span className="text-brand text-lg font-bold">
            {order.totalStatus === "FINAL"
              ? formatPrice(order.grandTotal.toString())
              : "Henüz belirlenmedi"}
          </span>
        </div>
        {order.totalStatus === "PENDING" ? (
          <p role="status" className="text-foreground/60 text-xs leading-5">
            Toplam tutar kargo ücreti belirlendikten sonra netleşecektir.
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        {isLoggedIn ? (
          <Link
            href="/hesabim/siparisler"
            className="bg-brand text-brand-foreground hover:bg-brand-dark inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-bold transition-colors"
          >
            Siparişlerime Git
          </Link>
        ) : (
          <Link
            href="/urunler"
            className="bg-brand text-brand-foreground hover:bg-brand-dark inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-bold transition-colors"
          >
            Ürünleri İncele
          </Link>
        )}
        <Link
          href="/urunler"
          className="border-border-muted text-foreground hover:border-brand inline-flex min-h-11 items-center justify-center rounded-full border px-6 text-sm font-semibold transition-colors"
        >
          Alışverişe Devam Et
        </Link>
      </div>
    </div>
  );
}
