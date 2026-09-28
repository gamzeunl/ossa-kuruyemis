import { describe, expect, it } from "vitest";
import { computeDefaultEndsAt } from "@/lib/campaign-type-preset";

describe("computeDefaultEndsAt — kampanya türü SADECE form önerisi, gerçek kaynak startsAt/endsAt", () => {
  it("DAILY: başlangıçtan tam 24 saat sonrasını önerir", () => {
    const startsAt = new Date("2026-06-01T09:00:00.000Z");
    const result = computeDefaultEndsAt("DAILY", startsAt);
    expect(result.toISOString()).toBe("2026-06-02T09:00:00.000Z");
  });

  it("WEEKLY: başlangıçtan tam 7 gün sonrasını önerir", () => {
    const startsAt = new Date("2026-06-01T09:00:00.000Z");
    const result = computeDefaultEndsAt("WEEKLY", startsAt);
    expect(result.toISOString()).toBe("2026-06-08T09:00:00.000Z");
  });

  it("MONTHLY: başlangıçtan tam 1 ay sonrasını önerir", () => {
    const startsAt = new Date("2026-06-01T09:00:00.000Z");
    const result = computeDefaultEndsAt("MONTHLY", startsAt);
    expect(result.toISOString()).toBe("2026-07-01T09:00:00.000Z");
  });

  it("MONTHLY: ay sonu tarihlerinde (ör. 31 Ocak) JS'in bilinen Date.setMonth taşma davranışını yansıtır", () => {
    const startsAt = new Date("2026-01-31T09:00:00.000Z");
    const result = computeDefaultEndsAt("MONTHLY", startsAt);
    // Şubat 2026'da 28 gün var — 31 Ocak + 1 ay, 3 Mart'a taşar. Bu bir hata
    // DEĞİL, JS Date'in standart davranışı; admin formda görüp elle düzeltebilir
    // (görev: "admin tarihleri manuel değiştirebilsin").
    expect(result.toISOString()).toBe("2026-03-03T09:00:00.000Z");
  });
});
