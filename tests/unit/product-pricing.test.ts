import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import {
  resolveVariantPricing,
  validateVariantDiscountUpdate,
  validateVariantPriceInput,
  type VariantDiscountRawInput,
  type VariantPriceRawInput,
  type VariantPricingInput,
} from "@/lib/product-pricing";

function variant(overrides: Partial<VariantPricingInput> = {}): VariantPricingInput {
  return {
    price: new Prisma.Decimal("100.00"),
    discountPrice: null,
    discountStartsAt: null,
    discountEndsAt: null,
    isDiscountActive: false,
    ...overrides,
  };
}

describe("resolveVariantPricing", () => {
  it("senaryo 1: indirimsiz üründe regularPrice = effectivePrice", () => {
    const result = resolveVariantPricing(variant());
    expect(result.regularPrice.toString()).toBe("100");
    expect(result.effectivePrice.toString()).toBe("100");
    expect(result.discountPrice).toBeNull();
    expect(result.discountPercentage).toBeNull();
    expect(result.hasActiveDiscount).toBe(false);
  });

  it("senaryo 2: aktif indirimde effectivePrice = discountPrice", () => {
    const result = resolveVariantPricing(
      variant({ discountPrice: new Prisma.Decimal("85.00"), isDiscountActive: true }),
    );
    expect(result.effectivePrice.toString()).toBe("85");
    expect(result.regularPrice.toString()).toBe("100");
    expect(result.hasActiveDiscount).toBe(true);
    expect(result.discountPercentage).toBe(15);
  });

  it("senaryo 3: süresi bitmiş indirimde effectivePrice = regularPrice", () => {
    const result = resolveVariantPricing(
      variant({
        discountPrice: new Prisma.Decimal("85.00"),
        isDiscountActive: true,
        discountEndsAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      }),
    );
    expect(result.effectivePrice.toString()).toBe("100");
    expect(result.hasActiveDiscount).toBe(false);
    expect(result.discountPrice).toBeNull();
  });

  it("senaryo 3b: henüz başlamamış indirimde effectivePrice = regularPrice", () => {
    const result = resolveVariantPricing(
      variant({
        discountPrice: new Prisma.Decimal("85.00"),
        isDiscountActive: true,
        discountStartsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      }),
    );
    expect(result.hasActiveDiscount).toBe(false);
  });

  it("senaryo 4a: discountPrice >= regularPrice ise indirim uygulanmaz", () => {
    const result = resolveVariantPricing(
      variant({ discountPrice: new Prisma.Decimal("100.00"), isDiscountActive: true }),
    );
    expect(result.hasActiveDiscount).toBe(false);
    expect(result.effectivePrice.toString()).toBe("100");
  });

  it("senaryo 4b: discountPrice sıfır/negatif ise indirim uygulanmaz", () => {
    const result = resolveVariantPricing(
      variant({ discountPrice: new Prisma.Decimal("0"), isDiscountActive: true }),
    );
    expect(result.hasActiveDiscount).toBe(false);
  });

  it("senaryo 4c: isDiscountActive false ise discountPrice dolu olsa bile indirim uygulanmaz", () => {
    const result = resolveVariantPricing(
      variant({ discountPrice: new Prisma.Decimal("85.00"), isDiscountActive: false }),
    );
    expect(result.hasActiveDiscount).toBe(false);
    expect(result.effectivePrice.toString()).toBe("100");
  });
});

function priceInput(overrides: Partial<VariantPriceRawInput> = {}): VariantPriceRawInput {
  return {
    price: "100.00",
    discountPrice: null,
    discountStartsAt: null,
    discountEndsAt: null,
    ...overrides,
  };
}

describe("validateVariantPriceInput", () => {
  it("geçerli fiyat (indirimsiz) kabul edilir", () => {
    const result = validateVariantPriceInput(priceInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.price.toString()).toBe("100");
    expect(result.discountPrice).toBeNull();
  });

  it("geçerli fiyat + geçerli indirim kabul edilir", () => {
    const result = validateVariantPriceInput(priceInput({ discountPrice: "85.00" }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.discountPrice?.toString()).toBe("85");
  });

  it("geçersiz fiyat: sıfır reddedilir", () => {
    const result = validateVariantPriceInput(priceInput({ price: "0" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("Normal fiyat");
  });

  it("geçersiz fiyat: negatif reddedilir", () => {
    const result = validateVariantPriceInput(priceInput({ price: "-10" }));
    expect(result.ok).toBe(false);
  });

  it("geçersiz fiyat: sayı olmayan değer reddedilir", () => {
    const result = validateVariantPriceInput(priceInput({ price: "abc" }));
    expect(result.ok).toBe(false);
  });

  it("geçersiz indirim: indirimli fiyat normal fiyata eşit veya büyükse reddedilir", () => {
    const result = validateVariantPriceInput(priceInput({ discountPrice: "100" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("İndirimli fiyat");
  });

  it("geçersiz indirim: indirimli fiyat sıfır/negatifse reddedilir", () => {
    const result = validateVariantPriceInput(priceInput({ discountPrice: "0" }));
    expect(result.ok).toBe(false);
  });

  it("geçersiz indirim: başlangıç tarihi bitişten sonraysa reddedilir", () => {
    const result = validateVariantPriceInput(
      priceInput({
        discountPrice: "85",
        discountStartsAt: new Date("2026-06-10"),
        discountEndsAt: new Date("2026-06-01"),
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("İndirim başlangıç");
  });
});

function discountInput(overrides: Partial<VariantDiscountRawInput> = {}): VariantDiscountRawInput {
  return {
    discountPrice: "",
    isDiscountActive: false,
    discountStartsAt: null,
    discountEndsAt: null,
    ...overrides,
  };
}

describe("validateVariantDiscountUpdate (Haftanın Fırsatları — DB'den okunan gerçek fiyata göre doğrular)", () => {
  const regularPrice = new Prisma.Decimal("300.00");

  it("indirimsiz (boş discountPrice) girdi kabul edilir", () => {
    const result = validateVariantDiscountUpdate(regularPrice, discountInput());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.discountPrice).toBeNull();
  });

  it("geçerli indirim kabul edilir", () => {
    const result = validateVariantDiscountUpdate(
      regularPrice,
      discountInput({ discountPrice: "249.90", isDiscountActive: true }),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.discountPrice?.toString()).toBe("249.9");
  });

  it("discountPrice >= regularPrice reddedilir", () => {
    const result = validateVariantDiscountUpdate(regularPrice, discountInput({ discountPrice: "300.00" }));
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("İndirimli fiyat");
  });

  it("sıfır/negatif indirim reddedilir", () => {
    expect(validateVariantDiscountUpdate(regularPrice, discountInput({ discountPrice: "0" })).ok).toBe(false);
    expect(validateVariantDiscountUpdate(regularPrice, discountInput({ discountPrice: "-10" })).ok).toBe(false);
  });

  it("başlangıç tarihi bitişten sonraysa reddedilir", () => {
    const result = validateVariantDiscountUpdate(
      regularPrice,
      discountInput({
        discountPrice: "249.90",
        discountStartsAt: new Date("2026-06-10"),
        discountEndsAt: new Date("2026-06-01"),
      }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("İndirim başlangıç");
  });

  it("aktif işaretlenmiş ama indirimli fiyat girilmemişse reddedilir", () => {
    const result = validateVariantDiscountUpdate(
      regularPrice,
      discountInput({ discountPrice: "", isDiscountActive: true }),
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.message).toContain("Aktif etmek için");
  });
});
