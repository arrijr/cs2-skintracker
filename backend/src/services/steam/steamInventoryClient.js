// Steam Community inventory client. Uses console for logging because the shared logger
// eagerly initializes PrismaClient, which breaks Jest ESM module loading.
const BASE_URL = 'https://steamcommunity.com/inventory';
const APPID = 730;
const CONTEXT_ID = 2;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_ATTEMPTS = 3;
const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map(); // steamId -> { items, expiresAt }

export function clearInventoryCache() {
  cache.clear();
}

async function defaultSleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Parse Steam inventory JSON into our normalized shape.
 * Returns array of { marketHashName, amount, tradable, marketable }.
 */
export function parseInventory(raw) {
  if (!raw || raw.success !== 1) return [];
  const assets = Array.isArray(raw.assets) ? raw.assets : [];
  const descriptions = Array.isArray(raw.descriptions) ? raw.descriptions : [];
  if (!assets.length || !descriptions.length) return [];

  const descByKey = new Map();
  for (const d of descriptions) {
    descByKey.set(`${d.classid}:${d.instanceid}`, d);
  }

  const grouped = new Map();
  for (const a of assets) {
    const desc = descByKey.get(`${a.classid}:${a.instanceid}`);
    if (!desc?.market_hash_name) continue;
    const name = desc.market_hash_name;
    const itemTradable = !!desc.tradable;
    const itemMarketable = !!desc.marketable;
    const existing = grouped.get(name);
    if (existing) {
      existing.amount += 1;
      existing.tradable = existing.tradable && itemTradable;
      existing.marketable = existing.marketable && itemMarketable;
    } else {
      grouped.set(name, {
        marketHashName: name,
        amount: 1,
        tradable: itemTradable,
        marketable: itemMarketable,
      });
    }
  }
  return Array.from(grouped.values());
}

/**
 * Fetch the public inventory of a Steam user (CS2 = appid 730, context 2).
 * Returns array of normalized items. Throws on private (403). Retries 429/5xx. Caches 5min.
 */
export async function fetchInventory(steamId, {
  fetchImpl = fetch,
  sleepImpl = defaultSleep,
} = {}) {
  const cached = cache.get(steamId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.items;
  }

  const url = `${BASE_URL}/${encodeURIComponent(steamId)}/${APPID}/${CONTEXT_ID}?l=english&count=5000`;

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

      if (res.status === 403) {
        throw new Error('Steam inventory is private. Set inventory privacy to Public temporarily and retry.');
      }

      if (res.status === 429) {
        const retryAfter = parseFloat(res.headers?.get?.('retry-after') ?? '5');
        lastError = `429 (retry-after ${retryAfter}s)`;
        if (attempt < MAX_ATTEMPTS) {
          await sleepImpl(Math.min(retryAfter * 1000, 30000));
          continue;
        }
        throw new Error(`Steam rate-limited after ${MAX_ATTEMPTS} attempts`);
      }

      if (res.status >= 500) {
        lastError = `Steam ${res.status}`;
        if (attempt < MAX_ATTEMPTS) {
          await sleepImpl(2000 * attempt);
          continue;
        }
        throw new Error(`Steam ${res.status} after ${MAX_ATTEMPTS} attempts`);
      }

      if (!res.ok) {
        throw new Error(`Steam inventory HTTP ${res.status}`);
      }

      const data = await res.json();
      const items = parseInventory(data);
      cache.set(steamId, { items, expiresAt: Date.now() + CACHE_TTL_MS });
      return items;
    } catch (err) {
      if (/private/i.test(err.message) || err.message?.startsWith('Steam inventory HTTP')) {
        throw err;
      }
      lastError = err.message;
      if (attempt < MAX_ATTEMPTS) {
        await sleepImpl(2000 * attempt);
      }
    }
  }
  console.warn('[steamInventoryClient] fetch failed', { steamId, lastError });
  throw new Error(lastError ?? 'unknown error fetching Steam inventory');
}
