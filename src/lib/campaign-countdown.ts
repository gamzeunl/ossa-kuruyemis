/**
 * Kampanya sayacının saf tarih aritmetiği — `CampaignCountdown` component'i
 * bunu sarmalayıp `setInterval` ile besler. Component'ten ayrı tutulması,
 * DOM/timer olmadan birim test edilebilmesi içindir. Girdi her zaman
 * milisaniye cinsinden KALAN süre (`endsAt - now`), zaten epoch-ms farkı
 * olduğundan saat dilimine duyarlı DEĞİLDİR (mutlak saat karşılaştırması yok).
 */

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Süre dolmuş mu — dolduysa parçalar 0'dır, gösterim tarafı "Sona erdi" durumuna geçmeli. */
  expired: boolean;
}

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

export function computeCountdownParts(msRemaining: number): CountdownParts {
  if (msRemaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  const days = Math.floor(msRemaining / DAY_MS);
  const hours = Math.floor((msRemaining % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((msRemaining % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((msRemaining % MINUTE_MS) / SECOND_MS);
  return { days, hours, minutes, seconds, expired: false };
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

/**
 * Akıllı format: 24 saatten uzun kalan sürede gün öne çıkar ("2 Gün 04:32:10"),
 * kısa sürede yalnızca saat:dakika:saniye ("04:32:10") gösterilir.
 */
export function formatCountdown(parts: CountdownParts): string {
  if (parts.expired) {
    return "Sona erdi";
  }
  const clock = `${pad2(parts.hours)}:${pad2(parts.minutes)}:${pad2(parts.seconds)}`;
  if (parts.days > 0) {
    return `${parts.days} Gün ${clock}`;
  }
  return clock;
}
