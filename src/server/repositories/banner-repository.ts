import { BannerType, type Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

const publicBannerSelect = {
  id: true,
  title: true,
  subtitle: true,
  imageUrl: true,
  imageAlt: true,
  primaryButtonLabel: true,
  primaryButtonHref: true,
  secondaryButtonLabel: true,
  secondaryButtonHref: true,
} satisfies Prisma.BannerSelect;

export type PublicBannerRow = Prisma.BannerGetPayload<{ select: typeof publicBannerSelect }>;

/** Belirli tipteki en düşük `sortOrder`'a sahip aktif banner'ı döner; hiç yoksa `null`. */
export async function findActiveBannerByType(type: BannerType): Promise<PublicBannerRow | null> {
  return prisma.banner.findFirst({
    where: { type, isActive: true },
    orderBy: { sortOrder: "asc" },
    select: publicBannerSelect,
  });
}

/** Belirli tipteki aktif banner'ları `sortOrder`'a göre ilk `limit` kadarı — Hero slider gibi çoklu-slayt kullanımları için. */
export async function listActiveBannersByType(type: BannerType, limit: number): Promise<PublicBannerRow[]> {
  return prisma.banner.findMany({
    where: { type, isActive: true },
    orderBy: { sortOrder: "asc" },
    take: limit,
    select: publicBannerSelect,
  });
}

// ==================== Yönetim ====================

const adminBannerSelect = {
  id: true,
  type: true,
  title: true,
  subtitle: true,
  imageUrl: true,
  imageAlt: true,
  primaryButtonLabel: true,
  primaryButtonHref: true,
  secondaryButtonLabel: true,
  secondaryButtonHref: true,
  isActive: true,
  sortOrder: true,
} satisfies Prisma.BannerSelect;

export type AdminBannerRow = Prisma.BannerGetPayload<{ select: typeof adminBannerSelect }>;

/** Belirli tipteki tüm banner'lar (pasif dahil), yönetim listesi için `sortOrder`'a göre. */
export async function listBannersByType(type: BannerType): Promise<AdminBannerRow[]> {
  return prisma.banner.findMany({ where: { type }, select: adminBannerSelect, orderBy: { sortOrder: "asc" } });
}

export async function findBannerById(id: string): Promise<AdminBannerRow | null> {
  return prisma.banner.findUnique({ where: { id }, select: adminBannerSelect });
}

/** Belirli tipteki toplam banner sayısı (pasif dahil) — dashboard içerik/sistem durumu için "Aktif/Pasif/Eksik" ayrımı. */
export async function countBannersByType(type: BannerType): Promise<number> {
  return prisma.banner.count({ where: { type } });
}

export interface BannerFields {
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imageAlt: string | null;
  primaryButtonLabel: string;
  primaryButtonHref: string;
  secondaryButtonLabel: string | null;
  secondaryButtonHref: string | null;
  isActive: boolean;
  sortOrder: number;
}

export async function createBanner(type: BannerType, input: BannerFields): Promise<AdminBannerRow> {
  return prisma.banner.create({ data: { type, ...input }, select: adminBannerSelect });
}

export async function updateBanner(id: string, input: BannerFields): Promise<AdminBannerRow> {
  return prisma.banner.update({ where: { id }, data: input, select: adminBannerSelect });
}

export async function deleteBanner(id: string): Promise<void> {
  await prisma.banner.delete({ where: { id } });
}
