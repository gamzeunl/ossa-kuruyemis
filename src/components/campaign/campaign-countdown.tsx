"use client";

import { useEffect, useRef, useState } from "react";
import { computeCountdownParts, formatCountdown } from "@/lib/campaign-countdown";

interface CampaignCountdownProps {
  /** ISO string (`Date.toISOString()`) — epoch-ms farkıyla hesaplanır, saat dilimine duyarlı değildir. */
  endsAt: string;
  className?: string;
  /** Süre 0'a ulaştığında TEK SEFER çağrılır — üst component'in (ör. popup) süresi dolan kampanyayı gizlemesi için. */
  onExpire?: () => void;
}

/**
 * Kampanya sayacı — TEK client-only saat kaynağı. Sunucu render'ı ve mount
 * ÖNCESİ ilk client render'ı KASITLI OLARAK boş/nötr bir yer tutucudur (`useCartHydrated`
 * ile AYNI hydration-mismatch önleme deseni, bkz. `mini-cart.tsx`) — `Date.now()`
 * sunucu/client arasında asla eşleşmeyeceğinden, gerçek değer yalnızca mount
 * SONRASI hesaplanır. Her saniye günceller, `endsAt` DEĞİŞMEDEN sabit kalır
 * (yenilemede sıfırlanmaz) — gösterilen süre her zaman gerçek `endsAt - şu an`
 * farkıdır. Süre dolunca interval durur, `onExpire` tam olarak bir kez çağrılır.
 */
export function CampaignCountdown({ endsAt, className, onExpire }: CampaignCountdownProps) {
  const [nowMs, setNowMs] = useState<number | null>(null);
  const hasExpiredRef = useRef(false);
  const targetMs = new Date(endsAt).getTime();

  useEffect(() => {
    hasExpiredRef.current = false;

    function tick() {
      const current = Date.now();
      setNowMs(current);
      if (current >= targetMs && !hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpire?.();
      }
    }

    // İlk değer effect gövdesinde SENKRON `setState` yapmaz (bkz.
    // `react-hooks/set-state-in-effect`) — `campaign-popup.tsx`'teki açılış
    // gecikmesiyle AYNI desen, bir sonraki tick'e ertelenir.
    const initialTimer = setTimeout(tick, 0);
    const intervalId = setInterval(() => {
      tick();
      if (hasExpiredRef.current) {
        clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `onExpire` bilinçli olarak dışarıda: yeniden başlatma yalnızca `targetMs` değişince olsun.
  }, [targetMs]);

  if (nowMs === null) {
    return (
      <span className={className} aria-hidden="true">
        &nbsp;
      </span>
    );
  }

  const parts = computeCountdownParts(targetMs - nowMs);

  return (
    <span className={className} aria-live="polite">
      {parts.expired ? "Sona erdi" : `Kalan süre: ${formatCountdown(parts)}`}
    </span>
  );
}
