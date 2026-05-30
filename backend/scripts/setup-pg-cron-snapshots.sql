-- setup-pg-cron-snapshots.sql — [Backend / DB ops]
-- Idempotent setup of the daily price-history snapshot jobs that run ENTIRELY
-- inside Postgres via pg_cron. Replaces the Render/Inngest dailySkin/CasePriceHistory
-- crons which never ran reliably (Render free-tier service spin-down).
--
-- Applied to prod 2026-05-30 via the Supabase MCP. Kept here for reproducibility
-- if the database is ever rebuilt. See docs/sessions/2026-05-30-price-pipeline-fix.md.
--
-- Run: paste into Supabase SQL editor, or via MCP execute_sql.
-- Safe to re-run — unschedules existing jobs of the same name first.

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Drop prior versions so re-running doesn't error on duplicate job names.
SELECT cron.unschedule('daily-skin-price-snapshot')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-skin-price-snapshot');
SELECT cron.unschedule('daily-case-price-snapshot')
  WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-case-price-snapshot');

-- Skin snapshot: copy current priceLatest -> PriceHistory once per day, 06:30 UTC.
-- NOTE: this only records whatever priceLatest currently holds. A fresh-price
-- source (GitHub Actions price-refresh, see scheduled-price-refresh.yml) must keep
-- priceLatest current or the chart shows a flat line.
SELECT cron.schedule(
  'daily-skin-price-snapshot',
  '30 6 * * *',
  $$INSERT INTO "PriceHistory" ("skinId", "date", "price")
    SELECT id, CURRENT_DATE, "priceLatest"
    FROM "Skin"
    WHERE "priceLatest" IS NOT NULL AND "priceLatest" > 0
    ON CONFLICT ("skinId", "date") DO UPDATE SET "price" = EXCLUDED."price"$$
);

-- Case snapshot: copy Case.price -> CasePriceHistory once per day, 06:35 UTC.
SELECT cron.schedule(
  'daily-case-price-snapshot',
  '35 6 * * *',
  $$INSERT INTO "CasePriceHistory" ("caseId", "date", "price", "createdAt", "updatedAt")
    SELECT id, CURRENT_DATE, "price", NOW(), NOW()
    FROM "Case"
    WHERE "price" IS NOT NULL AND "price" > 0
    ON CONFLICT ("caseId", "date") DO UPDATE SET "price" = EXCLUDED."price", "updatedAt" = NOW()$$
);

-- Verify
SELECT jobid, schedule, jobname, active FROM cron.job ORDER BY jobid;
