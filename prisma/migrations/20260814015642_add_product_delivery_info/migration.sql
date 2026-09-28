-- AlterTable
-- Ürüne özgü, OPSİYONEL teslimat bilgisi override'ı. Null bırakılan (yani
-- TÜM mevcut 136 ürün) PDP'de değişiklik olmadan paylaşılan
-- `getDeliveryInformationText()` metnini göstermeye devam eder.
ALTER TABLE "Product" ADD COLUMN     "deliveryInfo" TEXT;
