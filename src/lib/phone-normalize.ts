/**
 * Karşılaştırma amaçlı telefon normalizasyonu — checkout formu telefonu
 * serbest biçimde kabul ettiğinden (boşluk/tire, opsiyonel `0`/`+90` öneki),
 * kamuya açık sipariş takibinde kullanıcının girdiği numarayı DB'deki
 * saklanmış numarayla adil biçimde eşleştirmek için rakam dışı karakterleri
 * ve baştaki ülke/trunk önekini (`90`/`0`) atar. Yalnızca EŞLEŞTİRME
 * içindir — hiçbir yerde saklama/gösterim formatı olarak kullanılmaz.
 */
export function normalizePhoneForCompare(value: string): string {
  const digitsOnly = value.replace(/\D/g, "");
  if (digitsOnly.startsWith("90") && digitsOnly.length > 10) {
    return digitsOnly.slice(2);
  }
  if (digitsOnly.startsWith("0") && digitsOnly.length > 10) {
    return digitsOnly.slice(1);
  }
  return digitsOnly;
}
