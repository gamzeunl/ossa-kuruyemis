/**
 * Ürün rozetlerinin (İndirim, OSSA Öneriyor, Çok Satan, Yeni) TEK seçim/öncelik
 * kaynağı. `ProductCard`/`ProductListCard` bu modülün ürettiği listeyi doğrudan
 * render eder — kart bileşenlerinde dağınık koşul yazılmaz.
 */

export type ProductBadgeKey = "discount" | "recommended" | "bestSeller" | "new";

export interface ProductBadge {
  key: ProductBadgeKey;
  label: string;
}

/** "Yeni" rozetinin otomatik göründüğü, ürün oluşturulduktan sonraki gün sayısı. */
export const NEW_PRODUCT_DAYS = 30;

const MAX_BADGES = 2;

/** Aynı anda birden fazla rozet uygunsa bu sırayla en fazla ikisi gösterilir. */
const BADGE_PRIORITY: ProductBadgeKey[] = ["discount", "recommended", "bestSeller", "new"];

const BADGE_LABELS: Record<ProductBadgeKey, string> = {
  discount: "İndirim",
  recommended: "OSSA Öneriyor",
  bestSeller: "Çok Satan",
  new: "Yeni",
};

export interface ProductBadgeInput {
  hasActiveDiscount: boolean;
  isRecommended: boolean;
  /** Gerçek sipariş verisinden hesaplanmış olmalı — bkz. `order-repository.ts`. */
  isBestSeller: boolean;
  createdAt: Date;
  /** null: otomatik hesapla, true: zorla göster, false: zorla gizle. */
  newBadgeOverride: boolean | null;
}

function isWithinNewWindow(createdAt: Date, now: Date): boolean {
  const ageInDays = (now.getTime() - createdAt.getTime()) / 86_400_000;
  return ageInDays <= NEW_PRODUCT_DAYS;
}

export function resolveProductBadges(input: ProductBadgeInput, now: Date = new Date()): ProductBadge[] {
  const isNew = input.newBadgeOverride ?? isWithinNewWindow(input.createdAt, now);

  const eligible: Record<ProductBadgeKey, boolean> = {
    discount: input.hasActiveDiscount,
    recommended: input.isRecommended,
    bestSeller: input.isBestSeller,
    new: isNew,
  };

  return BADGE_PRIORITY.filter((key) => eligible[key])
    .slice(0, MAX_BADGES)
    .map((key) => ({ key, label: BADGE_LABELS[key] }));
}
