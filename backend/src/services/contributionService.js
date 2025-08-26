import prisma from "../prisma/prismaClient.js";

// Calculate contribution of each position to portfolio performance
export async function calculatePortfolioContribution(userId, days = 7) {
  try {
    // Get portfolio positions
    const portfolio = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true }
    });

    if (portfolio.length === 0) {
      return { contributions: [], totalContribution: 0, message: "No portfolio positions" };
    }

    // Get portfolio values for start and end dates
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [startValue, endValue] = await Promise.all([
      prisma.portfolioHistory.findFirst({
        where: {
          userId,
          date: { gte: startDate }
        },
        orderBy: { date: 'asc' }
      }),
      prisma.portfolioHistory.findFirst({
        where: {
          userId,
          date: { lte: endDate }
        },
        orderBy: { date: 'desc' }
      })
    ]);

    if (!startValue || !endValue) {
      return { contributions: [], totalContribution: 0, message: "Insufficient history data" };
    }

    const totalPortfolioChange = endValue.value - startValue.value;
    const totalPortfolioChangePercent = startValue.value > 0 ? (totalPortfolioChange / startValue.value) * 100 : 0;

    // Calculate contribution for each position
    const contributions = [];
    let totalContribution = 0;

    for (const position of portfolio) {
      const skin = position.skin;
      
      // Get current market value
      const currentPrice = skin.priceLatest || 0;
      const currentValue = currentPrice * position.amount;
      
      // Calculate position change (simplified - using current price vs avg buy price)
      const avgBuyPrice = position.buyPrice;
      const positionChange = currentValue - (avgBuyPrice * position.amount);
      const positionChangePercent = avgBuyPrice > 0 ? (positionChange / (avgBuyPrice * position.amount)) * 100 : 0;
      
      // Calculate contribution to total portfolio change
      const positionWeight = startValue.value > 0 ? (avgBuyPrice * position.amount) / startValue.value : 0;
      const contribution = positionWeight * positionChangePercent;
      
      contributions.push({
        skinId: skin.id,
        skinName: skin.name,
        amount: position.amount,
        avgBuyPrice: avgBuyPrice,
        currentPrice: currentPrice,
        currentValue: currentValue,
        positionChange: positionChange,
        positionChangePercent: positionChangePercent,
        weight: positionWeight * 100, // Convert to percentage
        contribution: contribution
      });
      
      totalContribution += contribution;
    }

    // Sort by absolute contribution (biggest impact first)
    contributions.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));

    return {
      contributions,
      totalContribution,
      totalPortfolioChange,
      totalPortfolioChangePercent,
      message: null
    };
  } catch (error) {
    console.error("Error calculating portfolio contribution:", error);
    return { contributions: [], totalContribution: 0, message: "Calculation error" };
  }
}

// Get contribution data for different time ranges
export async function getPortfolioContributionRanges(userId) {
  try {
    const [week, month, quarter] = await Promise.all([
      calculatePortfolioContribution(userId, 7),
      calculatePortfolioContribution(userId, 30),
      calculatePortfolioContribution(userId, 90)
    ]);

    return {
      week,
      month,
      quarter
    };
  } catch (error) {
    console.error("Error getting contribution ranges:", error);
    return {
      week: { contributions: [], totalContribution: 0, message: "Error" },
      month: { contributions: [], totalContribution: 0, message: "Error" },
      quarter: { contributions: [], totalContribution: 0, message: "Error" }
    };
  }
}
