// backend/src/routes/portfolioHistoryRoutes.js — [Backend]
// {/* Optimized Portfolio History Route - Fast, Stable, Guaranteed Data Form */}
import express from "express";
import prisma from "../prisma/prismaClient.js";
import { clerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

const MAX_DAYS = 90; // Maximum 90 days as requested
const DEFAULT_DAYS = 30; // Default to 30 days

router.get('/', clerkAuth, async (req, res) => {
  const startTime = Date.now();
  
  try {
    const userId = req.userId || req.user?.id;
    
    if (!userId) {
      console.log('❌ [PORTFOLIO-HISTORY] No userId found');
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }
    
    // Validate and limit days parameter
    const requestedDays = parseInt(req.query.days) || DEFAULT_DAYS;
    const days = Math.min(Math.max(requestedDays, 1), MAX_DAYS); // Clamp between 1 and 90
    
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    console.log(`[PORTFOLIO-HISTORY] 🚀 Fetching ${days} days of history for user ${userId}`);

    // Get portfolio history with optimized query
    const portfolioHistory = await prisma.portfolioHistory.findMany({
      where: {
        userId: userId,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        value: true,
        invested: true,
        unrealizedPL: true
      }
    });

    // Generate guaranteed data form with carry-forward logic
    const history = generateGuaranteedHistory(startDate, endDate, portfolioHistory);
    
    const duration = Date.now() - startTime;
    console.log(`[PORTFOLIO-HISTORY] ✅ Returned ${history.length} days in ${duration}ms`);
    
    res.json(history);
    
  } catch (error) {
    console.error("❌ [PORTFOLIO-HISTORY] Error:", error);
    
    // Return empty history on error to prevent frontend crashes
    const fallbackHistory = generateEmptyHistory(req.query.days || DEFAULT_DAYS);
    res.json(fallbackHistory);
  }
});

function generateGuaranteedHistory(startDate, endDate, portfolioHistory) {
  const history = [];
  let lastValue = 0;
  let lastInvested = 0;
  let lastUnrealizedPL = 0;
  
  // Create a map for faster lookups
  const historyMap = new Map();
  portfolioHistory.forEach(entry => {
    const dateStr = entry.date.toISOString().split('T')[0];
    historyMap.set(dateStr, {
      value: entry.value || 0,
      invested: entry.invested || 0,
      unrealizedPL: entry.unrealizedPL || 0
    });
  });
  
  // Generate history for each day with carry-forward logic
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const entry = historyMap.get(dateStr);
    
    if (entry) {
      // Use actual data
      lastValue = Math.round((entry.value || 0) * 100) / 100;
      lastInvested = Math.round((entry.invested || 0) * 100) / 100;
      lastUnrealizedPL = Math.round((entry.unrealizedPL || 0) * 100) / 100;
    }
    // If no entry, use last known values (carry-forward)
    
    history.push({
      date: dateStr,
      value: lastValue,
      invested: lastInvested,
      unrealizedPL: lastUnrealizedPL
    });
  }
  
  return history;
}

function generateEmptyHistory(days) {
  const history = [];
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    history.push({
      date: dateStr,
      value: 0,
      invested: 0,
      unrealizedPL: 0
    });
  }
  
  return history;
}

export default router;
