-- Align nullability with current schema
ALTER TABLE "MarketSnapshot" ALTER COLUMN "activeListings" DROP NOT NULL;

-- priceUsd: schema says NOT NULL. If existing rows have null priceUsd, this will fail.
-- Backfill nulls to 0 first as a defensive measure (snapshots without price are not useful).
UPDATE "MarketSnapshot" SET "priceUsd" = 0 WHERE "priceUsd" IS NULL;
ALTER TABLE "MarketSnapshot" ALTER COLUMN "priceUsd" SET NOT NULL;

-- Add missing case index
CREATE INDEX IF NOT EXISTS "MarketSnapshot_caseId_date_idx" ON "MarketSnapshot"("caseId", "date");

-- Partial unique constraints per item type (preserve idempotent upsert semantics)
CREATE UNIQUE INDEX IF NOT EXISTS "MarketSnapshot_skin_day_unique"
  ON "MarketSnapshot"("skinId", "date") WHERE "itemType" = 'skin';
CREATE UNIQUE INDEX IF NOT EXISTS "MarketSnapshot_case_day_unique"
  ON "MarketSnapshot"("caseId", "date") WHERE "itemType" = 'case';
CREATE UNIQUE INDEX IF NOT EXISTS "MarketSnapshot_market_item_day_unique"
  ON "MarketSnapshot"("marketItemId", "date") WHERE "itemType" = 'market_item';
