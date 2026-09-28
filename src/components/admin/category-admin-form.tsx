"use client";

import { useActionState } from "react";
import { createCategoryAction, updateCategoryAction } from "@/actions/admin-categories";
import { ImageUploadField } from "@/components/admin/image-upload-field";

export interface CategoryAdminFormValues {
  name: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string;
  isActive: boolean;
  sortOrder: number;
}

interface CategoryAdminFormProps {
  /** Belirtilmemişse "yeni kategori" (oluşturma) modu, belirtilmişse düzenleme modu. */
  categoryId?: string;
  initialValues: CategoryAdminFormValues;
}

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

const labelClassName = "text-foreground text-sm font-medium flex flex-col gap-1.5";
const inputClassName =
  "border-border-muted focus:border-brand w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors";

export function CategoryAdminForm({ categoryId, initialValues }: CategoryAdminFormProps) {
  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = categoryId
      ? await updateCategoryAction(categoryId, formData)
      : await createCategoryAction(formData);
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
        Kategori adı
        <input name="name" type="text" required defaultValue={initialValues.name} className={inputClassName} />
      </label>

      <label className={labelClassName}>
        Slug
        <input
          name="slug"
          type="text"
          required
          placeholder="ör. kuru-meyveler"
          defaultValue={initialValues.slug}
          className={inputClassName}
        />
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
