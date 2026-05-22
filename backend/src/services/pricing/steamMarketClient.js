import logger from '../../utils/logger.js';

const BASE_URL = 'https://steamcommunity.com/market/priceoverview/';
const SEARCH_URL = 'https://steamcommunity.com/market/search/render/';
const APPID = 730;
const DEFAULT_COUNTRY = 'DE';
const DEFAULT_CURRENCY = 3; // EUR
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Parse a Steam Market price string like "12,50€", "1.234,56€", or "$5.99" into a Number.
 * Returns null if the string is unparseable.
 */
export function parsePrice(str) {
  if (typeof str !== 'string') return null;
  const cleaned = str.replace(/[€$£¥₽]/g, '').trim();
  if (!cleaned || cleaned === '--') return null;

  let normalized;
  if (cleaned.includes('.') && cleaned.includes(',')) {
    // Both present: '.' is thousand separator (DE/EU)
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    // Only ',': decimal separator (DE)
    normalized = cleaned.replace(',', '.');
  } else {
    normalized = cleaned;
  }

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

async function defaultSleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch price for a market_hash_name from Steam Community Market.
 * Returns { found, status, priceLatest, priceMedian, volume24h, error }.
 *
 * Retries transient failures (429, 5xx, network) up to maxAttempts.
 * Caller is responsible for inter-request spacing (3s between distinct calls).
 */
export async function fetchPrice(marketHashName, {
  fetchImpl = fetch,
  sleepImpl = defaultSleep,
  country = DEFAULT_COUNTRY,
  currency = DEFAULT_CURRENCY,
  maxAttempts = 3,
} = {}) {
  const url = `${BASE_URL}?country=${encodeURIComponent(country)}&currency=${currency}&appid=${APPID}&market_hash_name=${encodeURIComponent(marketHashName)}`;

  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

      // Steam returns 500 for items it doesn't recognize — treat as not-found (permanent)
      if (res.status === 404 || res.status === 500) {
        return { found: false, status: res.status };
      }

      // Rate-limited: honor Retry-After when present
      if (res.status === 429) {
        const retryAfter = parseFloat(res.headers?.get?.('retry-after') ?? '5');
        lastError = `429 rate-limited (retry-after ${retryAfter}s)`;
        if (attempt < maxAttempts) {
          await sleepImpl(Math.min(retryAfter * 1000, 30000));
          continue;
        }
        return { found: false, status: 429, error: lastError };
      }

      // 5xx (other than 500): transient — retry with backoff
      if (res.status >= 500) {
        lastError = `Steam ${res.status}`;
        if (attempt < maxAttempts) {
          await sleepImpl(5000 * attempt);
          continue;
        }
        return { found: false, status: res.status, error: lastError };
      }

      if (!res.ok) {
        return { found: false, status: res.status, error: `unexpected ${res.status}` };
      }

      const data = await res.json();
      if (data?.success !== true) {
        return { found: false, status: 200, error: 'success:false in body' };
      }

      const priceLatest = parsePrice(data.lowest_price);
      const priceMedian = parsePrice(data.median_price);
      const volume24h = data.volume ? parseInt(String(data.volume).replace(/[^\d]/g, ''), 10) : null;

      // Steam returns {success:true} with NO price/median/volume for some queries
      // (notably skin names without a wear suffix). Treat that as not-found so we
      // don't overwrite real prices with null on the next refresh.
      if (priceLatest == null && priceMedian == null) {
        return { found: false, status: 200, error: 'success:true but empty body' };
      }

      return {
        found: true,
        status: 200,
        priceLatest,
        priceMedian,
        volume24h,
      };
    } catch (err) {
      lastError = err.message;
      if (attempt < maxAttempts) {
        await sleepImpl(2000 * attempt);
        continue;
      }
    }
  }

  logger.warn('Steam Market fetch failed after retries', { marketHashName, lastError });
  return { found: false, status: 0, error: lastError ?? 'unknown' };
}

/**
 * Fetch a single page of the Steam Market search endpoint.
 * Returns { ok, status, totalCount, results } where each result has
 * { hash_name, sell_listings, sell_price_text }.
 *
 * Internal — `fetchAllListingCounts` calls this in a loop.
 */
export async function fetchListingsPage(start, {
  count = 100,
  fetchImpl = fetch,
  appid = APPID,
} = {}) {
  const url = `${SEARCH_URL}?appid=${appid}&start=${start}&count=${count}&norender=1`;
  const res = await fetchImpl(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: {
      // Steam search endpoint occasionally 403s a bare fetch UA — pretend to be a browser.
      'User-Agent': 'Mozilla/5.0 (compatible; CS2SkinTracker/1.0)',
    },
  });

  if (res.status === 429) {
    return { ok: false, status: 429, totalCount: 0, results: [] };
  }
  if (res.status >= 500) {
    return { ok: false, status: res.status, totalCount: 0, results: [] };
  }
  if (!res.ok) {
    return { ok: false, status: res.status, totalCount: 0, results: [] };
  }

  const data = await res.json();
  if (data?.success !== true || !Array.isArray(data.results)) {
    return { ok: false, status: 200, totalCount: 0, results: [] };
  }

  return {
    ok: true,
    status: 200,
    totalCount: Number(data.total_count) || 0,
    results: data.results,
  };
}

/**
 * Bulk fetch listing-counts from Steam Market search endpoint.
 * Paginates through all CS2 (appid=730) items, 100 per page.
 * Returns a Map<hash_name, { sellListings: number, sellPriceText: string|null }>.
 *
 * Steam blocks aggressive scraping. ~190 pages total → 1s spacing between
 * pages = ~3min total. Tolerates per-page failures (skip, continue).
 *
 * Rate-limit handling:
 *   - 429 → exponential backoff (3s, 9s, 27s) then abort the run.
 *   - 5xx → single 5s retry then skip the page.
 */
export async function fetchAllListingCounts({
  delayMs = 1000,
  maxPages = 250,
  pageSize = 100,
  fetchImpl = fetch,
  sleepImpl = defaultSleep,
} = {}) {
  const out = new Map();
  let start = 0;
  let totalCount = null;
  let pagesFetched = 0;
  let pagesSkipped = 0;

  for (let pageIdx = 0; pageIdx < maxPages; pageIdx++) {
    // 429 backoff loop — up to 3 attempts (3s, 9s, 27s) then abort the whole run.
    let page = null;
    const backoffs = [3000, 9000, 27000];
    let aborted = false;
    for (let attempt = 0; attempt <= backoffs.length; attempt++) {
      try {
        page = await fetchListingsPage(start, { count: pageSize, fetchImpl });
      } catch (err) {
        page = { ok: false, status: 0, totalCount: 0, results: [], error: err.message };
      }

      if (page.ok) break;

      if (page.status === 429) {
        if (attempt < backoffs.length) {
          logger.warn('[steam-listing-counts] 429 backoff', { start, attempt: attempt + 1, sleepMs: backoffs[attempt] });
          await sleepImpl(backoffs[attempt]);
          continue;
        }
        // Exhausted backoffs → abort the whole run, return what we have.
        logger.error('[steam-listing-counts] 429 exhausted, aborting', { start, collected: out.size });
        aborted = true;
        break;
      }

      if (page.status >= 500) {
        if (attempt === 0) {
          logger.warn('[steam-listing-counts] 5xx, single retry', { start, status: page.status });
          await sleepImpl(5000);
          continue;
        }
        // 5xx retried once → skip this page.
        logger.warn('[steam-listing-counts] 5xx persists, skipping page', { start, status: page.status });
        break;
      }

      // Other non-ok (4xx other than 429, network error, malformed body) → skip this page.
      logger.warn('[steam-listing-counts] page failed, skipping', {
        start,
        status: page.status,
        error: page.error,
      });
      break;
    }

    if (aborted) break;

    if (!page?.ok) {
      pagesSkipped++;
      start += pageSize;
      if (pageIdx < maxPages - 1) await sleepImpl(delayMs);
      continue;
    }

    pagesFetched++;
    if (totalCount == null) totalCount = page.totalCount;

    for (const r of page.results) {
      const name = r?.hash_name;
      const sellListings = Number(r?.sell_listings);
      if (!name || !Number.isFinite(sellListings)) continue;
      out.set(name, {
        sellListings,
        sellPriceText: typeof r.sell_price_text === 'string' ? r.sell_price_text : null,
      });
    }

    // Stop conditions: short last page, or we've covered total_count.
    if (page.results.length < pageSize) break;
    start += pageSize;
    if (totalCount && start >= totalCount) break;

    if (pageIdx < maxPages - 1) await sleepImpl(delayMs);
  }

  logger.info('[steam-listing-counts] done', {
    pagesFetched,
    pagesSkipped,
    items: out.size,
    totalCount,
  });

  return out;
}
