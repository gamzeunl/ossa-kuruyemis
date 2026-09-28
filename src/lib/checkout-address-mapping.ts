import type { Address, AddressType } from "@/generated/prisma/client";
import type { AddressFormInput } from "@/lib/address-schema";
import type { AddressSchema } from "@/lib/checkout-schema";

/**
 * `Address` (kayıtlı adres defteri) → checkout formunun alan şekli (`AddressSchema`)
 * TEK merkezi, saf eşleme fonksiyonu — hiçbir component/form kendi eşlemesini
 * yapmaz. `Address.title` → checkout'un `addressLabel`'ına yeniden adlandırılır;
 * `Address`'te KARŞILIĞI OLMAYAN checkout alanı yoktur (checkout zaten Address'in
 * bir alt kümesi). `Address.neighborhood` nullable ama checkout'ta zorunlu —
 * boşsa UYDURULMAZ, boş string döner ve kullanıcı formda tamamlar.
 */
export function mapSavedAddressToCheckoutFields(address: Address): AddressSchema {
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone,
    city: address.city,
    district: address.district,
    neighborhood: address.neighborhood ?? "",
    addressLine: address.addressLine,
    addressLabel: address.title,
  };
}

/**
 * Ters yön — "Bu adresi adreslerime kaydet" işaretlendiğinde, checkout'ta
 * yazılan (Zod'dan geçmiş) teslimat adresini `Address` satırına çevirir.
 * Checkout'ta karşılığı olmayan `Address` alanları (postalCode, fatura
 * alanları) UYDURULMAZ, `null` bırakılır — kullanıcı isterse sonradan
 * `/hesabim/adresler` üzerinden doldurur.
 */
export function mapCheckoutFieldsToAddressInput(
  fields: AddressSchema,
  type: AddressType = "SHIPPING",
): AddressFormInput {
  return {
    type,
    title: fields.addressLabel,
    firstName: fields.firstName,
    lastName: fields.lastName,
    phone: fields.phone,
    city: fields.city,
    district: fields.district,
    neighborhood: fields.neighborhood || null,
    postalCode: null,
    addressLine: fields.addressLine,
    invoiceCompanyName: null,
    taxOffice: null,
    taxNumber: null,
    isDefault: false,
  };
}
