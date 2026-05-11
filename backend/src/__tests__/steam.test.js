import { describe, it, expect, jest } from '@jest/globals';
import {
  buildAuthRedirectUrl,
  signState,
  verifyState,
  parseSteamIdFromClaimedId,
  STEAM_OPENID_NS,
} from '../services/steam/steamOpenId.js';

describe('steamOpenId — state HMAC', () => {
  it('signs and verifies a payload roundtrip', () => {
    const secret = 'unit-test-secret';
    const payload = { userId: 42, nonce: 'abc' };
    const state = signState(payload, secret);
    expect(typeof state).toBe('string');
    const verified = verifyState(state, secret);
    expect(verified.userId).toBe(42);
    expect(verified.nonce).toBe('abc');
  });

  it('rejects state signed with a different secret', () => {
    const state = signState({ userId: 1 }, 'secret-a');
    expect(() => verifyState(state, 'secret-b')).toThrow();
  });

  it('rejects tampered state', () => {
    const state = signState({ userId: 1 }, 'secret');
    const tampered = state.slice(0, -2) + 'xx';
    expect(() => verifyState(tampered, 'secret')).toThrow();
  });
});

describe('steamOpenId — buildAuthRedirectUrl', () => {
  it('produces a valid Steam OpenID 2.0 URL with required params', () => {
    const url = buildAuthRedirectUrl({
      returnTo: 'https://api.example.com/steam/connect/callback?state=abc',
      realm: 'https://api.example.com/',
    });
    expect(url).toMatch(/^https:\/\/steamcommunity\.com\/openid\/login\?/);
    expect(url).toContain('openid.ns=' + encodeURIComponent(STEAM_OPENID_NS));
    expect(url).toContain('openid.mode=checkid_setup');
    expect(url).toContain('openid.return_to=' + encodeURIComponent('https://api.example.com/steam/connect/callback?state=abc'));
    expect(url).toContain('openid.realm=' + encodeURIComponent('https://api.example.com/'));
    expect(url).toContain('openid.identity=' + encodeURIComponent('http://specs.openid.net/auth/2.0/identifier_select'));
    expect(url).toContain('openid.claimed_id=' + encodeURIComponent('http://specs.openid.net/auth/2.0/identifier_select'));
  });
});

describe('steamOpenId — parseSteamIdFromClaimedId', () => {
  it('extracts a 17-digit steamId from a valid claimed_id', () => {
    const id = parseSteamIdFromClaimedId('https://steamcommunity.com/openid/id/76561198000000001');
    expect(id).toBe('76561198000000001');
  });

  it('returns null for a non-Steam claimed_id', () => {
    expect(parseSteamIdFromClaimedId('https://example.com/openid/id/123')).toBeNull();
  });

  it('returns null for a malformed steamId', () => {
    expect(parseSteamIdFromClaimedId('https://steamcommunity.com/openid/id/notanumber')).toBeNull();
  });
});

import {
  fetchInventory,
  parseInventory,
  clearInventoryCache,
} from '../services/steam/steamInventoryClient.js';

describe('parseInventory', () => {
  it('joins assets with descriptions by classid+instanceid', () => {
    const raw = {
      success: 1,
      assets: [
        { classid: '100', instanceid: '0', assetid: 'A1' },
        { classid: '100', instanceid: '0', assetid: 'A2' },
        { classid: '200', instanceid: '0', assetid: 'B1' },
      ],
      descriptions: [
        { classid: '100', instanceid: '0', market_hash_name: 'AK-47 | Redline (Field-Tested)', tradable: 1, marketable: 1 },
        { classid: '200', instanceid: '0', market_hash_name: 'AWP | Asiimov (Battle-Scarred)', tradable: 1, marketable: 1 },
      ],
    };
    const parsed = parseInventory(raw);
    expect(parsed).toEqual([
      { marketHashName: 'AK-47 | Redline (Field-Tested)', amount: 2, tradable: true, marketable: true },
      { marketHashName: 'AWP | Asiimov (Battle-Scarred)', amount: 1, tradable: true, marketable: true },
    ]);
  });

  it('groups duplicate market_hash_names across different classids', () => {
    const raw = {
      success: 1,
      assets: [
        { classid: '1', instanceid: '0', assetid: 'A' },
        { classid: '2', instanceid: '0', assetid: 'B' },
      ],
      descriptions: [
        { classid: '1', instanceid: '0', market_hash_name: 'Same Skin', tradable: 1, marketable: 1 },
        { classid: '2', instanceid: '0', market_hash_name: 'Same Skin', tradable: 0, marketable: 1 },
      ],
    };
    const parsed = parseInventory(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({ marketHashName: 'Same Skin', amount: 2, tradable: false, marketable: true });
  });

  it('returns empty array on success=0 or missing fields', () => {
    expect(parseInventory({ success: 0 })).toEqual([]);
    expect(parseInventory({})).toEqual([]);
    expect(parseInventory(null)).toEqual([]);
  });
});

describe('fetchInventory', () => {
  it('returns parsed inventory on 200', async () => {
    clearInventoryCache();
    const fetchImpl = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: 1,
        assets: [{ classid: '1', instanceid: '0', assetid: 'X' }],
        descriptions: [{ classid: '1', instanceid: '0', market_hash_name: 'Test', tradable: 1, marketable: 1 }],
      }),
    });
    const items = await fetchInventory('76561198000000001', { fetchImpl, sleepImpl: async () => {} });
    expect(items).toEqual([{ marketHashName: 'Test', amount: 1, tradable: true, marketable: true }]);
  });

  it('throws on 403 (private inventory)', async () => {
    clearInventoryCache();
    const fetchImpl = async () => ({ ok: false, status: 403, text: async () => '' });
    await expect(
      fetchInventory('76561198000000002', { fetchImpl, sleepImpl: async () => {} })
    ).rejects.toThrow(/private/i);
  });

  it('retries 429 then succeeds', async () => {
    clearInventoryCache();
    let n = 0;
    const fetchImpl = async () => {
      n++;
      if (n === 1) return { ok: false, status: 429, headers: { get: () => '1' }, text: async () => '' };
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: 1, assets: [], descriptions: [] }),
      };
    };
    const items = await fetchInventory('76561198000000003', { fetchImpl, sleepImpl: async () => {} });
    expect(items).toEqual([]);
    expect(n).toBe(2);
  });

  it('caches results for 5 min per steamId', async () => {
    clearInventoryCache();
    let n = 0;
    const fetchImpl = async () => {
      n++;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: 1,
          assets: [{ classid: '1', instanceid: '0', assetid: 'A' }],
          descriptions: [{ classid: '1', instanceid: '0', market_hash_name: 'Cached', tradable: 1, marketable: 1 }],
        }),
      };
    };
    await fetchInventory('76561198000000004', { fetchImpl, sleepImpl: async () => {} });
    await fetchInventory('76561198000000004', { fetchImpl, sleepImpl: async () => {} });
    expect(n).toBe(1);
  });
});

import { matchInventory } from '../services/steam/inventoryMatcher.js';

describe('matchInventory', () => {
  it('matches a Skin by marketHashName', async () => {
    const fakePrisma = {
      skin:       { findMany: jest.fn().mockResolvedValue([{ id: 5, name: 'AK-47 | Redline', marketHashName: 'AK-47 | Redline (Field-Tested)', priceLatest: 12.5 }]) },
      case:       { findMany: jest.fn().mockResolvedValue([]) },
      marketItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const items = [{ marketHashName: 'AK-47 | Redline (Field-Tested)', amount: 2, tradable: true, marketable: true }];
    const result = await matchInventory(items, { prismaClient: fakePrisma });
    expect(result.matched).toEqual([{
      kind: 'skin',
      skinId: 5,
      caseId: null,
      marketItemId: null,
      marketHashName: 'AK-47 | Redline (Field-Tested)',
      name: 'AK-47 | Redline',
      amount: 2,
      tradable: true,
      marketable: true,
      currentPrice: 12.5,
    }]);
    expect(result.skipped).toHaveLength(0);
  });

  it('matches a Case by name (not marketHashName)', async () => {
    const fakePrisma = {
      skin:       { findMany: jest.fn().mockResolvedValue([]) },
      case:       { findMany: jest.fn().mockResolvedValue([{ id: 9, name: 'Operation Bravo Case', price: 80 }]) },
      marketItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const items = [{ marketHashName: 'Operation Bravo Case', amount: 1, tradable: true, marketable: true }];
    const result = await matchInventory(items, { prismaClient: fakePrisma });
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].kind).toBe('case');
    expect(result.matched[0].caseId).toBe(9);
  });

  it('matches a MarketItem (sticker) by marketHashName', async () => {
    const fakePrisma = {
      skin:       { findMany: jest.fn().mockResolvedValue([]) },
      case:       { findMany: jest.fn().mockResolvedValue([]) },
      marketItem: { findMany: jest.fn().mockResolvedValue([{ id: 77, name: 'Sticker | Foo (Holo)', marketHashName: 'Sticker | Foo (Holo)', category: 'sticker', priceLatest: 5 }]) },
    };
    const items = [{ marketHashName: 'Sticker | Foo (Holo)', amount: 3, tradable: false, marketable: true }];
    const result = await matchInventory(items, { prismaClient: fakePrisma });
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].kind).toBe('market_item');
    expect(result.matched[0].marketItemId).toBe(77);
  });

  it('lists unmatched items in skipped with reason', async () => {
    const fakePrisma = {
      skin:       { findMany: jest.fn().mockResolvedValue([]) },
      case:       { findMany: jest.fn().mockResolvedValue([]) },
      marketItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const items = [{ marketHashName: 'Unknown New Item', amount: 1, tradable: true, marketable: true }];
    const result = await matchInventory(items, { prismaClient: fakePrisma });
    expect(result.matched).toHaveLength(0);
    expect(result.skipped).toEqual([{ marketHashName: 'Unknown New Item', amount: 1, reason: 'not_in_catalog' }]);
  });

  it('prefers Skin match over MarketItem match for same name', async () => {
    const fakePrisma = {
      skin:       { findMany: jest.fn().mockResolvedValue([{ id: 5, name: 'X', marketHashName: 'X', priceLatest: 10 }]) },
      case:       { findMany: jest.fn().mockResolvedValue([]) },
      marketItem: { findMany: jest.fn().mockResolvedValue([{ id: 99, name: 'X', marketHashName: 'X', priceLatest: 10 }]) },
    };
    const items = [{ marketHashName: 'X', amount: 1, tradable: true, marketable: true }];
    const result = await matchInventory(items, { prismaClient: fakePrisma });
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].kind).toBe('skin');
  });

  it('returns empty for empty input', async () => {
    const fakePrisma = {
      skin:       { findMany: jest.fn() },
      case:       { findMany: jest.fn() },
      marketItem: { findMany: jest.fn() },
    };
    const result = await matchInventory([], { prismaClient: fakePrisma });
    expect(result).toEqual({ matched: [], skipped: [] });
    expect(fakePrisma.skin.findMany).not.toHaveBeenCalled();
  });
});

import { importSkinMatches } from '../services/steam/portfolioImporter.js';

describe('importSkinMatches', () => {
  function makeMatch(over) {
    return {
      kind: 'skin', skinId: 5, caseId: null, marketItemId: null,
      marketHashName: 'AK-47 | Redline (FT)', name: 'AK-47 | Redline',
      amount: 2, tradable: true, marketable: true, currentPrice: 12.5,
      ...over,
    };
  }

  it('creates a Portfolio row per skin match with buyPrice=null when mode=empty', async () => {
    const created = [];
    const fakePrisma = {
      portfolio: { create: jest.fn(async (args) => { created.push(args.data); return { id: created.length, ...args.data }; }) },
    };
    const matches = [makeMatch(), makeMatch({ skinId: 6, currentPrice: 99 })];
    const result = await importSkinMatches({ userId: 7, matches, costBasisMode: 'empty' }, { prismaClient: fakePrisma });
    expect(result.created).toBe(2);
    expect(created[0]).toEqual(expect.objectContaining({ userId: 7, skinId: 5, amount: 2, buyPrice: null }));
    expect(created[0].importedFromSteamAt).toBeInstanceOf(Date);
    expect(created[1].skinId).toBe(6);
    expect(created[1].buyPrice).toBeNull();
  });

  it('uses currentPrice as buyPrice when mode=current_market', async () => {
    const fakePrisma = {
      portfolio: { create: jest.fn(async (args) => ({ id: 1, ...args.data })) },
    };
    const matches = [makeMatch({ currentPrice: 12.5 })];
    const result = await importSkinMatches({ userId: 1, matches, costBasisMode: 'current_market' }, { prismaClient: fakePrisma });
    expect(result.created).toBe(1);
    expect(fakePrisma.portfolio.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ buyPrice: 12.5 }),
    }));
  });

  it('uses custom map (skinId -> buyPrice/buyDate) when mode=custom', async () => {
    const fakePrisma = {
      portfolio: { create: jest.fn(async (args) => ({ id: 1, ...args.data })) },
    };
    const matches = [makeMatch({ skinId: 5 }), makeMatch({ skinId: 6 })];
    const custom = [
      { skinId: 5, buyPrice: 8.0, buyDate: new Date('2025-01-15') },
      { skinId: 6, buyPrice: null, buyDate: null },
    ];
    await importSkinMatches({ userId: 1, matches, costBasisMode: 'custom', custom }, { prismaClient: fakePrisma });
    expect(fakePrisma.portfolio.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      data: expect.objectContaining({ skinId: 5, buyPrice: 8.0, buyDate: new Date('2025-01-15') }),
    }));
    expect(fakePrisma.portfolio.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      data: expect.objectContaining({ skinId: 6, buyPrice: null }),
    }));
  });

  it('skips non-skin matches (case, market_item)', async () => {
    const fakePrisma = {
      portfolio: { create: jest.fn() },
    };
    const matches = [
      { kind: 'case', amount: 1, caseId: 9 },
      { kind: 'market_item', amount: 1, marketItemId: 77 },
    ];
    const result = await importSkinMatches({ userId: 1, matches, costBasisMode: 'empty' }, { prismaClient: fakePrisma });
    expect(result.created).toBe(0);
    expect(fakePrisma.portfolio.create).not.toHaveBeenCalled();
  });

  it('rejects unknown costBasisMode', async () => {
    const fakePrisma = { portfolio: { create: jest.fn() } };
    await expect(
      importSkinMatches({ userId: 1, matches: [makeMatch()], costBasisMode: 'bogus' }, { prismaClient: fakePrisma })
    ).rejects.toThrow(/invalid costBasisMode/i);
  });

  it('rejects missing userId', async () => {
    const fakePrisma = { portfolio: { create: jest.fn() } };
    await expect(
      importSkinMatches({ matches: [makeMatch()], costBasisMode: 'empty' }, { prismaClient: fakePrisma })
    ).rejects.toThrow(/userId/);
  });
});
