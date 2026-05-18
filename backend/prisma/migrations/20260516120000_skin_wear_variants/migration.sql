-- Wear variants: every base skin will spawn one variant row per wear (Factory New, Minimal Wear, Field-Tested, Well-Worn, Battle-Scarred).
-- variantOf is a loose Int reference to Skin.id (no FK to keep migrations simple and decouple cleanup).
ALTER TABLE "Skin" ADD COLUMN IF NOT EXISTS "variantOf" INTEGER;
CREATE INDEX IF NOT EXISTS "Skin_variantOf_idx" ON "Skin"("variantOf");
