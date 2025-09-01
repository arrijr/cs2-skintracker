import prisma from "../prisma/prismaClient.js";
import { fetchSkinPrice } from "../services/steamService.js";

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
    
    const currentSkin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { name: true, weaponType: true, itemGroup: true }
    });

    if (!currentSkin) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    // Find variants with same base name but different wear/quality
    const variants = await prisma.skin.findMany({
      where: {
        name: currentSkin.name,
        weaponType: currentSkin.weaponType,
        itemGroup: currentSkin.itemGroup,
        id: { not: parseInt(skinId) } // Exclude current skin
      },
      select: {
        id: true,
        name: true,
        wear: true,
        quality: true,
        isStattrak: true,
        isStar: true,
        priceLatest: true,
        imageUrl: true
      },
      orderBy: [
        { isStattrak: 'desc' },
        { wear: 'asc' },
        { priceLatest: 'asc' }
      ]
    });

    // Add current skin to the list and mark it as active
    const allVariants = [
      ...variants,
      {
        id: parseInt(skinId),
        name: currentSkin.name,
        wear: null, // Will be filled from current skin data
        quality: null,
        isStattrak: null,
        isStar: null,
        priceLatest: null,
        imageUrl: null,
        isActive: true // Mark current skin as active
      }
    ];

    const result = {
      variants: allVariants,
      currentSkin: {
        name: currentSkin.name,
        weaponType: currentSkin.weaponType,
        itemGroup: currentSkin.itemGroup
      }
    };

    console.log(`[DEBUG] Returning variants:`, result);
    res.json(result);
  } catch (err) {
    console.error(`[ERROR] getSkinVariants error:`, err);
    res.status(500).json({ error: "Could not fetch skin variants", details: err.message });
  }
};

// {/* Get case information for a skin */}
export const getSkinCase = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching case info for skin ID: ${skinId}`);
    
    // Get skin data to check if it has case information
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { collection: true, name: true }
    });

    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    // If no case/collection data, return 204 No Content
    if (!skin.collection) {
      console.log(`[DEBUG] No case data for skin ${skinId}, returning 204`);
      return res.status(204).send();
    }

    // Find all skins from the same case/collection
    const caseSkins = await prisma.skin.findMany({
      where: { collection: skin.collection },
      select: {
        id: true,
        name: true,
        wear: true,
        rarity: true,
        quality: true,
        isStattrak: true,
        priceLatest: true,
        imageUrl: true
      },
      orderBy: [
        { rarity: 'desc' },
        { priceLatest: 'desc' }
      ]
    });

    const caseInfo = {
      caseName: skin.collection,
      skins: caseSkins,
      totalSkins: caseSkins.length
    };

    console.log(`[DEBUG] Returning case info:`, caseInfo);
    res.json(caseInfo);
  } catch (err) {
    console.error(`[ERROR] getSkinCase error:`, err);
    res.status(500).json({ error: "Could not fetch case information", details: err.message });
  }
};

// {/* Get market statistics for a skin */}
export const getSkinMarketStats = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching market stats for skin ID: ${skinId}`);
    
    // Simple test response first
    const testStats = {
      volume24h: 150,
      volume7d: 1200,
      volume30d: 5000,
      currentPrice: 25.50,
      medianPrice: 24.00,
      minPrice: 20.00,
      maxPrice: 30.00,
      avgPrice: 24.50,
      buyOrders: 45,
      listings: 120,
      lastUpdated: new Date()
    };

    console.log(`[DEBUG] Returning test stats:`, testStats);
    res.json(testStats);
  } catch (err) {
    console.error(`[ERROR] getSkinMarketStats error:`, err);
    res.status(500).json({ error: "Could not fetch market statistics", details: err.message });
  }
};

export const searchSkin = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing search query.' });

  // Try to get skin from DB
  let skin = await prisma.skin.findUnique({
    where: { marketHashName: q }
  });

  // If not found: fetch price from Steam and create skin in DB
  if (!skin) {
    const priceData = await fetchSkinPrice(q);
    if (!priceData || !priceData.lowest_price) {
      return res.status(404).json({ error: 'Skin not found on Steam Market.' });
    }

    // Create new skin in DB
    skin = await prisma.skin.create({
      data: {
        name: q, // You can extract a display name here if needed
        marketHashName: q,
        imageUrl: null // Optional: add images later
      }
    });

    // Also save price in PriceHistory
    await prisma.priceHistory.create({
      data: {
        skinId: skin.id,
        date: new Date(),
        price: parseFloat(
          priceData.lowest_price.replace('€', '').replace(',', '.').trim()
        )
      }
    });
  }

  // Fetch current price
  const priceData = await fetchSkinPrice(q);

  res.json({
    id: skin.id,
    name: skin.name,
    marketHashName: skin.marketHashName,
    imageUrl: skin.imageUrl,
    price: priceData?.lowest_price ?? null,
    median: priceData?.median_price ?? null
  });
};

export const getPriceHistory = async (req, res) => {
  const { skinId } = req.params;
  try {
    const priceHistory = await prisma.priceHistory.findMany({
      where: { skinId: parseInt(skinId) },
      orderBy: { date: "asc" },
      select: { date: true, price: true }
    });
    res.json(priceHistory);
  } catch (err) {
    res.status(500).json({ error: "Could not fetch price history" });
  }
};
