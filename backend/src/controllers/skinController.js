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

    res.json({ variants, currentSkin });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch skin variants" });
  }
};

// {/* Get case information for a skin */}
export const getSkinCase = async (req, res) => {
  const { skinId } = req.params;
  try {
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { collection: true, name: true }
    });

    if (!skin || !skin.collection) {
      return res.status(404).json({ error: 'Case information not available' });
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

    res.json({ 
      caseName: skin.collection,
      skins: caseSkins,
      totalSkins: caseSkins.length
    });
  } catch (err) {
    res.status(500).json({ error: "Could not fetch case information" });
  }
};

// {/* Get market statistics for a skin */}
export const getSkinMarketStats = async (req, res) => {
  const { skinId } = req.params;
  try {
    console.log(`[DEBUG] Fetching market stats for skin ID: ${skinId}`);
    
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: {
        sold24h: true,
        sold7d: true,
        sold30d: true,
        priceLatest: true,
        priceMedian: true,
        priceMin: true,
        priceMax: true,
        priceAvg: true,
        buyOrderVolume: true,
        offerVolume: true,
        priceUpdatedAt: true
      }
    });

    console.log(`[DEBUG] Skin data:`, skin);

    if (!skin) {
      console.log(`[DEBUG] Skin not found for ID: ${skinId}`);
      return res.status(404).json({ error: 'Skin not found' });
    }

    const stats = {
      volume24h: skin.sold24h || 0,
      volume7d: skin.sold7d || 0,
      volume30d: skin.sold30d || 0,
      currentPrice: skin.priceLatest || 0,
      medianPrice: skin.priceMedian || 0,
      minPrice: skin.priceMin || 0,
      maxPrice: skin.priceMax || 0,
      avgPrice: skin.priceAvg || 0,
      buyOrders: skin.buyOrderVolume || 0,
      listings: skin.offerVolume || 0,
      lastUpdated: skin.priceUpdatedAt || new Date()
    };

    console.log(`[DEBUG] Returning stats:`, stats);
    res.json(stats);
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
