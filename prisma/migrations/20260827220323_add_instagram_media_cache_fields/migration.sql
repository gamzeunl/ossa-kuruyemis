-- Instagram Graph API'den çözülen gerçek medya bilgisini cache eden additive
-- alanlar. `postUrl` asıl referans olarak DEĞİŞMEDİ; mevcut satırlarda yeni
-- alanlar NULL olarak kalır (veri kaybı yok), bir sonraki admin kaydında
-- senkronize edilir.
CREATE TYPE "InstagramMediaKind" AS ENUM ('IMAGE', 'VIDEO', 'CAROUSEL_ALBUM');

ALTER TABLE "InstagramPost" ADD COLUMN "instagramMediaId" TEXT;
ALTER TABLE "InstagramPost" ADD COLUMN "mediaType" "InstagramMediaKind";
ALTER TABLE "InstagramPost" ADD COLUMN "mediaUrl" TEXT;
ALTER TABLE "InstagramPost" ADD COLUMN "thumbnailUrl" TEXT;
ALTER TABLE "InstagramPost" ADD COLUMN "captionCached" TEXT;
ALTER TABLE "InstagramPost" ADD COLUMN "publishedAt" TIMESTAMP(3);
ALTER TABLE "InstagramPost" ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
