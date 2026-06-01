// frontend/src/lib/portfolio-grouping.test.ts
import { describe, it, expect } from 'vitest';
import {
  positionValue, costBasis, entryPL, hasMarketPrice, weaponGroupKey,
  type PortfolioEntry,
} from './portfolio-grouping';

const entry = (over: Partial<PortfolioEntry> & { skin?: Partial<PortfolioEntry['skin']> } = {}): PortfolioEntry => ({
  amount: 1,
  avgPrice: 100,
  purchases: [],
  ...over,
  skin: {
    id: 1, name: 'AK-47 | Redline', marketHashName: 'AK-47 | Redline',
    slug: null, weaponSlug: null, imageUrl: null, marketPrice: 120,
    rarity: 'Classified', weaponType: 'AK-47', exterior: 'Field-Tested',
    priceChange24h: null, priceChange7d: null,
    ...(over.skin ?? {}),
  },
});

describe('value math', () => {
  it('positionValue = marketPrice × amount', () => {
    expect(positionValue(entry({ amount: 3, skin: { marketPrice: 10 } as any }))).toBe(30);
  });
  it('positionValue is 0 when no market price', () => {
    expect(positionValue(entry({ skin: { marketPrice: null } as any }))).toBe(0);
  });
  it('costBasis = avgPrice × amount', () => {
    expect(costBasis(entry({ amount: 2, avgPrice: 50 }))).toBe(100);
  });
  it('entryPL is the % gain vs avg, null when no market', () => {
    expect(entryPL(entry({ avgPrice: 100, skin: { marketPrice: 120 } as any }))).toBeCloseTo(20);
    expect(entryPL(entry({ skin: { marketPrice: null } as any }))).toBeNull();
    expect(entryPL(entry({ avgPrice: 0, skin: { marketPrice: 5 } as any }))).toBeNull();
  });
  it('hasMarketPrice reflects a numeric marketPrice', () => {
    expect(hasMarketPrice(entry())).toBe(true);
    expect(hasMarketPrice(entry({ skin: { marketPrice: null } as any }))).toBe(false);
  });
});

describe('weaponGroupKey', () => {
  it('uses weaponType when present', () => {
    expect(weaponGroupKey(entry().skin)).toBe('AK-47');
    expect(weaponGroupKey(entry({ skin: { weaponType: '★ Bayonet' } as any }).skin)).toBe('★ Bayonet');
  });
  it('falls back to the weapon parsed from the name', () => {
    expect(weaponGroupKey(entry({ skin: { weaponType: undefined, name: 'AWP | Dragon Lore' } as any }).skin)).toBe('AWP');
  });
  it('falls back to "Other" when nothing is parseable', () => {
    expect(weaponGroupKey(entry({ skin: { weaponType: undefined, name: '' } as any }).skin)).toBe('Other');
  });
});

import { filterEntries, sortEntries } from './portfolio-grouping';

describe('filterEntries', () => {
  const ak = entry({ skin: { id: 1, name: 'AK-47 | Redline', weaponType: 'AK-47', rarity: 'Classified', exterior: 'Field-Tested', marketPrice: 10 } as any });
  const awp = entry({ skin: { id: 2, name: 'AWP | Asiimov', weaponType: 'AWP', rarity: 'Covert', exterior: 'Minimal Wear', marketPrice: 90 } as any });
  const all = [ak, awp];

  it('matches search against the skin name (case-insensitive)', () => {
    expect(filterEntries(all, { search: 'asii' })).toEqual([awp]);
  });
  it('filters by weapon (weaponType)', () => {
    expect(filterEntries(all, { weapon: 'AK-47' })).toEqual([ak]);
  });
  it('filters by rarity and by exterior', () => {
    expect(filterEntries(all, { rarity: 'Covert' })).toEqual([awp]);
    expect(filterEntries(all, { exterior: 'Field-Tested' })).toEqual([ak]);
  });
  it('combines filters (AND)', () => {
    expect(filterEntries(all, { weapon: 'AWP', rarity: 'Classified' })).toEqual([]);
  });
  it('empty/undefined filters return everything', () => {
    expect(filterEntries(all, {})).toEqual(all);
  });
});

describe('sortEntries', () => {
  const cheap = entry({ amount: 1, avgPrice: 100, purchases: [{ id: 1, amount: 1, buyPrice: 100, buyDate: '2026-01-01' }], skin: { id: 1, name: 'B', marketPrice: 10 } as any });
  const dear = entry({ amount: 1, avgPrice: 100, purchases: [{ id: 2, amount: 1, buyPrice: 100, buyDate: '2026-03-01' }], skin: { id: 2, name: 'A', marketPrice: 200 } as any });

  it('value sorts by position value desc', () => {
    expect(sortEntries([cheap, dear], 'value').map(e => e.skin.id)).toEqual([2, 1]);
  });
  it('name sorts alphabetically', () => {
    expect(sortEntries([cheap, dear], 'name').map(e => e.skin.name)).toEqual(['A', 'B']);
  });
  it('performance sorts by PL desc, nulls last', () => {
    const noPrice = entry({ skin: { id: 3, name: 'C', marketPrice: null } as any });
    expect(sortEntries([cheap, dear, noPrice], 'performance').map(e => e.skin.id)).toEqual([2, 1, 3]);
  });
  it('recent sorts by latest purchase date desc', () => {
    expect(sortEntries([cheap, dear], 'recent').map(e => e.skin.id)).toEqual([2, 1]);
  });
  it('does not mutate the input array', () => {
    const input = [cheap, dear];
    sortEntries(input, 'value');
    expect(input.map(e => e.skin.id)).toEqual([1, 2]);
  });
});
