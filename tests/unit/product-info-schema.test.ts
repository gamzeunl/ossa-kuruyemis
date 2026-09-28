import { describe, expect, it } from "vitest";
import { productInfoFormSchema } from "@/lib/product-info-schema";

describe("productInfoFormSchema", () => {
  it("tüm alanlar boşken geçerlidir (hiçbiri zorunlu değil)", () => {
    const result = productInfoFormSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("nutritionSourceUrl için javascript: şemasını reddeder", () => {
    const result = productInfoFormSchema.safeParse({ nutritionSourceUrl: "javascript:alert(1)" });
    expect(result.success).toBe(false);
  });

  it("nutritionSourceUrl için https: şemasını kabul eder", () => {
    const result = productInfoFormSchema.safeParse({ nutritionSourceUrl: "https://fdc.nal.usda.gov/" });
    expect(result.success).toBe(true);
  });

  it("nutrition sayısal alanları geçerli bir sayı formatını kabul eder", () => {
    const result = productInfoFormSchema.safeParse({ nutritionEnergyKcal: "579.50" });
    expect(result.success).toBe(true);
  });

  it("nutrition sayısal alanları geçersiz metni reddeder", () => {
    const result = productInfoFormSchema.safeParse({ nutritionEnergyKcal: "abc" });
    expect(result.success).toBe(false);
  });

  it("nutritionConfidence yalnızca tanımlı enum değerlerini kabul eder", () => {
    const valid = productInfoFormSchema.safeParse({ nutritionConfidence: "HIGH" });
    const invalid = productInfoFormSchema.safeParse({ nutritionConfidence: "SUPER_HIGH" });
    expect(valid.success).toBe(true);
    expect(invalid.success).toBe(false);
  });
});
