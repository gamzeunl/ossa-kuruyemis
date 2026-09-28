-- İş kararı: Instagram medyası artık OSSA sunucusuna hiç yüklenmiyor; tek veri
-- kaynağı `postUrl` (bkz. InstagramEmbedCard, resmi Instagram embed.js).
-- `mediaType`/`mediaUrl`/`imageAlt` bu yüzden gereksiz. Bu DROP, migration
-- öncesi doğrulandı: `InstagramPost` tablosunda GERÇEK/production veri yoktu
-- (0 satır) — veri kaybı riski yok.
ALTER TABLE "InstagramPost" DROP COLUMN "mediaType";
ALTER TABLE "InstagramPost" DROP COLUMN "mediaUrl";
ALTER TABLE "InstagramPost" DROP COLUMN "imageAlt";
DROP TYPE "InstagramPostMediaType";
