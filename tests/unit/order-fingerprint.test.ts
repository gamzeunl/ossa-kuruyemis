import { describe, expect, it } from "vitest";
import { InvoiceType } from "@/generated/prisma/client";
import { computeOrderFingerprint, type OrderFingerprintInput } from "@/lib/order-fingerprint";

const baseAddress = {
  firstName: "Ayşe",
  lastName: "Yılmaz",
  phone: "05551234567",
  city: "İstanbul",
  district: "Kadıköy",
  neighborhood: "Moda",
  addressLine: "Test sokak no:1",
  addressLabel: "Ev",
};

function baseInput(overrides: Partial<OrderFingerprintInput> = {}): OrderFingerprintInput {
  return {
    identityKey: "user-1",
    items: [{ variantId: "var-a", quantity: 2 }],
    address: baseAddress,
    billingAddress: baseAddress,
    invoice: { invoiceType: InvoiceType.INDIVIDUAL },
    ...overrides,
  };
}

describe("computeOrderFingerprint", () => {
  it("aynı girdi için deterministik (aynı) sonuç üretir", () => {
    const input = baseInput();
    expect(computeOrderFingerprint(input)).toBe(computeOrderFingerprint(input));
  });

  it("kalem sırası farklı olsa bile aynı fingerprint'i üretir (sıralama normalize edilir)", () => {
    const a = computeOrderFingerprint(
      baseInput({
        items: [
          { variantId: "var-b", quantity: 1 },
          { variantId: "var-a", quantity: 2 },
        ],
      }),
    );
    const b = computeOrderFingerprint(
      baseInput({
        items: [
          { variantId: "var-a", quantity: 2 },
          { variantId: "var-b", quantity: 1 },
        ],
      }),
    );
    expect(a).toBe(b);
  });

  it("farklı kimlik (kullanıcı/e-posta) farklı fingerprint üretir", () => {
    const a = computeOrderFingerprint(baseInput({ identityKey: "user-1" }));
    const b = computeOrderFingerprint(baseInput({ identityKey: "user-2" }));
    expect(a).not.toBe(b);
  });

  it("farklı adet farklı fingerprint üretir", () => {
    const a = computeOrderFingerprint(baseInput({ items: [{ variantId: "var-a", quantity: 1 }] }));
    const b = computeOrderFingerprint(baseInput({ items: [{ variantId: "var-a", quantity: 2 }] }));
    expect(a).not.toBe(b);
  });

  it("farklı adres farklı fingerprint üretir", () => {
    const a = computeOrderFingerprint(baseInput());
    const b = computeOrderFingerprint(
      baseInput({ address: { ...baseInput().address, city: "Ankara" } }),
    );
    expect(a).not.toBe(b);
  });

  it("64 karakterlik hex (SHA-256) döner", () => {
    const result = computeOrderFingerprint(baseInput());
    expect(result).toMatch(/^[a-f0-9]{64}$/);
  });

  it("farklı fatura tipi (bireysel/kurumsal) farklı fingerprint üretir", () => {
    const a = computeOrderFingerprint(baseInput({ invoice: { invoiceType: InvoiceType.INDIVIDUAL } }));
    const b = computeOrderFingerprint(
      baseInput({
        invoice: {
          invoiceType: InvoiceType.CORPORATE,
          companyName: "Test A.Ş.",
          taxOffice: "Kadıköy",
          taxNumber: "1234567890",
        },
      }),
    );
    expect(a).not.toBe(b);
  });

  it("farklı fatura adresi (teslimattan ayrı) farklı fingerprint üretir", () => {
    const a = computeOrderFingerprint(baseInput());
    const b = computeOrderFingerprint(
      baseInput({ billingAddress: { ...baseAddress, city: "Ankara" } }),
    );
    expect(a).not.toBe(b);
  });
});
