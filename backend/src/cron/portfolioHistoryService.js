import prisma from "../prisma/prismaClient.js";

export async function calculateAndStorePortfolioValues() {
  const users = await prisma.user.findMany();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  console.log(`[PORTFOLIO-HISTORY] Processing ${users.length} users at ${now.toISOString()}`);

  for (const user of users) {
    try {
      console.log(`[PORTFOLIO-HISTORY] Processing user: ${user.id} (${user.email})`);
      
      // Get user's current portfolio
      const portfolio = await prisma.portfolio.findMany({
        where: { userId: user.id },
        include: { skin: true }
      });

      if (portfolio.length === 0) {
        console.log(`[PORTFOLIO-HISTORY] No portfolio for user ${user.email}, skipping...`);
        continue;
      }

      // Calculate current portfolio value with carry-forward logic
      const { totalValue, investedValue, unrealizedPL } = await calculatePortfolioValue(portfolio, today);
      
      console.log(`[PORTFOLIO-HISTORY] User ${user.email}: Value=${totalValue}, Invested=${investedValue}, P/L=${unrealizedPL}`);

      // Check if we already have an entry for today
      const existingEntry = await prisma.portfolioHistory.findFirst({
        where: {
          userId: user.id,
          date: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) // Next day
          }
        }
      });

      if (existingEntry) {
        // Update existing entry
        await prisma.portfolioHistory.update({
          where: { id: existingEntry.id },
          data: {
            value: totalValue,
            invested: investedValue,
            unrealizedPL: unrealizedPL,
            updatedAt: now
          }
        });
        console.log(`[PORTFOLIO-HISTORY] Updated existing entry for user ${user.email}`);
      } else {
        // Create new entry
        await prisma.portfolioHistory.create({
          data: {
            userId: user.id,
            date: today,
            value: totalValue,
            invested: investedValue,
            unrealizedPL: unrealizedPL,
            createdAt: now,
            updatedAt: now
          }
        });
        console.log(`[PORTFOLIO-HISTORY] Created new entry for user ${user.email}: $${totalValue.toFixed(2)}`);
      }

    } catch (error) {
      console.error(`[PORTFOLIO-HISTORY] Error processing user ${user.email}:`, error);
    }
  }

  // Clean up old entries (keep only last 30 days)
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const deletedCount = await prisma.portfolioHistory.deleteMany({
    where: {
      date: {
        lt: thirtyDaysAgo
      }
    }
  });
  
  if (deletedCount.count > 0) {
    console.log(`[PORTFOLIO-HISTORY] Cleaned up ${deletedCount.count} old entries (older than 30 days)`);
  }
}

async function calculatePortfolioValue(portfolio, targetDate) {
  let totalValue = 0;
  let investedValue = 0;
  let unrealizedPL = 0;

  for (const entry of portfolio) {
    // Calculate invested value
    const entryInvested = entry.amount * entry.buyPrice;
    investedValue += entryInvested;

    // Get current price with carry-forward logic
    const currentPrice = await getCurrentPriceWithCarryForward(entry.skinId, targetDate);
    
    if (currentPrice) {
      const currentValue = entry.amount * currentPrice;
      totalValue += currentValue;
    } else {
      console.log(`[PORTFOLIO-HISTORY] No price data for skin ${entry.skinId} (${entry.skin?.marketHashName})`);
    }
  }

  unrealizedPL = totalValue - investedValue;

  return {
    totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimal places
    investedValue: Math.round(investedValue * 100) / 100,
    unrealizedPL: Math.round(unrealizedPL * 100) / 100
  };
}

async function getCurrentPriceWithCarryForward(skinId, targetDate) {
  // Get the most recent price for this skin up to the target date
  const latestPrice = await prisma.priceHistory.findFirst({
    where: {
      skinId: skinId,
      date: {
        lte: targetDate
      }
    },
    orderBy: { date: 'desc' }
  });

  if (latestPrice) {
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
    orderBy: { date: 'asc' }
  });

  if (futurePrice) {
    console.log(`[PORTFOLIO-HISTORY] Using future price for skin ${skinId} (carry-forward from future)`);
    return futurePrice.price;
  }

  return null;
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
