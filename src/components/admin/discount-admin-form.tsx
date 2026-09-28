"use client";

import { useActionState, useState } from "react";
import { createDiscountAction, updateDiscountAction } from "@/actions/admin-discounts";
import { formatPrice } from "@/lib/format-money";

export interface DiscountAdminFormValues {
  discountPrice: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

interface DiscountAdminFormProps {
  /** Belirtilmemişse "yeni indirim" (oluşturma, ürün/varyant seçilebilir) modu, belirtilmişse düzenleme modu. */
  variantId?: string;
  /** Yalnızca düzenleme modunda — "Ürün Adı — Varyant Adı", değiştirilemez (indirim kaydı `ProductVariant`'ın kendisidir, ayrı bir id taşımaz). */
  variantLabel?: string;
  /** Seçili/düzenlenen varyantın DB'deki gerçek normal fiyatı — yalnızca bilgi amaçlı gösterim, sunucu doğrulaması her zaman kendi DB okumasını kullanır. */
  price: string;
  initialValues: DiscountAdminFormValues;
  /** Yalnızca oluşturma modunda — tek `<select>` için düz ürün/varyant seçenekleri. */
  variantOptions?: { id: string; label: string; price: string }[];
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

export function DiscountAdminForm({
  variantId,
  variantLabel,
  price,
  initialValues,
  variantOptions,
}: DiscountAdminFormProps) {
  const [selectedPrice, setSelectedPrice] = useState(price);
  const [discountPrice, setDiscountPrice] = useState(initialValues.discountPrice);

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = variantId
      ? await updateDiscountAction(variantId, formData)
      : await createDiscountAction(formData);
    return result.ok
      ? { message: "Kaydedildi.", success: true }
      : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  // Yalnızca CANLI ÖNİZLEME — `resolveVariantPricing()`'teki AYNI formülü kullanır
  // ama otoriter değildir; kaydedilen gerçek yüzde her zaman sunucuda yeniden hesaplanır.
  const priceNumber = Number(selectedPrice);
  const discountNumber = Number(discountPrice);
  const previewPercentage =
    Number.isFinite(priceNumber) &&
    priceNumber > 0 &&
    Number.isFinite(discountNumber) &&
    discountNumber > 0 &&
    discountNumber < priceNumber
      ? Math.round((1 - discountNumber / priceNumber) * 100)
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

      {variantId ? (
        <div className={labelClassName}>
          Ürün / Varyant
          <p className={readOnlyClassName}>{variantLabel}</p>
        </div>
      ) : (
        <label className={labelClassName}>
          Ürün / Varyant
          <select
            name="variantId"
            required
            defaultValue=""
            onChange={(event) => {
              const selected = variantOptions?.find((option) => option.id === event.target.value);
              setSelectedPrice(selected?.price ?? "0");
            }}
            className={inputClassName}
          >
            <option value="" disabled>
              Ürün / varyant seçin
            </option>
            {variantOptions?.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className={labelClassName}>
        Normal Fiyat
        <p className={readOnlyClassName}>{formatPrice(selectedPrice)}</p>
      </div>

      <label className={labelClassName}>
        Fırsat Fiyatı (indirimli) <span className="text-foreground/40 font-normal">(boş = indirim yok)</span>
        <input
          name="discountPrice"
          type="number"
          step="0.01"
          min="0"
          defaultValue={initialValues.discountPrice}
          onChange={(event) => setDiscountPrice(event.target.value)}
          className={inputClassName}
        />
      </label>

      {previewPercentage !== null ? (
        <p className="text-brand text-sm font-semibold">İndirim: %{previewPercentage}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Başlangıç Tarihi <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          <input
            name="discountStartsAt"
            type="datetime-local"
            defaultValue={initialValues.startsAt}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Bitiş Tarihi <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          <input
            name="discountEndsAt"
            type="datetime-local"
            defaultValue={initialValues.endsAt}
            className={inputClassName}
          />
        </label>
      </div>

      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="isDiscountActive" defaultChecked={initialValues.isActive} />
        Aktif
      </label>

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
