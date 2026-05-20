/**
 * Aggregates Steam Market (our local catalog data) + Skinport + CSFloat
 * into a single ordered list of sources for a single skin. External
 * fetchers may throw — we swallow and keep what works.
 *
 * Shape returned:
 *   {
 *     marketHashName,
 *     sources: [{ source, priceUsd, url, meta? }, ...],   // sorted cheapest first
 *     cheapestSource: 'steam'|'skinport'|'csfloat'|null,
 *     refreshedAt: ISO string,
 *   }
 */
import { fetchSkinportItem as defaultSkinport } from './skinportClient.js';
import { fetchCsfloatItem as defaultCsfloat } from './csfloatClient.js';

const STEAM_TX_FEE = 0.13; // Steam Community Market charges 13% on buyer side

export async function aggregateMultiSourcePrice(
  skin,
  { skinportImpl = defaultSkinport, csfloatImpl = defaultCsfloat } = {}
) {
  const refreshedAt = new Date().toISOString();
  const sources = [];

  // Steam — local catalog data, no fetch
  if (skin.priceLatest != null) {
    sources.push({
      source: 'steam',
      priceUsd: skin.priceLatest,
      effectivePriceUsd: skin.priceLatest * (1 + STEAM_TX_FEE),
      url: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName)}`,
      meta: { includesFee: true },
    });
  }

  // Skinport
  try {
    const sp = await skinportImpl(skin.marketHashName);
    if (sp?.askUsd != null) {
      sources.push({
        source: 'skinport',
        priceUsd: sp.askUsd,
        effectivePriceUsd: sp.askUsd,
        url: sp.affiliateUrl,
        meta: { suggestedUsd: sp.suggestedUsd ?? null },
      });
    }
  } catch (_e) {
    // swallow — partial data is fine
  }

  // CSFloat
  try {
    const cf = await csfloatImpl(skin.marketHashName);
    if (cf?.minPriceUsd != null) {
      sources.push({
        source: 'csfloat',
        priceUsd: cf.minPriceUsd,
        effectivePriceUsd: cf.minPriceUsd,
        url: cf.affiliateUrl,
        meta: { listingCount: cf.listingCount, minFloat: cf.minFloat },
      });
    }
  } catch (_e) {
    // swallow
  }

  sources.sort((a, b) => a.effectivePriceUsd - b.effectivePriceUsd);

  return {
    marketHashName: skin.marketHashName,
    sources,
    cheapestSource: sources[0]?.source ?? null,
    refreshedAt,
  };
}
