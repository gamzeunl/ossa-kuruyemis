import { APIError } from "better-auth";
import { describe, expect, it, vi } from "vitest";
import { toErrorMessage } from "@/lib/auth-error-message";

describe("toErrorMessage — giriş/kayıt hata mesajı sızıntısı koruması", () => {
  it("Better Auth'un kendi APIError mesajını olduğu gibi döndürür (kullanıcıya gösterilmek üzere tasarlanmıştır)", () => {
    const error = new APIError("UNAUTHORIZED", { message: "Invalid email or password" });
    expect(toErrorMessage(error, "Giriş başarısız.")).toBe("Invalid email or password");
  });

  it("beklenmeyen bir Error (ör. DB/network hatası) ham .message sızdırmaz, fallback döner", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("connect ECONNREFUSED 127.0.0.1:5432");
    expect(toErrorMessage(error, "Giriş başarısız.")).toBe("Giriş başarısız.");
    expect(consoleSpy).toHaveBeenCalledWith(error);
    consoleSpy.mockRestore();
  });

  it("Error olmayan bir fırlatma (ör. string throw) fallback döner", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(toErrorMessage("beklenmedik string hata", "Kayıt başarısız.")).toBe("Kayıt başarısız.");
    vi.restoreAllMocks();
  });
});
