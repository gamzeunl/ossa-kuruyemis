"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Kalıcı silme gibi geri alınamaz işlemler için kırmızı/destructive vurgu. */
  danger?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Genel amaçlı onay diyaloğu — `mini-cart.tsx`/`campaign-popup.tsx`'teki
 * kanıtlanmış overlay iskeletiyle (backdrop + `role="dialog"` + ESC + focus)
 * AYNI desen, yeni bir dialog kütüphanesi eklenmedi. `browser confirm()`
 * KULLANILMAZ (bkz. görev kuralı).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Onayla",
  cancelLabel = "Vazgeç",
  danger = false,
  isPending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    confirmButtonRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="border-border-muted relative flex w-full max-w-sm flex-col gap-4 rounded-2xl border bg-white p-6 shadow-2xl"
      >
        <div className="flex flex-col gap-1.5">
          <h2 id="confirm-dialog-title" className="text-foreground text-base font-bold">
            {title}
          </h2>
          {description ? <p className="text-foreground/60 text-sm">{description}</p> : null}
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="border-border-muted hover:bg-surface-muted min-h-9 rounded-lg border px-4 text-sm font-semibold transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={`min-h-9 rounded-lg px-4 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              danger ? "bg-red-600 hover:bg-red-700" : "bg-brand hover:bg-brand-dark text-brand-foreground"
            }`}
          >
            {isPending ? "İşleniyor…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
