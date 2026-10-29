import { getClientIp } from "./request-ip";

/**
 * iyzico `buyer.ip` alanı ZORUNLUDUR ve geçerli bir IP adresi olmalıdır —
 * `getClientIp()`'in "hiçbir proxy başlığı yok" durumunda döndürdüğü
 * `"unknown"` sabiti iyzico'ya gönderilemez.
 *
 * `getClientIp()` bilinçli olarak ASLA throw etmez (hız sınırlama onu
 * çökmeden kullanabilsin diye); ödeme akışının ihtiyacı farklıdır:
 * ya geçerli bir IP, ya da nedeni AÇIK bir hata. Bu modül o farkı kapatır.
 *
 * Yerel geliştirmede (`next dev`) önünde ters proxy olmadığından
 * `x-forwarded-for`/`x-real-ip` HİÇ gelmez — eski davranışta checkout bu
 * yüzden her zaman "Müşteri IP adresi belirlenemedi." ile düşüyordu.
 * Production DIŞINDA loopback adresine düşülür; production'da gerçek IP
 * zorunludur ve eksikse hata ters proxy yapılandırmasını işaret eder.
 */

const DEVELOPMENT_FALLBACK_IP = "127.0.0.1";

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * iyzico IPv6'yı kabul etmediğinden IPv4-mapped IPv6 adresleri
 * (`::ffff:1.2.3.4`) IPv4 karşılığına indirgenir.
 */
function unwrapIpv4MappedIpv6(value: string): string {
  const match = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i.exec(value);
  return match ? match[1] : value;
}

export function isValidIpv4(value: string): boolean {
  const match = IPV4_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  return match.slice(1).every((octet) => {
    // Baştaki sıfır (ör. "01") bazı parser'larda farklı yorumlanır — reddedilir.
    if (octet.length > 1 && octet.startsWith("0")) {
      return false;
    }
    const number = Number(octet);
    return number >= 0 && number <= 255;
  });
}

/**
 * Ödeme isteği için istemci IP'sini çözer. Geçerli bir IPv4 bulunamazsa
 * production'da throw eder; diğer ortamlarda loopback adresine düşer.
 */
export async function resolvePaymentClientIp(
  isProduction = process.env.NODE_ENV === "production",
): Promise<string> {
  const raw = await getClientIp();
  const candidate = unwrapIpv4MappedIpv6(raw.trim());

  if (isValidIpv4(candidate)) {
    return candidate;
  }

  if (!isProduction) {
    return DEVELOPMENT_FALLBACK_IP;
  }

  throw new Error(
    "Ödeme için müşteri IP adresi belirlenemedi. Ters proxy (nginx/Vercel) " +
      "`X-Forwarded-For` başlığını ayarlamalıdır.",
  );
}
