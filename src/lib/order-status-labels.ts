import type {
  EmailSendStatus,
  InvoiceType,
  OrderEmailType,
  OrderStatus,
  ShippingPriceStatus,
} from "@/generated/prisma/enums";
import type { StatusTone } from "@/components/admin/status-badge";

/** Sipariş durumu için tek Türkçe etiket kaynağı — yönetim listesi/detayında tekrar edilmez. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Beklemede",
  PAYMENT_PROCESSING: "Ödeme İşleniyor",
  PAID: "Ödendi",
  CONFIRMED: "Onaylandı",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kargoya Verildi",
  DELIVERED: "Teslim Edildi",
  PAYMENT_FAILED: "Ödeme Başarısız",
  CANCELLATION_REQUESTED: "İptal Talep Edildi",
  CANCELLED: "İptal Edildi",
  EXPIRED: "Süresi Doldu",
  RETURN_REQUESTED: "İade Talep Edildi",
  RETURNED: "İade Edildi",
  RETURN_REJECTED: "İade Reddedildi",
};

/** Admin genelindeki ortak `StatusBadge` için sipariş durumu → ton eşlemesi (bkz. `status-badge.tsx`). */
export const ORDER_STATUS_TONE: Record<OrderStatus, StatusTone> = {
  PENDING: "warning",
  PAYMENT_PROCESSING: "warning",
  PAID: "success",
  CONFIRMED: "success",
  PROCESSING: "success",
  SHIPPED: "success",
  DELIVERED: "success",
  PAYMENT_FAILED: "danger",
  CANCELLATION_REQUESTED: "warning",
  CANCELLED: "danger",
  EXPIRED: "neutral",
  RETURN_REQUESTED: "warning",
  RETURNED: "neutral",
  RETURN_REJECTED: "danger",
};

export const SHIPPING_PRICE_STATUS_LABELS: Record<ShippingPriceStatus, string> = {
  PENDING: "Henüz belirlenmedi",
  FIXED: "Sabit ücret",
  FREE: "Ücretsiz",
};

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  INDIVIDUAL: "Bireysel",
  CORPORATE: "Kurumsal",
};

export const ORDER_EMAIL_TYPE_LABELS: Record<OrderEmailType, string> = {
  ORDER_RECEIVED: "Sipariş Alındı",
  STATUS_CONFIRMED: "Onaylandı",
  STATUS_PROCESSING: "Hazırlanıyor",
  STATUS_SHIPPED: "Kargoya Verildi",
  STATUS_DELIVERED: "Teslim Edildi",
  STATUS_CANCELLED: "İptal Edildi",
};

export const EMAIL_SEND_STATUS_LABELS: Record<EmailSendStatus, string> = {
  SENT: "Gönderildi",
  FAILED: "Başarısız",
};
