"use server";

import { orderTrackingSchema } from "@/lib/order-tracking-schema";
import { checkRateLimit, hashRateLimitIdentifier, RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/request-ip";
import { trackOrder, type PublicOrderTrackingResult } from "@/server/services/order-tracking-service";

export type OrderTrackingActionResult =
  | { ok: true; result: PublicOrderTrackingResult }
  | { ok: false; message: string };

/**
 * Sipariş var/yok veya hangi alan yanlış bilgisini SIZDIRMAMAK için tek,
 * sabit generic mesaj — hem "sipariş bulunamadı" hem "iletişim bilgisi
 * eşleşmedi" durumunda AYNI metin döner.
 */
const GENERIC_NOT_FOUND_MESSAGE = "Sipariş bilgileri eşleşmedi. Bilgilerinizi kontrol edip tekrar deneyin.";

export async function trackOrderAction(formData: FormData): Promise<OrderTrackingActionResult> {
  const parsed = orderTrackingSchema.safeParse({
    orderNumber: String(formData.get("orderNumber") ?? ""),
    contact: String(formData.get("contact") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? GENERIC_NOT_FOUND_MESSAGE };
  }

  // İki ayrı anahtar: IP genel gürültüyü, sipariş numarası hash'i ise TEK bir
  // numarayı farklı email/telefonlarla deneyerek enumeration yapan saldırıyı
  // sınırlar (bkz. RATE_LIMIT_POLICIES.orderTrackingByOrderNumber).
  const ip = await getClientIp();
  const [ipCheck, orderCheck] = await Promise.all([
    checkRateLimit(`order-tracking:ip:${ip}`, RATE_LIMIT_POLICIES.orderTrackingByIp),
    checkRateLimit(
      `order-tracking:order:${hashRateLimitIdentifier(parsed.data.orderNumber)}`,
      RATE_LIMIT_POLICIES.orderTrackingByOrderNumber,
    ),
  ]);
  if (!ipCheck.ok || !orderCheck.ok) {
    return { ok: false, message: GENERIC_NOT_FOUND_MESSAGE };
  }

  const result = await trackOrder(parsed.data);
  if (!result) {
    return { ok: false, message: GENERIC_NOT_FOUND_MESSAGE };
  }

  return { ok: true, result };
}
