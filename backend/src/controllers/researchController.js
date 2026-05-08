/**
 * Research Controller
 * Pro-tier endpoints for research tools
 */

import prisma from '../prisma/prismaClient.js';
import researchService from '../services/researchService.js';
import { subscriptionService } from '../services/subscriptionService.js';
import logger from '../utils/logger.js';

/**
 * GET /research/portfolio
 * Get research analysis for user's portfolio (Pro tier only)
 */
export const getPortfolioResearch = async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check tier
    const hasTierAccess = await subscriptionService.checkTier(userId, 'pro');
    if (!hasTierAccess) {
      return res.status(403).json({
        error: 'Pro tier required',
        message: 'Research tools are available for Pro subscribers'
      });
    }

    const research = await researchService.getPortfolioResearch(userId);
    return res.json(research);
  } catch (error) {
    logger.error('Failed to get portfolio research', {
      userId: req.auth?.userId,
      error: error.message
    });

    return res.status(500).json({
      error: 'Failed to fetch research data'
    });
  }
};

/**
 * GET /research/skins/:id
 * Get detailed research for specific skin (Pro tier only)
 */
export const getSkinResearch = async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { id: skinId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check tier
    const hasTierAccess = await subscriptionService.checkTier(userId, 'pro');
    if (!hasTierAccess) {
      return res.status(403).json({
        error: 'Pro tier required',
        message: 'Research tools are available for Pro subscribers'
      });
    }

    const research = await researchService.getSkinResearchDetails(parseInt(skinId), userId);
    return res.json(research);
  } catch (error) {
    logger.error('Failed to get skin research', {
      userId: req.auth?.userId,
      skinId: req.params.id,
      error: error.message
    });

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    return res.status(500).json({
      error: 'Failed to fetch research data'
    });
  }
};

/**
 * GET /research/volatility/:id
 * Get volatility metrics for skin (available to all tiers)
 */
export const getSkinVolatility = async (req, res) => {
  try {
    const { id: skinId } = req.params;
    const { days = '30' } = req.query;

    const volatility = await researchService.getSkinVolatility(
      parseInt(skinId),
      parseInt(days)
    );

    return res.json(volatility);
  } catch (error) {
    logger.error('Failed to get skin volatility', {
      skinId: req.params.id,
      error: error.message
    });

    return res.status(500).json({
      error: 'Failed to fetch volatility data'
    });
  }
};

/**
 * GET /research/rarity/:id
 * Get rarity score for skin (available to all tiers)
 */
export const getSkinRarity = async (req, res) => {
  try {
    const { id: skinId } = req.params;

    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) }
    });

    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    const rarityScore = researchService.calculateRarityScore(skin);

    return res.json({
      skinId: skin.id,
      skinName: skin.name,
      rarityScore,
      rarityLevel: rarityScore > 75 ? 'RARE' : rarityScore > 50 ? 'UNCOMMON' : 'COMMON',
      details: {
        tier: skin.rarity || 'Unknown',
        wear: skin.wear || 'Unknown',
        isStattrak: skin.isStattrak || false,
        salesVolume30d: skin.sold30d
      }
    });
  } catch (error) {
    logger.error('Failed to get skin rarity', {
      skinId: req.params.id,
      error: error.message
    });

    return res.status(500).json({
      error: 'Failed to fetch rarity data'
    });
  }
};
