/**
 * Yalnızca EKRANDA gösterim içindir. `Number()` burada bilinçli ve sınırlı bir
 * biçimlendirme adımıdır — iş kuralı/hesaplama/karşılaştırma için asla kullanılmaz
 * (bkz. src/server/services/catalog-service.ts: fiyat karşılaştırmaları Decimal ile yapılır).
 */
export function formatPrice(value: string, currency = "TRY"): string {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    // Geçersiz girdiyi olduğu gibi (ör. "NaN") EKRANA basmak yerine nötr bir
    // yer tutucu döner — uydurma bir tutar (ör. ₺0,00) da GÖSTERİLMEZ.
    return "—";
  }
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
