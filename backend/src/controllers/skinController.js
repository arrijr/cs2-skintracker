import prisma from "../prisma/prismaClient.js";
import { fetchSkinPrice } from "../services/steamService.js";

// {/* Get price history for a skin */}
export const getPriceHistory = async (req, res) => {
  const { skinId } = req.params;
  try {
    const history = await prisma.priceHistory.findMany({
      where: { skinId: parseInt(skinId) },
      orderBy: { date: 'asc' },
      select: {
        date: true,
        price: true
      }
    });
    
    res.json(history);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch price history for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch price history" });
  }
};

// {/* Get skin by ID with full details */}
export const getSkinById = async (req, res) => {
  const { skinId } = req.params;
  try {
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) }
    });
    
    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    res.json(skin);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch skin" });
  }
};

// {/* Get skin variants (same skin, different wear/quality) */}
export const getSkinVariants = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching variants for skin ID: ${skinId}`);
    
    // Get the base skin to find variants
    const baseSkin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { 
        name: true, 
        marketHashName: true,
        weaponType: true,
        itemName: true,
        itemGroup: true
      }
    });
    
    if (!baseSkin) {
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // Find all skins with similar characteristics (same weapon, itemName, itemGroup)
    const variants = await prisma.skin.findMany({
      where: {
        AND: [
          { id: { not: parseInt(skinId) } }, // Exclude current skin
          { weaponType: baseSkin.weaponType },
          { itemName: baseSkin.itemName },
          { itemGroup: baseSkin.itemGroup }
        ]
      },
      select: {
        id: true,
        name: true,
        wear: true,
        quality: true,
        isStattrak: true,
        isStar: true,
        imageUrl: true,
        priceAvg: true,
        priceMedian: true
      },
      orderBy: [
        { wear: 'asc' },
        { isStattrak: 'asc' }
      ]
    });
    
    // Add current skin to variants list
    const currentSkin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: {
        id: true,
        name: true,
        wear: true,
        quality: true,
        isStattrak: true,
        isStar: true,
        imageUrl: true,
        priceAvg: true,
        priceMedian: true
      }
    });
    
    if (currentSkin) {
      variants.unshift({ ...currentSkin, isActive: true });
    }
    
    res.json(variants);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch variants for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch skin variants" });
  }
};

// {/* Get case information for a skin */}
export const getSkinCase = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching case info for skin ID: ${skinId}`);
    
    // Get the skin to find its case/collection
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { itemGroup: true, weaponType: true, itemName: true }
    });
    
    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // Find all skins in the same item group (case/collection)
    const caseSkins = await prisma.skin.findMany({
      where: {
        itemGroup: skin.itemGroup
      },
      select: {
        id: true,
        name: true,
        wear: true,
        rarity: true,
        quality: true,
        isStattrak: true,
        isStar: true,
        priceAvg: true,
        priceMedian: true,
        imageUrl: true
      },
      orderBy: [
        { rarity: 'asc' },
        { name: 'asc' }
      ]
    });
    
    const caseInfo = {
      caseName: skin.itemGroup || "Unknown Case",
      skins: caseSkins,
      totalSkins: caseSkins.length
    };
    
    res.json(caseInfo);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch case info for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch case information" });
  }
};

// {/* Get market statistics for a skin */}
export const getSkinMarketStats = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching market stats for skin ID: ${skinId}`);
    
    // Get price history for calculations
    const priceHistory = await prisma.priceHistory.findMany({
      where: { skinId: parseInt(skinId) },
      orderBy: { date: 'desc' },
      take: 30 // Last 30 days
    });
    
    if (priceHistory.length === 0) {
      return res.json({
        volume24h: 0,
        volume7d: 0,
        volume30d: 0,
        currentPrice: 0,
        medianPrice: 0,
        lowestPrice: 0,
        maxPrice: 0,
        avgPrice: 0,
        buyOrders: 0,
        listings: 0,
        lastUpdated: null
      });
    }
    
    // Calculate statistics
    const prices = priceHistory.map(h => h.price);
    const currentPrice = prices[0];
    const lowestPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // Calculate median
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const medianPrice = sortedPrices.length % 2 === 0
      ? (sortedPrices[sortedPrices.length / 2 - 1] + sortedPrices[sortedPrices.length / 2]) / 2
      : sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    // Simulate volume data (in real implementation, this would come from trade data)
    const volume24h = Math.floor(Math.random() * 50) + 1;
    const volume7d = volume24h * 7 + Math.floor(Math.random() * 20);
    const volume30d = volume7d * 4 + Math.floor(Math.random() * 50);
    
    const stats = {
      volume24h,
      volume7d,
      volume30d,
      currentPrice,
      medianPrice,
      lowestPrice,
      maxPrice,
      avgPrice,
      buyOrders: Math.floor(Math.random() * 20) + 1,
      listings: Math.floor(Math.random() * 100) + 1,
      lastUpdated: new Date().toISOString()
    };
    
    res.json(stats);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch market stats for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch market statistics" });
  }
};

// {/* Get related skins */}
export const getRelatedSkins = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching related skins for skin ID: ${skinId}`);
    
    // Get the base skin to find related skins
    const baseSkin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { 
        weaponType: true,
        itemGroup: true,
        itemName: true,
        rarity: true
      }
    });
    
    if (!baseSkin) {
      return res.status(404).json({ error: 'Skin not found' });
    }
    
    // Find related skins (same weapon type or item group)
    const relatedSkins = await prisma.skin.findMany({
      where: {
        AND: [
          { id: { not: parseInt(skinId) } }, // Exclude current skin
          {
            OR: [
              { weaponType: baseSkin.weaponType },
              { itemGroup: baseSkin.itemGroup },
              { itemName: baseSkin.itemName }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        priceAvg: true,
        priceMedian: true,
        wear: true,
        rarity: true,
        isStattrak: true,
        isStar: true
      },
      orderBy: [
        { priceAvg: 'desc' }
      ],
      take: 12 // Limit to 12 related skins
    });
    
    res.json(relatedSkins);
  } catch (err) {
    console.error(`[ERROR] Failed to fetch related skins for skin ${skinId}:`, err);
    res.status(500).json({ error: "Could not fetch related skins" });
  }
};