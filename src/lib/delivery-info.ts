import { FREE_SHIPPING_THRESHOLD_TRY } from "@/lib/checkout-shipping";

/**
 * "Teslimat Bilgileri" — tüm ürünlerde aynı olan, tek kaynaktan (kargo iş
 * kuralı) türeyen paylaşılan içerik. Ürüne özgü olmadığı için `Product`
 * tablosuna kopyalanmaz; ücretsiz kargo eşiği asla burada ayrıca hardcode
 * edilmez, `checkout-shipping.ts`'teki TEK kaynaktan okunur.
 */
export function getDeliveryInformationText(): string {
  const threshold = FREE_SHIPPING_THRESHOLD_TRY.toLocaleString("tr-TR");
  return `Siparişiniz, ürünlerin paketleme süreci tamamlandıktan sonra anlaşmalı kargo firmasına teslim edilir. Ürünler taşıma sırasında korunmasına yardımcı olacak şekilde özenle paketlenir. Teslimat süresi gönderim adresine ve kargo firmasının operasyon koşullarına göre değişebilir. ₺${threshold} ve üzeri siparişlerde kargo ücretsizdir.`;
}
