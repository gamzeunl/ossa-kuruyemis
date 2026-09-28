import { describe, expect, it } from "vitest";
import { OrderStatus } from "@/generated/prisma/client";
import { resolveOrderTimeline } from "@/lib/order-timeline";

describe("resolveOrderTimeline", () => {
  it("PENDING: ilk adım current, geri kalanı upcoming", () => {
    const timeline = resolveOrderTimeline(OrderStatus.PENDING);
    if (timeline.kind !== "steps") throw new Error("steps bekleniyordu");
    expect(timeline.steps.map((step) => step.state)).toEqual([
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("PROCESSING: önceki adımlar done, kendisi current, sonrakiler upcoming", () => {
    const timeline = resolveOrderTimeline(OrderStatus.PROCESSING);
    if (timeline.kind !== "steps") throw new Error("steps bekleniyordu");
    expect(timeline.steps.map((step) => step.state)).toEqual([
      "done",
      "done",
      "current",
      "upcoming",
      "upcoming",
    ]);
  });

  it("DELIVERED: tüm adımlar done ya da current, hiçbiri upcoming değil", () => {
    const timeline = resolveOrderTimeline(OrderStatus.DELIVERED);
    if (timeline.kind !== "steps") throw new Error("steps bekleniyordu");
    expect(timeline.steps.every((step) => step.state !== "upcoming")).toBe(true);
    expect(timeline.steps.at(-1)?.state).toBe("current");
  });

  it("adım etiketleri ORDER_STATUS_LABELS ile birebir aynı (ikinci bir Türkçe metin kaynağı yok)", () => {
    const timeline = resolveOrderTimeline(OrderStatus.CONFIRMED);
    if (timeline.kind !== "steps") throw new Error("steps bekleniyordu");
    expect(timeline.steps.map((step) => step.label)).toEqual([
      "Beklemede",
      "Onaylandı",
      "Hazırlanıyor",
      "Kargoya Verildi",
      "Teslim Edildi",
    ]);
  });

  it("CANCELLED ayrı bir durumdur, adımlardan birine sahte konum atanmaz", () => {
    expect(resolveOrderTimeline(OrderStatus.CANCELLED)).toEqual({ kind: "cancelled" });
  });

  it("henüz ulaşılamayan ödeme/iade durumları stepper'a zorlanmaz", () => {
    expect(resolveOrderTimeline(OrderStatus.PAID)).toEqual({ kind: "unsupported", label: "Ödendi" });
    expect(resolveOrderTimeline(OrderStatus.PAYMENT_PROCESSING)).toEqual({
      kind: "unsupported",
      label: "Ödeme İşleniyor",
    });
    expect(resolveOrderTimeline(OrderStatus.RETURN_REQUESTED)).toEqual({
      kind: "unsupported",
      label: "İade Talep Edildi",
    });
  });
});
