import type { InstagramMediaKind, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

const publicInstagramPostSelect = {
  id: true,
  postUrl: true,
  caption: true,
  mediaType: true,
  mediaUrl: true,
  thumbnailUrl: true,
  captionCached: true,
} satisfies Prisma.InstagramPostSelect;

export type PublicInstagramPostRow = Prisma.InstagramPostGetPayload<{
  select: typeof publicInstagramPostSelect;
}>;

/**
 * Aktif Instagram gönderilerini `sortOrder`'a göre ilk `limit` kadarını döner
 * (ana sayfa vitrini). `mediaUrl: { not: null }` — Instagram API'den hiç
 * başarıyla senkronize OLMAMIŞ (cache boş) gönderiler storefront'ta hiç
 * gösterilmez, kırık/boş kart YOK (bkz. görev: "Cache de yoksa kartı render
 * etme").
 */
export async function listActiveInstagramPosts(limit: number): Promise<PublicInstagramPostRow[]> {
  return prisma.instagramPost.findMany({
    where: { isActive: true, mediaUrl: { not: null } },
    orderBy: { sortOrder: "asc" },
    take: limit,
    select: publicInstagramPostSelect,
  });
}

// ==================== Yönetim ====================

const adminInstagramPostSelect = {
  id: true,
  postUrl: true,
  caption: true,
  isActive: true,
  sortOrder: true,
  instagramMediaId: true,
  mediaType: true,
  mediaUrl: true,
  thumbnailUrl: true,
  captionCached: true,
  publishedAt: true,
  lastSyncedAt: true,
} satisfies Prisma.InstagramPostSelect;

export type AdminInstagramPostRow = Prisma.InstagramPostGetPayload<{ select: typeof adminInstagramPostSelect }>;

export async function listInstagramPostsForAdmin(): Promise<AdminInstagramPostRow[]> {
  return prisma.instagramPost.findMany({ select: adminInstagramPostSelect, orderBy: { sortOrder: "asc" } });
}

export async function findInstagramPostById(id: string): Promise<AdminInstagramPostRow | null> {
  return prisma.instagramPost.findUnique({ where: { id }, select: adminInstagramPostSelect });
}

export interface InstagramPostFields {
  postUrl: string;
  caption: string | null;
  isActive: boolean;
  sortOrder: number;
  instagramMediaId: string | null;
  mediaType: InstagramMediaKind | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  captionCached: string | null;
  publishedAt: Date | null;
  lastSyncedAt: Date | null;
}

export async function createInstagramPost(input: InstagramPostFields): Promise<AdminInstagramPostRow> {
  return prisma.instagramPost.create({ data: input, select: adminInstagramPostSelect });
}

export async function updateInstagramPost(
  id: string,
  input: InstagramPostFields,
): Promise<AdminInstagramPostRow> {
  return prisma.instagramPost.update({ where: { id }, data: input, select: adminInstagramPostSelect });
}

export async function deleteInstagramPost(id: string): Promise<void> {
  await prisma.instagramPost.delete({ where: { id } });
}
