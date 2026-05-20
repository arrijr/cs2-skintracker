/**
 * Skinport public price feed client.
 *
 * Endpoint: https://api.skinport.com/v1/items?app_id=730&currency=EUR
 * Returns the entire CS2 catalog in one JSON array (~3-5MB). We fetch
 * once and parse in-memory; the daily Inngest cron handles the bulk
 * refresh, and this `fetchSkinportItem` is a thin convenience wrapper
 * around the same parse for ad-hoc lookups.
 *
 * Affiliate links: docs say no public referral program yet — placeholder
 * for the partner code once approved. Until then, links go to the bare
 * Skinport URL.
 */

const ENDPOINT = 'https://api.skinport.com/v1/items?app_id=730&currency=EUR&tradable=0';
const TIMEOUT_MS = 15000;
const DEFAULT_MAX_ATTEMPTS = 3;
const SKINPORT_PARTNER_CODE = process.env.SKINPORT_PARTNER_CODE || '';

export function parseSkinportItems(items, { eurToUsd = 1.08 } = {}) {
  const map = new Map();
  if (!Array.isArray(items)) return map;
  for (const it of items) {
    if (!it?.market_hash_name) continue;
    if (typeof it.min_price !== 'number') continue;
    const askEur = it.min_price / 100;
    const suggestedEur = typeof it.suggested_price === 'number' ? it.suggested_price / 100 : null;
    map.set(it.market_hash_name, {
      marketHashName: it.market_hash_name,
      askUsd: askEur * eurToUsd,
      suggestedUsd: suggestedEur != null ? suggestedEur * eurToUsd : null,
      affiliateUrl: buildAffiliateUrl(it.market_hash_name),
    });
  }
  return map;
}

export function buildAffiliateUrl(marketHashName) {
  const slug = marketHashName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const base = `https://skinport.com/item/${encodeURIComponent(slug)}`;
  return SKINPORT_PARTNER_CODE ? `${base}?ref=${SKINPORT_PARTNER_CODE}` : base;
}

export async function fetchSkinportItem(
  marketHashName,
  { fetchImpl = fetch, eurToUsd = 1.08, maxAttempts = DEFAULT_MAX_ATTEMPTS } = {}
) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res;
    try {
      res = await fetchImpl(ENDPOINT, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      lastError = e.message;
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }

    if (res.status === 429) {
      const retryAfter = parseFloat(res.headers?.get?.('retry-after') ?? '5');
      lastError = `429 (retry-after ${retryAfter}s)`;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, Math.min(retryAfter * 1000, 30000)));
        continue;
      }
      throw new Error(`Skinport rate-limited after ${maxAttempts} attempts`);
    }
    if (!res.ok) {
      lastError = `Skinport HTTP ${res.status}`;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw new Error(lastError);
    }

    const data = await res.json();
    const map = parseSkinportItems(data, { eurToUsd });
    return map.get(marketHashName) ?? null;
  }
  throw new Error(lastError ?? 'unknown skinport error');
}
