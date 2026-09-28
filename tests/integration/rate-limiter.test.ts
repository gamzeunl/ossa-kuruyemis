/**
 * İZOLE `TEST_DATABASE_URL` veritabanına karşı çalışır (bkz. tests/db.ts) —
 * `tests/setup.ts` paylaşılan `src/server/db/prisma.ts` singleton'ını test
 * DB'sine yönlendirdiği için `resolveRateLimiter()`'ın döndürdüğü GERÇEK
 * `PostgresRateLimiter` burada doğrudan (mock'suz) test edilebilir.
 */
import { afterAll, describe, expect, it } from "vitest";
import { resolveRateLimiter } from "@/server/providers/rate-limiter-provider";
import { getTestPrismaClient, hasTestDatabase } from "../db";

if (!hasTestDatabase) {
  console.warn("[tests/integration/rate-limiter] TEST_DATABASE_URL tanımsız — testler atlanıyor.");
}

function uniqueKey(label: string): string {
  return `test:${label}:${Date.now()}:${Math.random().toString(36).slice(2)}`;
}

describe.skipIf(!hasTestDatabase)("PostgresRateLimiter (izole test DB)", () => {
  const prisma = hasTestDatabase ? getTestPrismaClient() : null!;
  const usedKeyPrefixes: string[] = [];

  afterAll(async () => {
    for (const prefix of usedKeyPrefixes) {
      await prisma.rateLimitHit.deleteMany({ where: { bucketKey: { startsWith: prefix } } });
    }
  });

  it("limit altındaki istekler her zaman allowed:true döner", async () => {
    const key = uniqueKey("under-limit");
    usedKeyPrefixes.push(key);
    const limiter = resolveRateLimiter();

    for (let i = 0; i < 3; i++) {
      const result = await limiter.consume(key, { windowMs: 60_000, max: 5 });
      expect(result.allowed).toBe(true);
    }
  });

  it("limiti aşan istek allowed:false + pozitif retryAfterSeconds döner", async () => {
    const key = uniqueKey("over-limit");
    usedKeyPrefixes.push(key);
    const limiter = resolveRateLimiter();
    const policy = { windowMs: 60_000, max: 2 };

    expect((await limiter.consume(key, policy)).allowed).toBe(true);
    expect((await limiter.consume(key, policy)).allowed).toBe(true);
    const blocked = await limiter.consume(key, policy);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("farklı bucket key'ler birbirinden İZOLE sayılır", async () => {
    const keyA = uniqueKey("isolation-a");
    const keyB = uniqueKey("isolation-b");
    usedKeyPrefixes.push(keyA, keyB);
    const limiter = resolveRateLimiter();
    const policy = { windowMs: 60_000, max: 1 };

    expect((await limiter.consume(keyA, policy)).allowed).toBe(true);
    // A dolu olsa da B tamamen bağımsız kendi sayacına sahiptir.
    expect((await limiter.consume(keyB, policy)).allowed).toBe(true);
    expect((await limiter.consume(keyA, policy)).allowed).toBe(false);
  });

  it("pencere dolunca sayaç sıfırlanır (kısa pencereyle reset doğrulanır)", async () => {
    const key = uniqueKey("reset");
    usedKeyPrefixes.push(key);
    const limiter = resolveRateLimiter();
    const shortPolicy = { windowMs: 300, max: 1 };

    expect((await limiter.consume(key, shortPolicy)).allowed).toBe(true);
    expect((await limiter.consume(key, shortPolicy)).allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 400));

    expect((await limiter.consume(key, shortPolicy)).allowed).toBe(true);
  });

  it("eşzamanlı istekler race condition olmadan doğru sayılır (atomiklik)", async () => {
    const key = uniqueKey("concurrency");
    usedKeyPrefixes.push(key);
    const limiter = resolveRateLimiter();
    const policy = { windowMs: 60_000, max: 5 };

    const results = await Promise.all(Array.from({ length: 10 }, () => limiter.consume(key, policy)));
    const allowedCount = results.filter((r) => r.allowed).length;
    expect(allowedCount).toBe(5);
  });
});
