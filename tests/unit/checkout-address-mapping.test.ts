import { describe, expect, it } from "vitest";
import { mapCheckoutFieldsToAddressInput, mapSavedAddressToCheckoutFields } from "@/lib/checkout-address-mapping";
import type { Address } from "@/generated/prisma/client";
import type { AddressSchema } from "@/lib/checkout-schema";

function baseAddress(overrides: Partial<Address> = {}): Address {
  return {
    id: "addr-1",
    userId: "user-1",
    type: "SHIPPING",
    title: "Ev",
    firstName: "Ayşe",
    lastName: "Yılmaz",
    phone: "05349567879",
    city: "Mersin",
    district: "Mut",
    neighborhood: "Karşıyaka",
    postalCode: "33600",
    addressLine: "Seyran Sokak No:2",
    invoiceCompanyName: null,
    taxOffice: null,
    taxNumber: null,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("mapSavedAddressToCheckoutFields", () => {
  it("tam veriyi doğru eşler (title -> addressLabel dahil)", () => {
    const result = mapSavedAddressToCheckoutFields(baseAddress());
    expect(result).toEqual({
      firstName: "Ayşe",
      lastName: "Yılmaz",
      phone: "05349567879",
      city: "Mersin",
      district: "Mut",
      neighborhood: "Karşıyaka",
      addressLine: "Seyran Sokak No:2",
      addressLabel: "Ev",
    });
  });

  it("neighborhood null ise boş string döner (uydurmaz)", () => {
    const result = mapSavedAddressToCheckoutFields(baseAddress({ neighborhood: null }));
    expect(result.neighborhood).toBe("");
  });

  it("checkout'ta karşılığı olmayan alanlar (postalCode, fatura) sonuca dahil edilmez", () => {
    const result = mapSavedAddressToCheckoutFields(baseAddress());
    expect(result).not.toHaveProperty("postalCode");
    expect(result).not.toHaveProperty("invoiceCompanyName");
    expect(result).not.toHaveProperty("type");
    expect(result).not.toHaveProperty("isDefault");
  });
});

describe("mapCheckoutFieldsToAddressInput (ters yön — 'bu adresi kaydet')", () => {
  const checkoutFields: AddressSchema = {
    firstName: "Mehmet",
    lastName: "Demir",
    phone: "05341112233",
    city: "Ankara",
    district: "Çankaya",
    neighborhood: "Kızılay",
    addressLine: "Atatürk Bulvarı No:10",
    addressLabel: "İş Adresim",
  };

  it("addressLabel -> title olarak eşlenir", () => {
    const result = mapCheckoutFieldsToAddressInput(checkoutFields);
    expect(result.title).toBe("İş Adresim");
  });

  it("checkout'ta olmayan Address alanları uydurulmaz, null bırakılır", () => {
    const result = mapCheckoutFieldsToAddressInput(checkoutFields);
    expect(result.postalCode).toBeNull();
    expect(result.invoiceCompanyName).toBeNull();
    expect(result.taxOffice).toBeNull();
    expect(result.taxNumber).toBeNull();
  });

  it("varsayılan tür SHIPPING ve isDefault false'tur", () => {
    const result = mapCheckoutFieldsToAddressInput(checkoutFields);
    expect(result.type).toBe("SHIPPING");
    expect(result.isDefault).toBe(false);
  });

  it("boş neighborhood null'a çevrilir", () => {
    const result = mapCheckoutFieldsToAddressInput({ ...checkoutFields, neighborhood: "" });
    expect(result.neighborhood).toBeNull();
  });
});
