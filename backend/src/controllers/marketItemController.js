import defaultPrisma from '../prisma/prismaClient.js';
import logger from '../utils/logger.js';

const VALID_CATEGORIES = ['sticker', 'agent', 'patch', 'graffiti', 'music_kit', 'collectible', 'key'];
const VALID_SORTS = { name: 'name', price: 'priceLatest', volume: 'volume24h' };
const MAX_PAGE_SIZE = 60;
const DEFAULT_PAGE_SIZE = 24;

export async function listMarketItems(req, res, { prismaClient = defaultPrisma } = {}) {
  try {
    const { category, q, page: rawPage, pageSize: rawPageSize, sort: rawSort, order: rawOrder } = req.query ?? {};

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'invalid category', valid: VALID_CATEGORIES });
    }

    const sortKey = VALID_SORTS[rawSort] ?? 'name';
    const order = rawOrder === 'desc' ? 'desc' : 'asc';
    const page = Math.max(1, parseInt(rawPage, 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(rawPageSize, 10) || DEFAULT_PAGE_SIZE));

    const where = { isActive: true };
    if (category) where.category = category;
    if (q && typeof q === 'string' && q.trim()) {
      where.name = { contains: q.trim(), mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prismaClient.marketItem.findMany({
        where,
        orderBy: { [sortKey]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          category: true,
          name: true,
          marketHashName: true,
          imageUrl: true,
          rarity: true,
          collection: true,
          priceLatest: true,
          priceMedian: true,
          volume24h: true,
          priceUpdatedAt: true,
        },
      }),
      prismaClient.marketItem.count({ where }),
    ]);

    return res.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (err) {
    logger.error('listMarketItems failed', { error: err.message });
    return res.status(500).json({ error: 'failed to list items' });
  }
}

export async function getMarketItem(req, res, { prismaClient = defaultPrisma } = {}) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const item = await prismaClient.marketItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'item not found' });
    }
    return res.json(item);
  } catch (err) {
    logger.error('getMarketItem failed', { error: err.message });
    return res.status(500).json({ error: 'failed to fetch item' });
  }
}
