import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderCancelForm } from "@/components/admin/order-cancel-form";
import { OrderResendEmailForm } from "@/components/admin/order-resend-email-form";
import { OrderShippingFinalizeForm } from "@/components/admin/order-shipping-finalize-form";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { StatusBadge } from "@/components/admin/status-badge";
import { PageContainer } from "@/components/layout/container";
import { formatDate } from "@/lib/format-date";
import { formatPrice } from "@/lib/format-money";
import { parseOrderAddressSnapshot, type OrderAddressSnapshot } from "@/lib/order-address-snapshot";
import {
  EMAIL_SEND_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  ORDER_EMAIL_TYPE_LABELS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_TONE,
  SHIPPING_PRICE_STATUS_LABELS,
} from "@/lib/order-status-labels";
import { getAvailableOrderStatusTransitions } from "@/lib/order-status";
import { InvoiceType, OrderEmailType, OrderStatus, ShippingPriceStatus } from "@/generated/prisma/client";
import { requireRole } from "@/server/auth/guard";
import { findLatestEmailLogsForOrder, findOrderForAdmin } from "@/server/repositories/order-repository";

export const metadata: Metadata = { title: "Sipariş Detayı" };

function isSameAddress(a: OrderAddressSnapshot, b: OrderAddressSnapshot): boolean {
  return (
    a.firstName === b.firstName &&
    a.lastName === b.lastName &&
    a.phone === b.phone &&
    a.city === b.city &&
    a.district === b.district &&
    a.neighborhood === b.neighborhood &&
    a.addressLine === b.addressLine &&
    a.addressLabel === b.addressLabel
  );
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN", "/yonetim/siparisler");
  const { id } = await params;
  const order = await findOrderForAdmin(id);

  if (!order) {
    notFound();
  }

  const latestEmailLogs = await findLatestEmailLogsForOrder(order.id);

  const shippingAddress = parseOrderAddressSnapshot(order.shippingAddressSnapshot);
  const billingAddress = parseOrderAddressSnapshot(order.billingAddressSnapshot);
  const addressesMatch =
    shippingAddress !== null && billingAddress !== null && isSameAddress(shippingAddress, billingAddress);
  const hasSucceededPayment = order.payments.length > 0;
  const statusTransitions = getAvailableOrderStatusTransitions(order.status).filter(
    (status) => status !== OrderStatus.CANCELLED,
  );
  const canCancel = getAvailableOrderStatusTransitions(order.status).includes(OrderStatus.CANCELLED);

  return (
    <PageContainer maxWidthClassName="max-w-[900px]" className="gap-6">
      <div className="flex flex-col gap-1">
        <Link href="/yonetim/siparisler" className="text-brand w-fit text-xs font-semibold">
          ← Sipariş Yönetimi
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{order.orderNumber}</h1>
        <p className="text-foreground/60 text-sm">{formatDate(order.createdAt)}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border-border-muted bg-surface rounded-xl border p-4">
          <p className="text-foreground/60 text-xs font-semibold uppercase">Sipariş Durumu</p>
          <p className="mt-1.5">
            <StatusBadge label={ORDER_STATUS_LABELS[order.status]} tone={ORDER_STATUS_TONE[order.status]} />
          </p>
        </div>
        <div className="border-border-muted bg-surface rounded-xl border p-4">
          <p className="text-foreground/60 text-xs font-semibold uppercase">Ödeme Durumu</p>
          <p className="mt-1.5">
            <StatusBadge
              label={hasSucceededPayment ? "Ödendi" : "Ödeme bekleniyor"}
              tone={hasSucceededPayment ? "success" : "warning"}
            />
          </p>
        </div>
        <div className="border-border-muted bg-surface rounded-xl border p-4">
          <p className="text-foreground/60 text-xs font-semibold uppercase">Fatura Tipi</p>
          <p className="text-foreground mt-1 text-sm font-semibold">
            {INVOICE_TYPE_LABELS[order.invoiceType]}
          </p>
        </div>
      </div>

      {order.invoiceType === InvoiceType.CORPORATE ? (
        <section className="border-border-muted bg-surface flex flex-col gap-3 rounded-xl border p-5">
          <h2 className="text-foreground text-base font-bold">Kurumsal Fatura Bilgileri</h2>
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <p>
              <span className="text-foreground/60">Şirket Unvanı: </span>
              {order.invoiceCompanyName}
            </p>
            <p>
              <span className="text-foreground/60">Vergi Dairesi: </span>
              {order.invoiceTaxOffice}
            </p>
            <p>
              <span className="text-foreground/60">Vergi Numarası: </span>
              {order.invoiceTaxNumber}
            </p>
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="border-border-muted bg-surface rounded-xl border p-4">
          <p className="text-foreground/60 text-xs font-semibold uppercase">Onaylanma Tarihi</p>
          <p className="text-foreground mt-1 text-sm font-semibold">
            {order.confirmedAt ? formatDate(order.confirmedAt) : "—"}
          </p>
        </div>
        <div className="border-border-muted bg-surface rounded-xl border p-4">
          <p className="text-foreground/60 text-xs font-semibold uppercase">İptal Tarihi</p>
          <p className="text-foreground mt-1 text-sm font-semibold">
            {order.cancelledAt ? formatDate(order.cancelledAt) : "—"}
          </p>
        </div>
        <div className="border-border-muted bg-surface rounded-xl border p-4">
          <p className="text-foreground/60 text-xs font-semibold uppercase">Son Güncelleme</p>
          <p className="text-foreground mt-1 text-sm font-semibold">{formatDate(order.updatedAt)}</p>
        </div>
      </div>

      <section className="border-border-muted bg-surface flex flex-col gap-4 rounded-xl border p-5">
        <h2 className="text-foreground text-base font-bold">Müşteri</h2>
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-foreground/60">E-posta: </span>
            {order.email}
          </p>
          <p>
            <span className="text-foreground/60">Telefon: </span>
            {order.phone}
          </p>
        </div>
        {order.customerNote ? (
          <p className="text-sm">
            <span className="text-foreground/60">Müşteri Notu: </span>
            {order.customerNote}
          </p>
        ) : null}
      </section>

      {addressesMatch ? (
        <section className="border-border-muted bg-surface flex flex-col gap-2 rounded-xl border p-5">
          <h2 className="text-foreground text-base font-bold">Teslimat ve Fatura Adresi</h2>
          <p className="text-foreground/50 text-xs">(Fatura adresi teslimat adresiyle aynı)</p>
          <p className="text-foreground/80 text-sm leading-6">
            {shippingAddress!.firstName} {shippingAddress!.lastName}
            <br />
            {shippingAddress!.addressLine}
            <br />
            {shippingAddress!.neighborhood}, {shippingAddress!.district}/{shippingAddress!.city}
            <br />
            {shippingAddress!.phone}
          </p>
        </section>
      ) : (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="border-border-muted bg-surface flex flex-col gap-2 rounded-xl border p-5">
            <h2 className="text-foreground text-base font-bold">Teslimat Adresi</h2>
            {shippingAddress ? (
              <p className="text-foreground/80 text-sm leading-6">
                {shippingAddress.firstName} {shippingAddress.lastName}
                <br />
                {shippingAddress.addressLine}
                <br />
                {shippingAddress.neighborhood}, {shippingAddress.district}/{shippingAddress.city}
                <br />
                {shippingAddress.phone}
              </p>
            ) : (
              <p className="text-foreground/50 text-sm">Adres bilgisi okunamadı.</p>
            )}
          </div>
          <div className="border-border-muted bg-surface flex flex-col gap-2 rounded-xl border p-5">
            <h2 className="text-foreground text-base font-bold">Fatura Adresi</h2>
            {billingAddress ? (
              <p className="text-foreground/80 text-sm leading-6">
                {billingAddress.firstName} {billingAddress.lastName}
                <br />
                {billingAddress.addressLine}
                <br />
                {billingAddress.neighborhood}, {billingAddress.district}/{billingAddress.city}
              </p>
            ) : (
              <p className="text-foreground/50 text-sm">Adres bilgisi okunamadı.</p>
            )}
          </div>
        </section>
      )}

      <section className="border-border-muted bg-surface flex flex-col gap-4 rounded-xl border p-5">
        <h2 className="text-foreground text-base font-bold">Ürünler</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-foreground/60 text-xs uppercase">
              <tr>
                <th className="py-2 font-semibold">Ürün</th>
                <th className="py-2 font-semibold">SKU</th>
                <th className="py-2 font-semibold">Adet</th>
                <th className="py-2 font-semibold">Normal Fiyat</th>
                <th className="py-2 font-semibold">Efektif Fiyat</th>
                <th className="py-2 font-semibold">Satır Toplamı</th>
              </tr>
            </thead>
            <tbody className="divide-border-muted divide-y">
              {order.items.map((item) => {
                const hasDiscount = !item.regularUnitPrice.equals(item.unitPrice);
                return (
                  <tr key={item.id}>
                    <td className="py-2">
                      {item.productName}
                      <span className="text-foreground/50 block text-xs">{item.variantName}</span>
                    </td>
                    <td className="text-foreground/60 py-2">{item.sku}</td>
                    <td className="py-2">{item.quantity}</td>
                    <td className="py-2">
                      {hasDiscount ? (
                        <span className="text-foreground/50 line-through">
                          {formatPrice(item.regularUnitPrice.toString())}
                        </span>
                      ) : (
                        formatPrice(item.regularUnitPrice.toString())
                      )}
                    </td>
                    <td className="py-2">
                      {formatPrice(item.unitPrice.toString())}
                      {hasDiscount ? (
                        <span className="text-brand ml-1.5 text-xs font-semibold">İndirimli</span>
                      ) : null}
                    </td>
                    <td className="py-2">{formatPrice(item.lineTotal.toString())}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-border-muted flex flex-col gap-1.5 border-t pt-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Ara Toplam</span>
            <span className="font-medium">{formatPrice(order.subtotal.toString())}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">İndirim Toplamı</span>
            <span className="font-medium">{formatPrice(order.discountTotal.toString())}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/60">Kargo Ücreti</span>
            <span className="font-medium">
              {order.shippingTotal !== null
                ? formatPrice(order.shippingTotal.toString())
                : SHIPPING_PRICE_STATUS_LABELS[order.shippingPriceStatus]}
            </span>
          </div>
          <div className="border-border-muted flex items-center justify-between border-t pt-2">
            <span className="text-foreground font-semibold">Genel Toplam</span>
            <span className="text-foreground text-lg font-bold">
              {order.totalStatus === "FINAL"
                ? formatPrice(order.grandTotal.toString())
                : "Henüz belirlenmedi"}
            </span>
          </div>
        </div>
      </section>

      <section className="border-border-muted bg-surface flex flex-col gap-4 rounded-xl border p-5">
        <h2 className="text-foreground text-base font-bold">E-posta Bildirimleri</h2>
        <ul className="divide-border-muted flex flex-col divide-y">
          {Object.values(OrderEmailType).map((type) => {
            const log = latestEmailLogs.get(type);
            return (
              <li key={type} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-foreground text-sm font-semibold">{ORDER_EMAIL_TYPE_LABELS[type]}</p>
                  <p className="text-foreground/60 text-xs">
                    {log
                      ? `${EMAIL_SEND_STATUS_LABELS[log.status]} — ${formatDate(log.createdAt)}`
                      : "Gönderilmedi"}
                  </p>
                </div>
                <OrderResendEmailForm orderId={order.id} type={type} />
              </li>
            );
          })}
        </ul>
      </section>

      {order.shippingPriceStatus === ShippingPriceStatus.PENDING ? (
        <section className="border-border-muted bg-surface flex flex-col gap-3 rounded-xl border p-5">
          <h2 className="text-foreground text-base font-bold">Kargo Ücretini Netleştir</h2>
          <OrderShippingFinalizeForm orderId={order.id} />
        </section>
      ) : null}

      {statusTransitions.length > 0 ? (
        <section className="border-border-muted bg-surface flex flex-col gap-3 rounded-xl border p-5">
          <h2 className="text-foreground text-base font-bold">Sipariş Durumunu Güncelle</h2>
          <OrderStatusForm orderId={order.id} availableTransitions={statusTransitions} />
        </section>
      ) : null}

      {canCancel ? (
        <section className="border-border-muted bg-surface flex flex-col gap-3 rounded-xl border p-5">
          <h2 className="text-foreground text-base font-bold">Siparişi İptal Et</h2>
          <OrderCancelForm orderId={order.id} />
        </section>
      ) : null}
    </PageContainer>
  );
}
