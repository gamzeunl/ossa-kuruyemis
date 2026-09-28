import { OrderStatus } from "@/generated/prisma/client";

/**
 * Sipariş durum geçişlerinin TEK kaynağı. Canlı ödeme entegrasyonu henüz
 * olmadığından ödeme-güdümlü durumlar (`PAYMENT_PROCESSING`, `PAID`,
 * `PAYMENT_FAILED`, `EXPIRED`, iade akışı) bu fazda BOŞ geçiş listesine
 * sahiptir — yönetici bir siparişi asla elle `PAID` yapamaz; bu durumlar
 * yalnızca gerçek ödeme sağlayıcısı entegrasyonu geldiğinde kullanılacaktır.
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.PAYMENT_PROCESSING]: [],
  [OrderStatus.PAID]: [],
  [OrderStatus.PAYMENT_FAILED]: [],
  [OrderStatus.CANCELLATION_REQUESTED]: [],
  [OrderStatus.EXPIRED]: [],
  [OrderStatus.RETURN_REQUESTED]: [],
  [OrderStatus.RETURNED]: [],
  [OrderStatus.RETURN_REJECTED]: [],
};

export function canTransitionOrderStatus(from: OrderStatus, to: OrderStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

/** Yönetim panelinde bir siparişten seçilebilir hedef durumları döner. */
export function getAvailableOrderStatusTransitions(from: OrderStatus): OrderStatus[] {
  return ALLOWED_TRANSITIONS[from];
}
