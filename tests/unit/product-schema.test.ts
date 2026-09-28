import { describe, expect, it } from "vitest";
import { productFormSchema } from "@/lib/product-schema";

function baseVariant(overrides: Record<string, unknown> = {}) {
  return {
    name: "500g Paket",
    sku: "OSSA-TEST-500",
    weightGram: "500",
    price: "150.00",
    discountPrice: undefined,
    discountStartsAt: undefined,
    discountEndsAt: undefined,
    isActive: true,
    ...overrides,
  };
}

function baseRaw(overrides: Record<string, unknown> = {}) {
  return {
    name: "Kavrulmuş İç Fındık",
    slug: "kavrulmus-ic-findik",
    shortDescription: undefined,
    description: undefined,
    categoryId: "cat_test_1",
    status: "DRAFT",
    metaTitle: undefined,
    metaDescription: undefined,
    variants: [baseVariant()],
    ...overrides,
  };
}

describe("productFormSchema", () => {
  it("geçerli girdiyi kabul eder", () => {
    const result = productFormSchema.safeParse(baseRaw());
    expect(result.success).toBe(true);
  });

  it("varyantsız ürün reddi: boş variants dizisi reddedilir", () => {
    const result = productFormSchema.safeParse(baseRaw({ variants: [] }));
    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((issue) => issue.path.join("."));
    expect(paths).toContain("variants");
  });

  it("geçersiz slug formatını reddeder (büyük harf/boşluk)", () => {
    const result = productFormSchema.safeParse(baseRaw({ slug: "Kavrulmus Findik" }));
    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((issue) => issue.path.join("."));
    expect(paths).toContain("slug");
  });

  it("kategori seçilmemişse reddeder", () => {
    const result = productFormSchema.safeParse(baseRaw({ categoryId: "" }));
    expect(result.success).toBe(false);
  });

  it("ürün adı boşsa reddeder", () => {
    const result = productFormSchema.safeParse(baseRaw({ name: "" }));
    expect(result.success).toBe(false);
  });

  it("varyant SKU'su boşsa reddeder", () => {
    const result = productFormSchema.safeParse(baseRaw({ variants: [baseVariant({ sku: "" })] }));
    expect(result.success).toBe(false);
  });
});
