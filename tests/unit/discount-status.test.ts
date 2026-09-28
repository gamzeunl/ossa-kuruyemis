import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { resolveDiscountStatus } from "@/lib/discount-status";
import type { VariantPricingInput } from "@/lib/product-pricing";

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

describe("resolveDiscountStatus", () => {
  it("isDiscountActive=false → INACTIVE (tarih/fiyat ne olursa olsun)", () => {
    const status = resolveDiscountStatus(
      variant({ discountPrice: new Prisma.Decimal("80.00"), isDiscountActive: false }),
    );
    expect(status).toBe("INACTIVE");
  });

  it("aktif + tarih aralığındaysa → ACTIVE", () => {
    const status = resolveDiscountStatus(
      variant({ discountPrice: new Prisma.Decimal("80.00"), isDiscountActive: true }),
    );
    expect(status).toBe("ACTIVE");
  });

  it("aktif + henüz başlamamışsa (gelecek startsAt) → SCHEDULED", () => {
    const status = resolveDiscountStatus(
      variant({
        discountPrice: new Prisma.Decimal("80.00"),
        isDiscountActive: true,
        discountStartsAt: new Date(Date.now() + 86_400_000),
      }),
    );
    expect(status).toBe("SCHEDULED");
  });

  it("aktif + süresi geçmişse (geçmiş endsAt) → ENDED", () => {
    const status = resolveDiscountStatus(
      variant({
        discountPrice: new Prisma.Decimal("80.00"),
        isDiscountActive: true,
        discountEndsAt: new Date(Date.now() - 86_400_000),
      }),
    );
    expect(status).toBe("ENDED");
  });
});
