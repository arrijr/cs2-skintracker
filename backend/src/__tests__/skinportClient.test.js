import { describe, it, expect, jest } from '@jest/globals';
import { fetchSkinportItem, parseSkinportItems } from '../services/pricing/skinportClient.js';

describe('parseSkinportItems', () => {
  it('returns map keyed by marketHashName with ask + bid in USD', () => {
    const raw = [
      { market_hash_name: 'AK-47 | Redline (Field-Tested)', min_price: 1395, suggested_price: 1500, currency: 'EUR' },
      { market_hash_name: 'AWP | Asiimov (Field-Tested)',   min_price: 5099, suggested_price: 5300, currency: 'EUR' },
    ];
    const out = parseSkinportItems(raw, { eurToUsd: 1.08 });
    expect(out.get('AK-47 | Redline (Field-Tested)')).toMatchObject({
      askUsd: expect.closeTo(15.07, 1),
      suggestedUsd: expect.closeTo(16.20, 1),
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
        min_price: 1395,
        suggested_price: 1500,
        currency: 'EUR',
      }],
    }));
    const result = await fetchSkinportItem('AK-47 | Redline (FT)', { fetchImpl, eurToUsd: 1.08 });
    expect(result).toMatchObject({
      askUsd: expect.closeTo(15.07, 1),
      affiliateUrl: expect.stringContaining('skinport.com'),
    });
  });

  it('throws on HTTP 429 after retries', async () => {
    const fetchImpl = jest.fn(async () => ({ ok: false, status: 429, headers: new Headers({ 'retry-after': '0' }) }));
    await expect(fetchSkinportItem('X', { fetchImpl, maxAttempts: 2 })).rejects.toThrow(/429|rate-limited/i);
  });
});
