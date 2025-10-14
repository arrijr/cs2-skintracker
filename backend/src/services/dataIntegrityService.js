// backend/src/services/dataIntegrityService.js — [Backend]
// {/* Service for validating data integrity and monitoring data quality */}
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Validates that a skin has all required data fields populated
 * @param {number} skinId - The ID of the skin to validate
 * @returns {Promise<Object>} Validation result with missing fields
 */
export async function validateSkinData(skinId) {
  try {
    const skin = await prisma.skin.findUnique({
      where: { id: skinId },
      select: {
        id: true,
        name: true,
        marketHashName: true,
        priceLatest: true,
        priceMedian: true,
        priceAvg: true,
        offerVolume: true,
        sold7d: true,
        sold30d: true,
        buyOrderVolume: true,
        priceUpdatedAt: true
      }
    });

    if (!skin) {
      return { valid: false, error: 'Skin not found' };
    }

    const missingFields = [];
    const warnings = [];

    // Critical fields - at least one price field must be present
    const hasPrice = skin.priceLatest || skin.priceMedian || skin.priceAvg;
    if (!hasPrice) {
      missingFields.push('price data (priceLatest/priceMedian/priceAvg)');
    }

    // Important fields
    if (!skin.offerVolume && skin.offerVolume !== 0) {
      warnings.push('offerVolume');
    }
    if (!skin.sold7d && skin.sold7d !== 0) {
      warnings.push('sold7d');
    }
    if (!skin.sold30d && skin.sold30d !== 0) {
      warnings.push('sold30d');
    }

    // Freshness check
    const daysSinceUpdate = skin.priceUpdatedAt 
      ? Math.floor((Date.now() - new Date(skin.priceUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    
    if (daysSinceUpdate === null || daysSinceUpdate > 7) {
      warnings.push(`stale data (last updated: ${daysSinceUpdate === null ? 'never' : `${daysSinceUpdate} days ago`})`);
    }

    return {
      valid: missingFields.length === 0,
      skinId: skin.id,
      name: skin.marketHashName,
      missingFields,
      warnings,
      lastUpdated: skin.priceUpdatedAt
    };
  } catch (error) {
    console.error(`[DataIntegrity] Error validating skin ${skinId}:`, error);
    return { valid: false, error: error.message };
  }
}

/**
 * Logs a data update operation to the JobRun table
 * @param {string} source - Source of the update (e.g., 'updateSkinPrices', 'savePriceHistory')
 * @param {number} count - Number of records processed
 * @param {number} successCount - Number of successful updates
 * @param {number} errorCount - Number of errors
 * @param {Array<string>} errors - Array of error messages
 * @returns {Promise<void>}
 */
export async function logDataUpdate(source, count, successCount, errorCount, errors = []) {
  try {
    const status = errorCount > successCount * 0.1 ? 'failed' : 'completed';
    const errorSummary = errors.length > 0 ? errors.slice(0, 10).join('; ') : null;

    await prisma.jobRun.create({
      data: {
        jobName: source,
        status,
        actualCount: count,
        updatedCount: successCount,
        failedCount: errorCount,
        details: errorSummary ? `Processed ${count} items. Errors: ${errorSummary}` : `Successfully processed ${count} items`,
        completedAt: new Date()
      }
    });

    console.log(`[DataIntegrity] Logged ${source}: ${successCount}/${count} successful, ${errorCount} errors`);
  } catch (error) {
    console.error(`[DataIntegrity] Error logging data update for ${source}:`, error);
  }
}

/**
 * Checks for skins missing critical data
 * @param {number} limit - Maximum number of missing skins to return
 * @returns {Promise<Object>} Report of skins with missing data
 */
export async function checkMissingData(limit = 100) {
  try {
    // Find skins without any price data
    const skinsWithoutPrices = await prisma.skin.findMany({
      where: {
        AND: [
          { priceLatest: null },
          { priceMedian: null },
          { priceAvg: null }
        ]
      },
      select: {
        id: true,
        name: true,
        marketHashName: true
      },
      take: limit
    });

    // Find skins without market data
    const skinsWithoutMarketData = await prisma.skin.findMany({
      where: {
        AND: [
          { offerVolume: null },
          { sold7d: null }
        ]
      },
      select: {
        id: true,
        name: true,
        marketHashName: true
      },
      take: limit
    });

    // Find skins with stale data (not updated in 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const skinsWithStaleData = await prisma.skin.count({
      where: {
        OR: [
          { priceUpdatedAt: { lt: sevenDaysAgo } },
          { priceUpdatedAt: null }
        ]
      }
    });

    return {
      skinsWithoutPrices: skinsWithoutPrices.length,
      skinsWithoutPricesSample: skinsWithoutPrices.slice(0, 10),
      skinsWithoutMarketData: skinsWithoutMarketData.length,
      skinsWithoutMarketDataSample: skinsWithoutMarketData.slice(0, 10),
      skinsWithStaleData,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[DataIntegrity] Error checking missing data:', error);
    return { error: error.message };
  }
}

/**
 * Checks if price history has gaps (missing daily entries)
 * @param {number} daysToCheck - Number of days to check back
 * @returns {Promise<Object>} Report of missing price history entries
 */
export async function checkPriceHistoryGaps(daysToCheck = 7) {
  try {
    const results = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysToCheck; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const nextDay = new Date(checkDate);
      nextDay.setDate(checkDate.getDate() + 1);

      const count = await prisma.priceHistory.count({
        where: {
          date: {
            gte: checkDate,
            lt: nextDay
          }
        }
      });

      results.push({
        date: checkDate.toISOString().split('T')[0],
        count,
        hasMissingData: count === 0
      });
    }

    const missingDays = results.filter(r => r.hasMissingData).map(r => r.date);

    return {
      daysChecked: daysToCheck,
      results,
      missingDays,
      hasGaps: missingDays.length > 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[DataIntegrity] Error checking price history gaps:', error);
    return { error: error.message };
  }
}

/**
 * Checks if quantity history has gaps (missing daily entries)
 * @param {number} daysToCheck - Number of days to check back
 * @returns {Promise<Object>} Report of missing quantity history entries
 */
export async function checkQuantityHistoryGaps(daysToCheck = 7) {
  try {
    const results = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < daysToCheck; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      
      const nextDay = new Date(checkDate);
      nextDay.setDate(checkDate.getDate() + 1);

      const count = await prisma.skinQuantityHistory.count({
        where: {
          date: {
            gte: checkDate,
            lt: nextDay
          }
        }
      });

      results.push({
        date: checkDate.toISOString().split('T')[0],
        count,
        hasMissingData: count === 0
      });
    }

    const missingDays = results.filter(r => r.hasMissingData).map(r => r.date);

    return {
      daysChecked: daysToCheck,
      results,
      missingDays,
      hasGaps: missingDays.length > 0,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('[DataIntegrity] Error checking quantity history gaps:', error);
    return { error: error.message };
  }
}

