import { describe, it, expect } from '@jest/globals';
import { fetchCategory, CATEGORIES, normalizeItem } from '../services/catalog/bymykelClient.js';

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
