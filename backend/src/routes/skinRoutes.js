import express from "express";
import prisma from "../prisma/prismaClient.js";
import { 
  getPriceHistory, 
  getSkinById, 
  getSkinVariants, 
  getSkinCase, 
  getSkinCaseInfo,
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
      include: {
        caseSkins: {
          include: {
            case: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          }
        }
      }
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

    // Get price history for charts (last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const history = await prisma.priceHistory.findMany({
      where: { 
        skinId,
        date: {
          gte: ninetyDaysAgo
        }
      },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        price: true
      }
    });

    console.log(`[DEBUG] Found ${history.length} price history entries for skin ${skinId}`);

    // Use REAL price history data only - NO sample data generation
    const priceHistory = history.map(entry => ({
      date: entry.date.toISOString().split('T')[0],
      price: entry.price
    }));

    // Get case information - Only real case relationships from CaseSkin table
    let caseInfo = null;
    if (skin.caseSkins && skin.caseSkins.length > 0) {
      // Use the first case (most skins belong to one case)
      const firstCase = skin.caseSkins[0].case;
      caseInfo = {
        id: firstCase.id,
        name: firstCase.name
      };
    }

    // Get variants (same weapon type) with REAL prices only
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
        imageUrl: true,
        rarity: true
      },
      take: 8
    });

    // Use REAL prices only - NO generated prices
    const variantsWithPrice = variants.map(variant => ({
      ...variant,
      marketPrice: variant.priceLatest || variant.priceMedian || variant.priceAvg || null
    }));

    // Remove caseSkins from response (internal data)
    const { caseSkins, ...skinWithoutCaseSkins } = skin;
    
    const response = {
      success: true,
      data: {
        ...skinWithoutCaseSkins,
        marketPrice,
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

// Get case information for a skin (for breadcrumbs)
router.get("/:skinId/case-breadcrumb", getSkinCaseInfo);

// Get case info for a skin (new format for CaseSection component)
// REMOVED: This endpoint created artificial collections based on weaponType
// Now using only real case relationships from /skins/:skinId endpoint

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
      case '1y':
        startDate.setDate(now.getDate() - 365);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    // Get real quantity history from database
    const quantityHistory = await prisma.skinQuantityHistory.findMany({
      where: {
        skinId: parseInt(skinId),
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'asc'
      },
      select: {
        date: true,
        quantity: true,
        activeListings: true,
        soldVolume24h: true
      }
    });
    
    // If we have real data, use it
    if (quantityHistory && quantityHistory.length > 0) {
      console.log(`[DEBUG] Found ${quantityHistory.length} real quantity history entries for skin ${skinId}`);
      
      const quantityData = quantityHistory.map(entry => ({
        date: entry.date.toISOString().split('T')[0],
        quantity: entry.quantity,
        activeListings: entry.activeListings,
        soldVolume24h: entry.soldVolume24h || 0
      }));
      
      return res.json({
        success: true,
        data: quantityData,
        range,
        skinId: parseInt(skinId),
        source: 'database'
      });
    }
    
    // NO SAMPLE DATA - Return empty if no real data exists
    console.log(`[DEBUG] No real quantity history found for skin ${skinId}, returning empty data`);
    
    res.json({
      success: true,
      data: [],
      range,
      skinId: parseInt(skinId),
      source: 'none',
      message: 'No quantity history available yet. Data will be collected daily.'
    });
  } catch (err) {
    console.error(`[ERROR] Failed to fetch quantity history for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch quantity history" });
  }
});

export default router;