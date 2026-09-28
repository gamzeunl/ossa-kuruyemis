import { randomUUID } from "node:crypto";
import { prisma } from "@/server/db/prisma";

export interface RateLimitPolicy {
  /** Pencere uzunluğu (ms). */
  windowMs: number;
  /** Pencere başına izin verilen maksimum istek. */
  max: number;
}

export interface RateLimitResult {
  allowed: boolean;
  /** Kalan pencerede kaç istek daha yapılabilir (0 ise aşılmış demektir). */
  remaining: number;
  /** İstemciye önerilecek bekleme süresi (saniye) — `allowed:false` iken anlamlıdır. */
  retryAfterSeconds: number;
}

export interface RateLimiter {
  /** Bir isteği sayaca ekler ve o an izin verilip verilmediğini döner (atomik: sayma + kontrol tek adımda). */
  consume(bucketKey: string, policy: RateLimitPolicy): Promise<RateLimitResult>;
}

/**
 * Postgres tabanlı, sabit pencere (fixed-window) sayaç — production'da
 * multi-instance/serverless ortamda GÜVENLE çalışır: `DATABASE_URL` zaten
 * uygulamanın çalışması için ZORUNLU olduğundan bu, yeni bir dış bağımlılık
 * (Redis/Upstash vb.) GEREKTİRMEDEN tüm instance'ların paylaştığı tek bir
 * sayaç kaynağıdır — "provider yapılandırılmadığında sessizce limitsiz
 * çalışma" riski YOKTUR (env'e bağlı bir açık/kapalı anahtarı yok).
 *
 * Atomiklik: `ON CONFLICT ... DO UPDATE SET count = count + 1` TEK SQL
 * ifadesi ile yapılır — eşzamanlı istekler arasında race condition oluşmaz
 * (Postgres'in kendi satır kilidi bunu garanti eder).
 *
 * Temizlik: ayrı bir cron/queue KURULMAZ — süresi geçmiş satırlar `consume`
 * çağrıları sırasında düşük olasılıkla (yaklaşık %1) best-effort olarak
 * temizlenir (lazy cleanup), böylece tablo sınırsız büyümez.
 */
class PostgresRateLimiter implements RateLimiter {
  async consume(bucketKey: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = new Date(Math.floor(now / policy.windowMs) * policy.windowMs);

    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimitHit" ("id", "bucketKey", "windowStart", "count")
      VALUES (${randomUUID()}, ${bucketKey}, ${windowStart}, 1)
      ON CONFLICT ("bucketKey", "windowStart")
      DO UPDATE SET "count" = "RateLimitHit"."count" + 1
      RETURNING "count"
    `;
    const count = rows[0]?.count ?? 1;

    if (Math.random() < 0.01) {
      const retentionCutoff = new Date(now - policy.windowMs * 4);
      prisma.rateLimitHit.deleteMany({ where: { windowStart: { lt: retentionCutoff } } }).catch(() => {});
    }

    const windowEndsAt = windowStart.getTime() + policy.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((windowEndsAt - now) / 1000));

    return {
      allowed: count <= policy.max,
      remaining: Math.max(0, policy.max - count),
      retryAfterSeconds,
    };
  }
}

/**
 * Yalnızca hızlı BİRİM testlerinde kullanılır (pencere/aşım matematiğini DB'ye
 * dokunmadan doğrulamak için) — production'da ASLA kullanılmaz: process
 * belleği instance'lar arasında paylaşılmaz, serverless'ta her çağrı taze bir
 * instance'a düşebilir (bkz. dosya başlığı). Gerçek entegrasyon testleri
 * `PostgresRateLimiter`'ın kendisini izole test DB'ye karşı çalıştırır.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly counts = new Map<string, { windowStart: number; count: number }>();

  async consume(bucketKey: string, policy: RateLimitPolicy): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / policy.windowMs) * policy.windowMs;
    const existing = this.counts.get(bucketKey);

    const count = existing && existing.windowStart === windowStart ? existing.count + 1 : 1;
    this.counts.set(bucketKey, { windowStart, count });

    const retryAfterSeconds = Math.max(1, Math.ceil((windowStart + policy.windowMs - now) / 1000));
    return {
      allowed: count <= policy.max,
      remaining: Math.max(0, policy.max - count),
      retryAfterSeconds,
    };
  }
}

const postgresRateLimiter = new PostgresRateLimiter();

/** Uygulama kodu her zaman bunu çağırır — gerçek (Postgres) sağlayıcıyı döner. */
export function resolveRateLimiter(): RateLimiter {
  return postgresRateLimiter;
}
