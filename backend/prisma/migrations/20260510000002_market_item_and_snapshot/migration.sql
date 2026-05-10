-- MarketItem
CREATE TABLE "MarketItem" (
  "id"             SERIAL PRIMARY KEY,
  "category"       TEXT NOT NULL,
  "externalId"     TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "marketHashName" TEXT NOT NULL UNIQUE,
  "imageUrl"       TEXT,
  "rarity"         TEXT,
  "collection"     TEXT,
  "metadata"       JSONB,
  "priceLatest"    DOUBLE PRECISION,
  "priceMedian"    DOUBLE PRECISION,
  "volume24h"      INTEGER,
  "priceUpdatedAt" TIMESTAMP(3),
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "consecutive404" INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL
);
CREATE INDEX "MarketItem_category_isActive_idx" ON "MarketItem"("category", "isActive");
CREATE INDEX "MarketItem_marketHashName_idx" ON "MarketItem"("marketHashName");

-- Generalize MarketSnapshot
ALTER TABLE "MarketSnapshot" ADD COLUMN IF NOT EXISTS "itemType"     TEXT NOT NULL DEFAULT 'skin';
ALTER TABLE "MarketSnapshot" ADD COLUMN IF NOT EXISTS "marketItemId" INTEGER;
ALTER TABLE "MarketSnapshot" ADD COLUMN IF NOT EXISTS "caseId"       INTEGER;
ALTER TABLE "MarketSnapshot" ALTER COLUMN "skinId" DROP NOT NULL;

ALTER TABLE "MarketSnapshot" ADD CONSTRAINT "MarketSnapshot_marketItemId_fkey"
  FOREIGN KEY ("marketItemId") REFERENCES "MarketItem"("id") ON DELETE CASCADE;
ALTER TABLE "MarketSnapshot" ADD CONSTRAINT "MarketSnapshot_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE;

ALTER TABLE "MarketSnapshot" DROP CONSTRAINT IF EXISTS "MarketSnapshot_skinId_date_key";

CREATE INDEX IF NOT EXISTS "MarketSnapshot_itemType_date_idx" ON "MarketSnapshot"("itemType", "date");
CREATE INDEX IF NOT EXISTS "MarketSnapshot_marketItemId_date_idx" ON "MarketSnapshot"("marketItemId", "date");
