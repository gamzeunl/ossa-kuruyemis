"use client";

import { useActionState } from "react";
import { cancelOrderAction } from "@/actions/admin-orders";

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

export function OrderCancelForm({ orderId }: { orderId: string }) {
  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const reason = String(formData.get("reason") ?? "").trim() || null;
    const result = await cancelOrderAction(orderId, reason);
    return result.ok
      ? { message: "Sipariş iptal edildi.", success: true }
      : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      {state.message ? (
        <p
          role={state.success ? "status" : "alert"}
          className={`text-xs font-medium ${state.success ? "text-green-700" : "text-red-700"}`}
        >
          {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="reason" className="text-foreground/70 text-xs font-medium">
            İptal nedeni <span className="text-foreground/40 font-normal">(isteğe bağlı)</span>
          </label>
          <input
            id="reason"
            name="reason"
            type="text"
            maxLength={300}
            className="border-border-muted min-h-9 rounded-lg border px-2 text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="min-h-9 rounded-full bg-red-600 px-5 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "İptal ediliyor…" : "Siparişi İptal Et"}
        </button>
      </div>
    </form>
  );
}
