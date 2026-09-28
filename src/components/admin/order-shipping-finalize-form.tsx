"use client";

import { useActionState, useState } from "react";
import { finalizeOrderShippingAction } from "@/actions/admin-orders";

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

/**
 * Sıfır kargo yalnızca "Ücretsiz kargo" açıkça seçildiğinde kabul edilir —
 * sabit ücret modunda tutar her zaman pozitif olmalıdır (bkz. `admin-orders.ts`).
 */
export function OrderShippingFinalizeForm({ orderId }: { orderId: string }) {
  const [mode, setMode] = useState<"FIXED" | "FREE">("FIXED");

  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const result = await finalizeOrderShippingAction(orderId, formData);
    return result.ok
      ? { message: "Kargo ücreti netleştirildi.", success: true }
      : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {state.message ? (
        <p
          role={state.success ? "status" : "alert"}
          className={`text-xs font-medium ${state.success ? "text-green-700" : "text-red-700"}`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            value="FIXED"
            checked={mode === "FIXED"}
            onChange={() => setMode("FIXED")}
          />
          Sabit ücret
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="mode"
            value="FREE"
            checked={mode === "FREE"}
            onChange={() => setMode("FREE")}
          />
          Ücretsiz kargo
        </label>
      </div>

      {mode === "FIXED" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor="amount" className="text-foreground/70 text-xs font-medium">
            Kargo ücreti (₺)
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="border-border-muted min-h-9 w-40 rounded-lg border px-2 text-sm"
          />
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="bg-brand hover:bg-brand-dark min-h-9 w-fit rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Kaydediliyor…" : "Kargo Ücretini Kaydet"}
      </button>
    </form>
  );
}
