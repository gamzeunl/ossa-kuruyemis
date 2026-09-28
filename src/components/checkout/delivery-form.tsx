"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrderAction } from "@/actions/checkout";
import { SavedAddressPicker, type AddressSelection } from "@/components/checkout/saved-address-picker";
import {
  fieldErrorClassName,
  inputClassName,
  labelClassName,
  submitButtonClassName,
} from "@/components/ui/form-styles";
import { mapSavedAddressToCheckoutFields } from "@/lib/checkout-address-mapping";
import { checkoutSchema, type AddressSchema } from "@/lib/checkout-schema";
import { useCartStore } from "@/stores/cart-store";
import type { Address } from "@/generated/prisma/client";

type FieldErrors = Record<string, string | undefined>;
type InvoiceTypeValue = "INDIVIDUAL" | "CORPORATE";

interface FormState {
  fieldErrors: FieldErrors;
  formError: string | null;
}

const initialState: FormState = { fieldErrors: {}, formError: null };

const sectionClassName =
  "border-border-muted bg-surface flex flex-col gap-5 rounded-2xl border p-6 shadow-sm";

function readAddressFromFormData(formData: FormData, namePrefix: string) {
  return {
    firstName: String(formData.get(`${namePrefix}firstName`) ?? ""),
    lastName: String(formData.get(`${namePrefix}lastName`) ?? ""),
    phone: String(formData.get(`${namePrefix}phone`) ?? ""),
    city: String(formData.get(`${namePrefix}city`) ?? ""),
    district: String(formData.get(`${namePrefix}district`) ?? ""),
    neighborhood: String(formData.get(`${namePrefix}neighborhood`) ?? ""),
    addressLine: String(formData.get(`${namePrefix}addressLine`) ?? ""),
    addressLabel: String(formData.get(`${namePrefix}addressLabel`) ?? ""),
  };
}

const addressTextFields: Array<{
  name: keyof AddressSchema;
  label: string;
  type: string;
  autoComplete?: string;
}> = [
  { name: "firstName", label: "Ad", type: "text", autoComplete: "given-name" },
  { name: "lastName", label: "Soyad", type: "text", autoComplete: "family-name" },
  { name: "phone", label: "Telefon", type: "tel", autoComplete: "tel" },
  { name: "city", label: "İl", type: "text", autoComplete: "address-level1" },
  { name: "district", label: "İlçe", type: "text", autoComplete: "address-level2" },
  { name: "neighborhood", label: "Mahalle", type: "text", autoComplete: "address-level3" },
  { name: "addressLabel", label: "Adres Başlığı", type: "text" },
];

/** Adres listesinden makul bir başlangıç seçimi — varsayılan işaretli adres, yoksa ilki, hiç adres yoksa "new". Saf/deterministik (SSR-hydration güvenli). */
function computeDefaultSelection(addresses: Address[]): AddressSelection {
  if (addresses.length === 0) {
    return "new";
  }
  return addresses.find((address) => address.isDefault)?.id ?? addresses[0].id;
}

/** Teslimat + fatura adresi formlarının ortak alan grubu — `namePrefix` HTML `name`/`id` önekini, `errorPrefix` Zod hata anahtarı önekini belirler. */
function AddressFields({
  namePrefix,
  errorPrefix,
  errors,
  defaultValues,
}: {
  namePrefix: string;
  errorPrefix: string;
  errors: FieldErrors;
  /** Kayıtlı bir adres seçildiğinde doldurulur — form UNCONTROLLED kalır, yalnızca ilk render değeri değişir (bkz. çağıran taraftaki `key` remount). */
  defaultValues?: Partial<AddressSchema>;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {addressTextFields.map((field) => {
        const fieldName = `${namePrefix}${field.name}`;
        const error = errors[`${errorPrefix}${field.name}`];
        return (
          <div key={fieldName} className="flex flex-col gap-1.5">
            <label htmlFor={fieldName} className={labelClassName}>
              {field.label}
            </label>
            <input
              id={fieldName}
              name={fieldName}
              type={field.type}
              inputMode={field.name === "phone" ? "tel" : undefined}
              placeholder={field.name === "phone" ? "05XX XXX XX XX" : undefined}
              autoComplete={field.autoComplete}
              required
              defaultValue={defaultValues?.[field.name] ?? ""}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? `${fieldName}-error` : undefined}
              className={inputClassName(Boolean(error))}
            />
            {error ? (
              <p id={`${fieldName}-error`} className={fieldErrorClassName}>
                {error}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="flex flex-col gap-1.5 sm:col-span-2">
        <label htmlFor={`${namePrefix}addressLine`} className={labelClassName}>
          Açık Adres
        </label>
        <textarea
          id={`${namePrefix}addressLine`}
          name={`${namePrefix}addressLine`}
          rows={3}
          required
          defaultValue={defaultValues?.addressLine ?? ""}
          aria-invalid={Boolean(errors[`${errorPrefix}addressLine`])}
          aria-describedby={
            errors[`${errorPrefix}addressLine`] ? `${namePrefix}addressLine-error` : undefined
          }
          className={inputClassName(Boolean(errors[`${errorPrefix}addressLine`]))}
        />
        {errors[`${errorPrefix}addressLine`] ? (
          <p id={`${namePrefix}addressLine-error`} className={fieldErrorClassName}>
            {errors[`${errorPrefix}addressLine`]}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function PillRadio({
  name,
  value,
  label,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`cursor-pointer rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors ${
        checked
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border-muted text-foreground hover:border-brand"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      {label}
    </label>
  );
}

/**
 * Teslimat bilgileri doğrulanınca `createOrderAction` gerçek bir sipariş
 * TASLAĞI oluşturur (`status: PENDING`) — canlı ödeme entegrasyonu henüz
 * olmadığından asla "ödendi" denmez. Sepet öğeleri sunucuya yalnızca
 * `variantId`+`quantity` olarak gönderilir; fiyat/toplam client'tan gelmez,
 * sunucu her şeyi DB'den yeniden hesaplar (bkz. `order-repository.ts`). Bu
 * dosyadaki Zod doğrulaması yalnızca UX içindir — `actions/checkout.ts` AYNI
 * şemayı bağımsız olarak sunucuda tekrar çalıştırır, client'a güvenilmez.
 */
interface DeliveryFormProps {
  savedAddresses: Address[];
  isLoggedIn: boolean;
}

export function DeliveryForm({ savedAddresses, isLoggedIn }: DeliveryFormProps) {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  // Sayfa ömrü boyunca sabit — her yeniden render'da veya çift tıklamada
  // DEĞİŞMEZ; bu sayede aynı gönderim tekrar denendiğinde sunucu aynı
  // idempotencyKey'i görüp mevcut siparişi döndürür, ikinci sipariş açmaz.
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [invoiceType, setInvoiceType] = useState<InvoiceTypeValue>("INDIVIDUAL");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);

  // Kayıtlı adres seçimi — sunucuya YALNIZCA formun doldurulmuş text alanları
  // gider, `addressId` hiçbir zaman submit edilmez/güvenilmez. Misafirde
  // `savedAddresses` boş olduğundan bu state hiç görünür etkiye sahip olmaz —
  // form bugünküyle birebir aynı (boş, uncontrolled) davranır.
  const [shippingSelection, setShippingSelection] = useState<AddressSelection>(() =>
    computeDefaultSelection(savedAddresses),
  );
  const billingEligibleAddresses = savedAddresses.filter((a) => a.type === "BILLING" || a.type === "BOTH");
  const [billingSelection, setBillingSelection] = useState<AddressSelection>(() =>
    computeDefaultSelection(billingEligibleAddresses),
  );

  const selectedShippingAddress =
    shippingSelection === "new" ? null : (savedAddresses.find((a) => a.id === shippingSelection) ?? null);
  const selectedBillingAddress =
    billingSelection === "new"
      ? null
      : (billingEligibleAddresses.find((a) => a.id === billingSelection) ?? null);
  const shippingDefaultValues = selectedShippingAddress
    ? mapSavedAddressToCheckoutFields(selectedShippingAddress)
    : undefined;
  const billingDefaultValues = selectedBillingAddress
    ? mapSavedAddressToCheckoutFields(selectedBillingAddress)
    : undefined;

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const billingSameAsShippingValue = formData.get("billingSameAsShipping") === "on";
    const invoiceTypeRaw = String(formData.get("invoiceType") ?? "");

    const raw = {
      email: String(formData.get("email") ?? ""),
      shippingAddress: readAddressFromFormData(formData, ""),
      billingSameAsShipping: billingSameAsShippingValue,
      billingAddress: billingSameAsShippingValue
        ? undefined
        : readAddressFromFormData(formData, "billing_"),
      invoice:
        invoiceTypeRaw === "CORPORATE"
          ? {
              invoiceType: "CORPORATE" as const,
              companyName: String(formData.get("companyName") ?? ""),
              taxOffice: String(formData.get("taxOffice") ?? ""),
              taxNumber: String(formData.get("taxNumber") ?? ""),
            }
          : { invoiceType: "INDIVIDUAL" as const },
    };

    const parsed = checkoutSchema.safeParse(raw);
    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join(".");
        if (!(key in fieldErrors)) {
          fieldErrors[key] = issue.message;
        }
      }
      return { fieldErrors, formError: null };
    }

    if (items.length === 0) {
      return { fieldErrors: {}, formError: "Sepetiniz boş." };
    }

    const result = await createOrderAction(
      formData,
      items.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
      idempotencyKey,
    );

    if (!result.ok) {
      return { fieldErrors: {}, formError: result.message };
    }

    clearCart();
    router.push(`/siparis-sonucu/${result.orderNumber}?t=${result.resultAccessToken}`);
    return { fieldErrors: {}, formError: null };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {state.formError ? (
        <div
          role="alert"
          className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.formError}
        </div>
      ) : null}

      <section className={sectionClassName}>
        <h2 className="text-foreground text-base font-bold">İletişim Bilgileri</h2>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className={labelClassName}>
            E-posta
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={Boolean(state.fieldErrors.email)}
            aria-describedby={state.fieldErrors.email ? "email-error" : undefined}
            className={inputClassName(Boolean(state.fieldErrors.email))}
          />
          {state.fieldErrors.email ? (
            <p id="email-error" className={fieldErrorClassName}>
              {state.fieldErrors.email}
            </p>
          ) : null}
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-foreground text-base font-bold">Teslimat Adresi</h2>

        {savedAddresses.length > 0 ? (
          <SavedAddressPicker
            addresses={savedAddresses}
            selected={shippingSelection}
            onSelect={setShippingSelection}
            groupName="savedShippingAddress"
          />
        ) : isLoggedIn ? (
          <p className="text-foreground/50 text-xs">
            Adreslerinizi{" "}
            <a href="/hesabim/adresler" target="_blank" rel="noopener noreferrer" className="text-brand font-semibold">
              Hesabım &gt; Adreslerim
            </a>{" "}
            bölümünden kaydedebilirsiniz.
          </p>
        ) : null}

        <AddressFields
          key={shippingSelection}
          namePrefix=""
          errorPrefix="shippingAddress."
          errors={state.fieldErrors}
          defaultValues={shippingDefaultValues}
        />

        {isLoggedIn && shippingSelection === "new" ? (
          <label className="text-foreground flex items-center gap-2.5 text-sm font-medium">
            <input type="checkbox" name="saveAddress" className="accent-brand h-4 w-4" />
            Bu adresi adreslerime kaydet
          </label>
        ) : null}
      </section>

      <section className={sectionClassName}>
        <h2 className="text-foreground text-base font-bold">Fatura Bilgileri</h2>

        <div className="flex gap-3">
          <PillRadio
            name="invoiceType"
            value="INDIVIDUAL"
            label="Bireysel"
            checked={invoiceType === "INDIVIDUAL"}
            onChange={() => setInvoiceType("INDIVIDUAL")}
          />
          <PillRadio
            name="invoiceType"
            value="CORPORATE"
            label="Kurumsal"
            checked={invoiceType === "CORPORATE"}
            onChange={() => setInvoiceType("CORPORATE")}
          />
        </div>

        {invoiceType === "CORPORATE" ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="companyName" className={labelClassName}>
                Şirket Unvanı
              </label>
              <input
                id="companyName"
                name="companyName"
                type="text"
                required
                aria-invalid={Boolean(state.fieldErrors["invoice.companyName"])}
                aria-describedby={
                  state.fieldErrors["invoice.companyName"] ? "companyName-error" : undefined
                }
                className={inputClassName(Boolean(state.fieldErrors["invoice.companyName"]))}
              />
              {state.fieldErrors["invoice.companyName"] ? (
                <p id="companyName-error" className={fieldErrorClassName}>
                  {state.fieldErrors["invoice.companyName"]}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="taxOffice" className={labelClassName}>
                Vergi Dairesi
              </label>
              <input
                id="taxOffice"
                name="taxOffice"
                type="text"
                required
                aria-invalid={Boolean(state.fieldErrors["invoice.taxOffice"])}
                aria-describedby={
                  state.fieldErrors["invoice.taxOffice"] ? "taxOffice-error" : undefined
                }
                className={inputClassName(Boolean(state.fieldErrors["invoice.taxOffice"]))}
              />
              {state.fieldErrors["invoice.taxOffice"] ? (
                <p id="taxOffice-error" className={fieldErrorClassName}>
                  {state.fieldErrors["invoice.taxOffice"]}
                </p>
              ) : null}
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
                required
                aria-invalid={Boolean(state.fieldErrors["invoice.taxNumber"])}
                aria-describedby={
                  state.fieldErrors["invoice.taxNumber"] ? "taxNumber-error" : undefined
                }
                className={inputClassName(Boolean(state.fieldErrors["invoice.taxNumber"]))}
              />
              {state.fieldErrors["invoice.taxNumber"] ? (
                <p id="taxNumber-error" className={fieldErrorClassName}>
                  {state.fieldErrors["invoice.taxNumber"]}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="border-border-muted flex flex-col gap-4 border-t pt-5">
          <label className="text-foreground flex items-center gap-2.5 text-sm font-medium">
            <input
              type="checkbox"
              name="billingSameAsShipping"
              checked={billingSameAsShipping}
              onChange={(event) => setBillingSameAsShipping(event.target.checked)}
              className="accent-brand h-4 w-4"
            />
            Fatura adresim teslimat adresimle aynı
          </label>
          {state.fieldErrors.billingAddress ? (
            <p className={fieldErrorClassName}>{state.fieldErrors.billingAddress}</p>
          ) : null}

          {!billingSameAsShipping ? (
            <>
              {billingEligibleAddresses.length > 0 ? (
                <SavedAddressPicker
                  addresses={billingEligibleAddresses}
                  selected={billingSelection}
                  onSelect={setBillingSelection}
                  groupName="savedBillingAddress"
                />
              ) : null}
              <AddressFields
                key={billingSelection}
                namePrefix="billing_"
                errorPrefix="billingAddress."
                errors={state.fieldErrors}
                defaultValues={billingDefaultValues}
              />
            </>
          ) : null}
        </div>
      </section>

      <p className="text-foreground/50 text-xs leading-5">
        Siparişi Oluştur&apos;a tıklayarak{" "}
        <a href="/mesafeli-satis-sozlesmesi" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-dark font-medium">
          Mesafeli Satış Sözleşmesi
        </a>
        ,{" "}
        <a href="/teslimat-iade" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-dark font-medium">
          Teslimat ve İade Koşulları
        </a>
        ,{" "}
        <a href="/gizlilik-politikasi" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-dark font-medium">
          Gizlilik Politikası
        </a>{" "}
        ve{" "}
        <a href="/kvkk" target="_blank" rel="noopener noreferrer" className="text-brand hover:text-brand-dark font-medium">
          KVKK Aydınlatma Metni
        </a>
        &apos;ni incelemiş olursunuz.
      </p>

      <button type="submit" disabled={isPending} className={submitButtonClassName}>
        {isPending ? "Sipariş oluşturuluyor…" : "Siparişi Oluştur"}
      </button>
    </form>
  );
}
