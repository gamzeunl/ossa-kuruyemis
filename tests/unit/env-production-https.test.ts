import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `src/config/env.ts`'in PARSE ANINDA (modül yüklenirken) fırlattığı hatayı
 * test eder — bu yüzden `@/config/env` MOCK'LANMAZ, gerçek modül her
 * senaryoda `vi.resetModules()` sonrası FARKLI `process.env` değerleriyle
 * yeniden import edilir (bkz. `resolve-email-provider.test.ts`'teki AYNI
 * dinamik-import deseni, oradaki fark: burada mock edilen modülün KENDİSİ
 * test ediliyor, bir tüketicisi değil).
 */
const ORIGINAL_ENV = { ...process.env };

async function loadEnvWith(overrides: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
  return import("@/config/env");
}

describe("src/config/env.ts — production'da NEXT_PUBLIC_SITE_URL zorunlu HTTPS", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.resetModules();
  });

  it("development'ta NEXT_PUBLIC_SITE_URL tanımsızsa http://localhost:3000 varsayılanı KULLANILIR (bozulmadı)", async () => {
    const { publicEnv } = await loadEnvWith({ NODE_ENV: "development", NEXT_PUBLIC_SITE_URL: undefined });
    expect(publicEnv.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("development'ta http:// bir URL verilirse sorunsuz kabul edilir", async () => {
    const { publicEnv } = await loadEnvWith({ NODE_ENV: "development", NEXT_PUBLIC_SITE_URL: "http://localhost:4000" });
    expect(publicEnv.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:4000");
  });

  it("production'da https:// ile başlayan geçerli bir URL kabul edilir", async () => {
    const { publicEnv } = await loadEnvWith({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "https://ossakuruyemis.com",
    });
    expect(publicEnv.NEXT_PUBLIC_SITE_URL).toBe("https://ossakuruyemis.com");
  });

  it("production'da http:// (https DEĞİL) bir URL verilirse anlaşılır bir hata fırlatılır", async () => {
    await expect(
      loadEnvWith({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: "http://ossakuruyemis.com" }),
    ).rejects.toThrow(/https/i);
  });

  it("production'da (ör. yerel `next build` sırasında) http://localhost bir URL verilirse İSTİSNA olarak kabul edilir — yerel build kırılmaz", async () => {
    const { publicEnv } = await loadEnvWith({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    });
    expect(publicEnv.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
  });

  it("production'da http://127.0.0.1 bir URL verilirse İSTİSNA olarak kabul edilir", async () => {
    const { publicEnv } = await loadEnvWith({
      NODE_ENV: "production",
      NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000",
    });
    expect(publicEnv.NEXT_PUBLIC_SITE_URL).toBe("http://127.0.0.1:3000");
  });

  it("production'da NEXT_PUBLIC_SITE_URL hiç tanımlı değilse hata fırlatılır (varsayılana SESSİZCE düşmez)", async () => {
    await expect(loadEnvWith({ NODE_ENV: "production", NEXT_PUBLIC_SITE_URL: undefined })).rejects.toThrow();
  });
});
