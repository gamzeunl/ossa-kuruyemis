import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBundleOfferAction,
  deleteBundleOfferAction,
  updateBundleOfferAction,
} from "@/actions/admin-bundle-offers";
import { findVariantForAdmin } from "@/server/repositories/product-repository";
import {
  createBundleOffer,
  deleteBundleOffer,
  findBundleOfferForAdmin,
  updateBundleOffer,
} from "@/server/repositories/bundle-offer-repository";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/server/providers/better-auth-provider", () => ({
  betterAuthProvider: { getCurrentUser },
}));

vi.mock("@/server/repositories/product-repository", () => ({
  findVariantForAdmin: vi.fn(),
}));

vi.mock("@/server/repositories/bundle-offer-repository", () => ({
  createBundleOffer: vi.fn(),
  updateBundleOffer: vi.fn(),
  deleteBundleOffer: vi.fn(),
  findBundleOfferForAdmin: vi.fn(),
}));

function buildFormData(): FormData {
  const formData = new FormData();
  formData.set("primaryVariantId", "var_kahve");
  formData.set("companionVariantId", "var_lokum");
  formData.set("companionPrice", "119.00");
  formData.set("sortOrder", "0");
  return formData;
}

const CUSTOMER = {
  id: "user_1",
  email: "musteri@ossa-test.local",
  firstName: "Test",
  lastName: "Müşteri",
  role: "CUSTOMER",
};

describe("Birlikte Al kampanya action'ları — yetkisiz erişim", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(findVariantForAdmin).mockReset();
    vi.mocked(createBundleOffer).mockReset();
    vi.mocked(updateBundleOffer).mockReset();
    vi.mocked(deleteBundleOffer).mockReset();
    vi.mocked(findBundleOfferForAdmin).mockReset();
  });

  it("createBundleOfferAction: oturum yoksa reddedilir, DB'ye hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await createBundleOfferAction(buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findVariantForAdmin).not.toHaveBeenCalled();
    expect(createBundleOffer).not.toHaveBeenCalled();
  });

  it("createBundleOfferAction: ADMIN olmayan rol reddedilir, DB'ye hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue(CUSTOMER);
    const result = await createBundleOfferAction(buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findVariantForAdmin).not.toHaveBeenCalled();
    expect(createBundleOffer).not.toHaveBeenCalled();
  });

  it("updateBundleOfferAction: oturum yoksa reddedilir, DB'ye hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await updateBundleOfferAction("bundle_1", buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findBundleOfferForAdmin).not.toHaveBeenCalled();
    expect(updateBundleOffer).not.toHaveBeenCalled();
  });

  it("updateBundleOfferAction: ADMIN olmayan rol reddedilir, DB'ye hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue(CUSTOMER);
    const result = await updateBundleOfferAction("bundle_1", buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findBundleOfferForAdmin).not.toHaveBeenCalled();
    expect(updateBundleOffer).not.toHaveBeenCalled();
  });

  it("deleteBundleOfferAction: oturum yoksa reddedilir, DB'ye hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await deleteBundleOfferAction("bundle_1");
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findBundleOfferForAdmin).not.toHaveBeenCalled();
    expect(deleteBundleOffer).not.toHaveBeenCalled();
  });

  it("deleteBundleOfferAction: ADMIN olmayan rol reddedilir, DB'ye hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue(CUSTOMER);
    const result = await deleteBundleOfferAction("bundle_1");
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(findBundleOfferForAdmin).not.toHaveBeenCalled();
    expect(deleteBundleOffer).not.toHaveBeenCalled();
  });
});
