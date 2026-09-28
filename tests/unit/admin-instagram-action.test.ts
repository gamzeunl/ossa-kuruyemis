import { beforeEach, describe, expect, it, vi } from "vitest";
import { createInstagramPostAction } from "@/actions/admin-instagram";
import { createInstagramPost } from "@/server/repositories/instagram-post-repository";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/server/providers/better-auth-provider", () => ({
  betterAuthProvider: { getCurrentUser },
}));

vi.mock("@/server/repositories/instagram-post-repository", () => ({
  createInstagramPost: vi.fn(),
  findInstagramPostById: vi.fn(),
}));

function buildFormData(overrides: Record<string, string> = {}): FormData {
  const formData = new FormData();
  formData.set("postUrl", "https://www.instagram.com/p/ABC123/");
  formData.set("caption", "Test");
  formData.set("sortOrder", "0");
  for (const key in overrides) {
    formData.set(key, overrides[key]);
  }
  return formData;
}

describe("createInstagramPostAction — yetkilendirme ve doğrulama (dosya yükleme YOK, tek veri kaynağı postUrl)", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(createInstagramPost).mockReset();
  });

  it("oturum yoksa reddedilir, createInstagramPost hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await createInstagramPostAction(buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(createInstagramPost).not.toHaveBeenCalled();
  });

  it("ADMIN olmayan rol reddedilir, createInstagramPost hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue({
      id: "user_1",
      email: "musteri@ossa-test.local",
      firstName: "Test",
      lastName: "Müşteri",
      role: "CUSTOMER",
    });
    const result = await createInstagramPostAction(buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(createInstagramPost).not.toHaveBeenCalled();
  });

  it("güvensiz postUrl (javascript:) admin olsa dahi reddedilir, kayıt oluşmaz", async () => {
    getCurrentUser.mockResolvedValue({ id: "admin_1", role: "ADMIN" });
    const result = await createInstagramPostAction(buildFormData({ postUrl: "javascript:alert(1)" }));
    expect(result.ok).toBe(false);
    expect(createInstagramPost).not.toHaveBeenCalled();
  });

  it("profil URL'si (post/reel değil) admin olsa dahi reddedilir, kayıt oluşmaz", async () => {
    getCurrentUser.mockResolvedValue({ id: "admin_1", role: "ADMIN" });
    const result = await createInstagramPostAction(
      buildFormData({ postUrl: "https://www.instagram.com/ossa.kuruyemis/" }),
    );
    expect(result.ok).toBe(false);
    expect(createInstagramPost).not.toHaveBeenCalled();
  });

  it("Instagram API yapılandırılmamışsa (test ortamında env yok) geçerli URL'de dahi anlaşılır hatayla reddedilir", async () => {
    if (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      return;
    }
    getCurrentUser.mockResolvedValue({ id: "admin_1", role: "ADMIN" });
    const result = await createInstagramPostAction(buildFormData());
    expect(result).toEqual({
      ok: false,
      message: "Instagram API yapılandırılmamış. Lütfen sistem yöneticisiyle iletişime geçin.",
    });
    expect(createInstagramPost).not.toHaveBeenCalled();
  });
});
