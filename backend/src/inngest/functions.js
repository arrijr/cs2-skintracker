// All Inngest function definitions.
// Each function wraps an existing job from services/. The wrapper handles:
//   - Cron / event triggers
//   - Step-based execution (each step is an atomic durable unit)
//   - Automatic retries on transient errors
//
// To register a new function: add it to the exports at the bottom; it'll be picked up
// by /api/inngest endpoint automatically.

import { inngest } from './client.js';
import logger from '../utils/logger.js';
import prisma from '../prisma/prismaClient.js';
import { runCatalogSync } from '../services/catalog/catalogSyncJob.js';
import { refreshItemPrice } from '../services/pricing/priceRefreshJob.js';

/* ───────────────────────────── CATALOG SYNC ───────────────────────────── */
// Pulls 9 bymykel categories. Runs in one shot (~5 min). Single step.
export const catalogSync = inngest.createFunction(
  {
    id: 'catalog-sync',
    name: 'Catalog Sync (bymykel)',
    retries: 3,
    // Daily at 02:30 UTC. Also runnable on-demand via inngest.send('catalog-sync/manual').
    triggers: [{ cron: '30 2 * * *' }, { event: 'catalog-sync/manual' }],
  },
  async ({ step, logger: l }) => {
    return await step.run('sync-all-categories', async () => {
      l.info('Catalog sync starting');
      const summary = await runCatalogSync();
      l.info('Catalog sync complete', { summary });
      return summary;
    });
  }
);

/* ───────────────────────────── PRICE REFRESH ───────────────────────────── */
// Refreshes prices for ALL items via Steam Market scrape. Chunked into ~50-item steps
// so each step completes well under the 60s Vercel function limit.
//
// Strategy: load full id list once, then for each chunk run refreshItemPrice with
// 3s spacing (still polite to Steam). Inngest persists state between steps; if a step
// fails (rate-limit, network), it retries automatically.
const PRICE_CHUNK_SIZE = 50; // ~50 items × 3s = ~2.5 min per step (fits 60s? No — use 8)
// Render free plan ~100s request timeout. Worst case per item ≈ 5s (3s spacing + fetch + retry).
// 8 × 5s = 40s per step, comfortably under 100s even with a 429 Retry-After mid-chunk.
const PRICE_ITEMS_PER_STEP = 8;
const PRICE_SPACING_MS = 3000;

export const priceRefresh = inngest.createFunction(
  {
    id: 'price-refresh',
    name: 'Steam Market Price Refresh',
    retries: 2,
    concurrency: { limit: 1 }, // never run two refreshes in parallel
    // 4× daily at 6h intervals (matches our old GHA cron cadence).
    // 03:30 / 09:30 / 15:30 / 21:30 UTC.
    triggers: [{ cron: '30 3,9,15,21 * * *' }, { event: 'price-refresh/manual' }],
  },
  async ({ step, event, logger: l }) => {
    // Optional event payload: { skinsOnly: true, maxItems: 500 }
    const skinsOnly = event?.data?.skinsOnly ?? false;
    const maxItems = event?.data?.maxItems ?? null;

    // Step 1: load id list (durable — re-runs of later steps reuse this snapshot)
    // Skip items refreshed in the last 4h so retries / overlapping crons don't redo fresh work.
    // Skin + MarketItem use `priceUpdatedAt`; Case uses `lastUpdated`.
    const items = await step.run('load-item-list', async () => {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
      const skins = await prisma.skin.findMany({
        where: {
          OR: [{ priceUpdatedAt: null }, { priceUpdatedAt: { lt: fourHoursAgo } }],
        },
        select: { id: true, marketHashName: true },
      });
      const all = skins.map((s) => ({ ...s, itemType: 'skin' }));
      if (!skinsOnly) {
        const cases = await prisma.case.findMany({
          where: {
            OR: [{ lastUpdated: null }, { lastUpdated: { lt: fourHoursAgo } }],
          },
          select: { id: true, name: true },
        });
        const marketItems = await prisma.marketItem.findMany({
          where: {
            isActive: true,
            OR: [{ priceUpdatedAt: null }, { priceUpdatedAt: { lt: fourHoursAgo } }],
          },
          select: { id: true, marketHashName: true, consecutive404: true },
        });
        all.push(
          ...cases.map((c) => ({ id: c.id, marketHashName: c.name, itemType: 'case' })),
          ...marketItems.map((m) => ({ ...m, itemType: 'market_item' }))
        );
      }
      return maxItems != null ? all.slice(0, maxItems) : all;
    });

    l.info('Price refresh: loaded items', { total: items.length });

    // Step 2..N: chunked refresh
    let ok = 0;
    let miss = 0;
    let rateLimited = 0;
    const totalChunks = Math.ceil(items.length / PRICE_ITEMS_PER_STEP);

    for (let c = 0; c < totalChunks; c++) {
      const chunk = items.slice(c * PRICE_ITEMS_PER_STEP, (c + 1) * PRICE_ITEMS_PER_STEP);
      const result = await step.run(`refresh-chunk-${c}`, async () => {
        let cOk = 0;
        let cMiss = 0;
        let cRl = 0;
        for (let i = 0; i < chunk.length; i++) {
          try {
            const r = await refreshItemPrice(chunk[i]);
            if (r.found) cOk++;
            else if (r.status === 429) cRl++;
            else cMiss++;
          } catch {
            cMiss++;
          }
          if (i < chunk.length - 1) await new Promise((res) => setTimeout(res, PRICE_SPACING_MS));
        }
        return { cOk, cMiss, cRl };
      });
      ok += result.cOk;
      miss += result.cMiss;
      rateLimited += result.cRl;

      // If a chunk is mostly rate-limited, sleep durably between chunks
      // (Inngest holds state — step.sleep doesn't burn function-execution time).
      if (result.cRl > result.cOk && result.cRl > 5) {
        await step.sleep('cooldown-after-rate-limit', '10m');
      }
    }

    l.info('Price refresh complete', { ok, miss, rateLimited, total: items.length });
    return { ok, miss, rateLimited, total: items.length };
  }
);

/* ───────────────────────────── PRICE ALERTS ───────────────────────────── */
// Hourly check: evaluate all active alerts, send notifications when triggered.
// Reuses existing checkPriceAlerts logic.
export const priceAlertsCheck = inngest.createFunction(
  {
    id: 'price-alerts-check',
    name: 'Price Alerts Check',
    retries: 2,
    triggers: [{ cron: '0 * * * *' }, { event: 'alerts/check' }],
  },
  async ({ step, logger: l }) => {
    return await step.run('evaluate-alerts', async () => {
      // Lazy-import: avoids loading alert service when this function isn't invoked.
      const { checkPriceAlerts } = await import('../cron/priceAlertsCheck.js').catch(() => ({
        checkPriceAlerts: null,
      }));
      if (!checkPriceAlerts) {
        l.warn('checkPriceAlerts service not found, skipping');
        return { skipped: true };
      }
      const result = await checkPriceAlerts();
      return result ?? { ok: true };
    });
  }
);

/* ───────────────────────────── PORTFOLIO HISTORY SNAPSHOT ───────────────────────────── */
// Daily 00:00 UTC: snapshot every user's portfolio value into PortfolioHistory.
export const portfolioHistorySnapshot = inngest.createFunction(
  {
    id: 'portfolio-history-snapshot',
    name: 'Portfolio History Snapshot',
    retries: 2,
    triggers: [{ cron: '0 0 * * *' }, { event: 'portfolio/snapshot' }],
  },
  async ({ step, logger: l }) => {
    return await step.run('snapshot-all-portfolios', async () => {
      const { calculateAndStorePortfolioValues } = await import(
        '../cron/portfolioHistoryCron.js'
      ).catch(() => ({ calculateAndStorePortfolioValues: null }));
      if (!calculateAndStorePortfolioValues) {
        l.warn('calculateAndStorePortfolioValues not found, skipping');
        return { skipped: true };
      }
      const result = await calculateAndStorePortfolioValues();
      return result ?? { ok: true };
    });
  }
);

/* ───────────────────────────── REGISTRY ───────────────────────────── */
export const allFunctions = [
  catalogSync,
  priceRefresh,
  priceAlertsCheck,
  portfolioHistorySnapshot,
];
