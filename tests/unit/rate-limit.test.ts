import { describe, expect, it } from "vitest";
import { hashRateLimitIdentifier } from "@/lib/rate-limit";
import { InMemoryRateLimiter } from "@/server/providers/rate-limiter-provider";

describe("InMemoryRateLimiter (yalnızca hızlı birim testleri için — bkz. dosya başlığı)", () => {
  it("limit altındaki istekler allowed:true döner", async () => {
    const limiter = new InMemoryRateLimiter();
    const result = await limiter.consume("k1", { windowMs: 60_000, max: 3 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("limiti aşan istek allowed:false döner", async () => {
    const limiter = new InMemoryRateLimiter();
    const policy = { windowMs: 60_000, max: 2 };
    await limiter.consume("k2", policy);
    await limiter.consume("k2", policy);
    const blocked = await limiter.consume("k2", policy);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("farklı key'ler izole sayılır", async () => {
    const limiter = new InMemoryRateLimiter();
    const policy = { windowMs: 60_000, max: 1 };
    await limiter.consume("a", policy);
    const other = await limiter.consume("b", policy);
    expect(other.allowed).toBe(true);
  });
});

describe("hashRateLimitIdentifier", () => {
  it("aynı değeri her zaman aynı hash'e çevirir (deterministik)", () => {
    expect(hashRateLimitIdentifier("test@example.com")).toBe(hashRateLimitIdentifier("test@example.com"));
  });

  it("büyük/küçük harf ve boşluk farkını normalize eder", () => {
    expect(hashRateLimitIdentifier("  Test@Example.com ")).toBe(hashRateLimitIdentifier("test@example.com"));
  });

  it("farklı girdiler farklı hash üretir", () => {
    expect(hashRateLimitIdentifier("a@example.com")).not.toBe(hashRateLimitIdentifier("b@example.com"));
  });

  it("ham değeri (email) içermeyen bir hex string döner (PII sızdırmaz)", () => {
    const hash = hashRateLimitIdentifier("gizli@example.com");
    expect(hash).not.toContain("gizli");
    expect(hash).not.toContain("@");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
