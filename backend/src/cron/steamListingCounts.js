// backend/src/cron/steamListingCounts.js
//
// Daily backfill of Skin.offerVolume from the Steam Market search endpoint
// (https://steamcommunity.com/market/search/render/). Steam's `priceoverview`
// — used by priceRefreshJob — returns 24h-sales volume but NOT current
// listing-count. The frontend "Liquidity" tile needs the latter, so we
// scrape the search endpoint once per day.
//
// What we populate:
//   - Skin.offerVolume  ← sell_listings (current listings on the market)
//   - Skin.priceUpdatedAt ← now() (fresh data point)
//
// What we DO NOT touch:
//   - priceLatest / priceMedian — owned by priceRefreshJob (priceoverview).
//   - sold24h / sold7d / sold30d — owned by priceRefreshJob / Skinport.
//
// Runtime budget: ~190 pages × ~1s = ~3min scrape + DB writes well under 5min total.
//
// Why not Skinport? Product decision (see CLAUDE.md): Skinport integration is
// "Zukunftsmusik" — we ship Steam-only sources today.

import logger from '../utils/logger.js';
import defaultPrisma from '../prisma/prismaClient.js';
import { fetchAllListingCounts } from '../services/pricing/steamMarketClient.js';

const CHUNK_SIZE = 500;

/**
 * Run the Steam Market listing-counts backfill.
 *
 * @param {object} opts
 * @param {import('@prisma/client').PrismaClient} [opts.prismaClient]
 * @param {number} [opts.delayMs] - Spacing between Steam pages (default 1000).
 * @param {number} [opts.maxPages] - Hard cap on pages fetched (default 250).
 * @returns {Promise<{ fetched: number, matched: number, missing: number, written: number, durationMs: number }>}
 */
export async function runSteamListingCounts({
  prismaClient = defaultPrisma,
  delayMs,
  maxPages,
} = {}) {
  const t0 = Date.now();
  logger.info('[steam-listing-counts] starting');

  // 1. Scrape the full listing-counts map.
  const fetchOpts = {};
  if (delayMs != null) fetchOpts.delayMs = delayMs;
  if (maxPages != null) fetchOpts.maxPages = maxPages;
  const listingMap = await fetchAllListingCounts(fetchOpts);
  logger.info('[steam-listing-counts] scraped feed', { items: listingMap.size });

  // 2. Load all Skin rows.
  const skins = await prismaClient.skin.findMany({
    select: { id: true, marketHashName: true },
  });
  logger.info('[steam-listing-counts] loaded DB skins', { count: skins.length });

  // 3. Build update list — only skins we have a listing-count for.
  const updates = [];
  let missing = 0;
  const now = new Date();
  for (const skin of skins) {
    const entry = listingMap.get(skin.marketHashName);
    if (!entry) {
      missing++;
      continue;
    }
    updates.push({
      where: { id: skin.id },
      data: {
        offerVolume: entry.sellListings,
        priceUpdatedAt: now,
      },
    });
  }
  logger.info('[steam-listing-counts] derived updates', {
    matched: updates.length,
    missing,
  });

  // 4. Apply in chunks via $transaction so a poison row doesn't kill the run.
  let written = 0;
  for (let i = 0; i < updates.length; i += CHUNK_SIZE) {
    const chunk = updates.slice(i, i + CHUNK_SIZE);
    try {
      await prismaClient.$transaction(
        chunk.map((u) => prismaClient.skin.update(u))
      );
      written += chunk.length;
    } catch (err) {
      logger.error('[steam-listing-counts] chunk failed', {
        chunkStart: i,
        chunkSize: chunk.length,
        error: err.message,
      });
      // Don't bail; subsequent chunks may still succeed.
    }
  }

  const durationMs = Date.now() - t0;
  const summary = {
    fetched: listingMap.size,
    matched: updates.length,
    missing,
    written,
    durationMs,
  };
  logger.info('[steam-listing-counts] done', summary);
  return summary;
}

export default runSteamListingCounts;
