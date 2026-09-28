"use client";

import { useActionState, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

interface FormState {
  message: string | null;
}

const initialState: FormState = { message: null };

/**
 * Admin genelindeki ortak "Sil" butonu (banner/etkinlik kartı/ürün görseli/
 * varyant vb.) — erişilebilir `ConfirmDialog` kullanır, `window.confirm`
 * KULLANILMAZ (bkz. görev kuralı). Başarıda action kendi içinde `redirect()`
 * eder. Çağıran taraf (call site) API'si DEĞİŞMEDİ — yalnızca onay UX'i
 * güncellendi.
 */
export function ContentDeleteForm({
  action,
  confirmMessage,
}: {
  action: () => Promise<{ ok: boolean; message?: string }>;
  confirmMessage: string;
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(): Promise<FormState> {
    const result = await action();
    return result.ok ? { message: null } : { message: result.message ?? "Silinemedi." };
  }

  const [state, formAction, isPending] = useActionState(handleAction, initialState);

  return (
    <>
      <form ref={formRef} action={formAction} className="flex flex-col items-start gap-2">
        {state.message ? (
          <p role="alert" className="text-xs font-medium text-red-700">
            {state.message}
          </p>
        ) : null}
        <button
          type="button"
          disabled={isPending}
          onClick={() => setIsDialogOpen(true)}
          className="min-h-10 rounded-full border border-red-300 px-5 text-sm font-bold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Siliniyor…" : "Sil"}
        </button>
      </form>

      <ConfirmDialog
        open={isDialogOpen}
        title="Silme onayı"
        description={confirmMessage}
        confirmLabel="Sil"
        danger
        isPending={isPending}
        onConfirm={() => {
          setIsDialogOpen(false);
          formRef.current?.requestSubmit();
        }}
        onCancel={() => setIsDialogOpen(false)}
      />
    </>
  );
}
