-- CreateEnum
CREATE TYPE "MarketingCampaignType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY');

-- CreateTable
CREATE TABLE "MarketingCampaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "MarketingCampaignType" NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT true,
    "showPopup" BOOLEAN NOT NULL DEFAULT false,
    "headline" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketingCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketingCampaignProduct" (
    "campaignId" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MarketingCampaignProduct_pkey" PRIMARY KEY ("campaignId","variantId")
);

-- CreateIndex
CREATE INDEX "MarketingCampaign_isActive_startsAt_endsAt_idx" ON "MarketingCampaign"("isActive", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "MarketingCampaignProduct_variantId_idx" ON "MarketingCampaignProduct"("variantId");

-- AddForeignKey
ALTER TABLE "MarketingCampaignProduct" ADD CONSTRAINT "MarketingCampaignProduct_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "MarketingCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketingCampaignProduct" ADD CONSTRAINT "MarketingCampaignProduct_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
