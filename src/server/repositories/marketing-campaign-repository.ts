
import type {
  MarketingCampaignType,
  Prisma,
} from "@/generated/prisma/client";

import { prisma } from "@/server/db/prisma";

/**
 * Admin ve storefront için ortak kampanya sorgusu.
 */
const marketingCampaignSelect = {
  id: true,
  name: true,
  type: true,
  startsAt: true,
  endsAt: true,
  isActive: true,
  showOnHomepage: true,
  showPopup: true,
  headline: true,
  description: true,
  sortOrder: true,
  createdAt: true,
  updatedAt: true,

  products: {
    select: {
      variantId: true,
      sortOrder: true,
      campaignPrice: true,

      variant: {
        select: {
          id: true,
          name: true,
          productId: true,

          product: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      },
    },

    orderBy: {
      sortOrder: "asc",
    },
  },
} satisfies Prisma.MarketingCampaignSelect;

export type MarketingCampaignRow =
  Prisma.MarketingCampaignGetPayload<{
    select: typeof marketingCampaignSelect;
  }>;

/**
 * Admin için tüm kampanyalar.
 */
export async function listMarketingCampaignsForAdmin(): Promise<
  MarketingCampaignRow[]
> {
  return prisma.marketingCampaign.findMany({
    select: marketingCampaignSelect,
    orderBy: [
      { sortOrder: "asc" },
      { startsAt: "desc" },
    ],
  });
}

/**
 * Tek kampanyayı getir.
 */
export async function findMarketingCampaignForAdmin(
  id: string
): Promise<MarketingCampaignRow | null> {
  return prisma.marketingCampaign.findUnique({
    where: { id },
    select: marketingCampaignSelect,
  });
}

/**
 * Aktif olarak işaretlenmiş kampanyalar.
 * Tarih kontrolü servis katmanında yapılır.
 */
export async function listEnabledMarketingCampaigns(): Promise<
  MarketingCampaignRow[]
> {
  return prisma.marketingCampaign.findMany({
    where: {
      isActive: true,
    },

    select: marketingCampaignSelect,

    orderBy: [
      { sortOrder: "asc" },
      { startsAt: "desc" },
    ],
  });
}

/**
 * Kampanyanın temel alanları.
 */
export interface MarketingCampaignFields {
  name: string;
  type: MarketingCampaignType;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  showOnHomepage: boolean;
  showPopup: boolean;
  headline: string | null;
  description: string | null;
  sortOrder: number;
}

/**
 * Yeni kampanya ürün/fiyat formatı.
 */
export interface MarketingCampaignProductInput {
  variantId: string;
  campaignPrice: string;
}

/**
 * Eski testlerdeki string[] formatını da destekler.
 *
 * string:
 *   "variant-id"
 *
 * Yeni format:
 *   {
 *     variantId: "variant-id",
 *     campaignPrice: "249.90"
 *   }
 */
type CampaignProductInput =
  | MarketingCampaignProductInput
  | string;

/**
 * Ürün ilişkilerini Prisma kayıt formatına dönüştürür.
 *
 * Eski formatta fiyat null olur.
 * Yeni formatta kampanyalı fiyat kaydedilir.
 */
function buildProductRelationOps(
  products: CampaignProductInput[]
) {
  return products.map((product, index) => {
    if (typeof product === "string") {
      return {
        variantId: product,
        campaignPrice: null,
        sortOrder: index,
      };
    }

    return {
      variantId: product.variantId,
      campaignPrice: product.campaignPrice,
      sortOrder: index,
    };
  });
}

/**
 * Yeni kampanya oluştur.
 */
export async function createMarketingCampaign(
  fields: MarketingCampaignFields,
  products: CampaignProductInput[]
): Promise<{ id: string }> {
  return prisma.marketingCampaign.create({
    data: {
      ...fields,

      products: {
        create: buildProductRelationOps(products),
      },
    },

    select: {
      id: true,
    },
  });
}

/**
 * Kampanya bilgilerini ve ürün fiyatlarını
 * tek transaction içinde günceller.
 *
 * Eski ilişkiler silinir ve seçili ürünler
 * kampanya fiyatlarıyla yeniden oluşturulur.
 */
export async function updateMarketingCampaign(
  id: string,
  fields: MarketingCampaignFields,
  products: CampaignProductInput[]
): Promise<void> {
  await prisma.$transaction([
    prisma.marketingCampaignProduct.deleteMany({
      where: {
        campaignId: id,
      },
    }),

    prisma.marketingCampaign.update({
      where: {
        id,
      },

      data: {
        ...fields,

        products: {
          create: buildProductRelationOps(products),
        },
      },
    }),
  ]);
}

/**
 * Kampanyayı pasifleştir.
 */
export async function deactivateMarketingCampaign(
  id: string
): Promise<void> {
  await prisma.marketingCampaign.update({
    where: {
      id,
    },

    data: {
      isActive: false,
    },
  });
}

/**
 * Kampanyayı sil.
 */
export async function deleteMarketingCampaign(
  id: string
): Promise<void> {
  await prisma.marketingCampaign.delete({
    where: {
      id,
    },
  });
}

/**
 * Kampanya başlığı için temel bilgiler.
 */
export async function findMarketingCampaignBasicById(
  id: string
): Promise<{
  id: string;
  name: string;
  headline: string | null;
} | null> {
  return prisma.marketingCampaign.findUnique({
    where: {
      id,
    },

    select: {
      id: true,
      name: true,
      headline: true,
    },
  });
}

/**
 * Verilen varyantların aktif kampanya fiyatlarını getirir.
 * Aynı varyant birden fazla kampanyadaysa tüm adaylar döner.
 * En düşük geçerli fiyatı seçme işlemi ortak fiyatlandırma
 * fonksiyonunda yapılır.
 */
export async function listCampaignPricesForVariants(
  variantIds: string[],
  now: Date = new Date(),
) {
  if (variantIds.length === 0) {
    return [];
  }

  const rows = await prisma.marketingCampaignProduct.findMany({
    where: {
      variantId: { in: variantIds },
      campaignPrice: { not: null },
      campaign: {
        isActive: true,
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    },
    select: {
      variantId: true,
      campaignPrice: true,
      campaign: {
        select: {
          isActive: true,
          startsAt: true,
          endsAt: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    variantId: row.variantId,
    campaignPrice: row.campaignPrice,
    isActive: row.campaign.isActive,
    startsAt: row.campaign.startsAt,
    endsAt: row.campaign.endsAt,
  }));
}
