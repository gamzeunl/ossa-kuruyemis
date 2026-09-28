-- CreateTable
CREATE TABLE "BundleOffer" (
    "id" TEXT NOT NULL,
    "primaryProductId" TEXT NOT NULL,
    "primaryVariantId" TEXT NOT NULL,
    "companionProductId" TEXT NOT NULL,
    "companionVariantId" TEXT NOT NULL,
    "companionPrice" DECIMAL(12,2) NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BundleOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BundleOffer_primaryVariantId_isActive_idx" ON "BundleOffer"("primaryVariantId", "isActive");

-- CreateIndex
CREATE INDEX "BundleOffer_companionVariantId_isActive_idx" ON "BundleOffer"("companionVariantId", "isActive");

-- AddForeignKey
ALTER TABLE "BundleOffer" ADD CONSTRAINT "BundleOffer_primaryProductId_fkey" FOREIGN KEY ("primaryProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleOffer" ADD CONSTRAINT "BundleOffer_primaryVariantId_fkey" FOREIGN KEY ("primaryVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleOffer" ADD CONSTRAINT "BundleOffer_companionProductId_fkey" FOREIGN KEY ("companionProductId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BundleOffer" ADD CONSTRAINT "BundleOffer_companionVariantId_fkey" FOREIGN KEY ("companionVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
