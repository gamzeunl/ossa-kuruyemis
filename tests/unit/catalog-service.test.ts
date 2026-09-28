import { describe, expect, it } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import { resolveVariantPricing } from "@/lib/product-pricing";
import { computeMinPrice, resolveVariants, type VariantRow } from "@/server/services/catalog-service";

function variantRow(overrides: Partial<VariantRow> = {}): VariantRow {
  return {
    id: "var-1",
    sku: "SKU-1",
    name: "500 g",
    weightGram: 500,
    price: new Prisma.Decimal("100.00"),
    discountPrice: null,
    discountStartsAt: null,
    discountEndsAt: null,
    isDiscountActive: false,
    sortOrder: 0,
    inventory: { quantityAvailable: 10, quantityReserved: 0, lowStockThreshold: 1 },
    ...overrides,
  };
}

describe("resolveVariants — kart/sepet/PDP ile AYNI fiyatlandırma kaynağı (resolveVariantPricing)", () => {
  it("indirimsiz varyantta effectivePrice/regularPrice doğrudan resolveVariantPricing'ten gelir", () => {
    const row = variantRow();
    const [resolved] = resolveVariants([row]);
    const directPricing = resolveVariantPricing(row);

    expect(resolved.summary.effectivePrice).toBe(directPricing.effectivePrice.toString());
    expect(resolved.summary.regularPrice).toBe(directPricing.regularPrice.toString());
    expect(resolved.summary.hasActiveDiscount).toBe(false);
  });

  it("aktif indirimde effectivePrice indirimli fiyatı, regularPrice normal fiyatı taşır — ikisi de resolveVariantPricing ile birebir eşleşir", () => {
    const row = variantRow({
      price: new Prisma.Decimal("200.00"),
      discountPrice: new Prisma.Decimal("150.00"),
      isDiscountActive: true,
    });
    const [resolved] = resolveVariants([row]);
    const directPricing = resolveVariantPricing(row);

    expect(resolved.summary.effectivePrice).toBe("150");
    expect(resolved.summary.regularPrice).toBe("200");
    expect(resolved.summary.effectivePrice).toBe(directPricing.effectivePrice.toString());
    expect(resolved.summary.hasActiveDiscount).toBe(true);
  });

  it("stoksuz varyant isAvailable=false döner (miktar/stok metni değil, yalnızca boolean)", () => {
    const row = variantRow({ inventory: { quantityAvailable: 0, quantityReserved: 0, lowStockThreshold: 1 } });
    const [resolved] = resolveVariants([row]);
    expect(resolved.summary.isAvailable).toBe(false);
  });
});

describe("computeMinPrice — kartın minPrice'ı her zaman en düşük EFEKTİF fiyattır", () => {
  it("satılabilir varyantlar arasında en düşük effectivePrice'ı seçer (indirimli olan dahil)", () => {
    const cheap = variantRow({
      id: "var-cheap",
      price: new Prisma.Decimal("80.00"),
    });
    const discounted = variantRow({
      id: "var-discounted",
      price: new Prisma.Decimal("200.00"),
      discountPrice: new Prisma.Decimal("50.00"),
      isDiscountActive: true,
    });
    const expensive = variantRow({ id: "var-expensive", price: new Prisma.Decimal("500.00") });

    const resolved = resolveVariants([cheap, discounted, expensive]);
    expect(computeMinPrice(resolved)).toBe("50");
  });

  it("yalnızca satılamayan varyantlar varsa yine de en düşük fiyata düşer (uydurma null döndürmez)", () => {
    const outOfStock = variantRow({
      id: "var-oos",
      price: new Prisma.Decimal("120.00"),
      inventory: { quantityAvailable: 0, quantityReserved: 0, lowStockThreshold: 1 },
    });
    const resolved = resolveVariants([outOfStock]);
    expect(computeMinPrice(resolved)).toBe("120");
  });

  it("hiç varyant yoksa null döner", () => {
    expect(computeMinPrice([])).toBeNull();
  });
});
