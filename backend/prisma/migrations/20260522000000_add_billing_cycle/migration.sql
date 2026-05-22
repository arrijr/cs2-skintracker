-- AlterTable: add billingCycle column to persist Stripe billing cycle
-- (monthly | annual) from checkout metadata. Surfaced in /subscriptions/status
-- so BillingTab can display the renewal cycle. Nullable because free-tier
-- users and pre-existing rows don't have one.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "billingCycle" TEXT;
