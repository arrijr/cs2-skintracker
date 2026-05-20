-- Sprint 2 — SEO canonical slugs for the Skin catalog.
--
-- Adds two nullable columns + supporting indexes:
--   slug:        URL-safe canonical (e.g. "ak-47-redline-field-tested")
--                unique-where-not-null so backfill can run in a second pass.
--   weaponSlug:  pillar-page grouping (e.g. "ak-47", "awp", "karambit")
--                indexed non-unique for /skins/[weapon] queries.
--
-- Idempotent — re-running this migration is a no-op.

ALTER TABLE "Skin"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "weaponSlug" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "Skin_slug_key"
  ON "Skin"("slug")
  WHERE "slug" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "Skin_weaponSlug_idx"
  ON "Skin"("weaponSlug");
