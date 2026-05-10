/**
 * Research Service
 * Pro-tier research tools: volatility analysis, rarity scoring
 * No AI - purely heuristic-based calculations
 */

import prisma from '../prisma/prismaClient.js';
import logger from '../utils/logger.js';

/**
 * Calculate volatility (standard deviation) of prices over period
 * @param {Array<number>} prices - Array of prices
 * @returns {number} Volatility percentage (0-100)
 */
function calculateStdDevVolatility(prices) {
  if (prices.length < 2) return 0;

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const volatility = (stdDev / mean) * 100;

  return parseFloat(volatility.toFixed(2));
}

/**
 * Get volatility metrics for a skin
 * @param {number} skinId - Skin ID
 * @param {number} days - Number of days to analyze (default 30)
 */
async function getSkinVolatility(skinId, days = 30) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const priceHistory = await prisma.priceHistory.findMany({
      where: {
        skinId,
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });

    if (priceHistory.length < 2) {
      return {
        skinId,
        days,
        volatility: 0,
        dataPoints: priceHistory.length,
        minPrice: priceHistory[0]?.price || 0,
        maxPrice: priceHistory[0]?.price || 0,
        avgPrice: priceHistory[0]?.price || 0,
        priceRange: 0,
        volatilityLevel: 'INSUFFICIENT_DATA'
      };
    }

    const prices = priceHistory.map(h => h.price);
    const volatility = calculateStdDevVolatility(prices);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const priceRange = maxPrice - minPrice;

    // Volatility levels
    let volatilityLevel;
    if (volatility < 5) volatilityLevel = 'VERY_STABLE';
    else if (volatility < 10) volatilityLevel = 'STABLE';
    else if (volatility < 20) volatilityLevel = 'MODERATE';
    else if (volatility < 30) volatilityLevel = 'VOLATILE';
    else volatilityLevel = 'HIGHLY_VOLATILE';

    return {
      skinId,
      days,
      volatility,
      volatilityLevel,
      dataPoints: priceHistory.length,
      minPrice: parseFloat(minPrice.toFixed(2)),
      maxPrice: parseFloat(maxPrice.toFixed(2)),
      avgPrice: parseFloat(avgPrice.toFixed(2)),
      priceRange: parseFloat(priceRange.toFixed(2))
    };
  } catch (error) {
    logger.error('Failed to get skin volatility', { skinId, error: error.message });
    throw error;
  }
}

/**
 * Calculate rarity score heuristic (0-100)
 * Based on: rarity tier, wear condition, special properties, sales velocity
 */
function calculateRarityScore(skin) {
  if (!skin) return 0;

  let score = 50; // Base score

  // Rarity tier scores
  const rarityScores = {
    'Consumer Grade': 5,
    'Industrial Grade': 15,
    'Mil-Spec': 25,
    'Restricted': 40,
    'Classified': 60,
    'Covert': 80,
    'Exceedingly Rare': 95
  };

  // Wear condition scores (Factory New is rarest)
  const wearScores = {
    'Factory New': 25,
    'Minimal Wear': 20,
    'Field-Tested': 15,
    'Well-Worn': 10,
    'Battle-Scarred': 5
  };

  // Apply rarity tier
  score += rarityScores[skin.rarity] || 0;

  // Apply wear condition
  score += wearScores[skin.wear] || 0;

  // Special properties bonus
  if (skin.isStattrak) score += 15;
  if (skin.isStar) score += 10;

  // Sales velocity penalty (high volume = common = lower rarity)
  // 30-day sales data
  if (skin.sold30d) {
    if (skin.sold30d > 2000) score -= 25;
    else if (skin.sold30d > 1000) score -= 15;
    else if (skin.sold30d > 500) score -= 10;
    else if (skin.sold30d > 100) score -= 5;
  }

  // Price stability bonus (stable prices = collectible = rarer)
  // This would be calculated from price history in real usage
  // For now, estimate from priceMin/Max
  if (skin.priceMin && skin.priceMax && skin.priceMin > 0) {
    const priceVolatility = ((skin.priceMax - skin.priceMin) / skin.priceMin) * 100;
    if (priceVolatility < 5) score += 10;
    else if (priceVolatility < 10) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Get research data for portfolio positions (Pro tier only)
 * Includes volatility + rarity for each position
 */
async function getPortfolioResearch(userId) {
  try {
    // Verify user has Pro tier (source of truth: User.isPremium)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const tier = user?.isPremium ? 'pro' : 'free';
    if (tier !== 'pro') {
      throw new Error('Pro tier required for portfolio research');
    }

    // Get all portfolio entries
    const entries = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true },
      distinct: ['skinId']
    });

    const research = [];
    for (const entry of entries) {
      const volatility = await getSkinVolatility(entry.skinId, 30);
      const rarityScore = calculateRarityScore(entry.skin);

      research.push({
        skinId: entry.skin.id,
        skinName: entry.skin.name,
        volatility,
        rarityScore,
        investmentRisk: volatility.volatilityLevel,
        scarcityRating: rarityScore > 75 ? 'RARE' : rarityScore > 50 ? 'UNCOMMON' : 'COMMON'
      });
    }

    return {
      userId,
      analysisDate: new Date(),
      positionCount: research.length,
      research
    };
  } catch (error) {
    logger.error('Failed to get portfolio research', { userId, error: error.message });
    throw error;
  }
}

/**
 * Get detailed volatility analysis for single skin
 */
async function getSkinResearchDetails(skinId, userId) {
  try {
    const skin = await prisma.skin.findUnique({
      where: { id: skinId }
    });

    if (!skin) {
      throw new Error(`Skin not found: ${skinId}`);
    }

    const volatility7d = await getSkinVolatility(skinId, 7);
    const volatility30d = await getSkinVolatility(skinId, 30);
    const volatility90d = await getSkinVolatility(skinId, 90);

    const rarityScore = calculateRarityScore(skin);

    return {
      skinId,
      skinName: skin.name,
      marketHashName: skin.marketHashName,
      imageUrl: skin.imageUrl,

      volatility: {
        last7Days: volatility7d,
        last30Days: volatility30d,
        last90Days: volatility90d
      },

      rarity: {
        score: rarityScore,
        level: rarityScore > 75 ? 'RARE' : rarityScore > 50 ? 'UNCOMMON' : 'COMMON',
        tier: skin.rarity || 'Unknown',
        wear: skin.wear || 'Unknown',
        isStattrak: skin.isStattrak || false
      },

      marketData: {
        currentPrice: skin.priceLatest,
        priceMin90d: skin.priceMin,
        priceMax90d: skin.priceMax,
        avgPrice: skin.priceAvg,
        salesVolume30d: skin.sold30d
      },

      recommendations: generateRecommendations(rarityScore, volatility30d.volatility, skin.sold30d)
    };
  } catch (error) {
    logger.error('Failed to get skin research details', { skinId, error: error.message });
    throw error;
  }
}

/**
 * Generate investment recommendations based on metrics
 */
function generateRecommendations(rarityScore, volatility, salesVolume) {
  const recommendations = [];

  if (volatility > 25) {
    recommendations.push({
      type: 'RISK',
      message: 'High price volatility detected - risky for short-term holding'
    });
  }

  if (rarityScore > 75 && volatility < 15) {
    recommendations.push({
      type: 'OPPORTUNITY',
      message: 'Rare item with stable price - good for long-term collection'
    });
  }

  if (salesVolume > 1000 && rarityScore < 50) {
    recommendations.push({
      type: 'INFO',
      message: 'High volume, common item - liquid but potentially oversupplied'
    });
  }

  if (rarityScore > 50 && rarityScore < 75) {
    recommendations.push({
      type: 'INFO',
      message: 'Uncommon item with balanced profile'
    });
  }

  return recommendations;
}

export const researchService = {
  getSkinVolatility,
  calculateRarityScore,
  getPortfolioResearch,
  getSkinResearchDetails,
  calculateStdDevVolatility
};

export default researchService;
