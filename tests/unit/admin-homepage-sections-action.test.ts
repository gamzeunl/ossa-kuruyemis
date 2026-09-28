import { beforeEach, describe, expect, it, vi } from "vitest";
import { reorderHomepageSectionsAction, toggleHomepageSectionActiveAction } from "@/actions/admin-homepage-sections";
import { HOMEPAGE_SECTION_KEYS } from "@/lib/homepage-sections";
import { reorderHomepageSections, setHomepageSectionActive } from "@/server/repositories/homepage-section-repository";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/server/providers/better-auth-provider", () => ({
  betterAuthProvider: { getCurrentUser },
}));

vi.mock("@/server/repositories/homepage-section-repository", () => ({
  reorderHomepageSections: vi.fn(),
  setHomepageSectionActive: vi.fn(),
}));

vi.mock("@/server/audit/audit-log", () => ({
  recordAuditLog: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const ADMIN_USER = { id: "admin_1", role: "ADMIN" };
const CUSTOMER_USER = { id: "user_1", role: "CUSTOMER" };

describe("reorderHomepageSectionsAction", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(reorderHomepageSections).mockReset();
  });

  it("oturum yoksa reddedilir", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await reorderHomepageSectionsAction(HOMEPAGE_SECTION_KEYS);
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(reorderHomepageSections).not.toHaveBeenCalled();
  });

  it("ADMIN olmayan rol reddedilir", async () => {
    getCurrentUser.mockResolvedValue(CUSTOMER_USER);
    const result = await reorderHomepageSectionsAction(HOMEPAGE_SECTION_KEYS);
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(reorderHomepageSections).not.toHaveBeenCalled();
  });

  it("eksik bir key ile (tam olmayan sıralama) reddedilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    const incomplete = HOMEPAGE_SECTION_KEYS.slice(1);
    const result = await reorderHomepageSectionsAction(incomplete);
    expect(result).toEqual({ ok: false, message: "Geçersiz sıralama." });
    expect(reorderHomepageSections).not.toHaveBeenCalled();
  });

  it("bilinmeyen/uydurma bir key içeren sıralama reddedilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    const invalid = [...HOMEPAGE_SECTION_KEYS.slice(1), "bilinmeyen-bolum"];
    const result = await reorderHomepageSectionsAction(invalid);
    expect(result).toEqual({ ok: false, message: "Geçersiz sıralama." });
    expect(reorderHomepageSections).not.toHaveBeenCalled();
  });

  it("geçerli tam sıralama kabul edilir ve repository'ye iletilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    const reversed = [...HOMEPAGE_SECTION_KEYS].reverse();
    const result = await reorderHomepageSectionsAction(reversed);
    expect(result).toEqual({ ok: true });
    expect(reorderHomepageSections).toHaveBeenCalledWith(reversed);
  });
});

describe("toggleHomepageSectionActiveAction", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(setHomepageSectionActive).mockReset();
  });

  it("oturum yoksa reddedilir", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await toggleHomepageSectionActiveAction("blog", false);
    expect(result).toEqual({ ok: false, message: "Bu işlem için yetkiniz yok." });
    expect(setHomepageSectionActive).not.toHaveBeenCalled();
  });

  it("geçersiz (uydurma) bir section key reddedilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    const result = await toggleHomepageSectionActiveAction("uydurma-bolum", false);
    expect(result).toEqual({ ok: false, message: "Geçersiz bölüm." });
    expect(setHomepageSectionActive).not.toHaveBeenCalled();
  });

  it("toggleable:false olan bir bölüm (ör. hero) pasifleştirilemez", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    const result = await toggleHomepageSectionActiveAction("hero", false);
    expect(result).toEqual({ ok: false, message: "Bu bölüm gizlenemez." });
    expect(setHomepageSectionActive).not.toHaveBeenCalled();
  });

  it("toggleable:true bir bölüm (ör. blog) başarıyla pasif yapılır", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    const result = await toggleHomepageSectionActiveAction("blog", false);
    expect(result).toEqual({ ok: true });
    expect(setHomepageSectionActive).toHaveBeenCalledWith("blog", false);
  });

  it("toggleable:true bir bölüm tekrar aktif yapılabilir", async () => {
    getCurrentUser.mockResolvedValue(ADMIN_USER);
    const result = await toggleHomepageSectionActiveAction("blog", true);
    expect(result).toEqual({ ok: true });
    expect(setHomepageSectionActive).toHaveBeenCalledWith("blog", true);
  });
});
