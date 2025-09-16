import prisma from "../prisma/prismaClient.js";
import axios from "axios";
import { getPortfolioRiskMetrics } from "../services/riskService.js";
import { getPortfolioContributionRanges } from "../services/contributionService.js";

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
    console.error("Steam API error:", e.message);
    return null;
  }
}

export const getPortfolio = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId; // From Clerk middleware (optional)
    
    if (!userId) {
      return res.json([]); // Return empty array if no user
    }

    // 1) Einträge inkl. Skin laden
    const entries = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true },           // enthält u.a. name, market_hash_name, image_url
      orderBy: { buyDate: 'asc' }
    });

    // 2) Nach Skin aggregieren
    const skinMap = {};
    for (const entry of entries) {
      const sid = entry.skinId;
      if (!skinMap[sid]) {
        skinMap[sid] = {
          skin: entry.skin,
          purchases: [],
          amount: 0,
          totalInvested: 0,
        };
      }
      skinMap[sid].purchases.push({
        id: entry.id,
        amount: entry.amount,
        buyPrice: entry.buyPrice,
        buyDate: entry.buyDate,
      });
      skinMap[sid].amount += entry.amount;
      skinMap[sid].totalInvested += entry.amount * entry.buyPrice;
    }

    // 3) Ein erstes Portfolio-Array mit avgPrice erstellen
    const aggregated = Object.values(skinMap).map((item) => ({
      skin: item.skin,
      purchases: item.purchases,
      amount: item.amount,
      avgPrice: item.amount > 0 ? item.totalInvested / item.amount : 0,
    }));

    // 4) Aktuelle Marktpreise pro unique Skin parallel laden
    //    (Hinweis: Das ist ein MVP – später besser cachen / throttlen)
    const uniqueSkins = [
      ...new Set(
        aggregated.map(a =>
          a.skin.market_hash_name || a.skin.marketHashName || a.skin.name
        )
      ),
    ];
    const priceMap = {};
    await Promise.all(
      uniqueSkins.map(async (mhn) => {
        if (!mhn) return;
        const p = await getCurrentSteamPrice(mhn);
        priceMap[mhn] = typeof p === 'number' ? p : null;
      })
    );

    // 5) Antwort normalisieren (camelCase in der API) + marketPrice ergänzen
    const portfolio = aggregated.map((item) => {
      const s = item.skin;
      const marketHashName = s.market_hash_name || s.marketHashName || s.name;
      const imageUrl = s.imageUrl || s.image_url || s.itemimage || null;
      const marketPrice = priceMap[marketHashName] ?? null;

      return {
        skin: {
          id: s.id,
          name: s.name,
          marketHashName,
          imageUrl,
          marketPrice,
        },
        purchases: item.purchases,
        amount: item.amount,
        avgPrice: item.avgPrice,
      };
    });

    return res.json(portfolio);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const addToPortfolio = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId; // From Clerk middleware (optional)
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required to add to portfolio" });
    }
    const { skinId, amount, buyPrice, buyDate } = req.body;

    // Validation
    if (
      !skinId ||
      !amount ||
      typeof buyPrice !== "number" ||
      isNaN(buyPrice) ||
      buyPrice <= 0 ||
      !buyDate ||
      isNaN(Date.parse(buyDate))
    ) {
      return res.status(400).json({
        error: "Missing or invalid fields. Please enter all required data (Skin, Amount, Price > 0, Date).",
      });
    }

    const entry = await prisma.portfolio.create({
      data: {
        userId,
        skinId,
        amount,
        buyPrice,
        buyDate: new Date(buyDate)
      }
    });

    return res.json({ message: "Added to portfolio", id: entry.id });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error" });
    }
    return;
  }
};

export const removeFromPortfolio = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId; // From Clerk middleware (optional)
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required to remove from portfolio" });
    }
    const id = parseInt(req.params.id);

    // Check if entry exists and belongs to user
    const entry = await prisma.portfolio.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) {
      return res.status(404).json({ error: "Portfolio entry not found" });
    }

    await prisma.portfolio.delete({ where: { id } });
    return res.json({ message: "Removed from portfolio" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updatePortfolio = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId; // From Clerk middleware (optional)
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required to update portfolio" });
    }
    const id = parseInt(req.params.id);
    const { amount, buyPrice, buyDate } = req.body;

    // Find entry and check ownership
    const entry = await prisma.portfolio.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) {
      return res.status(404).json({ error: "Portfolio entry not found" });
    }

    // Only update provided fields
    const data = {};
    if (amount !== undefined) data.amount = amount;
    if (buyPrice !== undefined) data.buyPrice = buyPrice;
    if (buyDate !== undefined) data.buyDate = new Date(buyDate);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No update data provided" });
    }

    await prisma.portfolio.update({
      where: { id },
      data
    });

    return res.json({ message: "Portfolio entry updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET PORTFOLIO KPIs
export const getPortfolioKPIs = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId; // From Clerk middleware (optional)
    
    if (!userId) {
      return res.json({
        portfolioCount: 0,
        portfolioValue: 0,
        portfolioChange24h: 0,
        portfolioChange7d: 0,
        totalInvested: 0,
        unrealizedPL: 0,
        watchlistCount: 0,
        activeAlerts: 0,
        lastUpdated: new Date().toISOString()
      });
    }

    // Get portfolio data
    const portfolio = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true },
      orderBy: { buyDate: 'asc' }
    });

    // Get watchlist count
    const watchlistCount = await prisma.watchlist.count({
      where: { userId }
    });

    // Get active alerts count
    const activeAlerts = await prisma.watchlist.count({
      where: { 
        userId,
        priceAlert: { not: null }
      }
    });

    // Calculate portfolio value and changes
    let totalValue = 0;
    let totalInvested = 0;
    
    // Get current market prices for all skins
    const uniqueSkins = [...new Set(portfolio.map(p => p.skin.market_hash_name || p.skin.marketHashName || p.skin.name))];
    const priceMap = {};
    await Promise.all(
      uniqueSkins.map(async (mhn) => {
        if (!mhn) return;
        const p = await getCurrentSteamPrice(mhn);
        priceMap[mhn] = typeof p === 'number' ? p : 0;
      })
    );
    
    for (const item of portfolio) {
      const marketHashName = item.skin.market_hash_name || item.skin.marketHashName || item.skin.name;
      const currentPrice = priceMap[marketHashName] || 0;
      totalValue += currentPrice * item.amount;
      totalInvested += item.buyPrice * item.amount;
    }

    // Get last updated from portfolio history
    const lastHistory = await prisma.portfolioHistory.findFirst({
      where: { userId },
      orderBy: { date: 'desc' }
    });

    // Get 24h and 7d changes from history
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const yesterdayValue = await prisma.portfolioHistory.findFirst({
      where: { 
        userId,
        date: { gte: yesterday }
      },
      orderBy: { date: 'asc' }
    });

    const weekAgoValue = await prisma.portfolioHistory.findFirst({
      where: { 
        userId,
        date: { gte: weekAgo }
      },
      orderBy: { date: 'asc' }
    });

    let change24h = 0;
    let change7d = 0;

    if (yesterdayValue && totalValue > 0) {
      change24h = ((totalValue - yesterdayValue.value) / yesterdayValue.value) * 100;
    }

    if (weekAgoValue && totalValue > 0) {
      change7d = ((totalValue - weekAgoValue.value) / weekAgoValue.value) * 100;
    }

    // Get risk metrics
    const riskMetrics = await getPortfolioRiskMetrics(userId);

    const kpis = {
      portfolioCount: portfolio.length,
      portfolioValue: totalValue,
      portfolioChange24h: change24h,
      portfolioChange7d: change7d,
      totalInvested: totalInvested,
      unrealizedPL: totalValue - totalInvested,
      watchlistCount,
      activeAlerts,
      lastUpdated: lastHistory?.date || null,
      // Risk metrics
      volatility: riskMetrics.volatility,
      volatilityMessage: riskMetrics.volatilityMessage,
      maxDrawdown: riskMetrics.maxDrawdown,
      maxDrawdownMessage: riskMetrics.maxDrawdownMessage,
      hasEnoughRiskData: riskMetrics.hasEnoughData
    };

    res.json(kpis);
  } catch (error) {
    console.error("Failed to get portfolio KPIs:", error);
    res.status(500).json({ error: "Failed to get portfolio KPIs" });
  }
};

// GET PORTFOLIO CONTRIBUTION
export const getPortfolioContribution = async (req, res) => {
  try {
    const userId = req.userId; // From Clerk middleware
    const { range = 'week' } = req.query; // week, month, quarter
    
    const contributionData = await getPortfolioContributionRanges(userId);
    
    if (!contributionData[range]) {
      return res.status(400).json({ error: "Invalid range. Use: week, month, or quarter" });
    }
    
    res.json(contributionData[range]);
  } catch (error) {
    console.error("Failed to get portfolio contribution:", error);
    res.status(500).json({ error: "Failed to get portfolio contribution" });
  }
};
