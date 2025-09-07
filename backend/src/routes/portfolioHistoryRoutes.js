import express from "express";
import prisma from "../prisma/prismaClient.js";
import { clerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

router.get('/', clerkAuth, async (req, res) => {
  try {
    // Debug: Log request types and auth info
    console.log('🔍 [DEBUG] Portfolio History endpoint called');
    console.log('🔍 [DEBUG] req.auth type:', typeof req.auth);
    console.log('🔍 [DEBUG] req.user type:', typeof req.user);
    console.log('🔍 [DEBUG] req.userId type:', typeof req.userId);
    
    const userId = req.userId || req.user?.id;
    
    if (!userId) {
      console.log('❌ [DEBUG] No userId found');
      return res.status(401).json({ 
        error: 'Authentication required',
        debug: {
          hasAuth: !!req.auth,
          hasUser: !!req.user,
          hasUserId: !!req.userId,
          authKeys: req.auth ? Object.keys(req.auth) : null
        }
      });
    }
    
    const days = parseInt(req.query.days) || 30; // Default to 30 days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    console.log(`✅ [DEBUG] Portfolio History - userId: ${userId}, days: ${days}`);
    console.log(`[PORTFOLIO-HISTORY] Fetching ${days} days of history for user ${userId}`);

    // Try to get from PortfolioHistory table first (faster)
    const portfolioHistory = await prisma.portfolioHistory.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    if (portfolioHistory.length > 0) {
      console.log(`[PORTFOLIO-HISTORY] Found ${portfolioHistory.length} cached entries`);
      
      // Fill in missing days with carry-forward logic
      const history = [];
      let lastValue = 0;
      let lastInvested = 0;
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const entry = portfolioHistory.find(e => e.date.toISOString().split('T')[0] === dateStr);
        
        if (entry) {
          lastValue = entry.value;
          lastInvested = entry.invested || 0;
        }
        
        history.push({
          date: dateStr,
          value: lastValue,
          invested: lastInvested,
          unrealizedPL: lastValue - lastInvested
        });
      }
      
      return res.json(history);
    }

    // Fallback: Calculate on-the-fly (slower but more accurate)
    console.log(`[PORTFOLIO-HISTORY] No cached data, calculating on-the-fly`);
    
    // Get user's current portfolio
    const portfolio = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true }
    });

    if (portfolio.length === 0) {
      console.log("[PORTFOLIO-HISTORY] No portfolio found, returning empty history");
      return res.json([]);
    }

    // Get price history for all skins in portfolio
    const skinIds = [...new Set(portfolio.map(p => p.skinId))];
    const priceHistories = await prisma.priceHistory.findMany({
      where: {
        skinId: { in: skinIds },
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });

    // Build price map with carry-forward logic
    const priceMap = {};
    for (const skinId of skinIds) {
      priceMap[skinId] = {};
      const skinPrices = priceHistories.filter(ph => ph.skinId === skinId);
      
      let lastPrice = null;
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayPrice = skinPrices.find(sp => sp.date.toISOString().split('T')[0] === dateStr);
        
        if (dayPrice) {
          lastPrice = dayPrice.price;
        }
        
        if (lastPrice !== null) {
          priceMap[skinId][dateStr] = lastPrice;
        }
      }
    }

    // Calculate portfolio value for each day
    const history = [];
    let totalInvested = portfolio.reduce((sum, p) => sum + (p.amount * p.buyPrice), 0);
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      let dailyValue = 0;
      
      for (const entry of portfolio) {
        const price = priceMap[entry.skinId]?.[dateStr];
        if (typeof price === 'number') {
          dailyValue += entry.amount * price;
        }
      }
      
      history.push({
        date: dateStr,
        value: Math.round(dailyValue * 100) / 100,
        invested: Math.round(totalInvested * 100) / 100,
        unrealizedPL: Math.round((dailyValue - totalInvested) * 100) / 100
      });
    }

    console.log(`[PORTFOLIO-HISTORY] Calculated ${history.length} days of history`);
    res.json(history);
    
  } catch (error) {
    console.error("❌ [DEBUG] Portfolio History error:", error);
    console.error("[PORTFOLIO-HISTORY] Failed to generate portfolio history:", error);
    res.status(500).json({ 
      error: "Could not generate portfolio history.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      debug: {
        errorType: typeof error,
        errorMessage: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

export default router;
