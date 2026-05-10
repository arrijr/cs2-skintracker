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

import { recordPriceResult } from '../services/pricing/priceRefreshJob.js';
import { nextDeadState, DEAD_ITEM_THRESHOLD } from '../services/pricing/deadItemTracker.js';

describe('nextDeadState', () => {
  it('resets to 0 on found', () => {
    expect(nextDeadState(2, true, 200)).toEqual({ nextCount: 0, markInactive: false });
  });
  it('increments on 404', () => {
    expect(nextDeadState(1, false, 404)).toEqual({ nextCount: 2, markInactive: false });
  });
  it('marks inactive after 3rd consecutive 404', () => {
    expect(nextDeadState(2, false, 404)).toEqual({ nextCount: 3, markInactive: true });
  });
  it('does not bump on transient 429', () => {
    expect(nextDeadState(2, false, 429)).toEqual({ nextCount: 2, markInactive: false });
  });
});

describe('recordPriceResult', () => {
  it('updates skin row + creates snapshot on success', async () => {
    const updateSkin = jest.fn();
    const createSnap = jest.fn();
    const fakePrisma = {
      skin: { update: updateSkin },
      marketSnapshot: { create: createSnap },
    };
    const item = { id: 1, itemType: 'skin', marketHashName: 'X' };
    const result = { found: true, priceLatest: 10, priceMedian: 11, volume24h: 5 };
    await recordPriceResult(item, result, { prismaClient: fakePrisma });
    expect(updateSkin).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 1 },
      data: expect.objectContaining({ priceLatest: 10, priceMedian: 11 }),
    }));
    expect(createSnap).toHaveBeenCalled();
  });

  it('increments consecutive404 on not-found for marketItem', async () => {
    const updateItem = jest.fn();
    const fakePrisma = {
      marketItem: { update: updateItem },
      marketSnapshot: { create: jest.fn() },
    };
    const item = { id: 5, itemType: 'market_item', marketHashName: 'Y', consecutive404: 1 };
    const result = { found: false, status: 404 };
    await recordPriceResult(item, result, { prismaClient: fakePrisma });
    expect(updateItem).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 5 },
      data: expect.objectContaining({ consecutive404: 2 }),
    }));
  });

  it('marks marketItem inactive after 3 consecutive 404s', async () => {
    const updateItem = jest.fn();
    const fakePrisma = {
      marketItem: { update: updateItem },
      marketSnapshot: { create: jest.fn() },
    };
    const item = { id: 5, itemType: 'market_item', marketHashName: 'Y', consecutive404: 2 };
    const result = { found: false, status: 404 };
    await recordPriceResult(item, result, { prismaClient: fakePrisma });
    expect(updateItem).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ consecutive404: 3, isActive: false }),
    }));
  });

  it('does not create snapshot when not found', async () => {
    const createSnap = jest.fn();
    const fakePrisma = {
      skin: { update: jest.fn() },
      marketSnapshot: { create: createSnap },
    };
    const item = { id: 1, itemType: 'skin', marketHashName: 'X' };
    await recordPriceResult(item, { found: false, status: 404 }, { prismaClient: fakePrisma });
    expect(createSnap).not.toHaveBeenCalled();
  });
});
