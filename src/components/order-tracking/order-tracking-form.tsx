"use client";

import { useActionState } from "react";
import { OrderStatusTimeline } from "@/components/account/order-status-timeline";
import { inputClassName, labelClassName, submitButtonClassName } from "@/components/ui/form-styles";
import { formatDate } from "@/lib/format-date";
import { ORDER_STATUS_LABELS } from "@/lib/order-status-labels";
import { trackOrderAction, type OrderTrackingActionResult } from "@/actions/order-tracking";

const initialState: OrderTrackingActionResult | null = null;

const cardClassName = "border-border-muted bg-surface rounded-2xl border p-5 shadow-sm sm:p-6";

export function OrderTrackingForm() {
  async function action(
    _prevState: OrderTrackingActionResult | null,
    formData: FormData,
  ): Promise<OrderTrackingActionResult> {
    return trackOrderAction(formData);
  }

  const [state, formAction, isPending] = useActionState(action, initialState);

  if (state?.ok) {
    return (
      <div className="flex flex-col gap-6">
        <div className="border-brand/30 bg-brand/5 rounded-2xl border p-6">
          <p className="text-foreground text-lg font-bold">Siparişiniz bulundu.</p>
          <p className="text-foreground/70 mt-1 text-sm">
            Mahremiyetiniz için adres, fatura ve ödeme bilgileri bu ekranda gösterilmez.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className={cardClassName}>
            <p className="text-foreground/60 text-xs font-semibold uppercase">Sipariş Numarası</p>
            <p className="text-foreground mt-1 text-lg font-bold">{state.result.orderNumber}</p>
          </div>
          <div className={cardClassName}>
            <p className="text-foreground/60 text-xs font-semibold uppercase">Sipariş Tarihi</p>
            <p className="text-foreground mt-1 text-sm font-semibold">{formatDate(state.result.createdAt)}</p>
          </div>
        </div>

        <div className={cardClassName}>
          <p className="text-foreground/60 mb-4 text-xs font-semibold uppercase">Mevcut Durum</p>
          <OrderStatusTimeline status={state.result.status} />
        </div>

        {state.result.shipment ? (
          <div className={cardClassName}>
            <p className="text-foreground/60 text-xs font-semibold uppercase">Kargo Bilgisi</p>
            <p className="text-foreground mt-1 text-sm font-semibold">
              {state.result.shipment.carrier} · {state.result.shipment.trackingNumber}
            </p>
          </div>
        ) : null}

        <p className="text-foreground/50 text-xs">
          Genel durum: {ORDER_STATUS_LABELS[state.result.status]}
        </p>

        <a href="/siparis-takibi" className="text-brand hover:text-brand-dark w-fit text-sm font-semibold">
          ← Başka bir sipariş sorgula
        </a>
      </div>
    );
  }

  return (
    <form action={formAction} noValidate className="border-border-muted bg-surface flex flex-col gap-5 rounded-2xl border p-6 shadow-sm sm:p-8">
      {state && !state.ok ? (
        <div role="alert" className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="orderNumber" className={labelClassName}>
          Sipariş Numarası
        </label>
        <input
          id="orderNumber"
          name="orderNumber"
          type="text"
          required
          placeholder="OSSA-20260101-ABC123"
          autoComplete="off"
          className={inputClassName(false)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact" className={labelClassName}>
          E-posta veya Telefon
        </label>
        <input
          id="contact"
          name="contact"
          type="text"
          required
          placeholder="ornek@eposta.com veya 05XX XXX XX XX"
          autoComplete="off"
          className={inputClassName(false)}
        />
      </div>

      <button type="submit" disabled={isPending} className={submitButtonClassName}>
        {isPending ? "Sorgulanıyor…" : "Siparişimi Takip Et"}
      </button>

      <p className="text-foreground/50 text-xs">
        Sipariş numaranız ve siparişte kullandığınız e-posta veya telefon bilgisiyle sorgulama yapabilirsiniz.
      </p>
    </form>
  );
}
