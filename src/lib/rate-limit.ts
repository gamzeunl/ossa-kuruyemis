import { createHmac } from "node:crypto";
import { serverEnv } from "@/config/env";
import { resolveRateLimiter, type RateLimitPolicy } from "@/server/providers/rate-limiter-provider";

/**
 * Uç/endpoint'e göre risk seviyesine uygun ayrı politikalar — hepsine körü
 * körüne aynı limit uygulanmaz (bkz. görev gereksinimi). Tek merkezi kaynak:
 * bir limiti değiştirmek için yalnızca burası düzenlenir.
 */
export const RATE_LIMIT_POLICIES = {
  /** Giriş — IP başına gürültülü paylaşılan ağları (kurumsal NAT/mobil) tolere eder. */
  loginByIp: { windowMs: 5 * 60 * 1000, max: 15 } satisfies RateLimitPolicy,
  /** Giriş — hedefli hesap saldırısını IP'den bağımsız olarak sıkı sınırlar. */
  loginByEmail: { windowMs: 15 * 60 * 1000, max: 5 } satisfies RateLimitPolicy,
  /** Kayıt — toplu sahte hesap oluşturmayı engeller. */
  registerByIp: { windowMs: 60 * 60 * 1000, max: 5 } satisfies RateLimitPolicy,
  /** Sipariş oluşturma — girişli kullanıcıda userId, misafirde IP anahtarı. */
  checkoutByIdentity: { windowMs: 10 * 60 * 1000, max: 10 } satisfies RateLimitPolicy,
  /** İletişim formu — IP başına. */
  contactByIp: { windowMs: 60 * 60 * 1000, max: 5 } satisfies RateLimitPolicy,
  /** Sipariş takibi — IP başına (gevşek, meşru tekrar kontrolü için). */
  orderTrackingByIp: { windowMs: 60 * 60 * 1000, max: 20 } satisfies RateLimitPolicy,
  /** Sipariş takibi — TEK sipariş numarasının farklı email/telefonla denenmesini (enumeration) engeller. */
  orderTrackingByOrderNumber: { windowMs: 60 * 60 * 1000, max: 10 } satisfies RateLimitPolicy,
  /** Ürün arama otomatik tamamlama — herkese açık, ucuz ama DB'ye gidiyor. */
  searchByIp: { windowMs: 60 * 1000, max: 60 } satisfies RateLimitPolicy,
  /** Admin ürün görsel upload — kimliği doğrulanmış adminId'ye göre (IP değil); makul toplu yükleme trafiğine izin verirken kötüye kullanımı sınırlar. */
  adminImageUploadByAdmin: { windowMs: 60 * 1000, max: 20 } satisfies RateLimitPolicy,
} as const;

/**
 * Rate-limit anahtarlarında ham PII (e-posta, telefon, sipariş numarası)
 * SAKLANMAZ — zaten uygulama genelinde zorunlu olan `AUTH_SECRET` ile
 * HMAC-SHA256 hash'lenir (yeni bir secret env değişkeni GEREKMEZ, bkz.
 * `order-fingerprint.ts`'in benzer SHA-256 kullanım deseni).
 */
export function hashRateLimitIdentifier(value: string): string {
  const secret = serverEnv.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET tanımlı değil; rate-limit anahtarı hash'lenemedi.");
  }
  return createHmac("sha256", secret).update(value.trim().toLocaleLowerCase("tr-TR")).digest("hex");
}

export interface RateLimitCheck {
  ok: boolean;
  retryAfterSeconds?: number;
}

/**
 * Bir Server Action'ın en başında çağrılır. `bucketKey` çağıran tarafça
 * anlamlı şekilde ad alanlandırılır (ör. `login:ip:1.2.3.4`) — burada
 * hiçbir iş mantığına dair varsayım yapılmaz, yalnızca sayar/kontrol eder.
 * Aşıldığında dönen mesaj kasıtlı olarak GENEL'dir (DB/uygulama hatası gibi
 * görünmez, hangi politikanın tetiklendiğini sızdırmaz).
 *
 * `resolveRateLimiter().consume()` başarısız olursa (ör. geçici DB kesintisi)
 * BİLEREK "fail open" davranılır — istek GEÇERLİ sayılır. Rate limiter'ın
 * kendi sağlığı, giriş/checkout/iletişim gibi ANA işlevlerin kullanılabilirliğini
 * ASLA belirlememeli; aksi halde rate limiter'ın kendisi bir DoS vektörü olurdu.
 */
export async function checkRateLimit(bucketKey: string, policy: RateLimitPolicy): Promise<RateLimitCheck> {
  try {
    const result = await resolveRateLimiter().consume(bucketKey, policy);
    if (result.allowed) {
      return { ok: true };
    }
    return { ok: false, retryAfterSeconds: result.retryAfterSeconds };
  } catch {
    return { ok: true };
  }
}
