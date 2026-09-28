import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResendEmailProvider } from "@/server/providers/resend-email-provider";

describe("ResendEmailProvider", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("başarılı yanıt (2xx) → ok:true döner, doğru endpoint/header/body ile çağrılır", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({ id: "test-id" }), { status: 200 }));

    const provider = new ResendEmailProvider("test-api-key", "OSSA <no-reply@ossa.test>");
    const result = await provider.sendEmail({
      to: "musteri@example.com",
      subject: "Test Konu",
      html: "<p>Test</p>",
      text: "Test",
    });

    expect(result).toEqual({ ok: true });
    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
          "Content-Type": "application/json",
        }),
      }),
    );
    const call = vi.mocked(global.fetch).mock.calls[0];
    const body = JSON.parse(call[1]?.body as string);
    expect(body).toEqual({
      from: "OSSA <no-reply@ossa.test>",
      to: ["musteri@example.com"],
      subject: "Test Konu",
      html: "<p>Test</p>",
      text: "Test",
    });
  });

  it("API 4xx/5xx dönerse ok:false + hata mesajı döner, THROW ETMEZ", async () => {
    vi.mocked(global.fetch).mockResolvedValue(new Response(JSON.stringify({ message: "Invalid API key" }), { status: 401 }));

    const provider = new ResendEmailProvider("bad-key", "OSSA <no-reply@ossa.test>");
    const result = await provider.sendEmail({ to: "a@b.com", subject: "S", html: "<p/>", text: "t" });

    expect(result.ok).toBe(false);
    expect(result.error).toContain("401");
  });

  it("ağ hatası (fetch reject) durumunda ok:false döner, THROW ETMEZ", async () => {
    vi.mocked(global.fetch).mockRejectedValue(new Error("network down"));

    const provider = new ResendEmailProvider("test-key", "OSSA <no-reply@ossa.test>");
    const result = await provider.sendEmail({ to: "a@b.com", subject: "S", html: "<p/>", text: "t" });

    expect(result.ok).toBe(false);
    expect(result.error).toBeDefined();
  });
});
