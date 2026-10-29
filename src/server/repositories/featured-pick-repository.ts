import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

/**
 * Aktif VE tarih aralığında olan (süresi dolmamış, henüz başlamamış olanlar
 * hariç) kayıtları `sortOrder`'a göre döner. Süresi dolan bir kayıt cron/temizlik
 * GEREKTİRMEDEN, okuma anındaki bu tarih filtresi sayesinde otomatik düşer.
 */
export async function listActivePicksForDisplay(limit: number): Promise<{ productId: string }[]> {
  const now = new Date();
  return prisma.featuredProductPick.findMany({
    where: {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { sortOrder: "asc" },
    take: limit,
    select: { productId: true },
  });
}

// ==================== Yönetim ====================

const adminFeaturedPickSelect = {
  id: true,
  productId: true,
  sortOrder: true,
  startsAt: true,
  endsAt: true,
  isActive: true,
  createdAt: true,
  product: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.FeaturedProductPickSelect;

export type AdminFeaturedPickRow = Prisma.FeaturedProductPickGetPayload<{
  select: typeof adminFeaturedPickSelect;
}>;

/** Tüm kayıtlar (pasif/süresi dolmuş dahil) — yönetim listesi. */
export async function listPicksForAdmin(): Promise<AdminFeaturedPickRow[]> {
  return prisma.featuredProductPick.findMany({
    select: adminFeaturedPickSelect,
    orderBy: { sortOrder: "asc" },
  });
}

export async function findFeaturedPickById(id: string): Promise<AdminFeaturedPickRow | null> {
  return prisma.featuredProductPick.findUnique({ where: { id }, select: adminFeaturedPickSelect });
}


export interface FeaturedPickFields {
  productId: string;
  sortOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  isActive: boolean;
}


export async function createFeaturedPick(input: FeaturedPickFields): Promise<AdminFeaturedPickRow> {
  return prisma.featuredProductPick.create({ data: input, select: adminFeaturedPickSelect });
}

export async function updateFeaturedPick(id: string, input: FeaturedPickFields): Promise<AdminFeaturedPickRow> {
  return prisma.featuredProductPick.update({ where: { id }, data: input, select: adminFeaturedPickSelect });
}

export async function deleteFeaturedPick(id: string): Promise<void> {
  await prisma.featuredProductPick.delete({ where: { id } });
}

/** Dashboard/"Kampanyalar & Keşif" hub'ı için gerçek aktif kayıt sayısı. */
export async function countActiveFeaturedPicks(): Promise<number> {
  return prisma.featuredProductPick.count({ where: { isActive: true } });
}
