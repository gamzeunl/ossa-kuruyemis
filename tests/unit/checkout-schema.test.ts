import { describe, expect, it } from "vitest";
import { checkoutSchema } from "@/lib/checkout-schema";

function baseAddress() {
  return {
    firstName: "Ayşe",
    lastName: "Yılmaz",
    phone: "05551234567",
    city: "İstanbul",
    district: "Kadıköy",
    neighborhood: "Moda",
    addressLine: "Test sokak no:1",
    addressLabel: "Ev",
  };
}

function baseRaw(overrides: Record<string, unknown> = {}) {
  return {
    email: "test@ossa-test.local",
    shippingAddress: baseAddress(),
    billingSameAsShipping: true,
    invoice: { invoiceType: "INDIVIDUAL" as const },
    ...overrides,
  };
}

describe("checkoutSchema", () => {
  it("bireysel fatura + teslimatla aynı fatura adresi geçerlidir", () => {
    const result = checkoutSchema.safeParse(baseRaw());
    expect(result.success).toBe(true);
  });

  it("kurumsal fatura — şirket unvanı/vergi dairesi/vergi no eksikse reddedilir", () => {
    const result = checkoutSchema.safeParse(
      baseRaw({ invoice: { invoiceType: "CORPORATE" } }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((issue) => issue.path.join("."));
    expect(paths).toContain("invoice.companyName");
    expect(paths).toContain("invoice.taxOffice");
    expect(paths).toContain("invoice.taxNumber");
  });

  it("kurumsal fatura — tüm alanlar doluyken geçerlidir", () => {
    const result = checkoutSchema.safeParse(
      baseRaw({
        invoice: {
          invoiceType: "CORPORATE",
          companyName: "Test Kuruyemiş A.Ş.",
          taxOffice: "Kadıköy",
          taxNumber: "1234567890",
        },
      }),
    );
    expect(result.success).toBe(true);
  });

  it("kurumsal fatura — geçersiz vergi numarası formatı reddedilir", () => {
    const result = checkoutSchema.safeParse(
      baseRaw({
        invoice: {
          invoiceType: "CORPORATE",
          companyName: "Test Kuruyemiş A.Ş.",
          taxOffice: "Kadıköy",
          taxNumber: "12345",
        },
      }),
    );
    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((issue) => issue.path.join("."));
    expect(paths).toContain("invoice.taxNumber");
  });

  it("billingSameAsShipping=false iken billingAddress yoksa reddedilir", () => {
    const result = checkoutSchema.safeParse(baseRaw({ billingSameAsShipping: false }));
    expect(result.success).toBe(false);
    if (result.success) return;
    const paths = result.error.issues.map((issue) => issue.path.join("."));
    expect(paths).toContain("billingAddress");
  });

  it("billingSameAsShipping=false iken geçerli billingAddress ile kabul edilir", () => {
    const result = checkoutSchema.safeParse(
      baseRaw({
        billingSameAsShipping: false,
        billingAddress: { ...baseAddress(), city: "Ankara" },
      }),
    );
    expect(result.success).toBe(true);
  });
});
