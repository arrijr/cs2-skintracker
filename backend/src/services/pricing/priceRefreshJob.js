import defaultPrisma from '../../prisma/prismaClient.js';
import logger from '../../utils/logger.js';
import { fetchPrice } from './steamMarketClient.js';
import { nextDeadState } from './deadItemTracker.js';

const REFRESH_DELAY_MS = 3000;

// Steam Market direct refresh is rate-limited to ~3s/call → ~28k items/day max.
// We have 16,829 skins + cases + market_items; a single pass takes ~14h and
// only ~13% of rows get touched per day. To keep priceUpdatedAt fresh on the
// items users actually look at, we cap each run at MAX_SKINS_PER_RUN and order
// by [priceUpdatedAt ASC NULLS FIRST, sold30d DESC] so stalest + most-traded
// rows refresh first. Skinport bulk backfill (cron at 04:00 UTC) handles the
// long tail.
const MAX_SKINS_PER_RUN = 2000;
// Same reasoning for MarketItem (stickers/agents/keys/music-kits/etc): prevents
// the long tail from starving — cap at top-1000 by volume24h so the most-traded
// items refresh first. Without this MarketItems sat at the end of the array
// behind 16k skins and never got reached in a single cron window.
const MAX_MARKET_ITEMS_PER_RUN = 1000;

/**
 * Write the outcome of a single fetchPrice() call back to the DB.
 * `item` shape: { id, itemType, marketHashName, consecutive404? }
 *   itemType: 'skin' | 'case' | 'market_item'
 */
export async function recordPriceResult(item, result, { prismaClient = defaultPrisma } = {}) {
  const { nextCount, markInactive } = nextDeadState(item.consecutive404, result.found, result.status);

  // Per-table update payload (Skin uses sold24h, MarketItem uses volume24h, Case uses price)
  if (item.itemType === 'skin') {
    const skinUpdate = { priceUpdatedAt: new Date() };
    if (result.found) {
      skinUpdate.priceLatest = result.priceLatest;
      skinUpdate.priceMedian = result.priceMedian;
      if (result.volume24h != null) skinUpdate.sold24h = result.volume24h;
    }
    await prismaClient.skin.update({
      where: { id: item.id },
      data: skinUpdate,
    });
  } else if (item.itemType === 'case') {
    const caseUpdate = { lastUpdated: new Date() };
    if (result.found) caseUpdate.price = result.priceLatest;
    await prismaClient.case.update({
      where: { id: item.id },
      data: caseUpdate,
    });
  } else if (item.itemType === 'market_item') {
    const marketItemUpdate = {
      priceUpdatedAt: new Date(),
      consecutive404: nextCount,
      ...(markInactive ? { isActive: false } : {}),
    };
    if (result.found) {
      marketItemUpdate.priceLatest = result.priceLatest;
      marketItemUpdate.priceMedian = result.priceMedian;
      marketItemUpdate.volume24h = result.volume24h ?? null;
    }
    await prismaClient.marketItem.update({
      where: { id: item.id },
      data: marketItemUpdate,
    });
  }

  if (result.found && result.priceLatest != null) {
    await prismaClient.marketSnapshot.create({
      data: {
        itemType: item.itemType,
        skinId: item.itemType === 'skin' ? item.id : null,
        caseId: item.itemType === 'case' ? item.id : null,
        marketItemId: item.itemType === 'market_item' ? item.id : null,
        date: new Date(),
        priceUsd: result.priceLatest,
        soldVolume24h: result.volume24h ?? null,
        source: 'steam_market',
      },
    });

    // Bridge to PriceHistory so /skins/:id chart endpoint has data.
    // PriceHistory schema: { skinId, date, price } with @@unique([skinId, date]).
    // Use date-only (midnight UTC) so multiple refreshes per day upsert the same row.
    if (item.itemType === 'skin') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      try {
        await prismaClient.priceHistory.upsert({
          where: { skinId_date: { skinId: item.id, date: today } },
          update: { price: result.priceLatest },
          create: { skinId: item.id, date: today, price: result.priceLatest },
        });
      } catch (err) {
        // Don't fail the whole refresh on a transient PriceHistory write error
        // (e.g. unique-constraint race or DB hiccup). Snapshot already persisted above.
        logger.warn('PriceHistory upsert failed', {
          skinId: item.id,
          error: err?.message,
        });
      }
    }
  }
}

// Steam Market `priceoverview` returns no data for bare skin names like "AK-47 | Redline".
// Every market listing is wear-specific. We probe common wears in liquidity order
// (FT is by far the most traded, then MW, FN, WW, BS).
// For non-skin items (cases, market_items) the marketHashName is already complete — skip the loop.
const WEAR_VARIANTS = [
  '(Field-Tested)',
  '(Minimal Wear)',
  '(Factory New)',
  '(Well-Worn)',
  '(Battle-Scarred)',
];

function hasWearSuffix(mhn) {
  return /\([^)]+\)\s*$/.test(mhn);
}

/**
 * Refresh price for a single item.
 *
 * For skins without a wear suffix, probe up to 5 wear variants and use the first that returns data.
 * Caller is responsible for the 3s spacing between top-level calls, but we add 1.5s between
 * intra-skin probe attempts to stay polite.
 */
export async function refreshItemPrice(item, { prismaClient = defaultPrisma, fetchImpl, sleepImpl = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const opts = fetchImpl ? { fetchImpl } : {};

  // Cases + market_items: marketHashName is already complete (key/sticker/agent/etc.) — single shot.
  // Skins with explicit wear suffix already (legacy or user-entered): single shot.
  if (item.itemType !== 'skin' || hasWearSuffix(item.marketHashName)) {
    const result = await fetchPrice(item.marketHashName, opts);
    await recordPriceResult(item, result, { prismaClient });
    return result;
  }

  // Skin without wear — probe variants until one returns data.
  // Important: if Steam returns 429 (rate-limited), abort the probe loop immediately.
  // Continuing to probe 5 wears just feeds the rate limit. Skip this skin so the next
  // skin in the outer loop gets a chance.
  let lastResult = null;
  for (let i = 0; i < WEAR_VARIANTS.length; i++) {
    const wear = WEAR_VARIANTS[i];
    const probe = `${item.marketHashName} ${wear}`;
    const result = await fetchPrice(probe, opts);
    lastResult = result;
    if (result.found) {
      await recordPriceResult(item, result, { prismaClient });
      return { ...result, wearUsed: wear };
    }
    // Rate-limited → don't burn budget on 4 more wears, bail
    if (result.status === 429) {
      return { found: false, status: 429, error: 'rate-limited, aborted probe loop' };
    }
    if (i < WEAR_VARIANTS.length - 1) await sleepImpl(1500);
  }

  // True 404/empty across all wears — record so we don't keep retrying
  await recordPriceResult(item, lastResult ?? { found: false, status: 404 }, { prismaClient });
  return lastResult ?? { found: false, status: 404 };
}

/**
 * Iterate all active items and refresh prices. 3s spacing between requests.
 */
export async function runPriceRefresh({ prismaClient = defaultPrisma, sleepImpl = (ms) => new Promise((r) => setTimeout(r, ms)), maxItems, offset = 0 } = {}) {
  // Skins: cap to MAX_SKINS_PER_RUN, ordered stalest-and-most-popular first.
  // Postgres treats NULLs as larger than any value by default for ASC, so
  // priceUpdatedAt ASC alone would put NULL rows LAST. We want never-priced
  // skins refreshed first → use `[{ priceUpdatedAt: { sort: 'asc', nulls: 'first' } }, { sold30d: 'desc' }]`.
  const skins = await prismaClient.skin.findMany({
    select: { id: true, marketHashName: true },
    orderBy: [
      { priceUpdatedAt: { sort: 'asc', nulls: 'first' } },
      { sold30d: { sort: 'desc', nulls: 'last' } },
    ],
    take: MAX_SKINS_PER_RUN,
  });
  const cases = await prismaClient.case.findMany({ select: { id: true, name: true } });
  const marketItems = await prismaClient.marketItem.findMany({
    where: { isActive: true },
    orderBy: [
      { priceUpdatedAt: { sort: 'asc', nulls: 'first' } },
      { volume24h: { sort: 'desc', nulls: 'last' } },
    ],
    take: MAX_MARKET_ITEMS_PER_RUN,
    select: { id: true, marketHashName: true, consecutive404: true },
  });

  const all = [
    ...skins.map((s) => ({ ...s, itemType: 'skin' })),
    ...cases.map((c) => ({ id: c.id, marketHashName: c.name, itemType: 'case' })),
    ...marketItems.map((m) => ({ ...m, itemType: 'market_item' })),
  ];

  // Apply offset + maxItems for chunked runs (used by tests / manual triggers).
  const slice = maxItems != null
    ? all.slice(offset, offset + maxItems)
    : all.slice(offset);

  logger.info('Price refresh starting', { count: slice.length, offset, total: all.length });
  let ok = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < slice.length; i++) {
    const item = slice[i];
    try {
      const result = await refreshItemPrice(item, { prismaClient });
      if (result.found) ok++;
      else if (result.status === 404 || result.status === 500) notFound++;
      else errors++;
    } catch (err) {
      errors++;
      logger.error('refreshItemPrice threw', { id: item.id, type: item.itemType, error: err.message });
    }
    if (i < slice.length - 1) {
      await sleepImpl(REFRESH_DELAY_MS);
    }
  }

  logger.info('Price refresh complete', { ok, notFound, errors, processed: slice.length, total: all.length });
  // Backward-compatible return shape: `total` = full population, `processed` = items in this run
  return { ok, notFound, errors, processed: slice.length, total: all.length };
}
