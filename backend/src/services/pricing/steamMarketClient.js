import logger from '../../utils/logger.js';

const BASE_URL = 'https://steamcommunity.com/market/priceoverview/';
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
