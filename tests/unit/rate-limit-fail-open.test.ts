import { describe, expect, it, vi } from "vitest";

const { consume } = vi.hoisted(() => ({ consume: vi.fn() }));

vi.mock("@/server/providers/rate-limiter-provider", () => ({
  resolveRateLimiter: () => ({ consume }),
}));

const { checkRateLimit } = await import("@/lib/rate-limit");

describe("checkRateLimit — provider failure (fail-open)", () => {
  it("rate limiter sağlayıcısı hata fırlatırsa istek ENGELLENMEZ (ok:true) — rate limiter'ın kendi sağlığı ana işlevi bloklamamalı", async () => {
    consume.mockRejectedValueOnce(new Error("DB bağlantısı koptu"));
    const result = await checkRateLimit("any-key", { windowMs: 60_000, max: 1 });
    expect(result.ok).toBe(true);
  });

  it("sağlayıcı normal çalışırken limiti aşan istek yine de engellenir (fail-open yalnızca HATA durumunda geçerli)", async () => {
    consume.mockResolvedValueOnce({ allowed: false, remaining: 0, retryAfterSeconds: 30 });
    const result = await checkRateLimit("any-key", { windowMs: 60_000, max: 1 });
    expect(result.ok).toBe(false);
    expect(result.retryAfterSeconds).toBe(30);
  });
});
