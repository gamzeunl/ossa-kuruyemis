"use client";

import { useActionState } from "react";
import { createInstagramPostAction, updateInstagramPostAction } from "@/actions/admin-instagram";

export interface InstagramPostAdminFormValues {
  postUrl: string;
  caption: string;
  isActive: boolean;
  sortOrder: number;
}

interface InstagramPostAdminFormProps {
  /** Belirtilmemişse "yeni gönderi" (oluşturma) modu, belirtilmişse düzenleme modu. */
  postId?: string;
  initialValues: InstagramPostAdminFormValues;
}

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

const labelClassName = "text-foreground text-sm font-medium flex flex-col gap-1.5";
const inputClassName =
  "border-border-muted focus:border-brand w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors";

/**
 * Dosya yükleme alanı YOK — tek veri kaynağı `postUrl`. Kaydedildiğinde
 * server action gerçek medyayı Instagram Graph API'den çözüp cache'ler (bkz.
 * `admin-instagram.ts`); storefront'ta bu cache native `<video>`/`<img>` ile
 * gösterilir (bkz. `InstagramMediaCard`) — OSSA sunucusuna hiçbir medya
 * yüklenmez.
 */
export function InstagramPostAdminForm({ postId, initialValues }: InstagramPostAdminFormProps) {
  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = postId
      ? await updateInstagramPostAction(postId, formData)
      : await createInstagramPostAction(formData);
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
        Instagram gönderi linki
        <input
          name="postUrl"
          type="text"
          required
          placeholder="https://www.instagram.com/p/... veya /reel/..."
          defaultValue={initialValues.postUrl}
          className={inputClassName}
        />
      </label>

      <label className={labelClassName}>
        Alt metin / açıklama <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
        <textarea name="caption" rows={2} defaultValue={initialValues.caption} className={inputClassName} />
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
