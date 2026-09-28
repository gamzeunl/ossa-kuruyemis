import { describe, expect, it } from "vitest";
import { resolveSharedDiscountDeadlineLabel } from "@/lib/discount-shared-deadline";
import type { ProductSummary, ProductVariantSummary } from "@/types/catalog";

function buildVariant(overrides: Partial<ProductVariantSummary> = {}): ProductVariantSummary {
  return {
    id: "v1",
    sku: "SKU",
    name: "500 g",
    weightGram: 500,
    regularPrice: "100.00",
    effectivePrice: "80.00",
    discountPrice: "80.00",
    discountPercentage: 20,
    hasActiveDiscount: true,
    discountEndsAt: null,
    stockStatus: "IN_STOCK",
    isAvailable: true,
    ...overrides,
  };
}

function buildProduct(id: string, discountEndsAt: Date | null): ProductSummary {
  return {
    id,
    name: `Ürün ${id}`,
    slug: `${id}-slug`,
    shortDescription: null,
    primaryImage: null,
    minPrice: "80.00",
    defaultVariant: buildVariant({ discountEndsAt }),
    isOutOfStock: false,
    isFeatured: false,
    badges: [],
  };
}

const NOW = new Date("2026-08-14T12:00:00Z");

describe("resolveSharedDiscountDeadlineLabel", () => {
  it("tüm ürünler aynı yakın günde bitiyorsa etiket döner", () => {
    const sameDay1 = new Date("2026-08-16T18:00:00Z");
    const sameDay2 = new Date("2026-08-16T09:00:00Z");
    const label = resolveSharedDiscountDeadlineLabel(
      [buildProduct("p1", sameDay1), buildProduct("p2", sameDay2)],
      NOW,
    );
    expect(label).toBe("Bu hafta sonuna kadar");
  });

  it("ürünler farklı günlerde bitiyorsa null döner", () => {
    const label = resolveSharedDiscountDeadlineLabel(
      [buildProduct("p1", new Date("2026-08-16T18:00:00Z")), buildProduct("p2", new Date("2026-08-18T18:00:00Z"))],
      NOW,
    );
    expect(label).toBeNull();
  });

  it("bir üründe discountEndsAt yoksa null döner", () => {
    const label = resolveSharedDiscountDeadlineLabel(
      [buildProduct("p1", new Date("2026-08-16T18:00:00Z")), buildProduct("p2", null)],
      NOW,
    );
    expect(label).toBeNull();
  });

  it("ortak bitiş tarihi 7 günden uzaktaysa null döner (gerçek tarihe dayanmayan metin üretilmez)", () => {
    const label = resolveSharedDiscountDeadlineLabel(
      [buildProduct("p1", new Date("2026-09-01T18:00:00Z")), buildProduct("p2", new Date("2026-09-01T09:00:00Z"))],
      NOW,
    );
    expect(label).toBeNull();
  });

  it("ürün listesi boşsa null döner", () => {
    expect(resolveSharedDiscountDeadlineLabel([], NOW)).toBeNull();
  });

  it("tek ürün de olsa geçerli/yakın tarihliyse etiket döner", () => {
    const label = resolveSharedDiscountDeadlineLabel([buildProduct("p1", new Date("2026-08-15T18:00:00Z"))], NOW);
    expect(label).toBe("Bu hafta sonuna kadar");
  });
});
