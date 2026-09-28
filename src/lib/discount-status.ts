import type { VariantPricingInput } from "@/lib/product-pricing";
import { resolveVariantPricing } from "@/lib/product-pricing";
import type { StatusTone } from "@/components/admin/status-badge";

export type DiscountStatus = "ACTIVE" | "SCHEDULED" | "ENDED" | "INACTIVE";

export const DISCOUNT_STATUS_LABELS: Record<DiscountStatus, string> = {
  ACTIVE: "Aktif",
  SCHEDULED: "Planlandı",
  ENDED: "Sona Erdi",
  INACTIVE: "Pasif",
};

/** Ortak `StatusBadge` ton eşlemesi — `campaign-status.ts`/`bundle-offer-status.ts` ile AYNI 4'lü desen. */
export const DISCOUNT_STATUS_TONE: Record<DiscountStatus, StatusTone> = {
  ACTIVE: "success",
  SCHEDULED: "warning",
  ENDED: "neutral",
  INACTIVE: "neutral",
};

/**
 * Admin "Haftanın Fırsatları" listesi için bir varyantın indirim durumunu
 * sınıflandırır — fiyat/aktiflik HESAPLAMAZ, TEK karar kaynağı olarak
 * `resolveVariantPricing()`'in `hasActiveDiscount` sonucunu kullanır; yalnızca
 * "neden aktif değil" (henüz başlamadı / süresi geçti / admin kapattı)
 * ayrımını okunabilir bir etikete çevirir.
 */
export function resolveDiscountStatus(variant: VariantPricingInput, now: Date = new Date()): DiscountStatus {
  if (!variant.isDiscountActive) {
    return "INACTIVE";
  }

  const pricing = resolveVariantPricing(variant, now);
  if (pricing.hasActiveDiscount) {
    return "ACTIVE";
  }

  if (variant.discountStartsAt && now < variant.discountStartsAt) {
    return "SCHEDULED";
  }
  if (variant.discountEndsAt && now > variant.discountEndsAt) {
    return "ENDED";
  }

  // isDiscountActive=true, discountPrice geçersiz/eksik (ör. fiyattan büyük) —
  // pratikte doğrulama katmanı bunu engeller, ama gösterimde "Pasif" güvenli varsayılan.
  return "INACTIVE";
}
