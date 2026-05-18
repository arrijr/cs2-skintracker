-- AlterTable: add subscription period + status tracking columns.
-- Columns "tier", "stripeCustomerId", "stripeSubscriptionId" already exist
-- in the DB (created out-of-band before Prisma tracked them) — only add
-- the truly missing columns here.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentPeriodStart" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "currentPeriodEnd" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
