export const labelClassName = "text-foreground/80 text-sm font-medium";

export function inputClassName(invalid: boolean): string {
  return [
    "bg-surface text-foreground min-h-11 rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-colors",
    invalid
      ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
      : "border-border-muted focus:border-brand focus:ring-brand/20 focus:ring-2",
  ].join(" ");
}

export const fieldErrorClassName = "text-sm text-red-700";

export const submitButtonClassName =
  "bg-brand hover:bg-brand-dark text-brand-foreground inline-flex min-h-12 items-center justify-center rounded-full px-6 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60";
