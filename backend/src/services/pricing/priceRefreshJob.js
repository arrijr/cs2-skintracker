import defaultPrisma from '../../prisma/prismaClient.js';
import logger from '../../utils/logger.js';
import { fetchPrice } from './steamMarketClient.js';
import { nextDeadState } from './deadItemTracker.js';

const REFRESH_DELAY_MS = 3000;

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
  }
}

/**
 * Refresh price for a single item.
 */
export async function refreshItemPrice(item, { prismaClient = defaultPrisma, fetchImpl } = {}) {
  const result = await fetchPrice(item.marketHashName, fetchImpl ? { fetchImpl } : {});
  await recordPriceResult(item, result, { prismaClient });
  return result;
}

/**
 * Iterate all active items and refresh prices. 3s spacing between requests.
 */
export async function runPriceRefresh({ prismaClient = defaultPrisma, sleepImpl = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const skins = await prismaClient.skin.findMany({ select: { id: true, marketHashName: true } });
  const cases = await prismaClient.case.findMany({ select: { id: true, name: true } });
  const marketItems = await prismaClient.marketItem.findMany({
    where: { isActive: true },
    select: { id: true, marketHashName: true, consecutive404: true },
  });

  const all = [
    ...skins.map((s) => ({ ...s, itemType: 'skin' })),
    ...cases.map((c) => ({ id: c.id, marketHashName: c.name, itemType: 'case' })),
    ...marketItems.map((m) => ({ ...m, itemType: 'market_item' })),
  ];

  logger.info('Price refresh starting', { count: all.length });
  let ok = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < all.length; i++) {
    const item = all[i];
    try {
      const result = await refreshItemPrice(item, { prismaClient });
      if (result.found) ok++;
      else if (result.status === 404 || result.status === 500) notFound++;
      else errors++;
    } catch (err) {
      errors++;
      logger.error('refreshItemPrice threw', { id: item.id, type: item.itemType, error: err.message });
    }
    if (i < all.length - 1) {
      await sleepImpl(REFRESH_DELAY_MS);
    }
  }

  logger.info('Price refresh complete', { ok, notFound, errors });
  return { ok, notFound, errors, total: all.length };
}
