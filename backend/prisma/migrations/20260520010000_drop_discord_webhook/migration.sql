-- First update any Alert rows that have 'discord' in channels to use 'in_app' instead
UPDATE "Alert" SET channels = array_replace(channels, 'discord', 'in_app') WHERE 'discord' = ANY(channels);
-- Then drop the User.discordWebhook column
ALTER TABLE "User" DROP COLUMN IF EXISTS "discordWebhook";
