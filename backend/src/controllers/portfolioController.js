import prisma from "../prisma/prismaClient.js";
import axios from "axios";
import { getPortfolioRiskMetrics } from "../services/riskService.js";
import { getPortfolioContributionRanges } from "../services/contributionService.js";
import { subscriptionService } from "../services/subscriptionService.js";

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
    console.log('[PORTFOLIO-DEBUG] getPortfolio called with userId:', userId);
    
    if (!userId) {
      console.log('[PORTFOLIO-DEBUG] No userId found, returning empty array');
      return res.json([]); // Return empty array if no user
    }

    // 1) Einträge inkl. Skin laden
    const entries = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true },           // enthält u.a. name, market_hash_name, image_url
      orderBy: { buyDate: 'asc' }
    });
    
    console.log('[PORTFOLIO-DEBUG] Found portfolio entries:', entries.length);
    console.log('[PORTFOLIO-DEBUG] Entries:', entries);

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
    //    (Optimiert: Verwende gespeicherte Preise zuerst, Steam API nur als Fallback)
    const uniqueSkins = [
      ...new Set(
        aggregated.map(a =>
          a.skin.market_hash_name || a.skin.marketHashName || a.skin.name
        )
      ),
    ];
    const priceMap = {};
    
    // Priority 1: Use stored prices from database (fastest)
    for (const item of aggregated) {
      const mhn = item.skin.market_hash_name || item.skin.marketHashName || item.skin.name;
      if (mhn && item.skin.priceLatest) {
        priceMap[mhn] = item.skin.priceLatest;
      }
    }
    
    // Priority 2: Only fetch from Steam API for skins without stored prices
    const skinsNeedingSteamAPI = uniqueSkins.filter(mhn => !priceMap[mhn]);
    if (skinsNeedingSteamAPI.length > 0) {
      await Promise.all(
        skinsNeedingSteamAPI.map(async (mhn) => {
          if (!mhn) return;
          const p = await getCurrentSteamPrice(mhn);
          priceMap[mhn] = typeof p === 'number' ? p : null;
        })
      );
    }

    // 5) Antwort normalisieren (camelCase in der API) + marketPrice ergänzen
    // NOTE: Skin model has no priceChange24h/priceChange7d columns. Derive % change
    // from priceLatest vs priceAvg24h/priceAvg7d so the frontend movers panel works.
    const pctChange = (latest, prior) => {
      if (typeof latest !== "number" || typeof prior !== "number" || prior === 0) return null;
      return ((latest - prior) / prior) * 100;
    };

    const portfolio = aggregated.map((item) => {
      const s = item.skin;
      const marketHashName = s.market_hash_name || s.marketHashName || s.name;
      const imageUrl = s.imageUrl || s.image_url || s.itemimage || null;
      const marketPrice = priceMap[marketHashName] ?? null;
      const priceChange24h = pctChange(s.priceLatest, s.priceAvg24h);
      const priceChange7d = pctChange(s.priceLatest, s.priceAvg7d);

      return {
        skin: {
          id: s.id,
          name: s.name,
          marketHashName,
          slug: s.slug ?? null,
          weaponSlug: s.weaponSlug ?? null,
          imageUrl,
          marketPrice,
          rarity: s.rarity,
          weaponType: s.weaponType,
          exterior: s.wear,
          priceChange24h,
          priceChange7d,
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

    // SECURITY (2026-05-22 audit, finding #19 / Fix #3): enforce per-tier
    // portfolio row cap on the BACKEND. Previously only the frontend tier-
    // gating enforced this, so a Free user could `curl POST /portfolio` an
    // unlimited number of rows and side-step the €6.99 Lite paywall.
    // Caps: Free=25, Lite=200, Pro=999 (subscriptionService.PORTFOLIO_LIMITS).
    const quota = await subscriptionService.canAddPortfolioItem(userId, prisma);
    if (!quota.allowed) {
      return res.status(402).json({
        error: 'tier_limit_exceeded',
        limit: quota.limit,
        tier: quota.tier,
        count: quota.count,
        message: `Your ${quota.tier} plan is limited to ${quota.limit} portfolio items. Upgrade to add more.`,
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

    // Update portfolio history after adding skin
    try {
      // Calculate current portfolio value
      const portfolio = await prisma.portfolio.findMany({
        where: { userId },
        include: { skin: true }
      });

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
        let currentPrice = priceMap[marketHashName] || 0;
        
        // Use same price priority as in KPIs
        if (currentPrice === 0 && item.skin.priceLatest) {
          currentPrice = item.skin.priceLatest;
        } else if (currentPrice === 0 && item.skin.priceAvg) {
          currentPrice = item.skin.priceAvg;
        } else if (currentPrice === 0) {
          currentPrice = item.buyPrice;
        }
        
        totalValue += currentPrice * item.amount;
        totalInvested += item.buyPrice * item.amount;
      }

      // Create or update portfolio history entry for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      console.log("[PORTFOLIO-HISTORY] Creating history entry:", {
        userId,
        date: today,
        value: totalValue,
        invested: totalInvested,
        unrealizedPL: totalValue - totalInvested
      });
      
      // Note: PortfolioHistory has no @@unique([userId, date]) yet, so upsert with
      // compound key fails. Manual find+update/create instead.
      // TODO: add @@unique constraint + use proper upsert (also avoids race condition).
      const existing = await prisma.portfolioHistory.findFirst({
        where: { userId, date: today },
        select: { id: true },
      });
      const historyData = {
        value: totalValue,
        invested: totalInvested,
        unrealizedPL: totalValue - totalInvested,
      };
      if (existing) {
        await prisma.portfolioHistory.update({
          where: { id: existing.id },
          data: historyData,
        });
      } else {
        await prisma.portfolioHistory.create({
          data: { userId, date: today, ...historyData },
        });
      }
      
      console.log("[PORTFOLIO-HISTORY] History entry created/updated successfully");
    } catch (historyErr) {
      console.error("Failed to update portfolio history:", historyErr);
      // Don't fail the main operation if history update fails
    }

    return res.status(201).json({ success: true, id: entry.id, skinId: entry.skinId, amount: entry.amount, buyPrice: entry.buyPrice, buyDate: entry.buyDate });
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
    
    // Get current market prices for all skins (optimized)
    const uniqueSkins = [...new Set(portfolio.map(p => p.skin.market_hash_name || p.skin.marketHashName || p.skin.name))];
    const priceMap = {};
    
    // Priority 1: Use stored prices from database (fastest)
    for (const item of portfolio) {
      const mhn = item.skin.market_hash_name || item.skin.marketHashName || item.skin.name;
      if (mhn && item.skin.priceLatest) {
        priceMap[mhn] = item.skin.priceLatest;
      }
    }
    
    // Priority 2: Only fetch from Steam API for skins without stored prices
    const skinsNeedingSteamAPI = uniqueSkins.filter(mhn => !priceMap[mhn]);
    if (skinsNeedingSteamAPI.length > 0) {
      await Promise.all(
        skinsNeedingSteamAPI.map(async (mhn) => {
          if (!mhn) return;
          const p = await getCurrentSteamPrice(mhn);
          priceMap[mhn] = typeof p === 'number' ? p : 0;
        })
      );
    }
    
    for (const item of portfolio) {
      const marketHashName = item.skin.market_hash_name || item.skin.marketHashName || item.skin.name;
      let currentPrice = priceMap[marketHashName] || 0;
      
      // Priority 1: Use Steam API price if available
      if (currentPrice > 0) {
        // Use price from priceMap (already optimized)
      }
      // Priority 2: Use stored priceLatest from database
      else if (item.skin.priceLatest) {
        currentPrice = item.skin.priceLatest;
      }
      // Priority 3: Use priceAvg from database (if available)
      else if (item.skin.priceAvg) {
        currentPrice = item.skin.priceAvg;
      }
      // Priority 4: Use buyPrice as last resort
      else {
        currentPrice = item.buyPrice;
      }
      
      const itemValue = currentPrice * item.amount;
      const itemInvested = item.buyPrice * item.amount;
      
      totalValue += itemValue;
      totalInvested += itemInvested;
    }

    // Create portfolio history entry if it doesn't exist
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingHistory = await prisma.portfolioHistory.findFirst({
        where: {
          userId,
          date: today
        }
      });
      
      if (!existingHistory) {
        await prisma.portfolioHistory.create({
          data: {
            userId,
            date: today,
            value: totalValue,
            invested: totalInvested,
            unrealizedPL: totalValue - totalInvested
          }
        });
      }
    } catch (historyErr) {
      console.error("[PORTFOLIO-KPIS] Failed to create history entry:", historyErr);
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

// GET PORTFOLIO SUMMARY (Sprint 2 - dashboard KPIs + positions)
//
// Aggregation rule (fix for tech-debt item "getPortfolioSummary aggregiert nicht
// nach skinId"): multiple Portfolio rows for the SAME skinId are merged into a
// single position. Per group we sum `amount`, compute the weighted average buy
// price `sum(amount * buyPrice) / sum(amount)`, and include the underlying
// `purchases[]` entries so callers can still drill into individual lots.
// Mirrors the skinMap pattern already used in `getPortfolio`. `positionCount`
// is therefore the number of UNIQUE skins, not the number of Portfolio rows.
export const getPortfolioSummary = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const entries = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true },
      orderBy: { buyDate: 'asc' }
    });

    if (entries.length === 0) {
      return res.json({
        totalValue: 0,
        totalInvested: 0,
        unrealizedPL: 0,
        unrealizedPLPercent: 0,
        positionCount: 0,
        positions: [],
        lastUpdated: new Date()
      });
    }

    // 1) Group Portfolio rows by skinId.
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

    // 2) Resolve current price per unique skin (DB first, Steam API fallback).
    const groups = Object.values(skinMap);
    const priceMap = {};
    for (const g of groups) {
      const mhn = g.skin.market_hash_name || g.skin.marketHashName || g.skin.name;
      if (mhn && g.skin.priceLatest) {
        priceMap[mhn] = g.skin.priceLatest;
      }
    }
    const skinsNeedingSteamAPI = groups
      .map(g => g.skin.market_hash_name || g.skin.marketHashName || g.skin.name)
      .filter(mhn => mhn && priceMap[mhn] === undefined);
    if (skinsNeedingSteamAPI.length > 0) {
      await Promise.all(
        skinsNeedingSteamAPI.map(async (mhn) => {
          const p = await getCurrentSteamPrice(mhn);
          priceMap[mhn] = typeof p === 'number' ? p : null;
        })
      );
    }

    // 3) Build aggregated positions + roll up totals.
    let totalValue = 0;
    let totalInvested = 0;
    const positions = groups.map((g) => {
      const s = g.skin;
      const marketHashName = s.market_hash_name || s.marketHashName || s.name;
      const imageUrl = s.imageUrl || s.image_url || s.itemimage || null;
      // Fallback to priceAvg / first purchase price so positions never get a 0
      // current price just because Steam API was down and DB has no priceLatest.
      const currentPrice =
        priceMap[marketHashName] ?? s.priceLatest ?? s.priceAvg ?? g.purchases[0].buyPrice;
      const avgBuyPrice = g.amount > 0 ? g.totalInvested / g.amount : 0;
      const positionValue = currentPrice * g.amount;
      const unrealizedPL = positionValue - g.totalInvested;
      const unrealizedPLPercent =
        g.totalInvested > 0 ? (unrealizedPL / g.totalInvested) * 100 : 0;

      totalValue += positionValue;
      totalInvested += g.totalInvested;

      return {
        skinId: s.id,
        skinName: s.name,
        marketHashName,
        slug: s.slug ?? null,
        weaponSlug: s.weaponSlug ?? null,
        imageUrl,
        amount: g.amount,
        avgBuyPrice,
        currentPrice,
        totalInvested: g.totalInvested,
        totalValue: positionValue,
        unrealizedPL,
        unrealizedPLPercent,
        purchases: g.purchases,
      };
    });

    return res.json({
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalInvested: parseFloat(totalInvested.toFixed(2)),
      unrealizedPL: parseFloat((totalValue - totalInvested).toFixed(2)),
      unrealizedPLPercent:
        totalInvested > 0
          ? parseFloat((((totalValue - totalInvested) / totalInvested) * 100).toFixed(2))
          : 0,
      positionCount: positions.length,
      positions,
      lastUpdated: new Date(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

// GET /portfolio/export?format=csv
// Pro tier only. Returns CSV of portfolio entries with current price + P/L.
// v1: one row per Portfolio entry (not aggregated by skinId). Aggregation will
// come once the parallel getPortfolioSummary aggregation fix lands.
export const exportPortfolio = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Tier check via subscription service (single source of truth).
    const sub = await subscriptionService.getOrCreateSubscription(userId);
    if (sub.tier !== 'pro') {
      return res.status(403).json({ error: "Pro tier required" });
    }

    const format = (req.query.format || 'csv').toString().toLowerCase();
    if (format !== 'csv') {
      return res.status(400).json({ error: "Unsupported format. Use format=csv" });
    }

    // Pull user's preferredCurrency for the (future) currency-aware formatting.
    // For v1 the CSV outputs raw numbers — Excel/Sheets handles locale display.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferredCurrency: true },
    });
    const currency = user?.preferredCurrency || 'EUR';

    const entries = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true },
      orderBy: { buyDate: 'asc' },
    });

    // CSV escape (RFC 4180): wrap in quotes if value contains comma, quote, or
    // newline. Quotes inside the value are doubled.
    const esc = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    // Defuse Excel/Sheets formula injection for text fields that come from
    // untrusted sources (Steam-sourced skin name, market_hash_name, wear,
    // rarity). A leading `=`, `+`, `@`, `\t`, or `\r` makes spreadsheets
    // interpret the cell as a formula; prefix with single quote in that case.
    // We intentionally do NOT include `-`: it would mangle negative numbers,
    // and numeric values pass through fmtNum (controlled) anyway.
    const FORMULA_TRIGGERS = /^[=+@\t\r]/;
    const escText = (v) => {
      if (v === null || v === undefined) return '';
      let s = String(v);
      if (FORMULA_TRIGGERS.test(s)) s = "'" + s;
      if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const fmtNum = (n) => {
      if (typeof n !== 'number' || !Number.isFinite(n)) return '';
      return n.toFixed(2);
    };

    const header = [
      'skinName',
      'marketHashName',
      'wear',
      'rarity',
      'amount',
      'buyPrice',
      'buyDate',
      'currentPrice',
      'currentValue',
      'unrealizedPL',
      'unrealizedPLPercent',
    ].join(',');

    const rows = entries.map((e) => {
      const s = e.skin || {};
      const marketHashName = s.market_hash_name || s.marketHashName || s.name || '';
      const currentPrice = s.priceLatest || s.priceAvg || e.buyPrice;
      const currentValue = currentPrice * e.amount;
      const invested = e.buyPrice * e.amount;
      const unrealizedPL = currentValue - invested;
      const unrealizedPLPercent = invested > 0 ? (unrealizedPL / invested) * 100 : 0;

      return [
        escText(s.name || ''),
        escText(marketHashName),
        escText(s.wear || ''),
        escText(s.rarity || ''),
        esc(e.amount),
        esc(fmtNum(e.buyPrice)),
        esc(e.buyDate ? new Date(e.buyDate).toISOString().slice(0, 10) : ''),
        esc(fmtNum(currentPrice)),
        esc(fmtNum(currentValue)),
        esc(fmtNum(unrealizedPL)),
        esc(fmtNum(unrealizedPLPercent)),
      ].join(',');
    });

    // BOM so Excel detects UTF-8 properly with accented characters.
    const csv = '﻿' + [header, ...rows].join('\r\n') + '\r\n';

    const today = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="portfolio-${today}.csv"`
    );
    // Hint to currency-aware tooling downstream (not used by browsers).
    res.setHeader('X-Currency', currency);
    return res.send(csv);
  } catch (err) {
    console.error('[PORTFOLIO-EXPORT]', err);
    return res.status(500).json({ error: "Failed to export portfolio" });
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
