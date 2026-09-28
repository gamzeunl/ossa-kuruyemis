"use client";

import { useActionState } from "react";
import { createBlogPostAction, updateBlogPostAction } from "@/actions/admin-blog";

export interface BlogAdminFormValues {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  /** `datetime-local` değeri veya boş dize. */
  publishedAt: string;
  metaTitle: string;
  metaDescription: string;
  productIds: string[];
}

interface BlogAdminFormProps {
  /** Belirtilmemişse "yeni yazı" (oluşturma) modu, belirtilmişse düzenleme modu. */
  postId?: string;
  initialValues: BlogAdminFormValues;
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

export function BlogAdminForm({ postId, initialValues, productOptions }: BlogAdminFormProps) {
  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = postId
      ? await updateBlogPostAction(postId, formData)
      : await createBlogPostAction(formData);
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
        Başlık
        <input
          name="title"
          type="text"
          required
          defaultValue={initialValues.title}
          className={inputClassName}
        />
      </label>

      <label className={labelClassName}>
        Slug
        <input
          name="slug"
          type="text"
          required
          defaultValue={initialValues.slug}
          placeholder="ör. kavrulmus-findigin-faydalari"
          className={inputClassName}
        />
      </label>

      <label className={labelClassName}>
        Özet <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
        <textarea
          name="excerpt"
          rows={2}
          maxLength={300}
          defaultValue={initialValues.excerpt}
          className={inputClassName}
        />
      </label>

      <label className={labelClassName}>
        İçerik
        <textarea
          name="content"
          required
          rows={12}
          defaultValue={initialValues.content}
          placeholder="Paragrafları boş satırla ayırın."
          className={inputClassName}
        />
      </label>

      <label className={labelClassName}>
        Kapak görseli URL&apos;i <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
        <input
          name="coverImageUrl"
          type="text"
          defaultValue={initialValues.coverImageUrl}
          placeholder="/images/blog/..."
          className={inputClassName}
        />
      </label>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className={labelClassName}>
          Durum
          <select name="status" defaultValue={initialValues.status} className={inputClassName}>
            <option value="DRAFT">Taslak</option>
            <option value="PUBLISHED">Yayında</option>
            <option value="ARCHIVED">Arşivlendi</option>
          </select>
        </label>

        <label className={labelClassName}>
          Yayın tarihi
          <input
            name="publishedAt"
            type="datetime-local"
            defaultValue={initialValues.publishedAt}
            className={inputClassName}
          />
        </label>
      </div>

      <label className={labelClassName}>
        SEO başlığı <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
        <input
          name="metaTitle"
          type="text"
          defaultValue={initialValues.metaTitle}
          className={inputClassName}
        />
      </label>

      <label className={labelClassName}>
        SEO açıklaması <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
        <textarea
          name="metaDescription"
          rows={2}
          maxLength={300}
          defaultValue={initialValues.metaDescription}
          className={inputClassName}
        />
      </label>

      <fieldset className="border-border-muted flex flex-col gap-2 rounded-lg border p-3">
        <legend className="text-foreground px-1 text-sm font-medium">
          İlişkili ürünler <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
        </legend>
        <div className="flex max-h-64 flex-col gap-1 overflow-y-auto">
          {productOptions.map((product) => (
            <label key={product.id} className="flex min-h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="productIds"
                value={product.id}
                defaultChecked={initialValues.productIds.includes(product.id)}
              />
              {product.name}
            </label>
          ))}
        </div>
      </fieldset>

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
