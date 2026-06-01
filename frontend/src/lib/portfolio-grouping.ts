// frontend/src/lib/portfolio-grouping.ts
// Pure helpers for the Holdings view. No React, no I/O — fully unit-testable.

export type Purchase = { id: number; amount: number; buyPrice: number; buyDate: string };

export type PortfolioSkin = {
  id: number;
  name: string;
  marketHashName?: string;
  slug?: string | null;
  weaponSlug?: string | null;
  imageUrl?: string | null;
  marketPrice?: number | null;
  rarity?: string | null;
  weaponType?: string | null;
  /** Wear. The API exposes this as `exterior` (NOT `wear`). */
  exterior?: string | null;
  priceChange24h?: number | null;
  priceChange7d?: number | null;
};

export type PortfolioEntry = {
  amount: number;
  avgPrice: number;
  buyPrice?: number;
  purchases: Purchase[];
  skin: PortfolioSkin;
};

export const NO_PRICE_KEY = '__no_price__';
export const NO_PRICE_LABEL = 'No market price';

export function hasMarketPrice(e: PortfolioEntry): boolean {
  return typeof e.skin.marketPrice === 'number' && Number.isFinite(e.skin.marketPrice);
}

export function positionValue(e: PortfolioEntry): number {
  return hasMarketPrice(e) ? (e.skin.marketPrice as number) * e.amount : 0;
}

export function costBasis(e: PortfolioEntry): number {
  return (e.avgPrice ?? 0) * e.amount;
}

export function entryPL(e: PortfolioEntry): number | null {
  if (!hasMarketPrice(e) || !(e.avgPrice > 0)) return null;
  return (((e.skin.marketPrice as number) - e.avgPrice) / e.avgPrice) * 100;
}

export function weaponGroupKey(skin: PortfolioSkin): string {
  const wt = (skin.weaponType ?? '').trim();
  if (wt) return wt;
  const parsed = (skin.name ?? '').split('|')[0]?.trim();
  return parsed || 'Other';
}

import { safeIncludes, safeLocaleCompare } from '@/lib/strings';

export type SortKey = 'value' | 'name' | 'performance' | 'recent';

export type PortfolioFilter = {
  search?: string;
  weapon?: string | null;
  rarity?: string | null;
  exterior?: string | null;
};

export function filterEntries(entries: PortfolioEntry[], f: PortfolioFilter): PortfolioEntry[] {
  const search = (f.search ?? '').trim();
  return entries.filter((e) => {
    if (search && !safeIncludes(e.skin.name, search)) return false;
    if (f.weapon && weaponGroupKey(e.skin) !== f.weapon) return false;
    if (f.rarity && (e.skin.rarity ?? '') !== f.rarity) return false;
    if (f.exterior && (e.skin.exterior ?? '') !== f.exterior) return false;
    return true;
  });
}

function latestPurchaseTime(e: PortfolioEntry): number {
  let max = 0;
  for (const p of e.purchases ?? []) {
    const t = new Date(p.buyDate).getTime();
    if (Number.isFinite(t) && t > max) max = t;
  }
  return max;
}

export function sortEntries(entries: PortfolioEntry[], sortBy: SortKey): PortfolioEntry[] {
  const copy = [...entries];
  switch (sortBy) {
    case 'name':
      return copy.sort((a, b) => safeLocaleCompare(a.skin.name, b.skin.name));
    case 'performance':
      return copy.sort((a, b) => {
        const pa = entryPL(a), pb = entryPL(b);
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pb - pa;
      });
    case 'recent':
      return copy.sort((a, b) => latestPurchaseTime(b) - latestPurchaseTime(a));
    case 'value':
    default:
      return copy.sort((a, b) => positionValue(b) - positionValue(a));
  }
}
