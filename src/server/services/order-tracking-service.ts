import type { OrderStatus } from "@/generated/prisma/enums";
import { normalizePhoneForCompare } from "@/lib/phone-normalize";
import { findOrderByOrderNumberForTracking } from "@/server/repositories/order-repository";

export interface PublicOrderTrackingResult {
  orderNumber: string;
  createdAt: Date;
  status: OrderStatus;
  /** Yalnızca gerçekten bir `Shipment` kaydı ve dolu `trackingNumber` varsa dolu — asla uydurulmaz. */
  shipment: { carrier: string; trackingNumber: string } | null;
}

/**
 * `orderNumber` `@unique` olduğundan tek satır çekilir; e-posta/telefon
 * eşleşmesi burada, uygulama katımında normalize edilerek karşılaştırılır
 * (telefon formatı checkout'ta serbest bırakıldığı için boşluk/tire/`0`-`+90`
 * önek farkları olabilir). Sipariş bulunamazsa VEYA iletişim bilgisi
 * eşleşmezse — ayrım yapılmadan — `null` döner; çağıran katman İKİ durumda
 * da AYNI generic mesajı gösterir (sipariş var/yok bilgisini sızdırmaz).
 * Dönen obje kasıtlı olarak minimaldir: adres/fatura/ödeme/kişisel bilgi
 * (email/phone dahil) hiçbir zaman içermez.
 */
export async function trackOrder(input: {
  orderNumber: string;
  contact: string;
}): Promise<PublicOrderTrackingResult | null> {
  const order = await findOrderByOrderNumberForTracking(input.orderNumber);
  if (!order) {
    return null;
  }

  const normalizedContact = input.contact.trim().toLowerCase();
  const emailMatches = normalizedContact.length > 0 && order.email.trim().toLowerCase() === normalizedContact;

  const normalizedContactPhone = normalizePhoneForCompare(input.contact);
  const phoneMatches =
    normalizedContactPhone.length >= 10 && normalizePhoneForCompare(order.phone) === normalizedContactPhone;

  if (!emailMatches && !phoneMatches) {
    return null;
  }

  const latestShipment = order.shipments[0];
  const shipment =
    latestShipment && latestShipment.trackingNumber
      ? { carrier: latestShipment.carrier, trackingNumber: latestShipment.trackingNumber }
      : null;

  return {
    orderNumber: order.orderNumber,
    createdAt: order.createdAt,
    status: order.status,
    shipment,
  };
}
