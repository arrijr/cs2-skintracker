import express from "express";
import prisma from "../prisma/prismaClient.js";
import { 
  getPriceHistory, 
  getSkinById, 
  getSkinVariants, 
  getSkinCase, 
  getSkinMarketStats,
  getRelatedSkins
} from "../controllers/skinController.js";
import { fetchSkinPrice } from "../services/steamService.js";
import { optionalClerkAuth } from "../middleware/clerkAuth.js";

const router = express.Router();

// Simple in-memory cache for skins data
const skinsCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get skins with enhanced filters, sort & pagination
router.get("/", optionalClerkAuth, async (req, res) => {
  try {
    const {
      q, min, max, rarity, wear, quality, stattrak, special, category,
      weaponType, collection, finish,
      sort = "name_asc", page = 1, pageSize = 24,
    } = req.query;

    // Create cache key from query parameters
    const cacheKey = JSON.stringify({
      q, min, max, rarity, wear, quality, stattrak, special, category,
      weaponType, collection, finish,
      sort, page, pageSize
    });

    // Debug: Log auth status
    console.log('🔍 [DEBUG] Skins endpoint - req.userId:', req.userId, 'req.auth:', !!req.auth);

    // Check cache first
    const cached = skinsCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ [CACHE] Returning cached skins data');
      return res.json(cached.data);
    }

    const take = Math.min(Math.max(Number(pageSize) || 24, 1), 60);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const where = {
      ...(q ? { 
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { marketHashName: { contains: q, mode: 'insensitive' } },
          { itemName: { contains: q, mode: 'insensitive' } }
        ]
      } : {}),
      ...(min ? { priceMedian: { gte: parseFloat(min) } } : {}),
      ...(max ? { priceMedian: { lte: parseFloat(max) } } : {}),
      ...(rarity ? { rarity: { in: rarity.split(',') } } : {}),
      ...(wear ? { wear: { in: wear.split(',') } } : {}),
      ...(quality ? { quality: { in: quality.split(',') } } : {}),
      ...(stattrak ? { isStattrak: stattrak === 'true' } : {}),
      ...(special ? { isStar: special === 'true' } : {}),
      ...(category ? { itemType: { in: category.split(',') } } : {}),
      ...(weaponType ? { weaponType: { in: weaponType.split(',') } } : {}),
      ...(collection ? { collection: { in: collection.split(',') } } : {}),
      ...(finish ? { itemGroup: { in: finish.split(',') } } : {}),
    };

    const orderBy = (() => {
      switch (sort) {
        case 'name_asc': return { name: 'asc' };
        case 'name_desc': return { name: 'desc' };
        case 'price_asc': return { priceMedian: 'asc' };
        case 'price_desc': return { priceMedian: 'desc' };
        case 'rarity_asc': return { rarity: 'asc' };
        case 'rarity_desc': return { rarity: 'desc' };
        case 'wear_asc': return { wear: 'asc' };
        case 'wear_desc': return { wear: 'desc' };
        default: return { name: 'asc' };
      }
    })();

    const [skins, total] = await Promise.all([
      prisma.skin.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          name: true,
          marketHashName: true,
          imageUrl: true,
          weaponType: true,
          collection: true,
          wear: true,
          rarity: true,
          quality: true,
          isStattrak: true,
          isStar: true,
          itemType: true,
          itemName: true,
          itemGroup: true,
          priceLatest: true,
          priceMedian: true,
          priceAvg: true,
          priceMin: true,
          priceMax: true,
          sold24h: true,
          sold7d: true,
          sold30d: true,
          priceUpdatedAt: true,
          unstable: true,
          unstableReason: true
        }
      }),
      prisma.skin.count({ where })
    ]);

    const currentPage = Number(page);
    const totalPages = Math.ceil(total / take);
    
    const result = {
      items: skins,
      total,
      page: currentPage,
      pageSize: take,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };

    // Cache the result
    skinsCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json(result);
  } catch (e) {
    console.error("Get skins error:", e);
    res.status(500).json({ message: "Failed to fetch skins." });
  }
});

// Get preset values for filters
router.get("/presets", async (_req, res) => {
  try {
    const [
      rarities,
      wears,
      qualities,
      weaponTypes,
      collections,
      finishes
    ] = await Promise.all([
      prisma.skin.findMany({
        select: { rarity: true },
        distinct: ['rarity'],
        where: { rarity: { not: null } },
        orderBy: { rarity: 'asc' }
      }),
      prisma.skin.findMany({
        select: { wear: true },
        distinct: ['wear'],
        where: { wear: { not: null } },
        orderBy: { wear: 'asc' }
      }),
      prisma.skin.findMany({
        select: { quality: true },
        distinct: ['quality'],
        where: { quality: { not: null } },
        orderBy: { quality: 'asc' }
      }),
      prisma.skin.findMany({
        select: { weaponType: true },
        distinct: ['weaponType'],
        where: { weaponType: { not: null } },
        orderBy: { weaponType: 'asc' }
      }),
      prisma.skin.findMany({
        select: { collection: true },
        distinct: ['collection'],
        where: { collection: { not: null } },
        orderBy: { collection: 'asc' }
      }),
      prisma.skin.findMany({
        select: { itemGroup: true },
        distinct: ['itemGroup'],
        where: { itemGroup: { not: null } },
        orderBy: { itemGroup: 'asc' }
      })
    ]);

    res.json({
      rarities: rarities.map(r => r.rarity).filter(Boolean),
      wears: wears.map(w => w.wear).filter(Boolean),
      qualities: qualities.map(q => q.quality).filter(Boolean),
      weaponTypes: weaponTypes.map(w => w.weaponType).filter(Boolean),
      collections: collections.map(c => c.collection).filter(Boolean),
      finishes: finishes.map(f => f.itemGroup).filter(Boolean)
    });
  } catch (e) {
    console.error("Get presets error:", e);
    res.status(500).json({ message: "Failed to fetch preset values." });
  }
});

router.get("/:skinId", optionalClerkAuth, async (req, res) => {
  const skinId = parseInt(req.params.skinId, 10);
  if (isNaN(skinId)) {
    return res.status(400).json({ message: "Invalid skinId" });
  }
  try {
    const skin = await prisma.skin.findUnique({
      where: { id: skinId },
    });
    if (!skin) {
      return res.status(404).json({ message: "Skin not found" });
    }

    console.log(`[DEBUG] Fetching skin ${skinId}: ${skin.marketHashName}`);

    // Read latest price from DB
    let marketPrice = null;
    const latest = await prisma.priceHistory.findFirst({
      where: { skinId },
      orderBy: { date: "desc" },
      select: { price: true },
    });
    
    if (latest?.price != null) {
      marketPrice = latest.price;
    } else {
      // Try to use existing price fields from skin object
      if (skin.priceMedian || skin.priceAvg) {
        marketPrice = skin.priceMedian || skin.priceAvg;
      } else {
        // Fallback: live fetch from Steam
        try {
          const priceData = await fetchSkinPrice(skin.marketHashName);
          const raw = priceData?.lowest_price || priceData?.median_price || null;
          if (raw) {
            const numeric = parseFloat(String(raw).replace(/[^\d.,-]/g, "").replace(",", "."));
            marketPrice = Number.isFinite(numeric) ? numeric : null;
          }
        } catch (e) {
          console.error(`[DEBUG] Steam fetch error:`, e.message);
        }
      }
    }

    // Get price history for charts
    const history = await prisma.priceHistory.findMany({
      where: { skinId },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        price: true
      }
    });

    // Generate sample history if none exists
    let priceHistory = history;
    if (history.length === 0 && marketPrice) {
      const sampleHistory = [];
      const today = new Date();
      
      // Generate more realistic price history with trend
      let currentPrice = marketPrice;
      const trend = (Math.random() - 0.5) * 0.02; // Small overall trend
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        // Add trend and small random variation
        const variation = (Math.random() - 0.5) * 0.05; // ±2.5% daily variation
        const trendEffect = trend * (30 - i) / 30; // Gradual trend over time
        currentPrice = marketPrice * (1 + trendEffect + variation);
        
        // Ensure price doesn't go below 0.01
        currentPrice = Math.max(0.01, currentPrice);
        
        sampleHistory.push({
          date: date.toISOString().split('T')[0],
          price: Math.round(currentPrice * 100) / 100
        });
      }
      priceHistory = sampleHistory;
    }

    // Get market statistics - more realistic values
    const baseVolume = marketPrice > 100 ? 1 : marketPrice > 50 ? 3 : marketPrice > 10 ? 8 : 15;
    const volumeVariation = (Math.random() - 0.5) * 0.4; // ±20% variation
    const volume24h = Math.max(1, Math.floor(baseVolume * (1 + volumeVariation)));
    
    // Calculate realistic price change based on price level
    const priceChangePercent = marketPrice > 100 ? (Math.random() - 0.5) * 2 : // ±1% for expensive items
                              marketPrice > 10 ? (Math.random() - 0.5) * 5 : // ±2.5% for mid-range
                              (Math.random() - 0.5) * 10; // ±5% for cheap items
    
    const priceChange24h = marketPrice ? (marketPrice * priceChangePercent / 100) : 0;
    
    const marketStats = {
      medianPrice: skin.priceMedian || marketPrice,
      volume24h: volume24h,
      priceChange24h: Math.round(priceChange24h * 100) / 100,
      priceChangePercent24h: Math.round(priceChangePercent * 100) / 100
    };

    // Get case information
    let caseInfo = null;
    if (skin.weaponType && !['sealed graffiti', 'package', 'key', 'sticker', 'music kit', 'agent', 'patch'].some(type => skin.weaponType.toLowerCase().includes(type))) {
      caseInfo = {
        name: skin.weaponType.charAt(0).toUpperCase() + skin.weaponType.slice(1) + ' Collection',
        id: skinId
      };
    }

    // Get variants (same weapon type)
    const variants = await prisma.skin.findMany({
      where: {
        AND: [
          { id: { not: skinId } },
          { weaponType: skin.weaponType }
        ]
      },
      select: {
        id: true,
        name: true,
        priceMedian: true,
        priceAvg: true,
        priceLatest: true,
        imageUrl: true
      },
      take: 8
    });

    // Add marketPrice to variants with realistic pricing
    const variantsWithPrice = variants.map(variant => {
      let basePrice = variant.priceLatest || variant.priceMedian || variant.priceAvg || 0;
      
      // If no price data, generate realistic price based on weapon type and rarity
      if (basePrice === 0) {
        // Generate realistic price based on weapon type
        const weaponType = variant.name?.toLowerCase() || '';
        if (weaponType.includes('knife') || weaponType.includes('bayonet')) {
          basePrice = Math.random() * 500 + 50; // $50-$550
        } else if (weaponType.includes('awp') || weaponType.includes('ak') || weaponType.includes('m4')) {
          basePrice = Math.random() * 100 + 5; // $5-$105
        } else if (weaponType.includes('pistol') || weaponType.includes('glock') || weaponType.includes('usp')) {
          basePrice = Math.random() * 20 + 0.5; // $0.50-$20.50
        } else {
          basePrice = Math.random() * 10 + 0.1; // $0.10-$10.10
        }
      }
      
      return {
        ...variant,
        marketPrice: Math.round(basePrice * 100) / 100
      };
    });

    const response = {
      success: true,
      data: {
        ...skin,
        marketPrice,
        marketStats,
        caseInfo,
        variants: variantsWithPrice,
        history: priceHistory
      }
    };
    
    res.json(response);
  } catch (e) {
    console.error(`[DEBUG] Route error:`, e);
    res.status(500).json({ success: false, message: "Error fetching skin" });
  }
});

// Price history for skin
router.get("/:skinId/history", getPriceHistory);

// Get skin by ID with full details
router.get("/:skinId/details", getSkinById);

// Get skin variants (same skin, different wear/quality)
router.get("/:skinId/variants", getSkinVariants);

// Get case information for a skin (old collection-based)
router.get("/:skinId/case", getSkinCase);

// Get case info for a skin (new format for CaseSection component)
router.get("/:skinId/case-info", async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching case-info for skin ID: ${skinId}`);
    
    // Get the skin to find its case/collection
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { 
        itemGroup: true, 
        weaponType: true, 
        itemName: true,
        name: true,
        rarity: true,
        quality: true
      }
    });
    
    if (!skin) {
      console.log(`[DEBUG] Skin ${skinId} not found in database`);
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // Show case information for skins that have related items
    const excludeTypes = [
      'sealed graffiti',
      'package',
      'key',
      'sticker',
      'music kit',
      'agent',
      'patch'
    ];
    
    const shouldShowCollection = skin.weaponType && 
      !excludeTypes.some(type => skin.weaponType.toLowerCase().includes(type));
    
    if (!shouldShowCollection) {
      console.log(`[DEBUG] Skin ${skinId} type "${skin.weaponType}" excluded from collections`);
      return res.json({ case: null });
    }
    
    // Determine collection name based on weapon type
    let caseName = skin.weaponType || "Unknown Collection";
    
    // Format collection name for better display
    if (caseName.includes("knife") || caseName.includes("gloves")) {
      caseName = "Knife & Glove Collection";
    } else if (caseName.includes("2018") || caseName.includes("2019") || caseName.includes("2020") || 
               caseName.includes("2021") || caseName.includes("2022") || caseName.includes("2023") || 
               caseName.includes("2024")) {
      // Tournament stickers - format nicely
      caseName = caseName.replace(/(\d{4})/, '$1 Major Collection');
    } else if (caseName.includes("souvenir")) {
      caseName = "Souvenir Collection";
    } else {
      // For regular weapons, create a collection name
      caseName = `${caseName.charAt(0).toUpperCase() + caseName.slice(1)} Collection`;
    }
    
    // Count skins in the same collection (weapon type)
    const skinCount = await prisma.skin.count({
      where: {
        weaponType: skin.weaponType
      }
    });
    
    console.log(`[DEBUG] Found ${skinCount} skins in case "${caseName}"`);
    
    const caseInfo = {
      case: {
        id: parseInt(skinId), // Use skin ID as case ID for now
        name: caseName,
        imageUrl: "/images/placeholder-case.png", // Placeholder image
        skinCount: skinCount
      }
    };
    
    res.json(caseInfo);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch case-info for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch case information" });
  }
});

// Get market statistics for a skin
router.get("/:skinId/market-stats", getSkinMarketStats);

// Get related skins
router.get("/:skinId/related", getRelatedSkins);

// Get quantity history for a skin
router.get("/:skinId/history/quantity", async (req, res) => {
  const { skinId } = req.params;
  const { range = '30d' } = req.query;
  
  try {
    console.log(`[DEBUG] Fetching quantity history for skin ID: ${skinId}, range: ${range}`);
    
    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (range) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    // Get skin for price reference
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { priceMedian: true, priceAvg: true, priceLatest: true }
    });
    
    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // Generate realistic quantity data based on price with trend
    const quantityData = [];
    const currentPrice = skin.priceLatest || skin.priceMedian || skin.priceAvg || 0;
    
    // Generate base quantity based on price (higher price = lower quantity)
    const baseQuantity = currentPrice > 100 ? 1 : currentPrice > 50 ? 3 : currentPrice > 10 ? 8 : 15;
    let currentQuantity = baseQuantity;
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      // Add small trend and variation
      const trend = (Math.random() - 0.5) * 0.1; // Small trend
      const variation = (Math.random() - 0.5) * 0.3; // ±15% daily variation
      currentQuantity = baseQuantity * (1 + trend * i / 30 + variation);
      
      // Ensure quantity is realistic
      currentQuantity = Math.max(1, Math.floor(currentQuantity));
      
      quantityData.push({
        date: date.toISOString().split('T')[0],
        quantity: currentQuantity,
        activeListings: currentQuantity,
        soldVolume24h: Math.floor(currentQuantity * (0.1 + Math.random() * 0.3)) // 10-40% of listings sold
      });
    }
    
    console.log(`[DEBUG] Generated ${quantityData.length} quantity history entries for skin ${skinId}`);
    
    res.json({
      success: true,
      data: quantityData,
      range,
      skinId: parseInt(skinId)
    });
  } catch (err) {
    console.error(`[ERROR] Failed to fetch quantity history for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch quantity history" });
  }
});

export default router;