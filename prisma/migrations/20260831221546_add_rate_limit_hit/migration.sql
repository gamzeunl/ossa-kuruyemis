-- Production-safe (multi-instance/serverless) rate limiting — sabit pencere
-- sayacı, Postgres üzerinde (bkz. rate-limit-provider.ts). Additive, yeni tablo.
CREATE TABLE "RateLimitHit" (
    "id" TEXT NOT NULL,
    "bucketKey" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RateLimitHit_bucketKey_windowStart_key" ON "RateLimitHit"("bucketKey", "windowStart");

CREATE INDEX "RateLimitHit_windowStart_idx" ON "RateLimitHit"("windowStart");
