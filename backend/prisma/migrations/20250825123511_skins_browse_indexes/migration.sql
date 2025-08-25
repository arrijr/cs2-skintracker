-- CreateIndex
CREATE INDEX "PriceHistory_skinId_date_idx" ON "PriceHistory"("skinId", "date");

-- CreateIndex
CREATE INDEX "Skin_rarity_idx" ON "Skin"("rarity");

-- CreateIndex
CREATE INDEX "Skin_wear_idx" ON "Skin"("wear");

-- CreateIndex
CREATE INDEX "Skin_priceAvg_idx" ON "Skin"("priceAvg");
