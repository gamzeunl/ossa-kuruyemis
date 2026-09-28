"use client";

import { useActionState } from "react";
import { updateOrderStatusAction } from "@/actions/admin-orders";
import type { OrderStatus } from "@/generated/prisma/client";
import { ORDER_STATUS_LABELS } from "@/lib/order-status-labels";

interface FormState {
  message: string | null;
  success: boolean;
}

const initialState: FormState = { message: null, success: false };

export function OrderStatusForm({
  orderId,
  availableTransitions,
}: {
  orderId: string;
  availableTransitions: OrderStatus[];
}) {
  async function action(_prevState: FormState, formData: FormData): Promise<FormState> {
    const to = String(formData.get("status") ?? "") as OrderStatus;
    const result = await updateOrderStatusAction(orderId, to);
    return result.ok
      ? { message: "Sipariş durumu güncellendi.", success: true }
      : { message: result.message, success: false };
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  if (availableTransitions.length === 0) {
    return null;
  }

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
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-foreground/70 text-xs font-medium">
            Yeni durum
          </label>
          <select
            id="status"
            name="status"
            className="border-border-muted min-h-9 rounded-lg border px-2 text-sm"
          >
            {availableTransitions.map((status) => (
              <option key={status} value={status}>
                {ORDER_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-brand hover:bg-brand-dark min-h-9 rounded-full px-5 text-sm font-bold text-brand-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Kaydediliyor…" : "Durumu Güncelle"}
        </button>
      </div>
    </form>
  );
}
