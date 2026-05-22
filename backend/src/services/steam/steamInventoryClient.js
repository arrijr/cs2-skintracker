// Steam Community inventory client. Uses console for logging because the shared logger
// eagerly initializes PrismaClient, which breaks Jest ESM module loading.
const BASE_URL = 'https://steamcommunity.com/inventory';
const APPID = 730;
const CONTEXT_ID = 2;
// 25s per attempt — Cloudflare/Render front returns 524/502 around 30s, so we
// must finish + error-handle before that. Steam can be slow on large CS2
// inventories (1000+ items).
const REQUEST_TIMEOUT_MS = 25000;
const MAX_ATTEMPTS = 3;
const CACHE_TTL_MS = 5 * 60 * 1000;
// Steam rejects requests without a recognizable browser UA with HTTP 400/429.
// As of 2026 the public inventory endpoint also refuses count > ~2000 → use a
// safer default. Most CS2 inventories fit in a single page; if the user holds
// more we still get the first 2000 items which is plenty for a preview.
const USER_AGENT =
  'Mozilla/5.0 (compatible; CS2SkinTrackr/1.0; +https://www.skintrackr.io)';
const ACCEPT_LANGUAGE = 'en-US,en;q=0.9';
const PAGE_COUNT = 2000;

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
    console.log('[steamInventoryClient] cache hit', { steamId, items: cached.items.length });
    return cached.items;
  }

  const url = `${BASE_URL}/${encodeURIComponent(steamId)}/${APPID}/${CONTEXT_ID}?l=english&count=${PAGE_COUNT}`;

  // Browser-ish headers — Steam returns 400 for requests that look automated.
  const fetchOptions = {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': ACCEPT_LANGUAGE,
    },
  };

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const startedAt = Date.now();
    console.log('[steamInventoryClient] fetch start', { steamId, attempt, url });
    try {
      const res = await fetchImpl(url, fetchOptions);
      const elapsedMs = Date.now() - startedAt;
      console.log('[steamInventoryClient] fetch response', {
        steamId,
        attempt,
        status: res.status,
        elapsedMs,
      });

      if (res.status === 403) {
        throw new Error('Steam inventory is private. Set inventory privacy to Public temporarily and retry.');
      }

      if (res.status === 429) {
        const retryAfter = parseFloat(res.headers?.get?.('retry-after') ?? '5');
        lastError = `Steam rate-limited (HTTP 429, retry-after ${retryAfter}s)`;
        console.warn('[steamInventoryClient] 429', { steamId, attempt, retryAfter });
        if (attempt < MAX_ATTEMPTS) {
          await sleepImpl(Math.min(retryAfter * 1000, 30000));
          continue;
        }
        throw new Error('Steam is rate-limiting us right now. Please try again in a minute.');
      }

      if (res.status === 400) {
        // Steam returns 400 for: count too high, malformed steamId, or when
        // it decides the request looks like a bot. Worth retrying once with
        // a backoff in case it's transient.
        lastError = 'Steam HTTP 400 (bad request — possibly rate-limited or invalid steamId)';
        console.warn('[steamInventoryClient] 400', { steamId, attempt });
        if (attempt < MAX_ATTEMPTS) {
          await sleepImpl(2000 * attempt);
          continue;
        }
        throw new Error('Steam refused the inventory request. Your inventory may be empty or Steam is throttling us — try again in a minute.');
      }

      if (res.status >= 500) {
        lastError = `Steam ${res.status}`;
        console.warn('[steamInventoryClient] 5xx', { steamId, attempt, status: res.status });
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
      const totalAssets = Array.isArray(data?.assets) ? data.assets.length : 0;
      console.log('[steamInventoryClient] fetch ok', {
        steamId,
        attempt,
        elapsedMs,
        rawAssets: totalAssets,
        groupedItems: items.length,
        more_items: data?.more_items ?? 0,
      });
      cache.set(steamId, { items, expiresAt: Date.now() + CACHE_TTL_MS });
      return items;
    } catch (err) {
      const elapsedMs = Date.now() - startedAt;
      if (err?.name === 'AbortError' || err?.name === 'TimeoutError') {
        lastError = `Steam request timed out after ${elapsedMs}ms`;
        console.warn('[steamInventoryClient] timeout', { steamId, attempt, elapsedMs });
        if (attempt < MAX_ATTEMPTS) {
          await sleepImpl(2000 * attempt);
          continue;
        }
        throw new Error(lastError);
      }
      if (/private/i.test(err.message) || err.message?.startsWith('Steam inventory HTTP')) {
        throw err;
      }
      lastError = err.message;
      console.warn('[steamInventoryClient] fetch threw', { steamId, attempt, elapsedMs, err: err.message });
      if (attempt < MAX_ATTEMPTS) {
        await sleepImpl(2000 * attempt);
      }
    }
  }
  console.warn('[steamInventoryClient] fetch failed', { steamId, lastError });
  throw new Error(lastError ?? 'unknown error fetching Steam inventory');
}
