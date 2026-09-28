import { describe, expect, it } from "vitest";
import { profileSettingsSchema } from "@/lib/account-settings-schema";

describe("profileSettingsSchema", () => {
  it("geçerli girdiyi kabul eder", () => {
    const result = profileSettingsSchema.safeParse({ firstName: "Ayşe", lastName: "Yılmaz", phone: "0534 956 78 79" });
    expect(result.success).toBe(true);
  });

  it("boş telefonu (isteğe bağlı) kabul eder", () => {
    const result = profileSettingsSchema.safeParse({ firstName: "Ayşe", lastName: "Yılmaz", phone: "" });
    expect(result.success).toBe(true);
  });

  it("boş adı reddeder", () => {
    const result = profileSettingsSchema.safeParse({ firstName: "", lastName: "Yılmaz", phone: "" });
    expect(result.success).toBe(false);
  });

  it("geçersiz telefon formatını reddeder", () => {
    const result = profileSettingsSchema.safeParse({ firstName: "Ayşe", lastName: "Yılmaz", phone: "abc" });
    expect(result.success).toBe(false);
  });
});
