"use client";

import { useActionState, useState } from "react";
import { submitReviewAction } from "@/actions/reviews";
import { StarRatingInput } from "@/components/catalog/star-rating";
import { reviewFormSchema } from "@/lib/review-schema";

type FieldName = "rating" | "title" | "content" | "displayName";
type FieldErrors = Partial<Record<FieldName, string>>;

interface FormState {
  fieldErrors: FieldErrors;
  formError: string | null;
  success: boolean;
}

const initialState: FormState = { fieldErrors: {}, formError: null, success: false };

const labelClassName = "text-foreground text-sm font-medium";

function inputClassName(invalid: boolean): string {
  return [
    "border-border-muted focus:border-brand w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm outline-none transition-colors",
    invalid ? "border-red-400 focus:border-red-500" : "",
  ]
    .join(" ")
    .trim();
}

const fieldErrorClassName = "text-xs font-medium text-red-600";

export function ReviewForm({ productId, onCancel }: { productId: string; onCancel?: () => void }) {
  const [rating, setRating] = useState(0);

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const website = String(formData.get("website") ?? "");

    const raw = {
      productId,
      rating: String(formData.get("rating") ?? ""),
      title: String(formData.get("title") ?? "").trim() || undefined,
      content: String(formData.get("content") ?? ""),
      displayName: String(formData.get("displayName") ?? ""),
      website,
    };

    const parsed = reviewFormSchema.safeParse(raw);
    if (!parsed.success) {
      const flattened = parsed.error.flatten().fieldErrors;
      return {
        fieldErrors: {
          rating: flattened.rating?.[0],
          title: flattened.title?.[0],
          content: flattened.content?.[0],
          displayName: flattened.displayName?.[0],
        },
        formError: null,
        success: false,
      };
    }

    const result = await submitReviewAction(raw);

    if (!result.ok) {
      return { fieldErrors: {}, formError: result.message, success: false };
    }

    return { fieldErrors: {}, formError: null, success: true };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state.success) {
    return (
      <div
        role="status"
        className="border-border-muted bg-surface flex flex-col gap-1 rounded-2xl border p-6 text-center"
      >
        <p className="text-foreground text-sm font-bold">Yorumunuz incelemeye gönderildi.</p>
        <p className="text-foreground/60 text-xs">
          Onaylandığında bu ürünün yorumları arasında görünecek.
        </p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      noValidate
      className="border-border-muted bg-surface flex flex-col gap-4 rounded-2xl border p-6"
    >
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="review-website">Web siteniz</label>
        <input id="review-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {state.formError ? (
        <div
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {state.formError}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <span className={labelClassName}>Puanınız</span>
        <StarRatingInput name="rating" value={rating} onChange={setRating} />
        {state.fieldErrors.rating ? (
          <p className={fieldErrorClassName}>{state.fieldErrors.rating}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-title" className={labelClassName}>
          Başlık <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
        </label>
        <input
          id="review-title"
          name="title"
          type="text"
          maxLength={120}
          aria-invalid={Boolean(state.fieldErrors.title)}
          className={inputClassName(Boolean(state.fieldErrors.title))}
        />
        {state.fieldErrors.title ? (
          <p className={fieldErrorClassName}>{state.fieldErrors.title}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-content" className={labelClassName}>
          Yorumunuz
        </label>
        <textarea
          id="review-content"
          name="content"
          required
          rows={4}
          maxLength={2000}
          placeholder="Ürün hakkındaki düşüncelerinizi paylaşın."
          aria-invalid={Boolean(state.fieldErrors.content)}
          className={inputClassName(Boolean(state.fieldErrors.content))}
        />
        {state.fieldErrors.content ? (
          <p className={fieldErrorClassName}>{state.fieldErrors.content}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-displayName" className={labelClassName}>
          Görünen Ad
        </label>
        <input
          id="review-displayName"
          name="displayName"
          type="text"
          required
          maxLength={80}
          placeholder="Yorumunuzla birlikte gösterilecek ad"
          aria-invalid={Boolean(state.fieldErrors.displayName)}
          className={inputClassName(Boolean(state.fieldErrors.displayName))}
        />
        {state.fieldErrors.displayName ? (
          <p className={fieldErrorClassName}>{state.fieldErrors.displayName}</p>
        ) : null}
      </div>

      <div className="mt-1 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand hover:bg-brand-dark inline-flex min-h-11 w-fit items-center justify-center rounded-full px-7 text-sm font-bold text-brand-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Gönderiliyor…" : "Yorumu Gönder"}
        </button>
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            className="text-foreground/60 hover:text-foreground inline-flex min-h-11 w-fit items-center justify-center px-2 text-sm font-semibold transition-colors"
          >
            İptal
          </button>
        ) : null}
      </div>
    </form>
  );
}
