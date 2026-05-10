import { describe, it, expect, jest } from '@jest/globals';
import { fetchCategory, CATEGORIES, normalizeItem } from '../services/catalog/bymykelClient.js';
import { syncCategoryToDb } from '../services/catalog/catalogSyncJob.js';

describe('bymykelClient', () => {
  it('exposes the 9 supported categories', () => {
    expect(CATEGORIES).toEqual(expect.arrayContaining([
      'skins', 'cases', 'stickers', 'agents', 'patches', 'graffiti', 'music_kits', 'collectibles', 'keys'
    ]));
  });

  it('fetchCategory parses JSON and returns array', async () => {
    const stubFetch = async () => ({
      ok: true,
      json: async () => [
        { id: 'sticker-1', name: 'Foo | Holo', market_hash_name: 'Foo | Holo', image: 'http://x/y.png', rarity: { name: 'Exotic' } },
      ],
    });
    const items = await fetchCategory('stickers', { fetchImpl: stubFetch });
    expect(Array.isArray(items)).toBe(true);
    expect(items[0].name).toBe('Foo | Holo');
  });

  it('fetchCategory throws on non-2xx', async () => {
    const stubFetch = async () => ({ ok: false, status: 503, text: async () => 'down' });
    await expect(fetchCategory('skins', { fetchImpl: stubFetch })).rejects.toThrow(/503/);
  });

  it('fetchCategory throws on unsupported category', async () => {
    await expect(fetchCategory('not_a_category')).rejects.toThrow(/Unsupported category/);
  });

  it('normalizeItem extracts common subset for stickers', () => {
    const raw = {
      id: 'sticker-1',
      name: 'Test Sticker',
      market_hash_name: 'Test Sticker',
      image: 'http://x/y.png',
      rarity: { name: 'Exotic' },
      tournament_event: 'Krakow 2017',
      tournament_team: 'Team A',
    };
    const norm = normalizeItem(raw, 'stickers');
    expect(norm.externalId).toBe('sticker-1');
    expect(norm.name).toBe('Test Sticker');
    expect(norm.marketHashName).toBe('Test Sticker');
    expect(norm.imageUrl).toBe('http://x/y.png');
    expect(norm.rarity).toBe('Exotic');
    expect(norm.metadata.tournament).toBe('Krakow 2017');
  });

  it('normalizeItem falls back to name when market_hash_name missing', () => {
    const raw = { id: 'a-1', name: 'NoHashName', image: null };
    const norm = normalizeItem(raw, 'agents');
    expect(norm.marketHashName).toBe('NoHashName');
  });
});

describe('catalogSyncJob.syncCategoryToDb', () => {
  it('upserts MarketItem rows for sticker category', async () => {
    const fakePrisma = {
      marketItem: {
        upsert: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };
    const items = [
      { externalId: 'sticker-1', category: 'stickers', name: 'A', marketHashName: 'A', imageUrl: null, rarity: null, collection: null, metadata: {} },
      { externalId: 'sticker-2', category: 'stickers', name: 'B', marketHashName: 'B', imageUrl: null, rarity: null, collection: null, metadata: {} },
    ];
    const result = await syncCategoryToDb('stickers', items, { prismaClient: fakePrisma });
    expect(result.upserted).toBe(2);
    expect(fakePrisma.marketItem.upsert).toHaveBeenCalledTimes(2);
  });

  it('routes skins category to prisma.skin upsert (not marketItem)', async () => {
    const fakePrisma = {
      skin: { upsert: jest.fn().mockResolvedValue({ id: 99 }) },
      marketItem: { upsert: jest.fn() },
    };
    const items = [
      { externalId: 'skin-1', category: 'skins', name: 'AK-47 | Redline', marketHashName: 'AK-47 | Redline (Field-Tested)', imageUrl: null, rarity: 'Classified', collection: 'Phoenix', metadata: {} },
    ];
    await syncCategoryToDb('skins', items, { prismaClient: fakePrisma });
    expect(fakePrisma.skin.upsert).toHaveBeenCalledTimes(1);
    expect(fakePrisma.marketItem.upsert).not.toHaveBeenCalled();
  });

  it('routes cases category to prisma.case upsert', async () => {
    const fakePrisma = {
      case: { upsert: jest.fn().mockResolvedValue({ id: 7 }) },
      marketItem: { upsert: jest.fn() },
    };
    const items = [
      { externalId: 'case-1', category: 'cases', name: 'Operation Bravo Case', marketHashName: 'Operation Bravo Case', imageUrl: 'x.png', rarity: null, collection: null, metadata: {} },
    ];
    await syncCategoryToDb('cases', items, { prismaClient: fakePrisma });
    expect(fakePrisma.case.upsert).toHaveBeenCalledTimes(1);
  });

  it('captures errors per item without aborting', async () => {
    const fakePrisma = {
      marketItem: {
        upsert: jest.fn()
          .mockRejectedValueOnce(new Error('boom'))
          .mockResolvedValueOnce({ id: 2 }),
      },
    };
    const items = [
      { externalId: 'a', category: 'stickers', name: 'A', marketHashName: 'A', imageUrl: null, rarity: null, collection: null, metadata: {} },
      { externalId: 'b', category: 'stickers', name: 'B', marketHashName: 'B', imageUrl: null, rarity: null, collection: null, metadata: {} },
    ];
    const result = await syncCategoryToDb('stickers', items, { prismaClient: fakePrisma });
    expect(result.upserted).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].marketHashName).toBe('A');
  });
});
