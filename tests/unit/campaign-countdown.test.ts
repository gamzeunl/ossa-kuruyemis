import { describe, expect, it } from "vitest";
import { computeCountdownParts, formatCountdown } from "@/lib/campaign-countdown";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;

describe("computeCountdownParts — saf tarih aritmetiği", () => {
  it("0 veya negatif kalan süre için expired=true, tüm parçalar 0 döner", () => {
    expect(computeCountdownParts(0)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
    expect(computeCountdownParts(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
  });

  it("24 saatten kısa kalan süreyi saat/dakika/saniyeye böler, days=0", () => {
    const ms = 4 * HOUR_MS + 32 * MINUTE_MS + 10 * 1000;
    expect(computeCountdownParts(ms)).toEqual({ days: 0, hours: 4, minutes: 32, seconds: 10, expired: false });
  });

  it("24 saatten uzun kalan süreyi gün + saat/dakika/saniyeye böler", () => {
    const ms = 2 * DAY_MS + 4 * HOUR_MS + 32 * MINUTE_MS + 10 * 1000;
    expect(computeCountdownParts(ms)).toEqual({ days: 2, hours: 4, minutes: 32, seconds: 10, expired: false });
  });
});

describe("formatCountdown — akıllı format (>24s gün öne çıkar, <24s yalnızca saat)", () => {
  it("süre dolduysa 'Sona erdi' döner", () => {
    expect(formatCountdown(computeCountdownParts(0))).toBe("Sona erdi");
  });

  it("24 saatten kısa kalan süre yalnızca HH:MM:SS gösterir", () => {
    const ms = 4 * HOUR_MS + 32 * MINUTE_MS + 10 * 1000;
    expect(formatCountdown(computeCountdownParts(ms))).toBe("04:32:10");
  });

  it("24 saatten uzun kalan süre 'N Gün HH:MM:SS' gösterir", () => {
    const ms = 2 * DAY_MS + 4 * HOUR_MS + 32 * MINUTE_MS + 10 * 1000;
    expect(formatCountdown(computeCountdownParts(ms))).toBe("2 Gün 04:32:10");
  });

  it("tek haneli saat/dakika/saniye sıfırla doldurulur (padStart)", () => {
    const ms = 1 * HOUR_MS + 2 * MINUTE_MS + 3 * 1000;
    expect(formatCountdown(computeCountdownParts(ms))).toBe("01:02:03");
  });
});
