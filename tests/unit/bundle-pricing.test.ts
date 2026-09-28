import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { isBundleOfferCurrentlyValid, resolveBundleCompanionPrice } from "@/lib/bundle-pricing";
import type { BundleOfferPricingInput } from "@/lib/bundle-pricing";

function bundle(overrides: Partial<BundleOfferPricingInput> = {}): BundleOfferPricingInput {
  return {
    companionPrice: new Prisma.Decimal("119.00"),
    startsAt: null,
    endsAt: null,
    isActive: true,
    ...overrides,
  };
}

const INDEPENDENT_PRICE = new Prisma.Decimal("150.00");

describe("resolveBundleCompanionPrice — Türk Kahvesi + Lokum senaryosu", () => {
  it("geçerli kampanya (₺119 < ₺150) → bundle fiyatı uygulanır", () => {
    const result = resolveBundleCompanionPrice(INDEPENDENT_PRICE, bundle());
    expect(result.isBundleApplied).toBe(true);
    expect(result.effectivePrice.toString()).toBe("119");
  });

  it("isActive=false → bağımsız fiyat, bundle uygulanmaz (KRİTİK KURAL: tek başına ₺119 OLAMAZ)", () => {
    const result = resolveBundleCompanionPrice(INDEPENDENT_PRICE, bundle({ isActive: false }));
    expect(result.isBundleApplied).toBe(false);
    expect(result.effectivePrice.toString()).toBe("150");
  });

  it("henüz başlamamış (gelecek startsAt) → bağımsız fiyat", () => {
    const result = resolveBundleCompanionPrice(
      INDEPENDENT_PRICE,
      bundle({ startsAt: new Date(Date.now() + 86_400_000) }),
    );
    expect(result.isBundleApplied).toBe(false);
    expect(result.effectivePrice.toString()).toBe("150");
  });

  it("süresi bitmiş (geçmiş endsAt) → bağımsız fiyat", () => {
    const result = resolveBundleCompanionPrice(
      INDEPENDENT_PRICE,
      bundle({ endsAt: new Date(Date.now() - 86_400_000) }),
    );
    expect(result.isBundleApplied).toBe(false);
    expect(result.effectivePrice.toString()).toBe("150");
  });

  it("bundle fiyatı bağımsız fiyattan yüksek/eşitse → bağımsız fiyat kazanır", () => {
    const result = resolveBundleCompanionPrice(INDEPENDENT_PRICE, bundle({ companionPrice: new Prisma.Decimal("150.00") }));
    expect(result.isBundleApplied).toBe(false);
    expect(result.effectivePrice.toString()).toBe("150");
  });

  it("bundle ₺119 vs. aktif indirimli fiyat ₺130 → min() kuralı: ₺119 kazanır", () => {
    const discountedIndependentPrice = new Prisma.Decimal("130.00");
    const result = resolveBundleCompanionPrice(discountedIndependentPrice, bundle());
    expect(result.isBundleApplied).toBe(true);
    expect(result.effectivePrice.toString()).toBe("119");
  });

  it("bundle ₺119 vs. aktif indirimli fiyat ₺110 → min() kuralı: indirim (₺110) kazanır", () => {
    const discountedIndependentPrice = new Prisma.Decimal("110.00");
    const result = resolveBundleCompanionPrice(discountedIndependentPrice, bundle());
    expect(result.isBundleApplied).toBe(false);
    expect(result.effectivePrice.toString()).toBe("110");
  });

  it("companionPrice sıfır/negatifse → geçersiz, bağımsız fiyat", () => {
    const result = resolveBundleCompanionPrice(INDEPENDENT_PRICE, bundle({ companionPrice: new Prisma.Decimal("0") }));
    expect(result.isBundleApplied).toBe(false);
  });
});

describe("isBundleOfferCurrentlyValid", () => {
  it("tüm koşullar sağlanıyorsa true döner", () => {
    expect(isBundleOfferCurrentlyValid(bundle(), INDEPENDENT_PRICE)).toBe(true);
  });

  it("isActive=false ise false döner", () => {
    expect(isBundleOfferCurrentlyValid(bundle({ isActive: false }), INDEPENDENT_PRICE)).toBe(false);
  });
});
