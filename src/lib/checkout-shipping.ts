import { formatPrice } from "@/lib/format-money";

/**
 * Sabit kargo iş kuralı — TEK kaynak: 1.500 TL ve üzeri siparişlerde kargo
 * ücretsiz, altında sabit 120 TL. Hem client (`OrderSummary`/`DeliveryForm`)
 * hem sunucu (`actions/checkout.ts` → `createDraftOrder`) AYNI değerleri
 * `@/server/services/site-setting-service`'in `getShippingSettings()`'i
 * üzerinden okur — kargo ücreti asla istemciden ayrıca hesaplanıp
 * güvenilmez, yalnızca GÖRÜNÜM için burada da kullanılır.
 */
export const FREE_SHIPPING_THRESHOLD_TRY = 1500;
export const STANDARD_SHIPPING_FEE_TRY = 120;

/**
 * Bu dosya yalnızca saf hesaplama mantığı içerir, DB'ye erişmez — hem client
 * component'lerden hem server tarafından güvenle kullanılabilir.
 */
export interface ShippingSettings {
  freeShippingThreshold: number | null;
  standardShippingFee: number | null;
}

export type ShippingFeeResult =
  { status: "free" } | { status: "fee"; amount: number } | { status: "unknown" };

/**
 * Kargo ücreti durumunu belirler:
 * - eşik tanımlı ve karşılanmışsa: ücretsiz,
 * - karşılanmamışsa (veya eşik tanımsızsa) ve standart ücret tanımlıysa: o ücret,
 * - hiçbiri tanımlı değilse: bilinmiyor (uydurma 0 TL veya "ücretsiz" gösterilmez).
 */
export function resolveShippingFee(
  settings: ShippingSettings,
  subtotal: number,
): ShippingFeeResult {
  const thresholdMet =
    settings.freeShippingThreshold !== null && subtotal >= settings.freeShippingThreshold;

  if (thresholdMet) {
    return { status: "free" };
  }

  if (settings.standardShippingFee !== null) {
    return { status: "fee", amount: settings.standardShippingFee };
  }

  return { status: "unknown" };
}

/** Kargo ücreti bilinmiyorsa `null` döner — bu durumda kesin bir toplam gösterilmemelidir. */
export function computeOrderTotal(subtotal: number, shipping: ShippingFeeResult): number | null {
  if (shipping.status === "unknown") {
    return null;
  }
  const shippingAmount = shipping.status === "free" ? 0 : shipping.amount;
  return subtotal + shippingAmount;
}

/** Kargo ücreti hücresinde gösterilecek metni döner; para formatı için merkezi `formatPrice` kullanılır. */
export function formatShippingFee(shipping: ShippingFeeResult): string {
  switch (shipping.status) {
    case "free":
      return "Ücretsiz";
    case "fee":
      return formatPrice(shipping.amount.toFixed(2));
    case "unknown":
      return "Henüz belirlenmedi";
  }
}

export const SHIPPING_FEE_PENDING_MESSAGE = "Kargo ücreti sipariş sürecinde netleştirilecektir.";
