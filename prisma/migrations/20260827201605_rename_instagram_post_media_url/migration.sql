-- Semantik düzeltme: `imageUrl` yalnızca IMAGE gönderiler için anlamlıydı; VIDEO
-- gönderiler için de aynı alan gerçek video URL'sini tutacak. Mevcut IMAGE
-- kayıtlarının verisini KORUYAN bir RENAME (DROP+ADD değil) — geriye dönük
-- uyumluluk bozulmaz.
ALTER TABLE "InstagramPost" RENAME COLUMN "imageUrl" TO "mediaUrl";
