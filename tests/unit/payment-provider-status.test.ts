import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `isIyzicoConfigured()` her senaryoda FARKLI bir `serverEnv` görmesi
 * gerektiğinden dinamik mock (`vi.doMock` + `vi.resetModules`) kullanılır —
 * bkz. `resolve-email-provider.test.ts`'teki AYNI desen.
 */
async function checkWithEnv(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.doMock("@/config/env", () => ({
    serverEnv: env,
    publicEnv: { NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },
  }));
  const { isIyzicoConfigured } = await import("@/lib/payment-provider-status");
  return isIyzicoConfigured();
}

describe("isIyzicoConfigured", () => {
  afterEach(() => {
    vi.doUnmock("@/config/env");
    vi.resetModules();
  });

  it("IYZICO_API_KEY ve IYZICO_SECRET_KEY ikisi de tanımsızsa false döner", async () => {
    expect(await checkWithEnv({})).toBe(false);
  });

  it("yalnızca IYZICO_API_KEY tanımlıysa false döner (ikisi BİRDEN gerekir)", async () => {
    expect(await checkWithEnv({ IYZICO_API_KEY: "key" })).toBe(false);
  });

  it("yalnızca IYZICO_SECRET_KEY tanımlıysa false döner (ikisi BİRDEN gerekir)", async () => {
    expect(await checkWithEnv({ IYZICO_SECRET_KEY: "secret" })).toBe(false);
  });

  it("IYZICO_API_KEY ve IYZICO_SECRET_KEY ikisi de tanımlıysa true döner", async () => {
    expect(await checkWithEnv({ IYZICO_API_KEY: "key", IYZICO_SECRET_KEY: "secret" })).toBe(true);
  });
});
