/**
 * Portfolio Service
 * Business logic for portfolio operations: creation, calculations, summaries
 */

import prisma from '../prisma/prismaClient.js';
import axios from 'axios';
import logger from '../utils/logger.js';

/**
 * Fetch current price from Steam Community Market
 * @param {string} marketHashName - Steam market hash name
 * @returns {Promise<number|null>} Current price in EUR or null
 */
async function getCurrentSteamPrice(marketHashName) {
  const url = `https://steamcommunity.com/market/priceoverview/?appid=730&market_hash_name=${encodeURIComponent(marketHashName)}&currency=3`;
  try {
    const res = await axios.get(url);
    // Prioritize lowest_price, fallback to median_price
    let price = null;
    if (res.data && res.data.lowest_price) {
      price = parseFloat(res.data.lowest_price.replace('€', '').replace(',', '.').trim());
    } else if (res.data && res.data.median_price) {
      price = parseFloat(res.data.median_price.replace('€', '').replace(',', '.').trim());
    }
    return price;
  } catch (e) {
    logger.warn('Steam API error', { marketHashName, error: e.message });
    return null;
  }
}

/**
 * Calculate 7-day moving average
 * @param {Array<{price: number}>} prices - Array of price records
 * @returns {Array<number>} Moving averages
 */
function calculate7DayMovingAverage(prices) {
  if (prices.length === 0) return [];

  const mas = [];
  for (let i = 0; i < prices.length; i++) {
    const window = prices.slice(Math.max(0, i - 6), i + 1);
    const avg = window.reduce((sum, p) => sum + p.price, 0) / window.length;
    mas.push(parseFloat(avg.toFixed(2)));
  }
  return mas;
}

/**
 * Calculate volatility (standard deviation) of prices
 * @param {Array<number>} prices - Array of prices
 * @returns {number} Volatility percentage (0-100)
 */
function calculateVolatility(prices) {
  if (prices.length < 2) return 0;

  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const volatility = (stdDev / mean) * 100;

  return parseFloat(volatility.toFixed(2));
}

export const portfolioService = {
  /**
   * Get portfolio summary for dashboard
   * Includes KPIs: total value, profit/loss, individual positions
   */
  async getPortfolioSummary(userId) {
    try {
      // 1. Get all portfolio entries for user
      const entries = await prisma.portfolio.findMany({
        where: { userId },
        include: {
          skin: {
            include: {
              priceHistory: {
                where: {
                  date: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                  }
                },
                orderBy: { date: 'asc' },
                take: 30
              }
            }
          }
        },
        orderBy: { buyDate: 'asc' }
      });

      if (entries.length === 0) {
        return {
          totalValue: 0,
          totalInvested: 0,
          unrealizedPL: 0,
          unrealizedPLPercent: 0,
          positionCount: 0,
          positions: [],
          lastUpdated: new Date()
        };
      }

      // 2. Aggregate by skin
      const skinMap = {};
      for (const entry of entries) {
        const sid = entry.skinId;
        if (!skinMap[sid]) {
          skinMap[sid] = {
            skin: entry.skin,
            purchases: [],
            amount: 0,
            totalInvested: 0
          };
        }
        skinMap[sid].purchases.push({
          id: entry.id,
          amount: entry.amount,
          buyPrice: entry.buyPrice,
          buyDate: entry.buyDate
        });
        skinMap[sid].amount += entry.amount;
        skinMap[sid].totalInvested += entry.amount * entry.buyPrice;
      }

      // 3. Get current prices (database first, then Steam API)
      const positions = [];
      let totalValue = 0;
      let totalInvested = 0;

      for (const item of Object.values(skinMap)) {
        const s = item.skin;
        const marketHashName = s.marketHashName || s.name;

        // Try database price first
        let currentPrice = s.priceLatest;

        // Fallback to Steam API if needed
        if (!currentPrice) {
          currentPrice = await getCurrentSteamPrice(marketHashName);
        }

        const position = {
          skinId: s.id,
          skinName: s.name,
          marketHashName,
          imageUrl: s.imageUrl,
          amount: item.amount,
          avgBuyPrice: item.totalInvested / item.amount,
          currentPrice: currentPrice || 0,
          totalInvested: item.totalInvested,
          totalValue: (currentPrice || 0) * item.amount,
          unrealizedPL: ((currentPrice || 0) * item.amount) - item.totalInvested,
          unrealizedPLPercent: currentPrice
            ? (((currentPrice - (item.totalInvested / item.amount)) / (item.totalInvested / item.amount)) * 100)
            : 0
        };

        positions.push(position);
        totalValue += position.totalValue;
        totalInvested += position.totalInvested;
      }

      return {
        totalValue: parseFloat(totalValue.toFixed(2)),
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        unrealizedPL: parseFloat((totalValue - totalInvested).toFixed(2)),
        unrealizedPLPercent: totalInvested > 0
          ? parseFloat((((totalValue - totalInvested) / totalInvested) * 100).toFixed(2))
          : 0,
        positionCount: positions.length,
        positions,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Failed to get portfolio summary', { userId, error: error.message });
      throw error;
    }
  },

  /**
   * Get price history for a specific skin (for charting)
   */
  async getPriceHistory(skinId, days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const history = await prisma.priceHistory.findMany({
        where: {
          skinId,
          date: { gte: startDate }
        },
        orderBy: { date: 'asc' }
      });

      // Calculate 7-day moving average
      const prices = history.map(h => h.price);
      const movingAverages = calculate7DayMovingAverage(history);

      const chartData = history.map((h, idx) => ({
        date: h.date,
        price: h.price,
        movingAverage7d: movingAverages[idx] || null
      }));

      return {
        skinId,
        data: chartData,
        volatility: calculateVolatility(prices),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length
      };
    } catch (error) {
      logger.error('Failed to get price history', { skinId, error: error.message });
      throw error;
    }
  },

  /**
   * Add item to portfolio
   */
  async addToPortfolio(userId, skinId, amount, buyPrice, buyDate) {
    try {
      // Verify skin exists
      const skin = await prisma.skin.findUnique({ where: { id: skinId } });
      if (!skin) {
        throw new Error(`Skin not found: ${skinId}`);
      }

      // Create portfolio entry
      const entry = await prisma.portfolio.create({
        data: {
          userId,
          skinId,
          amount,
          buyPrice,
          buyDate
        },
        include: { skin: true }
      });

      logger.info('Added to portfolio', {
        userId,
        skinId,
        amount,
        buyPrice
      });

      return entry;
    } catch (error) {
      logger.error('Failed to add to portfolio', {
        userId,
        skinId,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Remove item from portfolio
   */
  async removeFromPortfolio(userId, portfolioEntryId) {
    try {
      // Verify ownership
      const entry = await prisma.portfolio.findUnique({
        where: { id: portfolioEntryId }
      });

      if (!entry || entry.userId !== userId) {
        throw new Error('Portfolio entry not found or unauthorized');
      }

      const deleted = await prisma.portfolio.delete({
        where: { id: portfolioEntryId }
      });

      logger.info('Removed from portfolio', {
        userId,
        portfolioEntryId,
        skinId: deleted.skinId
      });

      return deleted;
    } catch (error) {
      logger.error('Failed to remove from portfolio', {
        userId,
        portfolioEntryId,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Calculate rarity score heuristic
   * Based on: wear condition, rarity tier, sales volume
   * Returns 0-100 score
   */
  calculateRarityScore(skin) {
    if (!skin) return 0;

    let score = 50; // Base score

    // Rarity tier bonus (if available)
    const rarityMap = {
      'Consumer Grade': 10,
      'Industrial Grade': 15,
      'Mil-Spec': 25,
      'Restricted': 40,
      'Classified': 60,
      'Covert': 80,
      'Exceedingly Rare': 95
    };
    score += rarityMap[skin.rarity] || 0;

    // Wear condition bonus (lower wear = rarer)
    const wearMap = {
      'Factory New': 20,
      'Minimal Wear': 15,
      'Field-Tested': 10,
      'Well-Worn': 5,
      'Battle-Scarred': 0
    };
    score += wearMap[skin.wear] || 0;

    // Sales volume penalty (high volume = less rare)
    if (skin.sold30d && skin.sold30d > 1000) {
      score -= 20;
    } else if (skin.sold30d && skin.sold30d > 500) {
      score -= 10;
    }

    // Stattrak bonus (special item)
    if (skin.isStattrak) {
      score += 15;
    }

    // Cap at 100
    return Math.min(100, Math.max(0, score));
  }
};

export default portfolioService;
