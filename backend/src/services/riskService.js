import prisma from "../prisma/prismaClient.js";

// Calculate 30-day volatility for a portfolio
export async function calculatePortfolioVolatility(userId, days = 30) {
  try {
    // Get portfolio history for the last N days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const history = await prisma.portfolioHistory.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });
    
    if (history.length < 2) {
      return { volatility: null, message: "Not enough data" };
    }
    
    // Calculate daily returns
    const returns = [];
    for (let i = 1; i < history.length; i++) {
      const prevValue = history[i - 1].value;
      const currValue = history[i].value;
      
      if (prevValue > 0) {
        const dailyReturn = (currValue - prevValue) / prevValue;
        returns.push(dailyReturn);
      }
    }
    
    if (returns.length === 0) {
      return { volatility: null, message: "No valid returns" };
    }
    
    // Calculate volatility (standard deviation of returns)
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * 100; // Convert to percentage
    
    return { volatility: volatility, message: null };
  } catch (error) {
    console.error("Error calculating volatility:", error);
    return { volatility: null, message: "Calculation error" };
  }
}

// Calculate maximum drawdown for a portfolio
export async function calculateMaxDrawdown(userId, days = 90) {
  try {
    // Get portfolio history for the last N days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const history = await prisma.portfolioHistory.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });
    
    if (history.length < 2) {
      return { maxDrawdown: null, message: "Not enough data" };
    }
    
    let peak = history[0].value;
    let maxDrawdown = 0;
    
    for (const record of history) {
      if (record.value > peak) {
        peak = record.value;
      }
      
      if (peak > 0) {
        const drawdown = (peak - record.value) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    }
    
    const maxDrawdownPercent = maxDrawdown * 100; // Convert to percentage
    
    return { maxDrawdown: maxDrawdownPercent, message: null };
  } catch (error) {
    console.error("Error calculating max drawdown:", error);
    return { maxDrawdown: null, message: "Calculation error" };
  }
}

// Get comprehensive risk metrics for a user
export async function getPortfolioRiskMetrics(userId) {
  try {
    const [volatilityResult, drawdownResult] = await Promise.all([
      calculatePortfolioVolatility(userId, 30),
      calculateMaxDrawdown(userId, 90)
    ]);
    
    return {
      volatility: volatilityResult.volatility,
      volatilityMessage: volatilityResult.message,
      maxDrawdown: drawdownResult.maxDrawdown,
      drawdownMessage: drawdownResult.message,
      hasEnoughData: !volatilityResult.message && !drawdownResult.message
    };
  } catch (error) {
    console.error("Error getting risk metrics:", error);
    return {
      volatility: null,
      volatilityMessage: "Service error",
      maxDrawdown: null,
      drawdownMessage: "Service error",
      hasEnoughData: false
    };
  }
}
