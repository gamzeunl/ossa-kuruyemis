import { resolveCampaignPopupData } from "@/lib/campaign-popup";
import {
  getActiveDiscountedProducts,
  getActiveWeeklyPopupCampaign,
  getBundleOffersForHomepage,
  getFeaturedProductPicks,
} from "@/server/services/catalog-service";
import type { CampaignPopupData } from "@/types/campaign-popup";

const DISCOUNT_CANDIDATES_LIMIT = 4;
const FEATURED_CANDIDATES_LIMIT = 4;

/**
 * Site girişi kampanya popup'ı için gösterilecek TEK kampanyayı çözer.
 * Öncelik: admin'in `showPopup=true` işaretlediği aktif HAFTALIK
 * `MarketingCampaign` > aktif indirim > Birlikte Daha Güzel > Ayın Favorileri
 * — karar `resolveCampaignPopupData`'da verilir, burada yalnızca dört gerçek
 * kaynak TEK `Promise.all` ile okunur. Hiçbiri aktif değilse `null` — popup
 * hiç render edilmez.
 */
export async function getActiveCampaignPopup(): Promise<CampaignPopupData | null> {
  const [activeWeeklyPopupCampaign, discountedProducts, bundleOffers, featuredPicks] = await Promise.all([
    getActiveWeeklyPopupCampaign(),
    getActiveDiscountedProducts(DISCOUNT_CANDIDATES_LIMIT),
    getBundleOffersForHomepage(1),
    getFeaturedProductPicks(FEATURED_CANDIDATES_LIMIT),
  ]);

  return resolveCampaignPopupData({ activeWeeklyPopupCampaign, discountedProducts, bundleOffers, featuredPicks });
}
