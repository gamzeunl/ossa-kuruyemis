
import { Prisma } from "@/generated/prisma/client";
import { isCampaignCurrentlyActive } from "@/lib/campaign-status";
import {
  applyCampaignPrice,
  resolveVariantPricing,
  type ResolvedVariantPricing,
  type VariantPricingInput,
} from "@/lib/product-pricing";

export interface CampaignPriceCandidate {
  variantId: string;
  campaignPrice: Prisma.Decimal | null;
  isActive: boolean;
  startsAt: Date;
  endsAt: Date;
}

/**
 * Varyant için geçerli kampanya fiyatları arasından
 * en düşük olanı seçer.
 *
 * Pasif, henüz başlamamış, bitmiş veya
 * geçersiz fiyatlı kampanyalar uygulanmaz.
 */
export function findLowestActiveCampaignPrice(
  variantId: string,
  campaigns: CampaignPriceCandidate[],
  now: Date = new Date()
): Prisma.Decimal | null {
  let lowest: Prisma.Decimal | null = null;

  for (const campaign of campaigns) {
    if (campaign.variantId !== variantId) {
      continue;
    }

    if (
      !isCampaignCurrentlyActive(
        {
          isActive: campaign.isActive,
          startsAt: campaign.startsAt,
          endsAt: campaign.endsAt,
        },
        now
      )
    ) {
      continue;
    }

    const price = campaign.campaignPrice;

    if (price === null || !price.greaterThan(0)) {
      continue;
    }

    if (lowest === null || price.lessThan(lowest)) {
      lowest = price;
    }
  }

  return lowest;
}

/**
 * Normal indirim ve kampanya fiyatını
 * tek noktadan karşılaştırır.
 */
export function resolveVariantPricingWithCampaign(
  variantId: string,
  variant: VariantPricingInput,
  campaigns: CampaignPriceCandidate[],
  now: Date = new Date()
): ResolvedVariantPricing {
  const pricing = resolveVariantPricing(variant, now);

  const campaignPrice = findLowestActiveCampaignPrice(
    variantId,
    campaigns,
    now
  );

  return applyCampaignPrice(pricing, campaignPrice);
}
