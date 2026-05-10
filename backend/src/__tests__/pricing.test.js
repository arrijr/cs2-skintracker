import { describe, it, expect, jest } from '@jest/globals';
import { fetchPrice, parsePrice } from '../services/pricing/steamMarketClient.js';

describe('parsePrice', () => {
  it('parses "12,50€" as 12.50', () => {
    expect(parsePrice('12,50€')).toBeCloseTo(12.5, 2);
  });

  it('parses "1.234,56€" as 1234.56', () => {
    expect(parsePrice('1.234,56€')).toBeCloseTo(1234.56, 2);
  });

  it('parses "$5.99" as 5.99', () => {
    expect(parsePrice('$5.99')).toBeCloseTo(5.99, 2);
  });

  it('returns null for malformed', () => {
    expect(parsePrice('--')).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
  });
});

describe('fetchPrice', () => {
  it('returns parsed prices on 200', async () => {
    const fetchImpl = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        lowest_price: '10,00€',
        median_price: '11,00€',
        volume: '42',
      }),
    });
    const result = await fetchPrice('AK-47 | Redline (Field-Tested)', { fetchImpl, sleepImpl: async () => {} });
    expect(result.found).toBe(true);
    expect(result.priceLatest).toBeCloseTo(10, 2);
    expect(result.priceMedian).toBeCloseTo(11, 2);
    expect(result.volume24h).toBe(42);
  });

  it('returns found:false on 404', async () => {
    const fetchImpl = async () => ({
      ok: false,
      status: 404,
      json: async () => ({ success: false }),
    });
    const result = await fetchPrice('Nonexistent Item', { fetchImpl, sleepImpl: async () => {} });
    expect(result.found).toBe(false);
    expect(result.status).toBe(404);
  });

  it('retries on 429 up to max attempts', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls++;
      if (calls < 3) {
        return {
          ok: false,
          status: 429,
          headers: { get: () => '1' },
          text: async () => '',
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, lowest_price: '1,00€', median_price: '1,00€', volume: '1' }),
      };
    };
    const result = await fetchPrice('Test', { fetchImpl, sleepImpl: async () => {} });
    expect(result.found).toBe(true);
    expect(calls).toBe(3);
  });
});
