-- CreateEnum
CREATE TYPE "ContactRequestType" AS ENUM ('GENERAL_INFO', 'HENNA_SNACKS', 'WEDDING_SNACKS', 'ENGAGEMENT_INVITATION', 'CORPORATE_BULK_ORDER', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactRequestStatus" AS ENUM ('NEW', 'REVIEWED', 'CLOSED');

-- CreateTable
CREATE TABLE "ContactRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "requestType" "ContactRequestType" NOT NULL,
    "eventDate" TIMESTAMP(3),
    "estimatedGuestCount" INTEGER,
    "message" TEXT NOT NULL,
    "status" "ContactRequestStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactRequest_status_idx" ON "ContactRequest"("status");

-- CreateIndex
CREATE INDEX "ContactRequest_createdAt_idx" ON "ContactRequest"("createdAt");
