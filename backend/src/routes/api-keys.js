/**
 * API Key Management Routes
 *
 * Routes:
 *   GET    /api/v1/api-keys              - List user's API keys
 *   POST   /api/v1/api-keys              - Create new API key
 *   DELETE /api/v1/api-keys/:keyId       - Revoke API key
 *   GET    /api/v1/api-keys/:keyId/logs  - Get API usage logs
 *   POST   /api/v1/api-keys/:keyId/reset - Reset daily call counter
 */

import express from 'express';
import crypto from 'crypto';
import prisma from '../../prisma/prismaClient.js';
import { requireTier, getTierLimits } from '../middleware/tier-gating.js';
import { requireAuth } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/v1/api-keys
 */
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const tier = req.user.tier || 'free';
    const limits = getTierLimits(tier);

    if (limits.maxAPIKeysPerUser === 0) {
      return res.status(402).json({
        error: 'API access not available in your plan',
        requiredTier: 'pro',
        upgrade: { url: '/pricing', price: limits.monthlyPrice }
      });
    }

    const apiKeys = await prisma.aPIKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        key: true,
        tier: true,
        isActive: true,
        callsPerDay: true,
        callsUsed: true,
        lastResetAt: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const maskedKeys = apiKeys.map(k => ({
      id: k.id,
      name: k.name,
      keyPreview: `${k.key.substring(0, 4)}...${k.key.substring(k.key.length - 4)}`,
      tier: k.tier,
      isActive: k.isActive,
      limits: {
        callsPerDay: k.callsPerDay,
        callsUsed: k.callsUsed,
        remaining: k.callsPerDay - k.callsUsed
      },
      createdAt: k.createdAt,
      expiresAt: k.expiresAt,
      lastReset: k.lastResetAt
    }));

    res.json({
      keys: maskedKeys,
      maxKeys: limits.maxAPIKeysPerUser,
      currentCount: maskedKeys.length,
      available: limits.maxAPIKeysPerUser - maskedKeys.length
    });
  } catch (error) {
    logger.error('Failed to list API keys', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Failed to list API keys' });
  }
});

/**
 * POST /api/v1/api-keys
 */
router.post('/', requireTier('pro'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.length === 0) {
      return res.status(400).json({ error: 'Valid name required' });
    }

    if (name.length > 100) {
      return res.status(400).json({ error: 'Name too long (max 100 chars)' });
    }

    const limits = getTierLimits(req.user.tier);

    const existingKeys = await prisma.aPIKey.count({ where: { userId } });

    if (existingKeys >= limits.maxAPIKeysPerUser) {
      return res.status(402).json({
        error: `Maximum API keys (${limits.maxAPIKeysPerUser}) reached for your tier`
      });
    }

    const keyValue = crypto.randomBytes(32).toString('hex');
    const hashedKey = crypto.createHash('sha256').update(keyValue).digest('hex');

    const apiKey = await prisma.aPIKey.create({
      data: {
        userId,
        key: hashedKey,
        name,
        tier: req.user.tier === 'enterprise' ? 'enterprise' : 'pro',
        callsPerDay: limits.apiCallsPerDay,
        isActive: true
      }
    });

    logger.info('API key created', { userId, keyId: apiKey.id, name });

    res.status(201).json({
      success: true,
      message: "API key created. Save it now - you won't see it again!",
      key: keyValue,
      keyPreview: `${keyValue.substring(0, 4)}...${keyValue.substring(keyValue.length - 4)}`,
      id: apiKey.id,
      name: apiKey.name,
      tier: apiKey.tier,
      callsPerDay: apiKey.callsPerDay,
      createdAt: apiKey.createdAt
    });
  } catch (error) {
    logger.error('Failed to create API key', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

/**
 * DELETE /api/v1/api-keys/:keyId
 */
router.delete('/:keyId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    const apiKey = await prisma.aPIKey.findUnique({ where: { id: parseInt(keyId) } });

    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    if (apiKey.userId !== userId) return res.status(403).json({ error: 'Not authorized' });

    await prisma.aPIKey.update({
      where: { id: parseInt(keyId) },
      data: { isActive: false }
    });

    logger.info('API key revoked', { userId, keyId: parseInt(keyId) });
    res.json({ success: true, message: 'API key revoked' });
  } catch (error) {
    logger.error('Failed to revoke API key', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

/**
 * GET /api/v1/api-keys/:keyId/logs
 */
router.get('/:keyId/logs', async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;
    const { limit = 100, offset = 0 } = req.query;

    const apiKey = await prisma.aPIKey.findUnique({ where: { id: parseInt(keyId) } });

    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    if (apiKey.userId !== userId) return res.status(403).json({ error: 'Not authorized' });

    const [logs, total] = await Promise.all([
      prisma.aPILog.findMany({
        where: { apiKeyId: parseInt(keyId) },
        select: {
          id: true,
          endpoint: true,
          method: true,
          statusCode: true,
          responseTime: true,
          ipAddress: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(parseInt(limit), 1000),
        skip: parseInt(offset)
      }),
      prisma.aPILog.count({ where: { apiKeyId: parseInt(keyId) } })
    ]);

    res.json({
      logs,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total
      }
    });
  } catch (error) {
    logger.error('Failed to get API logs', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Failed to get API logs' });
  }
});

/**
 * POST /api/v1/api-keys/:keyId/reset
 */
router.post('/:keyId/reset', async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;

    const apiKey = await prisma.aPIKey.findUnique({ where: { id: parseInt(keyId) } });

    if (!apiKey) return res.status(404).json({ error: 'API key not found' });
    if (apiKey.userId !== userId) return res.status(403).json({ error: 'Not authorized' });

    await prisma.aPIKey.update({
      where: { id: parseInt(keyId) },
      data: { callsUsed: 0, lastResetAt: new Date() }
    });

    logger.info('API key reset', { userId, keyId: parseInt(keyId) });

    res.json({
      success: true,
      message: 'Daily counter reset',
      callsUsed: 0,
      callsPerDay: apiKey.callsPerDay,
      remaining: apiKey.callsPerDay
    });
  } catch (error) {
    logger.error('Failed to reset API key', { userId: req.user.id, error: error.message });
    res.status(500).json({ error: 'Failed to reset counter' });
  }
});

export default router;
