import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `resolveEmailProvider()` her senaryoda FARKLI bir `serverEnv` görmesi
 * gerektiğinden dinamik mock (`vi.doMock` + `vi.resetModules`) kullanılır —
 * modül seviyesi statik `vi.mock` burada uygun değildir (bkz. `rate-limit-fail-open.test.ts`'in
 * neden statik kaldığına dair not, buradaki fark: orada TEK sabit mock yeterliydi).
 * `vi.resetModules()` sonrası dinamik `import()` edilen sınıflar, bu dosyanın
 * ÜST SEVİYE statik import'undan FARKLI bir modül kimliğiyle yüklenir — bu
 * yüzden `instanceof` yerine `constructor.name` karşılaştırılır.
 */
async function resolveWithEnv(env: Record<string, string | undefined>) {
  vi.resetModules();
  vi.doMock("@/config/env", () => ({
    serverEnv: env,
    publicEnv: { NEXT_PUBLIC_SITE_URL: "http://localhost:3000" },
  }));
  const { resolveEmailProvider } = await import("@/server/providers/email-provider");
  return resolveEmailProvider();
}

describe("resolveEmailProvider", () => {
  afterEach(() => {
    vi.doUnmock("@/config/env");
    vi.resetModules();
  });

  it("EMAIL_PROVIDER tanımsızsa null döner (email gönderilmez, sipariş akışı etkilenmez)", async () => {
    const provider = await resolveWithEnv({});
    expect(provider).toBeNull();
  });

  it("EMAIL_PROVIDER=console → ConsoleEmailProvider döner", async () => {
    const provider = await resolveWithEnv({ EMAIL_PROVIDER: "console" });
    expect(provider?.constructor.name).toBe("ConsoleEmailProvider");
  });

  it("EMAIL_PROVIDER=resend + RESEND_API_KEY + EMAIL_FROM tam → gerçek ResendEmailProvider döner", async () => {
    const provider = await resolveWithEnv({
      EMAIL_PROVIDER: "resend",
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: "OSSA <no-reply@ossa.test>",
    });
    expect(provider?.constructor.name).toBe("ResendEmailProvider");
  });

  it("EMAIL_PROVIDER=resend ama RESEND_API_KEY eksik → null döner (console'a SESSİZCE DÜŞMEZ)", async () => {
    const provider = await resolveWithEnv({ EMAIL_PROVIDER: "resend", EMAIL_FROM: "OSSA <no-reply@ossa.test>" });
    expect(provider).toBeNull();
  });

  it("EMAIL_PROVIDER=resend ama EMAIL_FROM eksik → null döner (console'a SESSİZCE DÜŞMEZ)", async () => {
    const provider = await resolveWithEnv({ EMAIL_PROVIDER: "resend", RESEND_API_KEY: "re_test_key" });
    expect(provider).toBeNull();
  });
});
