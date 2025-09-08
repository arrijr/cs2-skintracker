// backend/src/cron/portfolioHistoryService.js — [Backend]
// {/* Optimized Portfolio History Service - Fast, Stable, 90-Day Limit */}
import prisma from "../prisma/prismaClient.js";

const MAX_HISTORY_DAYS = 90; // Maximum 90 days as requested
const BATCH_SIZE = 10; // Process users in batches for better performance

export async function calculateAndStorePortfolioValues() {
  const startTime = Date.now();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  console.log(`[PORTFOLIO-HISTORY] 🚀 Starting portfolio history calculation at ${now.toISOString()}`);

  try {
    // Get all users with portfolios in batches
    const users = await prisma.user.findMany({
      where: {
        portfolio: {
          some: {}
        }
      },
      select: {
        id: true,
        email: true,
        clerkId: true
      }
    });

    console.log(`[PORTFOLIO-HISTORY] 📊 Processing ${users.length} users with portfolios`);

    // Process users in batches to avoid memory issues
    for (let i = 0; i < users.length; i += BATCH_SIZE) {
      const batch = users.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(user => processUserPortfolio(user, today)));
    }

    // Clean up old entries (keep only last 90 days)
    await cleanupOldEntries(today);

    const duration = Date.now() - startTime;
    console.log(`[PORTFOLIO-HISTORY] ✅ Completed in ${duration}ms`);

  } catch (error) {
    console.error(`[PORTFOLIO-HISTORY] ❌ Fatal error:`, error);
    throw error;
  }
}

async function processUserPortfolio(user, today) {
  try {
    // Get user's current portfolio with optimized query
    const portfolio = await prisma.portfolio.findMany({
      where: { userId: user.id },
      include: { 
        skin: {
          select: {
            id: true,
            marketHashName: true,
            priceAvg: true,
            priceMedian: true
          }
        }
      }
    });

    if (portfolio.length === 0) {
      console.log(`[PORTFOLIO-HISTORY] ⚠️ No portfolio for user ${user.email}, skipping...`);
      return;
    }

    // Calculate current portfolio value with carry-forward logic
    const { totalValue, investedValue, unrealizedPL } = await calculatePortfolioValue(portfolio, today);
    
    // Ensure values are never null and properly rounded
    const safeTotalValue = Math.round((totalValue || 0) * 100) / 100;
    const safeInvestedValue = Math.round((investedValue || 0) * 100) / 100;
    const safeUnrealizedPL = Math.round((unrealizedPL || 0) * 100) / 100;

    console.log(`[PORTFOLIO-HISTORY] 💰 User ${user.email}: Value=$${safeTotalValue}, Invested=$${safeInvestedValue}, P/L=$${safeUnrealizedPL}`);

    // Upsert portfolio history entry
    await upsertPortfolioHistory(user.id, today, safeTotalValue, safeInvestedValue, safeUnrealizedPL);

  } catch (error) {
    console.error(`[PORTFOLIO-HISTORY] ❌ Error processing user ${user.email}:`, error);
    // Don't throw - continue with other users
  }
}

async function upsertPortfolioHistory(userId, date, value, invested, unrealizedPL) {
  try {
    // Use upsert to handle both create and update cases
    await prisma.portfolioHistory.upsert({
      where: {
        userId_date: {
          userId: userId,
          date: date
        }
      },
      update: {
        value: value,
        invested: invested,
        unrealizedPL: unrealizedPL,
        updatedAt: new Date()
      },
      create: {
        userId: userId,
        date: date,
        value: value,
        invested: invested,
        unrealizedPL: unrealizedPL
      }
    });
  } catch (error) {
    // If unique constraint doesn't exist, fall back to findFirst + update/create
    if (error.code === 'P2002') {
      const existingEntry = await prisma.portfolioHistory.findFirst({
        where: {
          userId: userId,
          date: {
            gte: date,
            lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
          }
        }
      });

      if (existingEntry) {
        await prisma.portfolioHistory.update({
          where: { id: existingEntry.id },
          data: {
            value: value,
            invested: invested,
            unrealizedPL: unrealizedPL,
            updatedAt: new Date()
          }
        });
      } else {
        await prisma.portfolioHistory.create({
          data: {
            userId: userId,
            date: date,
            value: value,
            invested: invested,
            unrealizedPL: unrealizedPL
          }
        });
      }
    } else {
      throw error;
    }
  }
}

async function calculatePortfolioValue(portfolio, targetDate) {
  let totalValue = 0;
  let investedValue = 0;

  // Process all portfolio entries
  for (const entry of portfolio) {
    // Calculate invested value (always available)
    const entryInvested = (entry.amount || 0) * (entry.buyPrice || 0);
    investedValue += entryInvested;

    // Get current price with optimized carry-forward logic
    const currentPrice = await getCurrentPriceWithCarryForward(entry.skinId, targetDate);
    
    if (currentPrice && currentPrice > 0) {
      const currentValue = (entry.amount || 0) * currentPrice;
      totalValue += currentValue;
    } else {
      // Use skin's current price as fallback
      const fallbackPrice = entry.skin?.priceAvg || entry.skin?.priceMedian || 0;
      if (fallbackPrice > 0) {
        const currentValue = (entry.amount || 0) * fallbackPrice;
        totalValue += currentValue;
        console.log(`[PORTFOLIO-HISTORY] Using fallback price for skin ${entry.skinId}: $${fallbackPrice}`);
      } else {
        console.log(`[PORTFOLIO-HISTORY] ⚠️ No price data for skin ${entry.skinId} (${entry.skin?.marketHashName})`);
      }
    }
  }

  const unrealizedPL = totalValue - investedValue;

  return {
    totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimal places
    investedValue: Math.round(investedValue * 100) / 100,
    unrealizedPL: Math.round(unrealizedPL * 100) / 100
  };
}

async function getCurrentPriceWithCarryForward(skinId, targetDate) {
  try {
    // Get the most recent price for this skin up to the target date
    const latestPrice = await prisma.priceHistory.findFirst({
      where: {
        skinId: skinId,
        date: {
          lte: targetDate
        }
      },
      orderBy: { date: 'desc' },
      select: { price: true }
    });

    if (latestPrice && latestPrice.price > 0) {
      return latestPrice.price;
    }

    // If no price found, try to get the earliest price after target date (future price)
    const futurePrice = await prisma.priceHistory.findFirst({
      where: {
        skinId: skinId,
        date: {
          gt: targetDate
        }
      },
      orderBy: { date: 'asc' },
      select: { price: true }
    });

    if (futurePrice && futurePrice.price > 0) {
      console.log(`[PORTFOLIO-HISTORY] Using future price for skin ${skinId} (carry-forward from future)`);
      return futurePrice.price;
    }

    return null;
  } catch (error) {
    console.error(`[PORTFOLIO-HISTORY] Error getting price for skin ${skinId}:`, error);
    return null;
  }
}

async function cleanupOldEntries(today) {
  try {
    const cutoffDate = new Date(today.getTime() - (MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000));
    
    const deletedCount = await prisma.portfolioHistory.deleteMany({
      where: {
        date: {
          lt: cutoffDate
        }
      }
    });
    
    if (deletedCount.count > 0) {
      console.log(`[PORTFOLIO-HISTORY] 🧹 Cleaned up ${deletedCount.count} old entries (older than ${MAX_HISTORY_DAYS} days)`);
    } else {
      console.log(`[PORTFOLIO-HISTORY] 🧹 No old entries to clean up`);
    }
  } catch (error) {
    console.error(`[PORTFOLIO-HISTORY] ❌ Error cleaning up old entries:`, error);
  }
}

// Allow manual execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  calculateAndStorePortfolioValues()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

