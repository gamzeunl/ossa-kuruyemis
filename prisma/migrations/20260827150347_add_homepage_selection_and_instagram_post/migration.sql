-- CreateEnum
CREATE TYPE "InstagramPostMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "HomepageSelection" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "ctaLabel" TEXT NOT NULL,
    "ctaHref" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomepageSelection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HomepageSelectionProduct" (
    "id" TEXT NOT NULL,
    "homepageSelectionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "HomepageSelectionProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstagramPost" (
    "id" TEXT NOT NULL,
    "mediaType" "InstagramPostMediaType" NOT NULL DEFAULT 'IMAGE',
    "imageUrl" TEXT NOT NULL,
    "imageAlt" TEXT,
    "postUrl" TEXT NOT NULL,
    "caption" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstagramPost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HomepageSelectionProduct_homepageSelectionId_sortOrder_idx" ON "HomepageSelectionProduct"("homepageSelectionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "HomepageSelectionProduct_homepageSelectionId_productId_key" ON "HomepageSelectionProduct"("homepageSelectionId", "productId");

-- CreateIndex
CREATE INDEX "InstagramPost_isActive_sortOrder_idx" ON "InstagramPost"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "HomepageSelectionProduct" ADD CONSTRAINT "HomepageSelectionProduct_homepageSelectionId_fkey" FOREIGN KEY ("homepageSelectionId") REFERENCES "HomepageSelection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HomepageSelectionProduct" ADD CONSTRAINT "HomepageSelectionProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
