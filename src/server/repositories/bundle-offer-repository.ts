import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

/**
 * PDP, ana sayfa keşif kartı ve admin listesi HEPSİ bu aynı, tam JOIN'li
 * şekli kullanır — nihai geçerlilik kararı (tarih/fiyat) her zaman
 * `resolveBundleCompanionPrice`'a (servis katmanında) bırakılır, burada
 * yalnızca veri toplanır.
 */
const bundleOfferDetailSelect = {
  id: true,
  companionPrice: true,
  startsAt: true,
  endsAt: true,
  isActive: true,
  sortOrder: true,
  primaryProduct: {
    select: {
      id: true,
      name: true,
      slug: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true, altText: true, isPrimary: true } },
    },
  },
  primaryVariant: { select: { id: true, name: true, weightGram: true } },
  companionProduct: {
    select: {
      id: true,
      name: true,
      slug: true,
      images: { where: { isPrimary: true }, take: 1, select: { url: true, altText: true, isPrimary: true } },
    },
  },
  companionVariant: {
    select: {
      id: true,
      name: true,
      weightGram: true,
      price: true,
      discountPrice: true,
      discountStartsAt: true,
      discountEndsAt: true,
      isDiscountActive: true,
    },
  },
} satisfies Prisma.BundleOfferSelect;

export type BundleOfferDetailRow = Prisma.BundleOfferGetPayload<{ select: typeof bundleOfferDetailSelect }>;

/** Bir ürün detay sayfasında gösterilecek adaylar — bu ürünün varyantlarından biri ANA (primary) olan aktif kampanyalar. */
export async function listActiveBundleOffersForVariants(variantIds: string[]): Promise<BundleOfferDetailRow[]> {
  if (variantIds.length === 0) {
    return [];
  }
  return prisma.bundleOffer.findMany({
    where: { isActive: true, primaryVariantId: { in: variantIds } },
    select: bundleOfferDetailSelect,
    orderBy: { sortOrder: "asc" },
  });
}

/** Ana sayfa "Birlikte Daha Güzel" keşif kartları için aday havuzu — nihai geçerlilik yine servis katmanında süzülür, bu yüzden `limit`'in birkaç katı çekilir. */
export async function listActiveBundleOfferCandidatesForHomepage(limit: number): Promise<BundleOfferDetailRow[]> {
  return prisma.bundleOffer.findMany({
    where: { isActive: true },
    select: bundleOfferDetailSelect,
    orderBy: { sortOrder: "asc" },
    take: limit * 3,
  });
}

// ==================== Yönetim ====================

/** Tüm kayıtlar (pasif/süresi dolmuş dahil) — yönetim listesi. */
export async function listBundleOffersForAdmin(): Promise<BundleOfferDetailRow[]> {
  return prisma.bundleOffer.findMany({
    select: bundleOfferDetailSelect,
    orderBy: { sortOrder: "asc" },
  });
}

export async function findBundleOfferForAdmin(id: string): Promise<BundleOfferDetailRow | null> {
  return prisma.bundleOffer.findUnique({ where: { id }, select: bundleOfferDetailSelect });
}

export interface BundleOfferFields {
  primaryProductId: string;
  primaryVariantId: string;
  companionProductId: string;
  companionVariantId: string;
  companionPrice: Prisma.Decimal;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
  sortOrder: number;
}

export async function createBundleOffer(fields: BundleOfferFields): Promise<{ id: string }> {
  return prisma.bundleOffer.create({ data: fields, select: { id: true } });
}

export async function updateBundleOffer(id: string, fields: BundleOfferFields): Promise<void> {
  await prisma.bundleOffer.update({ where: { id }, data: fields });
}

export async function deleteBundleOffer(id: string): Promise<void> {
  await prisma.bundleOffer.delete({ where: { id } });
}
