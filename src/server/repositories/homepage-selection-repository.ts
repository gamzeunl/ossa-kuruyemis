import { prisma } from "@/server/db/prisma";

export interface HomepageSelectionFields {
  isActive: boolean;
  eyebrow: string | null;
  title: string;
  description: string | null;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string | null;
  imageAlt: string | null;
}

export interface AdminHomepageSelectionRow extends HomepageSelectionFields {
  id: string;
  productIds: string[];
}

/**
 * Tek bölüm olduğundan (bkz. şema yorumu) `findFirst` ile en eski kaydı döner —
 * DB'de hard singleton constraint yok, admin action'ı hep bu kaydı günceller.
 */
export async function getHomepageSelectionForAdmin(): Promise<AdminHomepageSelectionRow | null> {
  const row = await prisma.homepageSelection.findFirst({
    orderBy: { createdAt: "asc" },
    include: { products: { orderBy: { sortOrder: "asc" }, select: { productId: true } } },
  });
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    isActive: row.isActive,
    eyebrow: row.eyebrow,
    title: row.title,
    description: row.description,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt,
    productIds: row.products.map((p) => p.productId),
  };
}

export interface ActiveHomepageSelectionRow extends HomepageSelectionFields {
  id: string;
  productIds: string[];
}

/** Storefront için — yalnızca `isActive: true` ise ve en az 1 ürünü varsa döner, yoksa `null`. */
export async function getActiveHomepageSelection(): Promise<ActiveHomepageSelectionRow | null> {
  const row = await prisma.homepageSelection.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: { products: { orderBy: { sortOrder: "asc" }, select: { productId: true } } },
  });
  if (!row || row.products.length === 0) {
    return null;
  }
  return {
    id: row.id,
    isActive: row.isActive,
    eyebrow: row.eyebrow,
    title: row.title,
    description: row.description,
    ctaLabel: row.ctaLabel,
    ctaHref: row.ctaHref,
    imageUrl: row.imageUrl,
    imageAlt: row.imageAlt,
    productIds: row.products.map((p) => p.productId),
  };
}

/**
 * Var olan tek kaydı (varsa) günceller, yoksa oluşturur — ürün listesi TEK
 * transaction içinde `deleteMany`+`createMany` ile senkronize edilir (yarı
 * güncellenmiş bir liste asla kalıcı olmaz).
 */
export async function upsertHomepageSelection(
  fields: HomepageSelectionFields,
  productIds: string[],
): Promise<string> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.homepageSelection.findFirst({ select: { id: true } });

    const selectionId = existing
      ? (await tx.homepageSelection.update({ where: { id: existing.id }, data: fields, select: { id: true } })).id
      : (await tx.homepageSelection.create({ data: fields, select: { id: true } })).id;

    await tx.homepageSelectionProduct.deleteMany({ where: { homepageSelectionId: selectionId } });
    if (productIds.length > 0) {
      await tx.homepageSelectionProduct.createMany({
        data: productIds.map((productId, index) => ({
          homepageSelectionId: selectionId,
          productId,
          sortOrder: index,
        })),
      });
    }

    return selectionId;
  });
}
