"use client";

import { useActionState } from "react";
import { updateHomepageSelectionAction } from "@/actions/admin-homepage-selection";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { HOMEPAGE_SELECTION_MAX_PRODUCTS } from "@/lib/homepage-selection-schema";

export interface HomepageSelectionAdminFormValues {
  isActive: boolean;
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  imageAlt: string;
  /** Sırayla, en fazla `HOMEPAGE_SELECTION_MAX_PRODUCTS` ürün id'si. */
  productIds: string[];
}

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

const labelClassName = "text-foreground text-sm font-medium flex flex-col gap-1.5";
const inputClassName =
  "border-border-muted focus:border-brand w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors";

export function HomepageSelectionAdminForm({
  initialValues,
  productOptions,
}: {
  initialValues: HomepageSelectionAdminFormValues;
  productOptions: { id: string; name: string }[];
}) {
  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await updateHomepageSelectionAction(formData);
    return result.ok
      ? { message: "Kaydedildi.", success: true }
      : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);
  const slots = Array.from({ length: HOMEPAGE_SELECTION_MAX_PRODUCTS }, (_, index) => index);

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

      <label className="text-foreground flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" name="isActive" defaultChecked={initialValues.isActive} />
        Bölüm ana sayfada aktif
      </label>

      <label className={labelClassName}>
        Üst etiket <span className="text-foreground/40 font-normal">(isteğe bağlı, ör. &quot;Editoryal Seçki&quot;)</span>
        <input name="eyebrow" type="text" defaultValue={initialValues.eyebrow} className={inputClassName} />
      </label>

      <label className={labelClassName}>
        Başlık
        <input name="title" type="text" required defaultValue={initialValues.title} className={inputClassName} />
      </label>

      <label className={labelClassName}>
        Açıklama <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
        <textarea name="description" rows={3} defaultValue={initialValues.description} className={inputClassName} />
      </label>

      <ImageUploadField currentImageUrl={initialValues.imageUrl} currentImageAlt={initialValues.imageAlt} />

      <label className={labelClassName}>
        Görsel alt metni <span className="text-foreground/40 font-normal">(isteğe bağlı, SEO)</span>
        <input name="imageAlt" type="text" defaultValue={initialValues.imageAlt} className={inputClassName} />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Buton metni
          <input
            name="ctaLabel"
            type="text"
            required
            defaultValue={initialValues.ctaLabel}
            className={inputClassName}
          />
        </label>
        <label className={labelClassName}>
          Buton linki
          <input
            name="ctaHref"
            type="text"
            required
            placeholder="/urunler"
            defaultValue={initialValues.ctaHref}
            className={inputClassName}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-foreground text-sm font-medium">
          Öne çıkarılacak ürünler <span className="text-foreground/40 font-normal">(en fazla {HOMEPAGE_SELECTION_MAX_PRODUCTS}, sıralı)</span>
        </span>
        <p className="text-foreground/50 -mt-2 text-xs">
          Fiyat burada girilmez — her ürünün fiyatı her zaman kendi varyant kaydından gösterilir.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {slots.map((slot) => (
            <label key={slot} className={labelClassName}>
              {slot + 1}. ürün
              <select name={`productSlot${slot + 1}`} defaultValue={initialValues.productIds[slot] ?? ""} className={inputClassName}>
                <option value="">— Seçilmedi —</option>
                {productOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
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
