import { serverEnv } from "@/config/env";

/**
 * iyzico Checkout Form entegrasyonu HENÜZ bağlanmadı (bkz.
 * `docs/IYZICO_APPLICATION_CHECKLIST.md`) — bu fonksiyon yalnızca gerçek API
 * kimlik bilgilerinin (ikisi BİRDEN) ortamda tanımlı olup olmadığını kontrol
 * eder, sahte/varsayılan bir "aktif" durumu ASLA üretmez. Şu an için her
 * zaman `false` döner. İleride gerçek iyzico entegrasyonu bağlandığında,
 * ödeme güven alanı (`PaymentTrustStrip`) ve gerçek "iyzico ile Öde" CTA'sı
 * BURADAKİ tek kontrole göre koşullu render edilir — mevcut "Siparişi
 * Oluştur" akışı bu görevde DEĞİŞTİRİLMEDİ.
 */
export function isIyzicoConfigured(): boolean {
  return Boolean(serverEnv.IYZICO_API_KEY && serverEnv.IYZICO_SECRET_KEY);
}
