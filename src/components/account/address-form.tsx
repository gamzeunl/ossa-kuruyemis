"use client";

import { useActionState } from "react";
import { createAddressAction, updateAddressAction, type AddressActionResult } from "@/actions/addresses";
import { inputClassName, labelClassName, submitButtonClassName } from "@/components/ui/form-styles";
import type { AddressFormInitialValues } from "@/lib/address-form-values";
import type { AddressType } from "@/generated/prisma/client";

const TYPE_OPTIONS: { value: AddressType; label: string }[] = [
  { value: "SHIPPING", label: "Teslimat" },
  { value: "BILLING", label: "Fatura" },
  { value: "BOTH", label: "Teslimat + Fatura" },
];

const initialState: AddressActionResult = { ok: false, message: "" };

/** `addressId` verilmemişse oluşturma, verilmişse düzenleme modu — action seçimi buna göre yapılır. */
export function AddressForm({
  addressId,
  initialValues,
}: {
  addressId?: string;
  initialValues: AddressFormInitialValues;
}) {
  async function action(_prevState: AddressActionResult, formData: FormData): Promise<AddressActionResult> {
    const result = addressId ? await updateAddressAction(addressId, formData) : await createAddressAction(formData);
    return result;
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {!state.ok && state.message ? (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className={labelClassName}>
            Adres Başlığı
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            defaultValue={initialValues.title}
            placeholder="ör. Ev, İş"
            className={inputClassName(false)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="type" className={labelClassName}>
            Adres Türü
          </label>
          <select id="type" name="type" defaultValue={initialValues.type} className={inputClassName(false)}>
            {TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="firstName" className={labelClassName}>
            Ad
          </label>
          <input
            id="firstName"
            name="firstName"
            type="text"
            required
            autoComplete="given-name"
            defaultValue={initialValues.firstName}
            className={inputClassName(false)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="lastName" className={labelClassName}>
            Soyad
          </label>
          <input
            id="lastName"
            name="lastName"
            type="text"
            required
            autoComplete="family-name"
            defaultValue={initialValues.lastName}
            className={inputClassName(false)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="phone" className={labelClassName}>
            Telefon
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            inputMode="tel"
            placeholder="05XX XXX XX XX"
            autoComplete="tel"
            defaultValue={initialValues.phone}
            className={inputClassName(false)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="city" className={labelClassName}>
            İl
          </label>
          <input
            id="city"
            name="city"
            type="text"
            required
            autoComplete="address-level1"
            defaultValue={initialValues.city}
            className={inputClassName(false)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="district" className={labelClassName}>
            İlçe
          </label>
          <input
            id="district"
            name="district"
            type="text"
            required
            autoComplete="address-level2"
            defaultValue={initialValues.district}
            className={inputClassName(false)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="neighborhood" className={labelClassName}>
            Mahalle <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          </label>
          <input
            id="neighborhood"
            name="neighborhood"
            type="text"
            autoComplete="address-level3"
            defaultValue={initialValues.neighborhood}
            className={inputClassName(false)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="postalCode" className={labelClassName}>
            Posta Kodu <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          </label>
          <input
            id="postalCode"
            name="postalCode"
            type="text"
            autoComplete="postal-code"
            defaultValue={initialValues.postalCode}
            className={inputClassName(false)}
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="addressLine" className={labelClassName}>
            Açık Adres
          </label>
          <textarea
            id="addressLine"
            name="addressLine"
            rows={3}
            required
            defaultValue={initialValues.addressLine}
            className={inputClassName(false)}
          />
        </div>
      </div>

      <div className="border-border-muted flex flex-col gap-4 border-t pt-5">
        <h2 className="text-foreground text-sm font-bold">Fatura Bilgileri (isteğe bağlı)</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="invoiceCompanyName" className={labelClassName}>
              Şirket Unvanı
            </label>
            <input
              id="invoiceCompanyName"
              name="invoiceCompanyName"
              type="text"
              defaultValue={initialValues.invoiceCompanyName}
              className={inputClassName(false)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="taxOffice" className={labelClassName}>
              Vergi Dairesi
            </label>
            <input
              id="taxOffice"
              name="taxOffice"
              type="text"
              defaultValue={initialValues.taxOffice}
              className={inputClassName(false)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="taxNumber" className={labelClassName}>
              Vergi Numarası
            </label>
            <input
              id="taxNumber"
              name="taxNumber"
              type="text"
              inputMode="numeric"
              defaultValue={initialValues.taxNumber}
              className={inputClassName(false)}
            />
          </div>
        </div>
      </div>

      <label className="text-foreground flex items-center gap-2.5 text-sm font-medium">
        <input
          type="checkbox"
          name="isDefault"
          defaultChecked={initialValues.isDefault}
          className="accent-brand h-4 w-4"
        />
        Varsayılan adresim olsun
      </label>

      <button type="submit" disabled={isPending} className={submitButtonClassName}>
        {isPending ? "Kaydediliyor…" : "Adresi Kaydet"}
      </button>
    </form>
  );
}
