/**
 * Public API Endpoints (B2B)
 * Requires API key authentication (no user login needed)
 *
 * Routes:
 *   GET /api/public/skins              - List all skins with prices
 *   GET /api/public/skins/:id          - Get single skin details
 *   GET /api/public/skins/:id/history  - Get price history for skin
 *   GET /api/public/cases              - List all cases
 *   GET /api/public/cases/:id          - Get single case details
 */

import express from 'express';
import crypto from 'crypto';
import prisma from '../../prisma/prismaClient.js';
import { validateAPIKeyUsage } from '../middleware/tier-gating.js';
import logger from '../utils/logger.js';

const router = express.Router();

async function authenticateAPIKey(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing API key',
        usage: 'Add header: Authorization: Bearer <your-api-key>'
      });
    }

    const keyValue = authHeader.substring(7);
    const hashedKey = crypto.createHash('sha256').update(keyValue).digest('hex');

    const apiKey = await prisma.aPIKey.findUnique({
      where: { key: hashedKey },
      include: { user: true }
    });

    if (!apiKey) {
      logger.warn('Invalid API key attempt', { ipAddress: req.ip, endpoint: req.path });
      return res.status(401).json({ error: 'Invalid API key' });
    }

    const validation = validateAPIKeyUsage(apiKey);
    if (!validation.canUse) {
      return res.status(429).json({
        error: validation.message,
        limit: validation.limit,
        used: validation.used
      });
    }

    req.apiKey = apiKey;
    req.apiUser = apiKey.user;
    next();
  } catch (error) {
    logger.error('API key authentication failed', { error: error.message });
    res.status(500).json({ error: 'Authentication failed' });
  }
}

async function logAPIUsage(req, res, next) {
  const startTime = Date.now();

  const originalJson = res.json.bind(res);
  res.json = function(data) {
    const responseTime = Date.now() - startTime;

    setImmediate(async () => {
      try {
        await prisma.aPILog.create({
          data: {
            userId: req.apiUser.id,
            apiKeyId: req.apiKey.id,
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            responseTime,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent']
          }
        });

        await prisma.aPIKey.update({
          where: { id: req.apiKey.id },
          data: { callsUsed: { increment: 1 } }
        });
      } catch (error) {
        logger.error('Failed to log API usage', { error: error.message });
      }
    });

    return originalJson(data);
  };

  next();
}

router.use(authenticateAPIKey);
router.use(logAPIUsage);

/**
 * GET /api/public/skins
 */
router.get('/skins', async (req, res) => {
  try {
    const { rarity, sortBy = 'priceAvg', order = 'desc', limit = 100, offset = 0 } = req.query;

    if (parseInt(limit) > 1000) {
      return res.status(400).json({ error: 'Limit max 1000' });
    }

    const where = {};
    if (rarity) where.rarity = rarity;

    const validSortFields = ['priceAvg', 'name', 'rarity', 'priceLatest'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'priceAvg';
    const validOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

    const [skins, total] = await Promise.all([
      prisma.skin.findMany({
        where,
        select: {
          id: true,
          name: true,
          marketHashName: true,
          rarity: true,
          wear: true,
          priceLatest: true,
          priceAvg: true,
          priceMedian: true,
          priceUpdatedAt: true,
          imageUrl: true
        },
        orderBy: { [sortField]: validOrder },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.skin.count({ where })
    ]);

    res.json({
      data: skins,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      },
      metadata: {
        source: 'CS2 Skin Tracker API',
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to fetch skins', { userId: req.apiUser.id, error: error.message });
    res.status(500).json({ error: 'Failed to fetch skins' });
  }
});

/**
 * GET /api/public/skins/:id
 */
router.get('/skins/:id', async (req, res) => {
  try {
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        priceHistory: {
          select: { date: true, price: true },
          orderBy: { date: 'desc' },
          take: 90
        }
      }
    });

    if (!skin) return res.status(404).json({ error: 'Skin not found' });

    res.json({
      data: skin,
      metadata: { source: 'CS2 Skin Tracker API', fetchedAt: new Date().toISOString() }
    });
  } catch (error) {
    logger.error('Failed to fetch skin', { skinId: req.params.id, error: error.message });
    res.status(500).json({ error: 'Failed to fetch skin' });
  }
});

/**
 * GET /api/public/skins/:id/history
 */
router.get('/skins/:id/history', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const skinId = parseInt(req.params.id);
    const lookbackDays = Math.min(Math.max(1, parseInt(days)), 365);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);

    const history = await prisma.priceHistory.findMany({
      where: { skinId, date: { gte: startDate } },
      select: { date: true, price: true },
      orderBy: { date: 'asc' }
    });

    if (history.length === 0) {
      return res.status(404).json({ error: 'No price history found' });
    }

    res.json({
      skinId,
      period: { from: startDate, to: new Date(), days: lookbackDays },
      data: history,
      statistics: {
        minPrice: Math.min(...history.map(h => h.price)),
        maxPrice: Math.max(...history.map(h => h.price)),
        avgPrice: history.reduce((sum, h) => sum + h.price, 0) / history.length,
        dataPoints: history.length
      }
    });
  } catch (error) {
    logger.error('Failed to fetch price history', { skinId: req.params.id, error: error.message });
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

/**
 * GET /api/public/cases
 */
router.get('/cases', async (req, res) => {
  try {
    const { sortBy = 'price', order = 'desc', limit = 100, offset = 0 } = req.query;

    const validSortFields = ['price', 'name', 'remaining', 'timeToExtinction'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'price';
    const validOrder = ['asc', 'desc'].includes(order) ? order : 'desc';

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        select: {
          id: true,
          name: true,
          imageUrl: true,
          price: true,
          remaining: true,
          timeToExtinction: true,
          lastUpdated: true,
          priceChange24h: true,
          priceChange7d: true
        },
        orderBy: { [sortField]: validOrder },
        take: parseInt(limit),
        skip: parseInt(offset)
      }),
      prisma.case.count()
    ]);

    res.json({
      data: cases,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    logger.error('Failed to fetch cases', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

/**
 * GET /api/public/cases/:id
 */
router.get('/cases/:id', async (req, res) => {
  try {
    const caseData = await prisma.case.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        caseSkins: {
          select: {
            rarity: true,
            dropChance: true,
            skin: { select: { id: true, name: true, priceAvg: true, rarity: true } }
          }
        }
      }
    });

    if (!caseData) return res.status(404).json({ error: 'Case not found' });

    res.json({
      data: caseData,
      metadata: {
        totalSkins: caseData.caseSkins.length,
        fetchedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to fetch case', { caseId: req.params.id, error: error.message });
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

export default router;
