import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCategoryAction } from "@/actions/admin-categories";
import { resolveStorageProvider } from "@/server/providers/storage-provider";
import { createCategory } from "@/server/repositories/category-repository";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/server/providers/better-auth-provider", () => ({
  betterAuthProvider: { getCurrentUser },
}));

vi.mock("@/server/repositories/category-repository", () => ({
  createCategory: vi.fn(),
}));

vi.mock("@/server/providers/storage-provider", () => ({
  resolveStorageProvider: vi.fn(),
}));

const ADMIN_USER = {
  id: "admin_1",
  email: "admin@ossa-test.local",
  firstName: "Admin",
  lastName: "Kullanıcı",
  role: "ADMIN",
};

function buildFormData(): FormData {
  const formData = new FormData();
  formData.set("name", "Kuru Meyveler");
  formData.set("slug", "kuru-meyveler");
  formData.set("sortOrder", "0");
  return formData;
}

describe("createCategoryAction", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(createCategory).mockReset();
    vi.mocked(resolveStorageProvider).mockReset();
  });

  it("yetkisiz erişim: oturum yoksa reddedilir, createCategory hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await createCategoryAction(buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(createCategory).not.toHaveBeenCalled();
  });

  it("yetkisiz erişim: ADMIN olmayan rol reddedilir, createCategory hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue({
      id: "user_1",
      email: "musteri@ossa-test.local",
      firstName: "Test",
      lastName: "Müşteri",
      role: "CUSTOMER",
    });
    const result = await createCategoryAction(buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(createCategory).not.toHaveBeenCalled();
  });

  it("görsel yükleme hatasında kayıt oluşmaz", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    vi.mocked(resolveStorageProvider).mockReturnValue({
      upload: vi.fn().mockRejectedValue(new Error("disk hatası")),
      delete: vi.fn(),
      deleteByUrl: vi.fn(),
      getPublicUrl: vi.fn(),
      isOwnedUrl: vi.fn(() => true),
    });

    const formData = buildFormData();
    const file = new File([new Uint8Array([1, 2, 3])], "test.jpg", { type: "image/jpeg" });
    formData.set("image", file);

    const result = await createCategoryAction(formData);
    expect(result).toEqual({ ok: false, message: "Görsel yüklenemedi." });
    expect(createCategory).not.toHaveBeenCalled();
  });
});
