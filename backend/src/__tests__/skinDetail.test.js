import { describe, it, expect, jest } from '@jest/globals';
import { getSkinBySlug, listSkinSlugs, listSkinsByWeapon, getSimilarSkins } from '../controllers/skinDetailController.js';

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

describe('skinDetailController', () => {
  it('getSkinBySlug returns 404 when slug not found', async () => {
    const prisma = { skin: { findUnique: jest.fn(async () => null) } };
    const res = makeRes();
    await getSkinBySlug({ params: { slug: 'nope' } }, res, { prismaClient: prisma });
    expect(res.statusCode).toBe(404);
  });

  it('getSkinBySlug returns skin when found', async () => {
    const skin = { id: 1, slug: 'ak-47-redline-ft', weaponSlug: 'ak-47', name: 'AK-47 | Redline' };
    const prisma = { skin: { findUnique: jest.fn(async () => skin) } };
    const res = makeRes();
    await getSkinBySlug({ params: { slug: 'ak-47-redline-ft' } }, res, { prismaClient: prisma });
    expect(res.statusCode).toBe(200);
    expect(res.body.slug).toBe('ak-47-redline-ft');
  });

  it('listSkinsByWeapon filters by weaponSlug + limit', async () => {
    const findMany = jest.fn(async () => [{ id: 1, slug: 'a', weaponSlug: 'ak-47' }]);
    const prisma = { skin: { findMany } };
    const res = makeRes();
    await listSkinsByWeapon({ query: { weapon: 'ak-47', limit: '50' } }, res, { prismaClient: prisma });
    expect(res.statusCode).toBe(200);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { weaponSlug: 'ak-47', slug: { not: null } },
      take: 50,
    }));
  });

  it('getSimilarSkins returns 404 when base skin missing', async () => {
    const prisma = { skin: { findUnique: jest.fn(async () => null) } };
    const res = makeRes();
    await getSimilarSkins({ params: { id: '42' } }, res, { prismaClient: prisma });
    expect(res.statusCode).toBe(404);
  });

  it('getSimilarSkins returns empty array when base has no price', async () => {
    const prisma = {
      skin: {
        findUnique: jest.fn(async () => ({ id: 1, weaponSlug: 'ak-47', rarity: 'Covert', priceLatest: null })),
        findMany: jest.fn(),
      },
    };
    const res = makeRes();
    await getSimilarSkins({ params: { id: '1' } }, res, { prismaClient: prisma });
    expect(res.body).toEqual([]);
    expect(prisma.skin.findMany).not.toHaveBeenCalled();
  });

  it('getSimilarSkins queries with +-30% price band, same weapon + rarity', async () => {
    const findMany = jest.fn(async () => [{ id: 2, name: 'AK-47 | Vulcan', slug: 'ak-47-vulcan-ft', weaponSlug: 'ak-47' }]);
    const prisma = {
      skin: {
        findUnique: jest.fn(async () => ({ id: 1, weaponSlug: 'ak-47', rarity: 'Covert', priceLatest: 100 })),
        findMany,
      },
    };
    const res = makeRes();
    await getSimilarSkins({ params: { id: '1' } }, res, { prismaClient: prisma });
    expect(res.statusCode).toBe(200);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id: { not: 1 },
        weaponSlug: 'ak-47',
        rarity: 'Covert',
        slug: { not: null },
        priceLatest: { gte: 70, lte: 130 },
      }),
      take: 6,
    }));
  });

  it('listSkinSlugs paginates', async () => {
    const findMany = jest.fn(async () => [{ slug: 'x', weaponSlug: 'ak-47', updatedAt: new Date() }]);
    const prisma = { skin: { findMany } };
    const res = makeRes();
    await listSkinSlugs({ query: { page: '1', pageSize: '5000' } }, res, { prismaClient: prisma });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 5000,
      take: 5000,
      where: { slug: { not: null } },
    }));
  });
});
