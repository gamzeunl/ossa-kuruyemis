import {
  FREE_SHIPPING_THRESHOLD_TRY,
  STANDARD_SHIPPING_FEE_TRY,
  type ShippingSettings,
} from "@/lib/checkout-shipping";

/**
 * Kargo ayarlarını döner. Sabit iş kuralı `@/lib/checkout-shipping`'te TEK
 * kaynaktan tanımlıdır (1.500 TL üzeri ücretsiz, altı 120 TL) — bu fonksiyon
 * yalnızca aynı imzayı (`Promise<ShippingSettings>`) koruyarak mevcut
 * çağıranların (checkout, top bar, ana sayfa "OSSA Ayrıcalıkları", SSS,
 * kargo/teslimat sayfası) hepsinin AYNI değeri kullanmasını sağlar.
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
  return {
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD_TRY,
    standardShippingFee: STANDARD_SHIPPING_FEE_TRY,
  };
}
