import { violatesUniqueConstraintOn } from "@/lib/prisma-errors";
import { prisma } from "@/server/db/prisma";

/**
 * Kullanıcının aynı ürünü iki kez favorilememesi `@@unique([userId, productId])`
 * ile DB seviyesinde garanti edilir. Yarış durumunda (çift tıklama) P2002
 * sessizce yutulur — favori zaten var demektir, hata değildir (idempotent add).
 */
export async function addFavorite(userId: string, productId: string): Promise<void> {
  try {
    await prisma.favorite.create({ data: { userId, productId } });
  } catch (error) {
    if (violatesUniqueConstraintOn(error, "productId")) {
      return;
    }
    throw error;
  }
}

/** Sorgu zaten `userId` ile sınırlı — başka kullanıcının favorisi asla hedeflenemez. */
export async function removeFavorite(userId: string, productId: string): Promise<void> {
  await prisma.favorite.deleteMany({ where: { userId, productId } });
}

/** `/hesabim/favoriler` için — en son favorilenen en üstte. */
export async function listFavoriteProductIds(userId: string): Promise<string[]> {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { productId: true },
  });
  return rows.map((row) => row.productId);
}

/** "Kampanyalar & Keşif" hub'ında gösterilen gerçek toplam favorileme sayısı. */
export async function countAllFavorites(): Promise<number> {
  return prisma.favorite.count();
}

/**
 * "Müşterilerin Favorileri" admin analitik ekranı için gerçek favori
 * sayısına göre (azalan) ürün id'leri + sayıları — `order-repository.ts`'teki
 * `listBestSellingProductIds`'in `groupBy` deseniyle birebir aynı, salt-okunur,
 * `Favorite` tablosunu hiç değiştirmez. Sahte minimum eşik YOKTUR.
 */
export async function listMostFavoritedProductIds(
  limit: number,
): Promise<{ productId: string; favoriteCount: number }[]> {
  const grouped = await prisma.favorite.groupBy({
    by: ["productId"],
    _count: { productId: true },
    orderBy: { _count: { productId: "desc" } },
    take: limit,
  });
  return grouped.map((entry) => ({ productId: entry.productId, favoriteCount: entry._count.productId }));
}

/**
 * Bir ürün listesindeki hangi ürünlerin bu kullanıcı tarafından favorilendiğini
 * TEK sorguda döner — ürün kartı başına ayrı sorgu YOK (bkz. görev: N+1 yasağı).
 */
export async function listFavoritedProductIdSet(
  userId: string,
  productIds: readonly string[],
): Promise<Set<string>> {
  if (productIds.length === 0) {
    return new Set();
  }
  const rows = await prisma.favorite.findMany({
    where: { userId, productId: { in: [...productIds] } },
    select: { productId: true },
  });
  return new Set(rows.map((row) => row.productId));
}
