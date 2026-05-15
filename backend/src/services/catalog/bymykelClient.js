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
    isStattrak: false,
    isStar: !!raw.name?.startsWith('★ '),
  };
}

/**
 * For skins where bymykel marks `stattrak: true`, generate a derivative variant row.
 * The base catalog has ONE row per skin; we synthesize StatTrak™ as a sibling row
 * so users can portfolio/watch/alert it independently (StatTrak prices typically
 * carry a 5-30% premium and trade as a distinct listing on Steam).
 *
 * Returns null if this skin doesn't have a StatTrak variant.
 */
export function makeStatTrakVariant(raw) {
  if (!raw.stattrak) return null;
  // Knives + gloves already use ★ prefix; StatTrak goes BEFORE the ★ for knives,
  // but gloves don't have StatTrak (Steam restriction). Skip gloves defensively.
  if (raw.name?.includes('Gloves') || raw.name?.includes('Hand Wraps')) return null;

  const isKnife = raw.name?.startsWith('★ ');
  // Knife: "★ Karambit | Doppler" → "★ StatTrak™ Karambit | Doppler"
  // Weapon: "AK-47 | Redline" → "StatTrak™ AK-47 | Redline"
  const stName = isKnife
    ? `★ StatTrak™ ${raw.name.slice(2)}`
    : `StatTrak™ ${raw.name}`;
  const baseMhn = raw.market_hash_name ?? raw.name;
  const stMhn = isKnife
    ? `★ StatTrak™ ${baseMhn.slice(2)}`
    : `StatTrak™ ${baseMhn}`;

  return {
    category: 'skins',
    externalId: `${raw.id}-st`,
    name: stName,
    marketHashName: stMhn,
    imageUrl: raw.image ?? null,
    rarity: raw.rarity?.name ?? null,
    collection: raw.collections?.[0]?.name ?? raw.crates?.[0]?.name ?? null,
    metadata: { type: raw.type ?? null, derivedFrom: raw.id, variant: 'stattrak' },
    isStattrak: true,
    isStar: isKnife,
  };
}
