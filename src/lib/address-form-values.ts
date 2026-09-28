import type { Address, AddressType } from "@/generated/prisma/client";

export interface AddressFormInitialValues {
  type: AddressType;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  neighborhood: string;
  postalCode: string;
  addressLine: string;
  invoiceCompanyName: string;
  taxOffice: string;
  taxNumber: string;
  isDefault: boolean;
}

/**
 * Saf veri dönüşümü — Server Component sayfalarından (`.../[id]/duzenle/page.tsx`)
 * çağrılabilmesi için `address-form.tsx` ("use client") DIŞINDA tutulur; bir
 * "use client" dosyasından export edilen fonksiyonlar sunucudan çağrılamaz.
 */
export function addressToFormValues(address: Address): AddressFormInitialValues {
  return {
    type: address.type,
    title: address.title,
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone,
    city: address.city,
    district: address.district,
    neighborhood: address.neighborhood ?? "",
    postalCode: address.postalCode ?? "",
    addressLine: address.addressLine,
    invoiceCompanyName: address.invoiceCompanyName ?? "",
    taxOffice: address.taxOffice ?? "",
    taxNumber: address.taxNumber ?? "",
    isDefault: address.isDefault,
  };
}

export const emptyAddressFormValues: AddressFormInitialValues = {
  type: "SHIPPING",
  title: "",
  firstName: "",
  lastName: "",
  phone: "",
  city: "",
  district: "",
  neighborhood: "",
  postalCode: "",
  addressLine: "",
  invoiceCompanyName: "",
  taxOffice: "",
  taxNumber: "",
  isDefault: false,
};
