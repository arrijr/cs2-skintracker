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

const CHUNK_SIZE = 500;

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

    // priceLatest = cheapest live ask (min_price). Skinport prices are EUR and
    // the DB convention is EUR (Steam scrape uses currency=3/EUR; the frontend
    // is EUR-native) — do NOT convert. If there is no live listing
    // (min_price null) fall back to suggested_price ONLY when there is
    // liquidity (quantity > 0); skip otherwise, because Skinport's
    // suggested_price for zero-listing items can be wildly stale (e.g. €3926
    // for an unlisted skin) and would poison portfolio valuations / P&L.
    const min = typeof sp.min_price === 'number' ? sp.min_price : null;
    const suggested = typeof sp.suggested_price === 'number' ? sp.suggested_price : null;
    const qty = typeof sp.quantity === 'number' ? sp.quantity : 0;
    const price = min != null ? min : (qty > 0 ? suggested : null);
    if (price == null || !Number.isFinite(price) || price <= 0) {
      skipped++;
      continue;
    }

    // Write ONLY priceLatest (+ timestamp). Intentionally NOT writing
    // priceMin/Max/median7d/30d: those gate the on-the-fly PriceHistory-derived
    // 30-day stats in skinDetailController, so populating them would silently
    // relabel current Skinport listing min/max as "30D"/"all-time".
    updates.push({
      where: { id: skin.id },
      data: { priceLatest: +price.toFixed(2), priceUpdatedAt: now },
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
