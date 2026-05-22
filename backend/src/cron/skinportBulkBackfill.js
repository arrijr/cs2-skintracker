// backend/src/cron/skinportBulkBackfill.js
//
// Daily fast backfill from the public Skinport feed (one HTTP call covers
// the full ~20k-item CS2 catalogue). Populates pricing fields that the
// Steam-Market priceRefreshJob can only fill slowly because of its rate limits.
//
// What we DO populate from Skinport:
//   - priceMin       ← min_price (EUR) × eurToUsd
//   - priceMax       ← max_price (EUR) × eurToUsd
//   - priceMedian7d  ← median_price (EUR) × eurToUsd  (Skinport listing-median proxy)
//   - priceMedian30d ← mean_price   (EUR) × eurToUsd  (Skinport listing-mean proxy)
//   - priceUpdatedAt ← now()
//
// What we DO NOT populate:
//   - sold7d / sold30d — public Skinport feed has NO sales-count field.
//     `quantity` is current-listings, not historical sales. Volume data
//     would require the gated /sales endpoint (auth required) — out of scope.
//
// Caveat: Skinport's `median_price` / `mean_price` describe Skinport's own
// listing prices, not Steam Market historical sales. They are a useful
// "second-market" reference but should not be confused with Steam-Market
// medians written by priceRefreshJob into priceMedian. That's why we write
// them into the 7d/30d slots, which were entirely NULL before this job.

import defaultPrisma from '../prisma/prismaClient.js';
import logger from '../utils/logger.js';
import { fetchSkinportItems } from '../services/pricing/skinportClient.js';

const DEFAULT_EUR_TO_USD = 1.08;
const CHUNK_SIZE = 500;

function eurToUsdSafe(eur, rate) {
  if (typeof eur !== 'number' || !Number.isFinite(eur)) return null;
  return +(eur * rate).toFixed(4);
}

/**
 * Run the Skinport bulk backfill.
 *
 * @param {object} opts
 * @param {import('@prisma/client').PrismaClient} [opts.prismaClient]
 * @param {number} [opts.eurToUsd] - FX rate (default 1.08)
 * @returns {Promise<{ fetched: number, matched: number, updated: number, skipped: number, durationMs: number }>}
 */
export async function runSkinportBulkBackfill({
  prismaClient = defaultPrisma,
  eurToUsd = DEFAULT_EUR_TO_USD,
} = {}) {
  const t0 = Date.now();
  logger.info('[skinport-backfill] starting');

  // 1. One bulk HTTP call.
  const items = await fetchSkinportItems();
  logger.info('[skinport-backfill] fetched feed', { count: items.length });

  // 2. Index by market_hash_name for O(1) lookup.
  const byName = new Map();
  for (const it of items) {
    if (it?.market_hash_name) byName.set(it.market_hash_name, it);
  }

  // 3. Load all Skin rows.
  const skins = await prismaClient.skin.findMany({
    select: { id: true, marketHashName: true },
  });
  logger.info('[skinport-backfill] loaded DB skins', { count: skins.length });

  // 4. Build the update list.
  const updates = [];
  let skipped = 0;
  const now = new Date();
  for (const skin of skins) {
    const sp = byName.get(skin.marketHashName);
    if (!sp) {
      skipped++;
      continue;
    }

    const priceMin = eurToUsdSafe(sp.min_price, eurToUsd);
    const priceMax = eurToUsdSafe(sp.max_price, eurToUsd);
    const priceMedian7d = eurToUsdSafe(sp.median_price, eurToUsd);
    const priceMedian30d = eurToUsdSafe(sp.mean_price, eurToUsd);

    // Build payload — only set non-null derived fields to avoid clobbering
    // existing Steam-sourced data with NULLs.
    const data = { priceUpdatedAt: now };
    if (priceMin != null) data.priceMin = priceMin;
    if (priceMax != null) data.priceMax = priceMax;
    if (priceMedian7d != null) data.priceMedian7d = priceMedian7d;
    if (priceMedian30d != null) data.priceMedian30d = priceMedian30d;

    updates.push({
      where: { id: skin.id },
      data,
    });
  }
  logger.info('[skinport-backfill] derived updates', {
    matched: updates.length,
    skipped,
  });

  // 5. Apply in chunks via $transaction so a poison row doesn't kill the run.
  let updated = 0;
  for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
    const chunk = updates.slice(i, i + CHUNK_SIZE);
    try {
      await prismaClient.$transaction(
        chunk.map((u) => prismaClient.skin.update(u))
      );
      updated += chunk.length;
    } catch (err) {
      logger.error('[skinport-backfill] chunk failed', {
        chunkStart: i,
        chunkSize: chunk.length,
        error: err.message,
      });
      // Don't bail; subsequent chunks may still succeed.
    }
  }

  const durationMs = Date.now() - t0;
  logger.info('[skinport-backfill] done', {
    fetched: items.length,
    matched: updates.length,
    updated,
    skipped,
    durationMs,
  });

  return {
    fetched: items.length,
    matched: updates.length,
    updated,
    skipped,
    durationMs,
  };
}

export default runSkinportBulkBackfill;
