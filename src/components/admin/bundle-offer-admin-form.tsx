"use client";

import { useActionState, useState } from "react";
import { createBundleOfferAction, updateBundleOfferAction } from "@/actions/admin-bundle-offers";
import { formatPrice } from "@/lib/format-money";

export interface BundleOfferAdminFormValues {
  primaryVariantId: string;
  companionVariantId: string;
  companionPrice: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  sortOrder: number;
}

interface BundleOfferAdminFormProps {
  /** Belirtilmemişse "yeni kampanya" (oluşturma) modu, belirtilmişse düzenleme modu. */
  bundleOfferId?: string;
  initialValues: BundleOfferAdminFormValues;
  variantOptions: { id: string; label: string; price: string }[];
}

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

const labelClassName = "text-foreground text-sm font-medium flex flex-col gap-1.5";
const inputClassName =
  "border-border-muted focus:border-brand w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors";
const readOnlyClassName =
  "text-foreground bg-surface-muted border-border-muted rounded-lg border px-3.5 py-2.5 text-sm font-semibold";

export function BundleOfferAdminForm({ bundleOfferId, initialValues, variantOptions }: BundleOfferAdminFormProps) {
  const [companionVariantId, setCompanionVariantId] = useState(initialValues.companionVariantId);
  const [companionPrice, setCompanionPrice] = useState(initialValues.companionPrice);

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = bundleOfferId
      ? await updateBundleOfferAction(bundleOfferId, formData)
      : await createBundleOfferAction(formData);
    return result.ok
      ? { message: "Kaydedildi.", success: true }
      : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  // Yalnızca CANLI ÖNİZLEME — kaydedilen gerçek fiyat/yüzde her zaman sunucuda
  // tamamlayıcının o andaki DB fiyatına göre yeniden hesaplanır/doğrulanır.
  const selectedCompanion = variantOptions.find((option) => option.id === companionVariantId);
  const companionRegularPrice = selectedCompanion ? Number(selectedCompanion.price) : null;
  const bundlePriceNumber = Number(companionPrice);
  const preview =
    companionRegularPrice !== null &&
    companionRegularPrice > 0 &&
    Number.isFinite(bundlePriceNumber) &&
    bundlePriceNumber > 0 &&
    bundlePriceNumber < companionRegularPrice
      ? {
          savingsAmount: companionRegularPrice - bundlePriceNumber,
          savingsPercent: Math.round((1 - bundlePriceNumber / companionRegularPrice) * 100),
        }
      : null;

  return (
    <form action={formAction} noValidate className="flex flex-col gap-5">
      {state.message ? (
        <div
          role={state.success ? "status" : "alert"}
          className={`rounded-lg border px-4 py-3 text-sm ${
            state.success
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <label className={labelClassName}>
        Ana Ürün / Varyant
        <select name="primaryVariantId" required defaultValue={initialValues.primaryVariantId} className={inputClassName}>
          <option value="" disabled>
            Ürün / varyant seçin
          </option>
          {variantOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        Tamamlayıcı Ürün / Varyant
        <select
          name="companionVariantId"
          required
          defaultValue={initialValues.companionVariantId}
          onChange={(event) => setCompanionVariantId(event.target.value)}
          className={inputClassName}
        >
          <option value="" disabled>
            Ürün / varyant seçin
          </option>
          {variantOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className={labelClassName}>
        Normal Tamamlayıcı Fiyatı
        <p className={readOnlyClassName}>
          {companionRegularPrice !== null ? formatPrice(String(companionRegularPrice)) : "Önce tamamlayıcı seçin"}
        </p>
      </div>

      <label className={labelClassName}>
        Birlikte Al Fiyatı
        <input
          name="companionPrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initialValues.companionPrice}
          onChange={(event) => setCompanionPrice(event.target.value)}
          className={inputClassName}
        />
      </label>

      {preview ? (
        <p className="text-brand text-sm font-semibold">
          Kazanç: {formatPrice(preview.savingsAmount.toFixed(2))} · %{preview.savingsPercent}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Başlangıç Tarihi <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={initialValues.startsAt}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Bitiş Tarihi <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          <input
            name="endsAt"
            type="datetime-local"
            defaultValue={initialValues.endsAt}
            className={inputClassName}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Sıra
          <input
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={initialValues.sortOrder}
            className={inputClassName}
          />
        </label>
        <label className="text-foreground flex items-center gap-2 text-sm font-medium sm:self-end sm:pb-2.5">
          <input type="checkbox" name="isActive" defaultChecked={initialValues.isActive} />
          Aktif
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand hover:bg-brand-dark w-fit min-h-11 rounded-full px-6 text-sm font-bold text-brand-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Kaydediliyor…" : "Kaydet"}
      </button>
    </form>
  );
}
