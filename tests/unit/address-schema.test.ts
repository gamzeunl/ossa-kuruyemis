import { describe, expect, it } from "vitest";
import { addressFormSchema } from "@/lib/address-schema";

function validInput(overrides: Record<string, unknown> = {}) {
  return {
    type: "SHIPPING",
    title: "Ev",
    firstName: "Ayşe",
    lastName: "Yılmaz",
    phone: "0534 956 78 79",
    city: "Mersin",
    district: "Mut",
    neighborhood: "",
    postalCode: "",
    addressLine: "Seyran Sokak No:2, Karşıyaka",
    invoiceCompanyName: "",
    taxOffice: "",
    taxNumber: "",
    isDefault: false,
    ...overrides,
  };
}

describe("addressFormSchema", () => {
  it("geçerli girdiyi kabul eder", () => {
    const result = addressFormSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  it("geçersiz adres türünü reddeder", () => {
    const result = addressFormSchema.safeParse(validInput({ type: "INVALID" }));
    expect(result.success).toBe(false);
  });

  it("boş başlığı reddeder", () => {
    const result = addressFormSchema.safeParse(validInput({ title: "" }));
    expect(result.success).toBe(false);
  });

  it("geçersiz telefon formatını reddeder", () => {
    const result = addressFormSchema.safeParse(validInput({ phone: "123" }));
    expect(result.success).toBe(false);
  });

  it("çok kısa açık adresi reddeder", () => {
    const result = addressFormSchema.safeParse(validInput({ addressLine: "Kısa" }));
    expect(result.success).toBe(false);
  });

  it("geçersiz vergi numarasını (10/11 hane değilse) reddeder", () => {
    const result = addressFormSchema.safeParse(validInput({ taxNumber: "12345" }));
    expect(result.success).toBe(false);
  });

  it("geçerli 10 haneli VKN'yi kabul eder", () => {
    const result = addressFormSchema.safeParse(validInput({ taxNumber: "1234567890" }));
    expect(result.success).toBe(true);
  });

  it("boş isteğe bağlı alanları null'a dönüştürür", () => {
    const result = addressFormSchema.safeParse(validInput());
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.neighborhood).toBeNull();
      expect(result.data.postalCode).toBeNull();
      expect(result.data.taxNumber).toBeNull();
    }
  });
});
