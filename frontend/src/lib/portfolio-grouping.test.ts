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
