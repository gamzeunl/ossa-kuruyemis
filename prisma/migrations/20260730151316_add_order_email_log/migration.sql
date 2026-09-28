-- CreateEnum
CREATE TYPE "OrderEmailType" AS ENUM ('ORDER_RECEIVED', 'STATUS_CONFIRMED', 'STATUS_PROCESSING', 'STATUS_SHIPPED', 'STATUS_DELIVERED', 'STATUS_CANCELLED');

-- CreateEnum
CREATE TYPE "EmailSendStatus" AS ENUM ('SENT', 'FAILED');

-- CreateTable
CREATE TABLE "OrderEmailLog" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "type" "OrderEmailType" NOT NULL,
    "status" "EmailSendStatus" NOT NULL,
    "recipient" TEXT NOT NULL,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderEmailLog_orderId_type_createdAt_idx" ON "OrderEmailLog"("orderId", "type", "createdAt");

-- AddForeignKey
ALTER TABLE "OrderEmailLog" ADD CONSTRAINT "OrderEmailLog_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
