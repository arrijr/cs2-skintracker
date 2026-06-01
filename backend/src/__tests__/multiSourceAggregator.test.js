import { describe, it, expect, jest } from '@jest/globals';
import { aggregateMultiSourcePrice } from '../services/pricing/multiSourceAggregator.js';

describe('aggregateMultiSourcePrice', () => {
  it('returns sources ordered cheapest → most expensive', async () => {
    const skinportImpl = jest.fn(async () => ({ askEur: 14.50, affiliateUrl: 'https://skinport.com/item/x' }));
    const csfloatImpl  = jest.fn(async () => ({ minPriceUsd: 15.20, listingCount: 12, minFloat: 0.16, affiliateUrl: 'https://csfloat.com/search?q=x' }));
    const skin = { marketHashName: 'AK-47 | Redline (FT)', priceLatest: 16.00, slug: 'ak-47-redline-ft' };
    const out = await aggregateMultiSourcePrice(skin, { skinportImpl, csfloatImpl });
    expect(out.sources[0].source).toBe('skinport');
    expect(out.sources[0].priceEur).toBeCloseTo(14.50);
    expect(out.cheapestSource).toBe('skinport');
    expect(out.sources).toHaveLength(3);
  });

  it('keeps steam-only when external sources fail', async () => {
    const skinportImpl = jest.fn(async () => { throw new Error('Skinport down'); });
    const csfloatImpl  = jest.fn(async () => null);
    const skin = { marketHashName: 'X', priceLatest: 10.0, slug: 'x' };
    const out = await aggregateMultiSourcePrice(skin, { skinportImpl, csfloatImpl });
    expect(out.sources).toHaveLength(1);
    expect(out.sources[0].source).toBe('steam');
    expect(out.cheapestSource).toBe('steam');
  });

  it('returns empty when no source has data', async () => {
    const skinportImpl = jest.fn(async () => null);
    const csfloatImpl  = jest.fn(async () => null);
    const skin = { marketHashName: 'X', priceLatest: null, slug: 'x' };
    const out = await aggregateMultiSourcePrice(skin, { skinportImpl, csfloatImpl });
    expect(out.sources).toHaveLength(0);
    expect(out.cheapestSource).toBeNull();
  });
});
