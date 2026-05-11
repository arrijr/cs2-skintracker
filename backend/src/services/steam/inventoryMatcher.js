/**
 * Match parsed Steam inventory items against our Skin/Case/MarketItem catalog.
 * Returns { matched: [...], skipped: [...] }.
 *
 * Match precedence: Skin > Case > MarketItem.
 * Skin and MarketItem match by marketHashName. Case matches by name.
 *
 * Note: prismaClient is loaded lazily (dynamic import) so Jest ESM can load
 * this module without eagerly initializing Prisma.
 */
export async function matchInventory(items, { prismaClient } = {}) {
  if (!Array.isArray(items) || items.length === 0) {
    return { matched: [], skipped: [] };
  }

  if (!prismaClient) {
    const mod = await import('../../prisma/prismaClient.js');
    prismaClient = mod.default;
  }

  const names = items.map(i => i.marketHashName);

  const [skins, cases, marketItems] = await Promise.all([
    prismaClient.skin.findMany({
      where: { marketHashName: { in: names } },
      select: { id: true, name: true, marketHashName: true, priceLatest: true },
    }),
    prismaClient.case.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true, price: true },
    }),
    prismaClient.marketItem.findMany({
      where: { marketHashName: { in: names } },
      select: { id: true, name: true, marketHashName: true, category: true, priceLatest: true },
    }),
  ]);

  const skinByName       = new Map(skins.map(s => [s.marketHashName, s]));
  const caseByName       = new Map(cases.map(c => [c.name, c]));
  const marketItemByName = new Map(marketItems.map(m => [m.marketHashName, m]));

  const matched = [];
  const skipped = [];

  for (const item of items) {
    const name = item.marketHashName;

    const skin = skinByName.get(name);
    if (skin) {
      matched.push({
        kind: 'skin',
        skinId: skin.id,
        caseId: null,
        marketItemId: null,
        marketHashName: name,
        name: skin.name,
        amount: item.amount,
        tradable: item.tradable,
        marketable: item.marketable,
        currentPrice: skin.priceLatest ?? null,
      });
      continue;
    }

    const c = caseByName.get(name);
    if (c) {
      matched.push({
        kind: 'case',
        skinId: null,
        caseId: c.id,
        marketItemId: null,
        marketHashName: name,
        name: c.name,
        amount: item.amount,
        tradable: item.tradable,
        marketable: item.marketable,
        currentPrice: c.price ?? null,
      });
      continue;
    }

    const mi = marketItemByName.get(name);
    if (mi) {
      matched.push({
        kind: 'market_item',
        skinId: null,
        caseId: null,
        marketItemId: mi.id,
        marketHashName: name,
        name: mi.name,
        amount: item.amount,
        tradable: item.tradable,
        marketable: item.marketable,
        currentPrice: mi.priceLatest ?? null,
      });
      continue;
    }

    skipped.push({ marketHashName: name, amount: item.amount, reason: 'not_in_catalog' });
  }

  return { matched, skipped };
}
