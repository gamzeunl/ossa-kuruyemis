-- DropIndex
DROP INDEX "Product_isBestSeller_idx";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "isBestSeller",
DROP COLUMN "isNew",
ADD COLUMN     "isRecommended" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newBadgeOverride" BOOLEAN;

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "compareAtPrice",
ADD COLUMN     "discountEndsAt" TIMESTAMP(3),
ADD COLUMN     "discountPrice" DECIMAL(12,2),
ADD COLUMN     "discountStartsAt" TIMESTAMP(3),
ADD COLUMN     "isDiscountActive" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "displayName" TEXT NOT NULL,
ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedById" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BlogPostProduct" (
    "blogPostId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BlogPostProduct_pkey" PRIMARY KEY ("blogPostId","productId")
);

-- CreateIndex
CREATE INDEX "Product_isRecommended_idx" ON "Product"("isRecommended");

-- CreateIndex
CREATE UNIQUE INDEX "Review_productId_userId_key" ON "Review"("productId", "userId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostProduct" ADD CONSTRAINT "BlogPostProduct_blogPostId_fkey" FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlogPostProduct" ADD CONSTRAINT "BlogPostProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

