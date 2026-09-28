"use client";

import { useActionState } from "react";
import { resendOrderEmailAction } from "@/actions/admin-orders";
import type { OrderEmailType } from "@/emails/order-emails";

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

export function OrderResendEmailForm({ orderId, type }: { orderId: string; type: OrderEmailType }) {
  async function action(): Promise<FormState> {
    const result = await resendOrderEmailAction(orderId, type);
    return result.ok
      ? { message: "E-posta yeniden gönderildi.", success: true }
      : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex items-center gap-3">
      {state.message ? (
        <p
          role={state.success ? "status" : "alert"}
          className={`text-xs font-medium ${state.success ? "text-green-700" : "text-red-700"}`}
        >
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="border-border-muted hover:border-brand min-h-8 shrink-0 rounded-full border px-4 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Gönderiliyor…" : "Yeniden Gönder"}
      </button>
    </form>
  );
}
