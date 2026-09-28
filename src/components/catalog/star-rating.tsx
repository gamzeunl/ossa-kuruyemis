const STAR_VALUES = [1, 2, 3, 4, 5] as const;

/** Salt-okunur yıldız gösterimi — anlam yalnızca ikonla değil, `aria-label` ile de aktarılır. */
export function StarRatingDisplay({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const dimension = size === "md" ? "h-5 w-5" : "h-3.5 w-3.5";
  return (
    <span
      role="img"
      aria-label={`5 üzerinden ${rating} puan`}
      className="inline-flex items-center gap-0.5"
    >
      {STAR_VALUES.map((value) => (
        <svg
          key={value}
          aria-hidden="true"
          viewBox="0 0 20 20"
          className={`${dimension} ${value <= Math.round(rating) ? "fill-brand" : "fill-border-muted"}`}
        >
          <path d="M10 1.5l2.59 5.25 5.79.84-4.19 4.09.99 5.77L10 14.77l-5.18 2.68.99-5.77L1.62 7.6l5.79-.84L10 1.5z" />
        </svg>
      ))}
    </span>
  );
}

interface StarRatingInputProps {
  value: number;
  onChange: (value: number) => void;
  name: string;
}

/** Yorum formundaki 1-5 yıldız seçici — klavye/erişilebilir radiogroup deseni. */
export function StarRatingInput({ value, onChange, name }: StarRatingInputProps) {
  return (
    <div role="radiogroup" aria-label="Puanınız" className="flex items-center gap-1">
      {STAR_VALUES.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`5 üzerinden ${star} puan ver`}
          onClick={() => onChange(star)}
          className="p-1"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className={`h-7 w-7 transition-colors ${star <= value ? "fill-brand" : "fill-border-muted"}`}
          >
            <path d="M10 1.5l2.59 5.25 5.79.84-4.19 4.09.99 5.77L10 14.77l-5.18 2.68.99-5.77L1.62 7.6l5.79-.84L10 1.5z" />
          </svg>
        </button>
      ))}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
