/**
 * `MarketingCampaign` durumunun TEK karar kaynağı — `discount-status.ts` ile
 * aynı desende. Hiçbir component/sayfa kendi tarih karşılaştırmasını yapmaz;
 * hepsi burayı çağırır. Gerçek aktiflik her zaman `isActive` + `startsAt`/
 * `endsAt` üzerinden hesaplanır, cron/arka plan işi gerekmez (read-time
 * evaluation).
 */

import type { StatusTone } from "@/components/admin/status-badge";

export type CampaignStatus = "PLANLANDI" | "AKTIF" | "BUGUN_BITIYOR" | "SONA_ERDI" | "PASIF";

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, string> = {
  PLANLANDI: "Planlandı",
  AKTIF: "Aktif",
  BUGUN_BITIYOR: "Bugün Bitiyor",
  SONA_ERDI: "Sona Erdi",
  PASIF: "Pasif",
};

/**
 * Admin genelindeki ortak `StatusBadge` için ton eşlemesi — önceden 3 ayrı
 * dosyada (`kampanyalar/page.tsx`, `birlikte-al/page.tsx`,
 * `haftanin-firsatlari/page.tsx`) neredeyse birebir kopyalanmıştı, artık TEK
 * kaynak burası.
 */
export const CAMPAIGN_STATUS_TONE: Record<CampaignStatus, StatusTone> = {
  AKTIF: "success",
  BUGUN_BITIYOR: "warning",
  PLANLANDI: "warning",
  SONA_ERDI: "neutral",
  PASIF: "neutral",
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export interface CampaignDateRange {
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
}

/**
 * Bir kampanyanın müşteriye GERÇEKTEN gösterilip gösterilmeyeceğinin tek
 * kaynağı — homepage/popup/ürün filtresi hepsi bunu kullanır.
 */
export function isCampaignCurrentlyActive(campaign: CampaignDateRange, now: Date = new Date()): boolean {
  return campaign.isActive && campaign.startsAt <= now && campaign.endsAt > now;
}

/**
 * Admin listesindeki durum badge'i için 5 durumlu sınıflandırma.
 * `isActive=false` → PASİF (admin kapatmış), aksi halde tarih aralığına göre
 * PLANLANDI/AKTİF/BUGÜN BİTİYOR/SONA ERDİ.
 */
export function resolveCampaignStatus(campaign: CampaignDateRange, now: Date = new Date()): CampaignStatus {
  if (!campaign.isActive) {
    return "PASIF";
  }
  if (now < campaign.startsAt) {
    return "PLANLANDI";
  }
  if (now >= campaign.endsAt) {
    return "SONA_ERDI";
  }
  const msLeft = campaign.endsAt.getTime() - now.getTime();
  if (msLeft <= ONE_DAY_MS) {
    return "BUGUN_BITIYOR";
  }
  return "AKTIF";
}
