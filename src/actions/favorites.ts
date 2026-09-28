"use server";

import { betterAuthProvider } from "@/server/providers/better-auth-provider";
import { prisma } from "@/server/db/prisma";
import { addFavorite, removeFavorite } from "@/server/services/favorite-service";

export type FavoriteActionResult = { ok: true } | { ok: false; message: string };

/** `userId` her zaman sunucudaki oturumdan gelir — client'tan asla kabul edilmez. */
export async function addFavoriteAction(productId: string): Promise<FavoriteActionResult> {
  const user = await betterAuthProvider.getCurrentUser();
  if (!user) {
    return { ok: false, message: "Favorilere eklemek için giriş yapmalısınız." };
  }
  if (typeof productId !== "string" || productId.length === 0) {
    return { ok: false, message: "Geçersiz ürün." };
  }

  try {
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      return { ok: false, message: "Ürün bulunamadı." };
    }
    await addFavorite(user.id, productId);
    return { ok: true };
  } catch {
    return { ok: false, message: "İşlem tamamlanamadı. Lütfen daha sonra tekrar deneyin." };
  }
}

export async function removeFavoriteAction(productId: string): Promise<FavoriteActionResult> {
  const user = await betterAuthProvider.getCurrentUser();
  if (!user) {
    return { ok: false, message: "Bu işlem için giriş yapmalısınız." };
  }
  if (typeof productId !== "string" || productId.length === 0) {
    return { ok: false, message: "Geçersiz ürün." };
  }

  try {
    await removeFavorite(user.id, productId);
    return { ok: true };
  } catch {
    return { ok: false, message: "İşlem tamamlanamadı. Lütfen daha sonra tekrar deneyin." };
  }
}
