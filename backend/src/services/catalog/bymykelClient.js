import logger from '../../utils/logger.js';

const BASE_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en';

export const CATEGORIES = [
  'skins',
  'crates',
  'stickers',
  'agents',
  'patches',
  'graffiti',
  'music_kits',
  'collectibles',
  'keys',
];

export async function fetchCategory(category, { fetchImpl = fetch } = {}) {
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Unsupported category: ${category}`);
  }
  const url = `${BASE_URL}/${category}.json`;
  logger.info('Fetching bymykel catalog', { category, url });
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`bymykel ${category} fetch failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`bymykel ${category} did not return an array`);
  }
  return data;
}

/**
 * Convert raw bymykel item to a normalized shape we persist.
 * Different categories have slightly different fields — we extract the common subset.
 */
export function normalizeItem(raw, category) {
  return {
    category,
    externalId: raw.id,
    name: raw.name,
    marketHashName: raw.market_hash_name ?? raw.name,
    imageUrl: raw.image ?? null,
    rarity: raw.rarity?.name ?? (typeof raw.rarity === 'string' ? raw.rarity : null),
    collection: raw.collections?.[0]?.name ?? raw.crates?.[0]?.name ?? null,
    metadata: {
      tournament: raw.tournament_event ?? null,
      team: raw.tournament_team ?? null,
      type: raw.type ?? null,
    },
  };
}
