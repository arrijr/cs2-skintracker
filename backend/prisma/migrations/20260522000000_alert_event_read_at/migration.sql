-- AlertEvent: track per-event read state for the in-app bell.
-- Before: notificationsRoutes.GET hardcoded `read: false`, mark-all-read was a no-op stub.
-- After: GET returns real read state, mark-all-read writes `readAt = now()` for the user's events.
--
-- NOTE: this migration was applied to the live Supabase DB on 2026-05-22 before
-- the working tree was wiped by a concurrent worktree push. SQL file is being
-- reconstructed here so the local migrations directory stays in sync with the
-- _prisma_migrations ledger. Re-running is a no-op (`ADD COLUMN IF NOT EXISTS`).

ALTER TABLE "AlertEvent" ADD COLUMN IF NOT EXISTS "readAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "AlertEvent_alertId_readAt_idx" ON "AlertEvent"("alertId", "readAt");
