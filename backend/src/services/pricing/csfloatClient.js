/**
 * CSFloat marketplace listings client.
 *
 * Endpoint: https://csfloat.com/api/v1/listings?market_hash_name=...
 * Returns live order book. Prices in cents USD.
 *
 * Affiliate: CSFloat has a referral program — set CSFLOAT_PARTNER_CODE
 * in env to attach ?ref= to outbound links.
 */

const ENDPOINT = 'https://csfloat.com/api/v1/listings';
const TIMEOUT_MS = 10000;
const DEFAULT_MAX_ATTEMPTS = 3;
const CSFLOAT_PARTNER_CODE = process.env.CSFLOAT_PARTNER_CODE || '';

export function parseCsfloatListings(listings) {
  const map = new Map();
  if (!Array.isArray(listings)) return map;
  for (const l of listings) {
    const name = l?.item?.market_hash_name;
    if (!name || typeof l.price !== 'number') continue;
    const existing = map.get(name);
    if (existing) {
      existing.minPriceCents = Math.min(existing.minPriceCents, l.price);
      existing.listingCount += 1;
      if (typeof l.float_value === 'number') {
        existing.minFloat = existing.minFloat == null ? l.float_value : Math.min(existing.minFloat, l.float_value);
      }
    } else {
      map.set(name, {
        marketHashName: name,
        minPriceCents: l.price,
        listingCount: 1,
        minFloat: typeof l.float_value === 'number' ? l.float_value : null,
      });
    }
  }
  return map;
}

export function buildCsfloatAffiliateUrl(marketHashName) {
  const url = `https://csfloat.com/search?market_hash_name=${encodeURIComponent(marketHashName)}`;
  return CSFLOAT_PARTNER_CODE ? `${url}&ref=${CSFLOAT_PARTNER_CODE}` : url;
}

export async function fetchCsfloatItem(
  marketHashName,
  { fetchImpl = fetch, maxAttempts = DEFAULT_MAX_ATTEMPTS } = {}
) {
  const url = `${ENDPOINT}?market_hash_name=${encodeURIComponent(marketHashName)}&limit=50&sort_by=lowest_price`;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res;
    try {
      res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      lastError = e.message;
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }
    if (res.status === 404) return null;
    if (res.status === 429) {
      lastError = '429 rate-limited';
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 3000 * attempt));
        continue;
      }
      throw new Error('CSFloat rate-limited');
    }
    if (!res.ok) {
      lastError = `CSFloat HTTP ${res.status}`;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw new Error(lastError);
    }
    const json = await res.json();
    const map = parseCsfloatListings(json?.data ?? []);
    const r = map.get(marketHashName);
    if (!r) return null;
    return {
      marketHashName,
      minPriceUsd: r.minPriceCents / 100,
      listingCount: r.listingCount,
      minFloat: r.minFloat,
      affiliateUrl: buildCsfloatAffiliateUrl(marketHashName),
    };
  }
  throw new Error(lastError ?? 'unknown csfloat error');
}
