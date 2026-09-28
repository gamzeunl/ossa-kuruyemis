/**
 * Arama karşılaştırması için Türkçe karakter toleranslı normalize anahtarı
 * üretir (ör. "fistik" ↔ "fıstık", "cig" ↔ "çiğ"). Bu, `@/lib/mega-menu-content`
 * içindeki `normalizeProductName` ile KARIŞTIRILMAMALIDIR — o fonksiyon mega
 * menü grup filtresinde kasıtlı olarak TAM ad eşleşmesi (yalnızca büyük/küçük
 * harf ve boşluk toleranslı) için kullanılır ve değiştirilmedi. Bu fonksiyon
 * yalnızca arama önerileri/sonuçları için, daha gevşek bir eşleştirme
 * anahtarı üretir. Ürüne gösterilen gerçek ad hiçbir yerde bu fonksiyonun
 * çıktısıyla DEĞİŞTİRİLMEZ — yalnızca karşılaştırma için kullanılır.
 */

const TURKISH_TO_ASCII: Record<string, string> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

// NFD normalizasyonu sonrası ayrışan birleşik aksan işaretleri (U+0300–U+036F).
const COMBINING_DIACRITICS_REGEX = /[̀-ͯ]/g;

export function normalizeSearchText(value: string): string {
  const lowered = value.trim().replace(/\s+/g, " ").toLocaleLowerCase("tr-TR");

  const asciiFolded = lowered.replace(/[çğıöşü]/g, (char) => TURKISH_TO_ASCII[char] ?? char);

  return asciiFolded
    .normalize("NFD")
    .replace(COMBINING_DIACRITICS_REGEX, "") // ek güvenlik katmanı: kalan aksan işaretleri
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // noktalama -> boşluk
    .replace(/\s+/g, " ")
    .trim();
}
