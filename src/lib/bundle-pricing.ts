import { Prisma } from "@/generated/prisma/client";

/**
 * "Birlikte Daha Güzel" çapraz satış fiyatının TEK karar kaynağı.
 * `resolveVariantPricing()`'e (bkz. `product-pricing.ts`) dokunmaz — bu
 * modül onun ÇIKTISINI (tamamlayıcı varyantın normal indirimi ZATEN dahil
 * edilmiş `effectivePrice`'ı) girdi olarak alır ve gerekirse bundle fiyatıyla
 * karşılaştırır. PDP, sepet, checkout, `createDraftOrder` — hepsi bu TEK
 * fonksiyonu çağırır; hiçbiri kendi `min()` mantığını yazmaz.
 */
export interface BundleOfferPricingInput {
  companionPrice: Prisma.Decimal;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}

/**
 * Bundle'ın şu an GEÇERLİ (uygulanabilir) olup olmadığını belirler:
 * aktif mi, tarih aralığında mı, kampanya fiyatı pozitif mi VE tamamlayıcının
 * o andaki gerçek bağımsız efektif fiyatından düşük mü.
 */
export function isBundleOfferCurrentlyValid(
  bundle: BundleOfferPricingInput,
  companionIndependentEffectivePrice: Prisma.Decimal,
  now: Date = new Date(),
): boolean {
  if (!bundle.isActive) {
    return false;
  }
  if (!bundle.companionPrice.greaterThan(0)) {
    return false;
  }
  if (!bundle.companionPrice.lessThan(companionIndependentEffectivePrice)) {
    return false;
  }
  if (bundle.startsAt && now < bundle.startsAt) {
    return false;
  }
  if (bundle.endsAt && now > bundle.endsAt) {
    return false;
  }
  return true;
}

export interface ResolvedBundlePricing {
  /** Müşterinin bu birim için ödeyeceği nihai fiyat — geçerliyse `min(bağımsız, bundle)`, değilse bağımsız fiyatın kendisi. */
  effectivePrice: Prisma.Decimal;
  isBundleApplied: boolean;
}

/**
 * Normal indirim + bundle aynı anda geçerli olabilir — müşteri için DAİMA
 * daha düşük olan fiyat kullanılır. `companionIndependentEffectivePrice`
 * `resolveVariantPricing(companionVariant).effectivePrice` olmalıdır (normal
 * indirim zaten hesaba katılmış hâli) — burada ikinci bir indirim hesaplayıcı
 * YAZILMAZ, yalnızca iki hazır sayı karşılaştırılır.
 */
export function resolveBundleCompanionPrice(
  companionIndependentEffectivePrice: Prisma.Decimal,
  bundle: BundleOfferPricingInput,
  now: Date = new Date(),
): ResolvedBundlePricing {
  if (!isBundleOfferCurrentlyValid(bundle, companionIndependentEffectivePrice, now)) {
    return { effectivePrice: companionIndependentEffectivePrice, isBundleApplied: false };
  }
  if (bundle.companionPrice.lessThan(companionIndependentEffectivePrice)) {
    return { effectivePrice: bundle.companionPrice, isBundleApplied: true };
  }
  return { effectivePrice: companionIndependentEffectivePrice, isBundleApplied: false };
}
