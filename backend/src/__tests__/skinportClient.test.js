import { describe, it, expect, jest } from '@jest/globals';
import { fetchSkinportItem, parseSkinportItems } from '../services/pricing/skinportClient.js';

describe('parseSkinportItems', () => {
  it('returns map keyed by marketHashName with ask + bid in USD', () => {
    // Skinport feed returns EUR in whole-unit scale (verified 2026-05-22).
    const raw = [
      { market_hash_name: 'AK-47 | Redline (Field-Tested)', min_price: 13.95, suggested_price: 15.00, currency: 'EUR' },
      { market_hash_name: 'AWP | Asiimov (Field-Tested)',   min_price: 50.99, suggested_price: 53.00, currency: 'EUR' },
    ];
    const out = parseSkinportItems(raw);
    expect(out.get('AK-47 | Redline (Field-Tested)')).toMatchObject({
      askEur: expect.closeTo(13.95, 2),
      suggestedEur: expect.closeTo(15.00, 2),
    });
    expect(out.size).toBe(2);
  });

  it('skips items missing prices', () => {
    const raw = [{ market_hash_name: 'X', min_price: null, suggested_price: 100 }];
    const out = parseSkinportItems(raw, { eurToUsd: 1 });
    expect(out.size).toBe(0);
  });
});

describe('fetchSkinportItem', () => {
  it('returns null when item not in feed', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => [{ market_hash_name: 'Other', min_price: 100, suggested_price: 120 }],
    }));
    const result = await fetchSkinportItem('AK-47 | Redline (FT)', { fetchImpl });
    expect(result).toBeNull();
  });

  it('returns parsed prices when item found', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => [{
        market_hash_name: 'AK-47 | Redline (FT)',
        min_price: 13.95,
        suggested_price: 15.00,
        currency: 'EUR',
      }],
    }));
    const result = await fetchSkinportItem('AK-47 | Redline (FT)', { fetchImpl });
    expect(result).toMatchObject({
      askEur: expect.closeTo(13.95, 2),
      affiliateUrl: expect.stringContaining('skinport.com'),
    });
  });

  it('throws on HTTP 429 after retries', async () => {
    const fetchImpl = jest.fn(async () => ({ ok: false, status: 429, headers: new Headers({ 'retry-after': '0' }) }));
    await expect(fetchSkinportItem('X', { fetchImpl, maxAttempts: 2 })).rejects.toThrow(/429|rate-limited/i);
  });
});
