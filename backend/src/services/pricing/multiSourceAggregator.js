/**
 * Aggregates Steam Market (our local catalog data) + Skinport + CSFloat
 * into a single ordered list of sources for a single skin. External
 * fetchers may throw — we swallow and keep what works.
 *
 * Shape returned:
 *   {
 *     marketHashName,
 *     sources: [{ source, priceEur, url, meta? }, ...],   // sorted cheapest first
 *     cheapestSource: 'steam'|'skinport'|'csfloat'|null,
 *     refreshedAt: ISO string,
 *   }
 */
import { fetchSkinportItem as defaultSkinport } from './skinportClient.js';
import { fetchCsfloatItem as defaultCsfloat } from './csfloatClient.js';

// All prices are EUR (the app-wide convention). Two prior bugs inflated/
// mislabelled this as USD: a Steam ×1.13 "fee" markup and a Skinport EUR×1.08
// conversion. Steam's listed price IS what the buyer pays (the 13% is the
// seller's cut), so there is no buyer-side markup to add here.
export async function aggregateMultiSourcePrice(
  skin,
  { skinportImpl = defaultSkinport, csfloatImpl = defaultCsfloat } = {}
) {
  const refreshedAt = new Date().toISOString();
  const sources = [];

  // Steam — local catalog data (EUR), no fetch
  if (skin.priceLatest != null) {
    sources.push({
      source: 'steam',
      priceEur: skin.priceLatest,
      url: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName)}`,
    });
  }

  // Skinport (EUR cheapest live ask)
  try {
    const sp = await skinportImpl(skin.marketHashName);
    if (sp?.askEur != null) {
      sources.push({
        source: 'skinport',
        priceEur: sp.askEur,
        url: sp.affiliateUrl,
        meta: { suggestedEur: sp.suggestedEur ?? null },
      });
    }
  } catch (_e) {
    // swallow — partial data is fine
  }

  // CSFloat
  // NOTE: csfloatClient returns USD and currently 403s anonymously (broken), so
  // it normally contributes nothing. If/when it is fixed, convert USD → EUR
  // before pushing — do NOT compare its raw USD against the EUR rows. Tech debt.
  try {
    const cf = await csfloatImpl(skin.marketHashName);
    if (cf?.minPriceUsd != null) {
      sources.push({
        source: 'csfloat',
        priceEur: cf.minPriceUsd,
        url: cf.affiliateUrl,
        meta: { listingCount: cf.listingCount, minFloat: cf.minFloat, currencyCaveat: 'usd' },
      });
    }
  } catch (_e) {
    // swallow
  }

  sources.sort((a, b) => a.priceEur - b.priceEur);

  return {
    marketHashName: skin.marketHashName,
    sources,
    cheapestSource: sources[0]?.source ?? null,
    refreshedAt,
  };
}
