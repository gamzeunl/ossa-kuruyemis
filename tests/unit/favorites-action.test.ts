import { beforeEach, describe, expect, it, vi } from "vitest";
import { addFavoriteAction, removeFavoriteAction } from "@/actions/favorites";
import { addFavorite, removeFavorite } from "@/server/services/favorite-service";

const { getCurrentUser } = vi.hoisted(() => ({ getCurrentUser: vi.fn() }));

vi.mock("@/server/providers/better-auth-provider", () => ({
  betterAuthProvider: { getCurrentUser },
}));

vi.mock("@/server/services/favorite-service", () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));

vi.mock("@/server/db/prisma", () => ({
  prisma: { product: { findUnique: vi.fn() } },
}));

describe("favoriler action — auth koruması", () => {
  beforeEach(() => {
    getCurrentUser.mockReset();
    vi.mocked(addFavorite).mockReset();
    vi.mocked(removeFavorite).mockReset();
  });

  it("girişsiz kullanıcı favori ekleyemez — servis katmanına hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await addFavoriteAction("prod_1");
    expect(result).toEqual({ ok: false, message: "Favorilere eklemek için giriş yapmalısınız." });
    expect(addFavorite).not.toHaveBeenCalled();
  });

  it("girişsiz kullanıcı favori silemez — servis katmanına hiç ulaşılmaz", async () => {
    getCurrentUser.mockResolvedValue(null);
    const result = await removeFavoriteAction("prod_1");
    expect(result).toEqual({ ok: false, message: "Bu işlem için giriş yapmalısınız." });
    expect(removeFavorite).not.toHaveBeenCalled();
  });
});
