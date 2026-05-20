import { describe, it, expect, jest } from '@jest/globals';
import { fetchCsfloatItem, parseCsfloatListings } from '../services/pricing/csfloatClient.js';

describe('parseCsfloatListings', () => {
  it('aggregates min/median listings into a single record', () => {
    const raw = [
      { item: { market_hash_name: 'AK-47 | Redline (FT)' }, price: 1200, float_value: 0.21 },
      { item: { market_hash_name: 'AK-47 | Redline (FT)' }, price: 1500, float_value: 0.18 },
      { item: { market_hash_name: 'AK-47 | Redline (FT)' }, price: 1800, float_value: 0.17 },
    ];
    const out = parseCsfloatListings(raw);
    const r = out.get('AK-47 | Redline (FT)');
    expect(r.minPriceCents).toBe(1200);
    expect(r.listingCount).toBe(3);
    expect(r.minFloat).toBe(0.17);
  });

  it('returns empty map for empty input', () => {
    expect(parseCsfloatListings([]).size).toBe(0);
  });
});

describe('fetchCsfloatItem', () => {
  it('returns null on 404', async () => {
    const fetchImpl = jest.fn(async () => ({ ok: false, status: 404 }));
    const result = await fetchCsfloatItem('Nope', { fetchImpl });
    expect(result).toBeNull();
  });

  it('returns parsed result on success', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        data: [
          { item: { market_hash_name: 'AK-47 | Redline (FT)' }, price: 1500, float_value: 0.20 },
        ],
      }),
    }));
    const result = await fetchCsfloatItem('AK-47 | Redline (FT)', { fetchImpl });
    expect(result).toMatchObject({
      minPriceUsd: expect.closeTo(15.00, 2),
      listingCount: 1,
      affiliateUrl: expect.stringContaining('csfloat.com'),
    });
  });
});
