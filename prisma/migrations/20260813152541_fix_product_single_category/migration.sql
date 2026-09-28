-- Veri düzeltmesi: eski seed.ts, gerçek indirimli 6 ürünü asıl ana kategorisine
-- EK OLARAK "kampanyali-paketler" kategorisine de bağlıyordu (bkz. kaldırılan
-- CAMPAIGN_PRODUCT_IDS bloğu). Bu vitrin artık hiçbir yerde kullanılmıyor
-- (kampanyali-paketler tüm nav/showcase yüzeylerinden filtreleniyor, ayrı bir
-- rotası yok) ve gerçek "birden fazla ana kategori" ihlaline yol açıyordu.
-- Yalnızca BİRDEN FAZLA kategorisi olan ürünlerin kampanyali-paketler satırı
-- silinir — tek kategorisi kampanyali-paketler olan bir ürün YOKTUR (doğrulandı),
-- bu yüzden hiçbir ürün kategorisiz kalmaz.
DELETE FROM "ProductCategory"
WHERE "categoryId" = 'cat-kampanyali-paketler'
  AND "productId" IN (
    SELECT "productId" FROM "ProductCategory" GROUP BY "productId" HAVING COUNT(*) > 1
  );

-- Bir ürünün asla birden fazla ana kategoriye bağlanamayacağını DB seviyesinde
-- zorunlu kılar (bkz. prisma/schema.prisma ProductCategory.productId @unique).
-- CreateIndex
CREATE UNIQUE INDEX "ProductCategory_productId_key" ON "ProductCategory"("productId");
