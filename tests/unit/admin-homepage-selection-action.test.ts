import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateHomepageSelectionAction } from "@/actions/admin-homepage-selection";
import { upsertHomepageSelection } from "@/server/repositories/homepage-selection-repository";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/server/providers/better-auth-provider", () => ({
  betterAuthProvider: { getCurrentUser },
}));

vi.mock("@/server/repositories/homepage-selection-repository", () => ({
  getHomepageSelectionForAdmin: vi.fn().mockResolvedValue(null),
  upsertHomepageSelection: vi.fn(),
}));

function buildFormData(): FormData {
  const formData = new FormData();
  formData.set("title", "Test Seçkisi");
  formData.set("ctaLabel", "Keşfet");
  formData.set("ctaHref", "/urunler");
  formData.set("productSlot1", "prod-1");
  return formData;
}

describe("updateHomepageSelectionAction — yetkilendirme", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(upsertHomepageSelection).mockReset();
  });

  it("oturum yoksa reddedilir, upsertHomepageSelection hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await updateHomepageSelectionAction(buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(upsertHomepageSelection).not.toHaveBeenCalled();
  });

  it("ADMIN olmayan rol reddedilir, upsertHomepageSelection hiç çağrılmaz", async () => {
    getCurrentUser.mockResolvedValue({ id: "user_1", role: "CUSTOMER" });
    const result = await updateHomepageSelectionAction(buildFormData());
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(upsertHomepageSelection).not.toHaveBeenCalled();
  });
});
