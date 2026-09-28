import type { MarketingCampaignType } from "@/generated/prisma/client";

/**
 * Kampanya "türü" (Günlük/Haftalık/Aylık) SADECE admin formunda varsayılan
 * bitiş tarihini önermek için kullanılır — asıl gerçek kaynak her zaman
 * `startsAt`/`endsAt`'tır, admin öneriyi elle değiştirebilir. Bu dosya DB'ye
 * dokunmaz, saf/test edilebilir tarih aritmetiği içerir.
 */
export const CAMPAIGN_TYPE_OPTIONS: { value: MarketingCampaignType; label: string }[] = [
  { value: "DAILY", label: "Günlük" },
  { value: "WEEKLY", label: "Haftalık" },
  { value: "MONTHLY", label: "Aylık" },
];

export const CAMPAIGN_TYPE_LABELS: Record<MarketingCampaignType, string> = {
  DAILY: "Günlük",
  WEEKLY: "Haftalık",
  MONTHLY: "Aylık",
};

/** Ana sayfada/popup'ta aynı anda birden fazla aktif kampanya varsa öncelik sırası: Günlük > Haftalık > Aylık. */
export const CAMPAIGN_TYPE_PRIORITY: Record<MarketingCampaignType, number> = {
  DAILY: 3,
  WEEKLY: 2,
  MONTHLY: 1,
};

/** Tür seçilince form'un önerdiği varsayılan bitiş tarihi — admin manuel değiştirebilir. */
export function computeDefaultEndsAt(type: MarketingCampaignType, startsAt: Date): Date {
  switch (type) {
    case "DAILY":
      return new Date(startsAt.getTime() + 24 * 60 * 60 * 1000);
    case "WEEKLY":
      return new Date(startsAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    case "MONTHLY": {
      const result = new Date(startsAt);
      result.setMonth(result.getMonth() + 1);
      return result;
    }
  }
}
