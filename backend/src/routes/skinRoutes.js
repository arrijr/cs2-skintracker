import express from "express";
import prisma from "../prisma/prismaClient.js";
import { getPriceHistory } from "../controllers/skinController.js";
import { fetchSkinPrice } from "../services/steamService.js";

const router = express.Router();

// {/* Browse all skins with filters and pagination */}
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      weaponType,
      wear,
      rarity,
      quality,
      isStattrak,
      isStar,
      minPrice,
      maxPrice,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build where clause
    const where = {};
    
    if (search && search.length >= 2) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { marketHashName: { contains: search, mode: "insensitive" } },
        { itemName: { contains: search, mode: "insensitive" } },
      ];
    }
    
    if (weaponType) where.weaponType = weaponType;
    if (wear) where.wear = wear;
    if (rarity) where.rarity = rarity;
    if (quality) where.quality = quality;
    if (isStattrak !== undefined) {
      if (isStattrak === 'true' || isStattrak === true) {
        where.isStattrak = true;
      } else if (isStattrak === 'false' || isStattrak === false) {
        where.isStattrak = false;
      }
    }
    if (isStar !== undefined) {
      if (isStar === 'true' || isStar === true) {
        where.isStar = true;
      } else if (isStar === 'false' || isStar === false) {
        where.isStar = false;
      }
    }
    
    if (minPrice || maxPrice) {
      where.OR = where.OR || [];
      const priceFilter = {};
      if (minPrice) priceFilter.gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
      
      where.OR.push(
        { priceMedian: priceFilter },
        { priceAvg: priceFilter },
      );
    }

    // Build orderBy
    const orderBy = {};
    if (sortBy === 'price') {
      orderBy.priceMedian = sortOrder;
    } else if (sortBy === 'rarity') {
      orderBy.rarity = sortOrder;
    } else {
      orderBy[sortBy] = sortOrder;
    }

    // Debug: Log the final where clause
    console.log('[DEBUG] Final where clause:', JSON.stringify(where, null, 2));
    
    // Debug: Check what's actually in the database
    const sampleSkins = await prisma.skin.findMany({
      take: 5,
      select: { id: true, name: true, weaponType: true, isStattrak: true, isStar: true }
    });
    console.log('[DEBUG] Sample skins from DB:', sampleSkins);
    
    const [skins, total] = await Promise.all([
      prisma.skin.findMany({
        where,
        orderBy,
        skip,
        take: parseInt(limit),
      }),
      prisma.skin.count({ where }),
    ]);

    res.json({
      skins,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (e) {
    console.error("Browse skins error:", e);
    res.status(500).json({ message: "Failed to fetch skins." });
  }
});

router.get("/search", async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) {
    return res.status(200).json([]);
  }

  try {
    const skins = await prisma.skin.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            marketHashName: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      take: 20,
    });
    res.json(skins);
  } catch (e) {
    res.status(500).json({ message: "Search failed." });
  }
});

// {/* Get filter options for UI */}
router.get("/filters", async (req, res) => {
  try {
    const [weaponTypes, wears, rarities, qualities] = await Promise.all([
      prisma.skin.findMany({
        select: { weaponType: true },
        where: { weaponType: { not: null } },
        distinct: ['weaponType'],
      }),
      prisma.skin.findMany({
        select: { wear: true },
        where: { wear: { not: null } },
        distinct: ['wear'],
      }),
      prisma.skin.findMany({
        select: { rarity: true },
        where: { rarity: { not: null } },
        distinct: ['rarity'],
      }),
      prisma.skin.findMany({
        select: { quality: true },
        where: { quality: { not: null } },
        distinct: ['quality'],
      }),
    ]);

    const result = {
      weaponTypes: weaponTypes.map(w => w.weaponType).filter(Boolean),
      wears: wears.map(w => w.wear).filter(Boolean),
      rarities: rarities.map(r => r.rarity).filter(Boolean),
      qualities: qualities.map(q => q.quality).filter(Boolean),
    };
    
    console.log('[DEBUG] Filter options:', result);
    res.json(result);
  } catch (e) {
    console.error("Get filters error:", e);
    res.status(500).json({ message: "Failed to fetch filter options." });
  }
});

router.get("/:skinId", async (req, res) => {
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
    console.log(`[DEBUG] Raw skin object:`, JSON.stringify(skin, null, 2));

    // Read latest price from DB
    let marketPrice = null;
    const latest = await prisma.priceHistory.findFirst({
      where: { skinId },
      orderBy: { date: "desc" },
      select: { price: true },
    });
    console.log(`[DEBUG] Latest DB price:`, latest);
    
    if (latest?.price != null) {
      marketPrice = latest.price;
      console.log(`[DEBUG] Using DB price: ${marketPrice}`);
    } else {
      // Try to use existing price fields from skin object
      console.log(`[DEBUG] Checking skin object prices: priceMedian=${skin.priceMedian}, priceAvg=${skin.priceAvg}`);
      
      if (skin.priceMedian || skin.priceAvg) {
        marketPrice = skin.priceMedian || skin.priceAvg;
        console.log(`[DEBUG] Using skin object price: ${marketPrice}`);
      } else {
        console.log(`[DEBUG] No skin object prices, trying live Steam fetch...`);
        // Fallback: live fetch from Steam
        try {
          const priceData = await fetchSkinPrice(skin.marketHashName);
          console.log(`[DEBUG] Steam API response:`, JSON.stringify(priceData, null, 2));
          
          const raw = priceData?.lowest_price || priceData?.median_price || null;
          console.log(`[DEBUG] Raw price from Steam:`, raw);
          
          if (raw) {
            const numeric = parseFloat(String(raw).replace(/[^\d.,-]/g, "").replace(",", "."));
            marketPrice = Number.isFinite(numeric) ? numeric : null;
            console.log(`[DEBUG] Parsed numeric price:`, numeric, `→ marketPrice:`, marketPrice);
          } else {
            console.log(`[DEBUG] No valid price found in Steam response`);
          }
        } catch (e) {
          console.error(`[DEBUG] Steam fetch error:`, e.message);
        }
      }
    }

    const response = { ...skin, marketPrice };
    console.log(`[DEBUG] Final response:`, JSON.stringify(response, null, 2));
    console.log(`[DEBUG] marketPrice in response:`, response.marketPrice, `(type: ${typeof response.marketPrice})`);
    
    res.json(response);
  } catch (e) {
    console.error(`[DEBUG] Route error:`, e);
    res.status(500).json({ message: "Error fetching skin" });
  }
});

// Price history for skin
router.get("/:skinId/history", getPriceHistory);

export default router;
