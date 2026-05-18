import defaultPrisma from '../../prisma/prismaClient.js';
import logger from '../../utils/logger.js';
import {
  CATEGORIES,
  fetchCategory,
  normalizeItem,
  makeStatTrakVariant,
  makeWearVariants,
  makeStatTrakWearVariants,
} from './bymykelClient.js';
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
 * Returns { upserted, errors, idsByExternal } where idsByExternal maps
 * `_externalId` → DB row id (used by catalog sync to resolve variant refs).
 */
export async function syncCategoryToDb(category, items, { prismaClient = defaultPrisma, externalIdMap } = {}) {
  let upserted = 0;
  const errors = [];

  for (const item of items) {
    try {
      if (category === 'skins') {
        const weaponType = extractWeaponType(item.name);
        const itemType = categorizeWeapon(weaponType);
        const row = await prismaClient.skin.upsert({
          where: { marketHashName: item.marketHashName },
          create: {
            name: item.name,
            marketHashName: item.marketHashName,
            imageUrl: item.imageUrl,
            rarity: item.rarity,
            collection: item.collection,
            wear: item.wear ?? null,
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
            wear: item.wear ?? undefined, // never null-out existing wear
            weaponType,
            itemType,
            isStattrak: item.isStattrak ?? false,
            isStar: item.isStar ?? false,
          },
          select: { id: true },
        });
        // Resolve variantOf via raw SQL — prisma client may not have the field typed
        // until `prisma generate` runs in user's terminal.
        if (item._variantOfExternalId && externalIdMap) {
          const parentId = externalIdMap.get(item._variantOfExternalId);
          if (parentId) {
            await prismaClient.$executeRaw`UPDATE "Skin" SET "variantOf" = ${parentId} WHERE "id" = ${row.id}`;
          }
        }
        // Track base-row ids so subsequent variant passes can resolve variantOf.
        if (externalIdMap && item._externalId) {
          externalIdMap.set(item._externalId, row.id);
        }
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

      if (category === 'skins') {
        // Two-pass sync for skins so variants can resolve variantOf → base Skin.id.
        // Pass 1: base rows (annotated with _externalId so we capture id mapping).
        const baseItems = raw.map((r) => ({ ...normalizeItem(r, category), _externalId: r.id }));
        const externalIdMap = new Map();
        const baseResult = await syncCategoryToDb(category, baseItems, { prismaClient, externalIdMap });

        // Pass 2: ST (non-wear) + wear variants + ST+wear variants.
        const variantItems = [];
        for (const r of raw) {
          const st = makeStatTrakVariant(r);
          if (st) variantItems.push(st); // legacy ST sibling (no wear suffix)
          for (const w of makeWearVariants(r)) variantItems.push(w);
          for (const w of makeStatTrakWearVariants(r)) variantItems.push(w);
        }
        const variantResult = await syncCategoryToDb(category, variantItems, { prismaClient, externalIdMap });

        summary[category] = {
          fetched: baseItems.length + variantItems.length,
          baseUpserted: baseResult.upserted,
          variantUpserted: variantResult.upserted,
          upserted: baseResult.upserted + variantResult.upserted,
          errors: [...baseResult.errors, ...variantResult.errors],
        };
        logger.info('Catalog sync complete', { category, ...summary[category] });
      } else {
        const items = raw.map((r) => normalizeItem(r, category));
        const result = await syncCategoryToDb(category, items, { prismaClient });
        summary[category] = { fetched: items.length, ...result };
        logger.info('Catalog sync complete', { category, ...summary[category] });
      }
    } catch (err) {
      logger.error('Catalog sync failed for category', { category, error: err.message });
      summary[category] = { error: err.message };
    }
  }
  return summary;
}
