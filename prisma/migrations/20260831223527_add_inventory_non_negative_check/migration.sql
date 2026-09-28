-- Negatif stok oluşmasına ASLA izin verilmez — uygulama katmanı zaten bunu
-- engeller, bu CHECK constraint son bir savunma katmanıdır (defense-in-depth).
-- Additive/güvenli: mevcut veride ihlal YOKTUR (varsayılan 0, hiçbir kod yolu
-- bugüne kadar negatif yazmadı).
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_quantityAvailable_non_negative" CHECK ("quantityAvailable" >= 0);
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_quantityReserved_non_negative" CHECK ("quantityReserved" >= 0);
