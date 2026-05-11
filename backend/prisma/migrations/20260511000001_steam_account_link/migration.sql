ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "steamId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "steamConnectedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "User_steamId_key" ON "User"("steamId");

ALTER TABLE "Portfolio" ADD COLUMN IF NOT EXISTS "importedFromSteamAt" TIMESTAMP(3);
ALTER TABLE "Portfolio" ADD COLUMN IF NOT EXISTS "removedFromSteamAt"  TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Portfolio_userId_importedFromSteamAt_idx" ON "Portfolio"("userId", "importedFromSteamAt");
