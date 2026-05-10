import { describe, it, expect, jest } from '@jest/globals';
import { listMarketItems, getMarketItem } from '../controllers/marketItemController.js';

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
  };
}

describe('listMarketItems', () => {
  it('returns paginated results with default page/pageSize', async () => {
    const fakePrisma = {
      marketItem: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, name: 'A', category: 'sticker' },
          { id: 2, name: 'B', category: 'sticker' },
        ]),
        count: jest.fn().mockResolvedValue(2),
      },
    };
    const req = { query: {} };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(res.statusCode).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 24, total: 2, totalPages: 1 });
  });

  it('filters by category', async () => {
    const fakePrisma = {
      marketItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const req = { query: { category: 'sticker' } };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(fakePrisma.marketItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ isActive: true, category: 'sticker' }),
    }));
  });

  it('filters by free-text q (case-insensitive contains on name)', async () => {
    const fakePrisma = {
      marketItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const req = { query: { q: 'krakow' } };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(fakePrisma.marketItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        isActive: true,
        name: { contains: 'krakow', mode: 'insensitive' },
      }),
    }));
  });

  it('caps pageSize at 60', async () => {
    const fakePrisma = {
      marketItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const req = { query: { pageSize: '500' } };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(fakePrisma.marketItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 60,
    }));
  });

  it('applies sort+order params', async () => {
    const fakePrisma = {
      marketItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const req = { query: { sort: 'price', order: 'desc' } };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(fakePrisma.marketItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: { priceLatest: 'desc' },
    }));
  });

  it('rejects invalid category with 400', async () => {
    const fakePrisma = { marketItem: { findMany: jest.fn(), count: jest.fn() } };
    const req = { query: { category: 'evil-injection' } };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(res.statusCode).toBe(400);
    expect(fakePrisma.marketItem.findMany).not.toHaveBeenCalled();
  });
});

describe('getMarketItem', () => {
  it('returns the item on hit', async () => {
    const fakePrisma = {
      marketItem: {
        findUnique: jest.fn().mockResolvedValue({ id: 7, name: 'X', category: 'sticker' }),
      },
    };
    const req = { params: { id: '7' } };
    const res = makeRes();
    await getMarketItem(req, res, { prismaClient: fakePrisma });
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(7);
  });

  it('returns 404 when not found', async () => {
    const fakePrisma = {
      marketItem: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const req = { params: { id: '999' } };
    const res = makeRes();
    await getMarketItem(req, res, { prismaClient: fakePrisma });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 on non-numeric id', async () => {
    const fakePrisma = { marketItem: { findUnique: jest.fn() } };
    const req = { params: { id: 'abc' } };
    const res = makeRes();
    await getMarketItem(req, res, { prismaClient: fakePrisma });
    expect(res.statusCode).toBe(400);
    expect(fakePrisma.marketItem.findUnique).not.toHaveBeenCalled();
  });
});
