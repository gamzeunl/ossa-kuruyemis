import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/server/db/prisma";

const publicEventCardSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  imageAlt: true,
  buttonLabel: true,
  buttonHref: true,
} satisfies Prisma.EventCardSelect;

export type PublicEventCardRow = Prisma.EventCardGetPayload<{ select: typeof publicEventCardSelect }>;

/** Aktif etkinlik kartlarını `sortOrder`'a göre ilk `limit` kadarını döner (ana sayfa: Kına/Düğün). */
export async function listActiveEventCards(limit: number): Promise<PublicEventCardRow[]> {
  return prisma.eventCard.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    take: limit,
    select: publicEventCardSelect,
  });
}

// ==================== Yönetim ====================

const adminEventCardSelect = {
  id: true,
  title: true,
  description: true,
  imageUrl: true,
  imageAlt: true,
  buttonLabel: true,
  buttonHref: true,
  isActive: true,
  sortOrder: true,
} satisfies Prisma.EventCardSelect;

export type AdminEventCardRow = Prisma.EventCardGetPayload<{ select: typeof adminEventCardSelect }>;

export async function listEventCards(): Promise<AdminEventCardRow[]> {
  return prisma.eventCard.findMany({ select: adminEventCardSelect, orderBy: { sortOrder: "asc" } });
}

export async function findEventCardById(id: string): Promise<AdminEventCardRow | null> {
  return prisma.eventCard.findUnique({ where: { id }, select: adminEventCardSelect });
}

/** Toplam etkinlik kartı sayısı (pasif dahil) — dashboard içerik/sistem durumu için "Aktif/Pasif/Eksik" ayrımı. */
export async function countEventCards(): Promise<number> {
  return prisma.eventCard.count();
}

export interface EventCardFields {
  title: string;
  description: string;
  imageUrl: string | null;
  imageAlt: string | null;
  buttonLabel: string;
  buttonHref: string;
  isActive: boolean;
  sortOrder: number;
}

export async function createEventCard(input: EventCardFields): Promise<AdminEventCardRow> {
  return prisma.eventCard.create({ data: input, select: adminEventCardSelect });
}

export async function updateEventCard(id: string, input: EventCardFields): Promise<AdminEventCardRow> {
  return prisma.eventCard.update({ where: { id }, data: input, select: adminEventCardSelect });
}

export async function deleteEventCard(id: string): Promise<void> {
  await prisma.eventCard.delete({ where: { id } });
}
