import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDiscountAction, updateDiscountAction } from "@/actions/admin-discounts";
import { findVariantForAdmin, updateVariantDiscount } from "@/server/repositories/product-repository";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/server/providers/better-auth-provider", () => ({
  betterAuthProvider: { getCurrentUser },
}));

vi.mock("@/server/repositories/product-repository", () => ({
  findVariantForAdmin: vi.fn(),
  updateVariantDiscount: vi.fn(),
}));

function buildFormData(): FormData {
  const formData = new FormData();
  formData.set("variantId", "var_1");
  formData.set("discountPrice", "249.90");
  formData.set("isDiscountActive", "on");
  return formData;
}

describe("Haftanın Fırsatları action'ları — yetkisiz erişim", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(findVariantForAdmin).mockReset();
    vi.mocked(updateVariantDiscount).mockReset();
  });

  it("createDiscountAction: oturum yoksa reddedilir, DB'ye hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await createDiscountAction(buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findVariantForAdmin).not.toHaveBeenCalled();
    expect(updateVariantDiscount).not.toHaveBeenCalled();
  });

  it("createDiscountAction: ADMIN olmayan rol reddedilir, DB'ye hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue({
      id: "user_1",
      email: "musteri@ossa-test.local",
      firstName: "Test",
      lastName: "Müşteri",
      role: "CUSTOMER",
    });
    const result = await createDiscountAction(buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findVariantForAdmin).not.toHaveBeenCalled();
    expect(updateVariantDiscount).not.toHaveBeenCalled();
  });

  it("updateDiscountAction: oturum yoksa reddedilir, DB'ye hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await updateDiscountAction("var_1", buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findVariantForAdmin).not.toHaveBeenCalled();
    expect(updateVariantDiscount).not.toHaveBeenCalled();
  });

  it("updateDiscountAction: ADMIN olmayan rol reddedilir, DB'ye hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue({
      id: "user_1",
      email: "musteri@ossa-test.local",
      firstName: "Test",
      lastName: "Müşteri",
      role: "CUSTOMER",
    });
    const result = await updateDiscountAction("var_1", buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findVariantForAdmin).not.toHaveBeenCalled();
    expect(updateVariantDiscount).not.toHaveBeenCalled();
  });
});
