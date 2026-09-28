import { OrderStatus } from "@/generated/prisma/enums";
import { ORDER_STATUS_LABELS } from "@/lib/order-status-labels";

/**
 * Gerçekten ulaşılabilir tek doğrusal ilerleme — `src/lib/order-status.ts`'teki
 * `ALLOWED_TRANSITIONS` state machine'inin PENDING→CONFIRMED→PROCESSING→SHIPPED→
 * DELIVERED zincirine karşılık gelir. Ödeme/iade durumları bu fazda hiç
 * ulaşılamaz (bkz. `order-status.ts` yorumu) — bu listeye eklenmez.
 */
const CORE_TIMELINE_STATUSES: readonly OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
];

export interface TimelineStep {
  status: OrderStatus;
  label: string;
  state: "done" | "current" | "upcoming";
}

export type OrderTimeline =
  | { kind: "steps"; steps: TimelineStep[] }
  | { kind: "cancelled" }
  | { kind: "unsupported"; label: string };

/**
 * Sipariş durumunu görsel takip için sınıflandırır. Çekirdek 5 durumdan
 * biriyse adım adım ilerleme döner; `CANCELLED` ayrı bir durum olarak
 * işaretlenir (asla adımlardan birine "iptal edildiği yer" diye uydurma
 * bir konum atanmaz); tanımlanmamış/henüz ulaşılamayan durumlar için de
 * (ödeme/iade akışı) adım zorlanmaz, yalnızca düz etiket döner.
 */
export function resolveOrderTimeline(status: OrderStatus): OrderTimeline {
  if (status === OrderStatus.CANCELLED) {
    return { kind: "cancelled" };
  }

  const currentIndex = CORE_TIMELINE_STATUSES.indexOf(status);
  if (currentIndex === -1) {
    return { kind: "unsupported", label: ORDER_STATUS_LABELS[status] };
  }

  const steps: TimelineStep[] = CORE_TIMELINE_STATUSES.map((step, index) => ({
    status: step,
    label: ORDER_STATUS_LABELS[step],
    state: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
  }));

  return { kind: "steps", steps };
}
