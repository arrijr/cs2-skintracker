import defaultPrisma from '../../prisma/prismaClient.js';
import logger from '../../utils/logger.js';
import { CATEGORIES, fetchCategory, normalizeItem, makeStatTrakVariant } from './bymykelClient.js';
import { extractWeaponType, categorizeWeapon } from './weaponClassifier.js';

const MARKET_ITEM_CATEGORIES = new Set([
  'stickers', 'agents', 'patches', 'graffiti', 'music_kits', 'collectibles', 'keys',
]);

const CATEGORY_TO_DB_VALUE = {
  stickers: 'sticker',
  agents: 'agent',
  patches: 'patch',
  graffiti: 'graffiti',
  music_kits: 'music_kit',
  collectibles: 'collectible',
  keys: 'key',
};

/**
 * Upsert already-normalized items for one category.
 * Returns { upserted, errors }.
 */
export async function syncCategoryToDb(category, items, { prismaClient = defaultPrisma } = {}) {
  let upserted = 0;
  const errors = [];

  for (const item of items) {
    try {
      if (category === 'skins') {
        const weaponType = extractWeaponType(item.name);
        const itemType = categorizeWeapon(weaponType);
        await prismaClient.skin.upsert({
          where: { marketHashName: item.marketHashName },
          create: {
            name: item.name,
            marketHashName: item.marketHashName,
            imageUrl: item.imageUrl,
            rarity: item.rarity,
            collection: item.collection,
            weaponType,
            itemType,
            isStattrak: item.isStattrak ?? false,
            isStar: item.isStar ?? false,
          },
          update: {
            name: item.name,
            imageUrl: item.imageUrl,
            rarity: item.rarity,
            collection: item.collection,
            weaponType,
            itemType,
            isStattrak: item.isStattrak ?? false,
            isStar: item.isStar ?? false,
          },
        });
      } else if (category === 'crates') {
        await prismaClient.case.upsert({
          where: { name: item.name },
          create: {
            name: item.name,
            imageUrl: item.imageUrl,
          },
          update: {
            imageUrl: item.imageUrl,
          },
        });
      } else if (MARKET_ITEM_CATEGORIES.has(category)) {
        const dbCategory = CATEGORY_TO_DB_VALUE[category] ?? category;
        await prismaClient.marketItem.upsert({
          where: { marketHashName: item.marketHashName },
          create: {
            category: dbCategory,
            externalId: item.externalId,
            name: item.name,
            marketHashName: item.marketHashName,
            imageUrl: item.imageUrl,
            rarity: item.rarity,
            collection: item.collection,
            metadata: item.metadata,
          },
          update: {
            name: item.name,
            imageUrl: item.imageUrl,
            rarity: item.rarity,
            collection: item.collection,
            metadata: item.metadata,
          },
        });
      } else {
        continue;
      }
      upserted++;
    } catch (err) {
      errors.push({ marketHashName: item.marketHashName, error: err.message });
    }
  }

  return { upserted, errors };
}

/**
 * Run a full catalog sync across all categories.
 */
export async function runCatalogSync({ prismaClient = defaultPrisma } = {}) {
  const summary = {};
  for (const category of CATEGORIES) {
    try {
      logger.info('Catalog sync starting', { category });
      const raw = await fetchCategory(category);
      const items = raw.map((r) => normalizeItem(r, category));
      // For skins, also fan out StatTrak™ derivative rows (bymykel marks stattrak: true on base skin).
      if (category === 'skins') {
        for (const r of raw) {
          const st = makeStatTrakVariant(r);
          if (st) items.push(st);
        }
      }
      const result = await syncCategoryToDb(category, items, { prismaClient });
      summary[category] = { fetched: items.length, ...result };
      logger.info('Catalog sync complete', { category, ...summary[category] });
    } catch (err) {
      logger.error('Catalog sync failed for category', { category, error: err.message });
      summary[category] = { error: err.message };
    }
  }
  return summary;
}
