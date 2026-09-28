import type { OrderStatus } from "@/generated/prisma/enums";
import { resolveOrderTimeline } from "@/lib/order-timeline";

function StepDot({ state }: { state: "done" | "current" | "upcoming" }) {
  if (state === "done") {
    return (
      <span className="bg-brand text-brand-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold">
        ✓
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="border-brand bg-brand/10 text-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold">
        ●
      </span>
    );
  }
  return (
    <span className="border-border-muted text-foreground/30 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold">
      ○
    </span>
  );
}

/** Görevin verdiği gerçek `OrderStatus` ilerleme sırasını görsel bir stepper olarak gösterir; icat edilmiş aşama yoktur (bkz. `resolveOrderTimeline`). */
export function OrderStatusTimeline({ status }: { status: OrderStatus }) {
  const timeline = resolveOrderTimeline(status);

  if (timeline.kind === "cancelled") {
    return (
      <div className="border-red-200 bg-red-50 flex items-center gap-2 rounded-xl border p-4">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
        <p className="text-sm font-semibold text-red-700">Bu sipariş iptal edilmiştir.</p>
      </div>
    );
  }

  if (timeline.kind === "unsupported") {
    return (
      <div className="border-border-muted bg-surface-muted flex items-center gap-2 rounded-xl border p-4">
        <p className="text-foreground text-sm font-semibold">{timeline.label}</p>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-0 sm:flex-row sm:items-start sm:gap-0">
      {timeline.steps.map((step, index) => (
        <li key={step.status} className="flex flex-1 gap-3 sm:flex-col sm:items-center sm:gap-2 sm:text-center">
          <div className="flex flex-col items-center sm:w-full sm:flex-row">
            <StepDot state={step.state} />
            {index < timeline.steps.length - 1 ? (
              <span
                aria-hidden="true"
                className={`w-0.5 flex-1 sm:h-0.5 sm:w-full ${
                  step.state === "done" ? "bg-brand" : "bg-border-muted"
                } my-1 sm:my-0 sm:ml-2`}
                style={{ minHeight: "1.25rem" }}
              />
            ) : null}
          </div>
          <span
            className={`pb-4 text-xs font-medium sm:pb-0 ${
              step.state === "upcoming" ? "text-foreground/40" : "text-foreground"
            }`}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
}
