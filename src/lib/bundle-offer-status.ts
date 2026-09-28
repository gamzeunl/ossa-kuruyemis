import { isBundleOfferCurrentlyValid, type BundleOfferPricingInput } from "@/lib/bundle-pricing";
import type { StatusTone } from "@/components/admin/status-badge";
import type { Prisma } from "@/generated/prisma/client";

export type BundleOfferStatus = "ACTIVE" | "SCHEDULED" | "ENDED" | "INACTIVE";

export const BUNDLE_OFFER_STATUS_LABELS: Record<BundleOfferStatus, string> = {
  ACTIVE: "Aktif",
  SCHEDULED: "Planlandı",
  ENDED: "Sona Erdi",
  INACTIVE: "Pasif",
};

/** Ortak `StatusBadge` ton eşlemesi — `campaign-status.ts`/`discount-status.ts` ile AYNI 4'lü desen. */
export const BUNDLE_OFFER_STATUS_TONE: Record<BundleOfferStatus, StatusTone> = {
  ACTIVE: "success",
  SCHEDULED: "warning",
  ENDED: "neutral",
  INACTIVE: "neutral",
};

/**
 * Admin "Birlikte Al" listesi için bir kampanyanın durumunu sınıflandırır —
 * `discount-status.ts` ile birebir aynı desen. Fiyat HESAPLAMAZ, TEK karar
 * kaynağı olarak `isBundleOfferCurrentlyValid()`'i kullanır.
 */
export function resolveBundleOfferStatus(
  bundle: BundleOfferPricingInput,
  companionIndependentEffectivePrice: Prisma.Decimal,
  now: Date = new Date(),
): BundleOfferStatus {
  if (!bundle.isActive) {
    return "INACTIVE";
  }
  if (isBundleOfferCurrentlyValid(bundle, companionIndependentEffectivePrice, now)) {
    return "ACTIVE";
  }
  if (bundle.startsAt && now < bundle.startsAt) {
    return "SCHEDULED";
  }
  if (bundle.endsAt && now > bundle.endsAt) {
    return "ENDED";
  }
  return "INACTIVE";
}
