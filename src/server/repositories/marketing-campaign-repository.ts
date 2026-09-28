import type { MarketingCampaignType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

/**
 * Admin listesi/formu ve storefront (homepage/popup) TÜMÜ bu aynı, ürün
 * ilişkisi dahil şekli kullanır — fiyat/aktiflik kararı burada YOK, çağıran
 * servis katmanı (`catalog-service.ts`) `resolveVariantPricing`/`campaign-status.ts`
 * ile karar verir, bu repository yalnızca veri toplar.
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
      variant: {
        select: {
          id: true,
          name: true,
          productId: true,
          product: { select: { id: true, name: true, slug: true } },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.MarketingCampaignSelect;

export type MarketingCampaignRow = Prisma.MarketingCampaignGetPayload<{
  select: typeof marketingCampaignSelect;
}>;

/** Tüm kayıtlar (pasif/planlı/sona ermiş dahil) — admin "Kampanyalar" hub'ı. */
export async function listMarketingCampaignsForAdmin(): Promise<MarketingCampaignRow[]> {
  return prisma.marketingCampaign.findMany({
    select: marketingCampaignSelect,
    orderBy: [{ sortOrder: "asc" }, { startsAt: "desc" }],
  });
}

export async function findMarketingCampaignForAdmin(id: string): Promise<MarketingCampaignRow | null> {
  return prisma.marketingCampaign.findUnique({ where: { id }, select: marketingCampaignSelect });
}

/**
 * Storefront (homepage/popup) için aday havuzu — nihai "şu an aktif mi"
 * kararı `isCampaignCurrentlyActive` ile servis katmanında verilir, burada
 * yalnızca `isActive=true` olanlar (pasif olanlar hiçbir zaman aday bile
 * olmaz) getirilir.
 */
export async function listEnabledMarketingCampaigns(): Promise<MarketingCampaignRow[]> {
  return prisma.marketingCampaign.findMany({
    where: { isActive: true },
    select: marketingCampaignSelect,
    orderBy: [{ sortOrder: "asc" }, { startsAt: "desc" }],
  });
}

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

function buildProductRelationOps(variantIds: string[]) {
  return variantIds.map((variantId, index) => ({ variantId, sortOrder: index }));
}

export async function createMarketingCampaign(
  fields: MarketingCampaignFields,
  variantIds: string[],
): Promise<{ id: string }> {
  return prisma.marketingCampaign.create({
    data: {
      ...fields,
      products: { create: buildProductRelationOps(variantIds) },
    },
    select: { id: true },
  });
}

/**
 * Kampanya alanları + ürün ilişkileri ATOMİK olarak güncellenir — mevcut
 * ilişkiler tamamen silinip seçilen listeyle yeniden yazılır (kısmi
 * ekleme/çıkarma karşılaştırması yapılmaz, form zaten TÜM seçili varyant
 * listesini gönderir).
 */
export async function updateMarketingCampaign(
  id: string,
  fields: MarketingCampaignFields,
  variantIds: string[],
): Promise<void> {
  await prisma.$transaction([
    prisma.marketingCampaignProduct.deleteMany({ where: { campaignId: id } }),
    prisma.marketingCampaign.update({
      where: { id },
      data: {
        ...fields,
        products: { create: buildProductRelationOps(variantIds) },
      },
    }),
  ]);
}

export async function deactivateMarketingCampaign(id: string): Promise<void> {
  await prisma.marketingCampaign.update({ where: { id }, data: { isActive: false } });
}

export async function deleteMarketingCampaign(id: string): Promise<void> {
  await prisma.marketingCampaign.delete({ where: { id } });
}

/** `/urunler?kampanya=` başlığı için hafif, salt-okunur kimlik bilgisi — ürün listesi ayrı sorguyla (`listProducts`) gelir. */
export async function findMarketingCampaignBasicById(
  id: string,
): Promise<{ id: string; name: string; headline: string | null } | null> {
  return prisma.marketingCampaign.findUnique({
    where: { id },
    select: { id: true, name: true, headline: true },
  });
}
