"use client";

import { useActionState } from "react";
import { createFeaturedPickAction, updateFeaturedPickAction } from "@/actions/admin-featured-picks";

export interface FeaturedPickAdminFormValues {
  productId: string;
  sortOrder: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
}

interface FeaturedPickAdminFormProps {
  /** Belirtilmemişse "yeni kayıt" (oluşturma) modu, belirtilmişse düzenleme modu. */
  pickId?: string;
  initialValues: FeaturedPickAdminFormValues;
  productOptions: { id: string; name: string }[];
}

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

const labelClassName = "text-foreground text-sm font-medium flex flex-col gap-1.5";
const inputClassName =
  "border-border-muted focus:border-brand w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors";

export function FeaturedPickAdminForm({ pickId, initialValues, productOptions }: FeaturedPickAdminFormProps) {
  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = pickId
      ? await updateFeaturedPickAction(pickId, formData)
      : await createFeaturedPickAction(formData);
    return result.ok
      ? { message: "Kaydedildi.", success: true }
      : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

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
        Ürün
        <select name="productId" required defaultValue={initialValues.productId} className={inputClassName}>
          <option value="" disabled>
            Ürün seçin
          </option>
          {productOptions.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
      </label>

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
