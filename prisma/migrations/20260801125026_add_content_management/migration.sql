/*
  Warnings:

  - You are about to drop the column `endsAt` on the `Banner` table. All the data in the column will be lost.
  - You are about to drop the column `href` on the `Banner` table. All the data in the column will be lost.
  - You are about to drop the column `mobileImageUrl` on the `Banner` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Banner` table. All the data in the column will be lost.
  - You are about to drop the column `startsAt` on the `Banner` table. All the data in the column will be lost.
  - Added the required column `primaryButtonHref` to the `Banner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryButtonLabel` to the `Banner` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Banner` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BannerType" AS ENUM ('HERO', 'FULL_WIDTH');

-- DropIndex
DROP INDEX "Banner_isActive_position_idx";

-- AlterTable
ALTER TABLE "Banner" DROP COLUMN "endsAt",
DROP COLUMN "href",
DROP COLUMN "mobileImageUrl",
DROP COLUMN "position",
DROP COLUMN "startsAt",
ADD COLUMN     "imageAlt" TEXT,
ADD COLUMN     "primaryButtonHref" TEXT NOT NULL,
ADD COLUMN     "primaryButtonLabel" TEXT NOT NULL,
ADD COLUMN     "secondaryButtonHref" TEXT,
ADD COLUMN     "secondaryButtonLabel" TEXT,
ADD COLUMN     "subtitle" TEXT,
ADD COLUMN     "type" "BannerType" NOT NULL;

-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "imageAlt" TEXT;

-- CreateTable
CREATE TABLE "EventCard" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "buttonLabel" TEXT NOT NULL,
    "buttonHref" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventCard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventCard_isActive_sortOrder_idx" ON "EventCard"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Banner_type_isActive_sortOrder_idx" ON "Banner"("type", "isActive", "sortOrder");
