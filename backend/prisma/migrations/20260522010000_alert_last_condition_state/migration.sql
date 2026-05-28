-- Alert.lastConditionState: tracks whether the last evaluator run returned
-- triggered=true. The engine only fires on a false→true transition, so a price
-- parked above the threshold no longer re-fires every cooldown window.
--
-- Cooldown still applies on top of edge-trigger (defense-in-depth: rapid
-- oscillation around the threshold can't spam either).
--
-- NULL = never evaluated (treat as false for the first fire).
--
-- NOTE: this migration was applied to the live Supabase DB on 2026-05-22 before
-- the working tree was wiped by a concurrent worktree push. SQL file is being
-- reconstructed here so the local migrations directory stays in sync with the
-- _prisma_migrations ledger. Re-running is a no-op (`ADD COLUMN IF NOT EXISTS`).

ALTER TABLE "Alert" ADD COLUMN IF NOT EXISTS "lastConditionState" BOOLEAN;
