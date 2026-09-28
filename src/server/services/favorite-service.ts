import {
  addFavorite,
  listFavoritedProductIdSet,
  listFavoriteProductIds,
  removeFavorite,
} from "@/server/repositories/favorite-repository";
import { getProductSummariesByIds } from "@/server/services/catalog-service";
import type { ProductSummary } from "@/types/catalog";

export { addFavorite, listFavoritedProductIdSet, removeFavorite };

/**
 * Kullanıcının favorilediği ürünleri `ProductListCard`'ın kullandığı
 * `ProductSummary` şeklinde döner — mevcut `getProductSummariesByIds`
 * (fiyat/rozet çözümlemesini zaten yapan TEK boru hattı) yeniden kullanılır.
 * `getProductSummariesByIds` giriş sırasını garanti etmediğinden, sonuç
 * favorileme sırasına (en yeni önce) göre burada yeniden sıralanır.
 */
export async function getUserFavoriteProducts(userId: string): Promise<ProductSummary[]> {
  const orderedIds = await listFavoriteProductIds(userId);
  if (orderedIds.length === 0) {
    return [];
  }
  const summaries = await getProductSummariesByIds(orderedIds);
  const positionById = new Map(orderedIds.map((id, index) => [id, index]));
  return [...summaries].sort(
    (a, b) => (positionById.get(a.id) ?? 0) - (positionById.get(b.id) ?? 0),
  );
}
