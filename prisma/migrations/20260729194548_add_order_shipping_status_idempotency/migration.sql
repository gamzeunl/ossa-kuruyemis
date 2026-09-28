-- CreateEnum
CREATE TYPE "ShippingPriceStatus" AS ENUM ('PENDING', 'FIXED', 'FREE');

-- CreateEnum
CREATE TYPE "OrderTotalStatus" AS ENUM ('PENDING', 'FINAL');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "idempotencyKey" TEXT NOT NULL,
ADD COLUMN     "requestFingerprint" TEXT NOT NULL,
ADD COLUMN     "resultAccessToken" TEXT NOT NULL,
ADD COLUMN     "shippingPriceStatus" "ShippingPriceStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "totalStatus" "OrderTotalStatus" NOT NULL DEFAULT 'PENDING',
ALTER COLUMN "shippingTotal" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Order_resultAccessToken_key" ON "Order"("resultAccessToken");

