import type {
  OrderEmailType,
  OrderStatus,
  OrderTotalStatus,
  ShippingPriceStatus,
} from "@/generated/prisma/client";
import { formatDate } from "@/lib/format-date";
import { formatPrice } from "@/lib/format-money";
import { ORDER_STATUS_LABELS, SHIPPING_PRICE_STATUS_LABELS } from "@/lib/order-status-labels";

export type { OrderEmailType };

export interface OrderEmailItemSummary {
  productName: string;
  quantity: number;
}

/**
 * Bir e-posta şablonunun ihtiyaç duyduğu TÜM veri — kasıtlı olarak
 * `idempotencyKey`/`requestFingerprint`/`resultAccessToken` gibi hiçbir
 * güvenlik alanı TAŞIMAZ (tip seviyesinde imkânsız kılınır).
 */
export interface OrderEmailData {
  orderNumber: string;
  createdAt: Date;
  customerName: string;
  status: OrderStatus;
  items: OrderEmailItemSummary[];
  subtotal: string;
  shippingTotal: string | null;
  shippingPriceStatus: ShippingPriceStatus;
  grandTotal: string;
  totalStatus: OrderTotalStatus;
}

export interface RenderedOrderEmail {
  subject: string;
  html: string;
  text: string;
}

const INTRO_TEXT: Record<OrderEmailType, string> = {
  ORDER_RECEIVED: "Siparişiniz alındı ve onayınızı bekliyor. Ödeme işlemi henüz tamamlanmadı.",
  STATUS_CONFIRMED: "Siparişiniz onaylandı, hazırlanmaya başlanacak.",
  STATUS_PROCESSING: "Siparişiniz hazırlanıyor.",
  STATUS_SHIPPED: "Siparişiniz kargoya verildi.",
  STATUS_DELIVERED: "Siparişiniz teslim edildi. Bizi tercih ettiğiniz için teşekkür ederiz.",
  STATUS_CANCELLED: "Siparişiniz iptal edildi.",
};

const SUBJECT_TITLE: Record<OrderEmailType, string> = {
  ORDER_RECEIVED: "Siparişiniz Alındı",
  STATUS_CONFIRMED: "Siparişiniz Onaylandı",
  STATUS_PROCESSING: "Siparişiniz Hazırlanıyor",
  STATUS_SHIPPED: "Siparişiniz Kargoya Verildi",
  STATUS_DELIVERED: "Siparişiniz Teslim Edildi",
  STATUS_CANCELLED: "Siparişiniz İptal Edildi",
};

function formatItemsSummary(items: OrderEmailItemSummary[]): string {
  return items.map((item) => `${item.productName} ×${item.quantity}`).join(", ");
}

/**
 * `customerName` (müşterinin adres formunda girdiği ad/soyad — kullanıcı
 * girdisi) gibi değerler `html` gövdesine yerleştirilmeden önce kaçırılır —
 * aksi halde `<img src=x onerror=...>` gibi bir ad, e-posta istemcisinde HTML
 * injection'a yol açabilirdi. `text` gövdesi zaten markup olarak
 * yorumlanmadığından kaçırma GEREKMEZ.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTotalLine(data: OrderEmailData): string {
  return data.totalStatus === "FINAL" ? formatPrice(data.grandTotal) : "Henüz belirlenmedi";
}

function formatShippingLine(data: OrderEmailData): string {
  return data.shippingTotal !== null
    ? formatPrice(data.shippingTotal)
    : SHIPPING_PRICE_STATUS_LABELS[data.shippingPriceStatus];
}

/**
 * Sipariş/durum bildirim e-postalarının TEK render noktası — framework'ten
 * bağımsız saf fonksiyon (server-side, hiçbir client kodu tüketmez). Her
 * şablon sipariş no + tarih + ürün özeti + sipariş durumu + kargo/toplam
 * durumu + müşteri adını içerir; `totalStatus!=="FINAL"` iken kesin tutar
 * YERİNE "Henüz belirlenmedi" gösterilir (mevcut UI mantığıyla birebir aynı
 * kural, bkz. `order-result-view.tsx`). "Ödeme tamamlandı/başarılı" gibi
 * yanlış bir ifade HİÇBİR şablonda kullanılmaz — canlı ödeme entegrasyonu
 * henüz yok.
 */
export function renderOrderEmail(type: OrderEmailType, data: OrderEmailData): RenderedOrderEmail {
  const subject = `${SUBJECT_TITLE[type]} — ${data.orderNumber}`;
  const intro = INTRO_TEXT[type];
  const itemsSummary = formatItemsSummary(data.items);
  const statusLabel = ORDER_STATUS_LABELS[data.status];
  const shippingLine = formatShippingLine(data);
  const totalLine = formatTotalLine(data);
  const dateLabel = formatDate(data.createdAt);

  const text = [
    `Merhaba ${data.customerName},`,
    "",
    intro,
    "",
    `Sipariş No: ${data.orderNumber}`,
    `Tarih: ${dateLabel}`,
    `Ürünler: ${itemsSummary}`,
    `Sipariş Durumu: ${statusLabel}`,
    `Kargo: ${shippingLine}`,
    `Toplam: ${totalLine}`,
  ].join("\n");

  const html = `
<div style="font-family: sans-serif; color: #1a1a1a; line-height: 1.6;">
  <p>Merhaba ${escapeHtml(data.customerName)},</p>
  <p>${intro}</p>
  <table style="border-collapse: collapse; margin-top: 12px;">
    <tbody>
      <tr><td style="padding: 4px 12px 4px 0; color: #666;">Sipariş No</td><td>${data.orderNumber}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; color: #666;">Tarih</td><td>${dateLabel}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; color: #666;">Ürünler</td><td>${escapeHtml(itemsSummary)}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; color: #666;">Sipariş Durumu</td><td>${statusLabel}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; color: #666;">Kargo</td><td>${shippingLine}</td></tr>
      <tr><td style="padding: 4px 12px 4px 0; color: #666;">Toplam</td><td><strong>${totalLine}</strong></td></tr>
    </tbody>
  </table>
</div>
`.trim();

  return { subject, html, text };
}
