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
    
    // Simple test response first to avoid database errors
    const testVariants = {
      variants: [
        {
          id: 19122,
          name: "★ StatTrak™ Gut Knife | Urban Masked",
          wear: "Factory New",
          quality: "Covert",
          isStattrak: true,
          isStar: true,
          priceLatest: 250.00,
          imageUrl: "https://example.com/skin1.jpg"
        },
        {
          id: 19123,
          name: "★ StatTrak™ Gut Knife | Urban Masked",
          wear: "Minimal Wear",
          quality: "Covert",
          isStattrak: true,
          isStar: true,
          priceLatest: 190.40,
          imageUrl: "https://example.com/skin2.jpg",
          isActive: true // Mark current skin as active
        },
        {
          id: 19124,
          name: "★ StatTrak™ Gut Knife | Urban Masked",
          wear: "Field-Tested",
          quality: "Covert",
          isStattrak: true,
          isStar: true,
          priceLatest: 150.00,
          imageUrl: "https://example.com/skin3.jpg"
        }
      ],
      currentSkin: {
        name: "★ StatTrak™ Gut Knife | Urban Masked",
        weaponType: "gut knife",
        itemGroup: "knife"
      }
    };

    console.log(`[DEBUG] Returning test variants:`, testVariants);
    res.json(testVariants);
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
    
    // Simple test response first to avoid database errors
    const testCaseInfo = {
      caseName: "Revolution Case",
      skins: [
        {
          id: 19125,
          name: "AK-47 | Redline",
          wear: "Field-Tested",
          rarity: "Classified",
          quality: "Classified",
          isStattrak: false,
          priceLatest: 15.50,
          imageUrl: "https://example.com/ak47.jpg"
        },
        {
          id: 19126,
          name: "M4A4 | Desolate Space",
          wear: "Minimal Wear",
          rarity: "Covert",
          quality: "Covert",
          isStattrak: true,
          priceLatest: 85.00,
          imageUrl: "https://example.com/m4a4.jpg"
        },
        {
          id: 19127,
          name: "AWP | Hyper Beast",
          wear: "Factory New",
          rarity: "Covert",
          quality: "Covert",
          isStattrak: false,
          priceLatest: 120.00,
          imageUrl: "https://example.com/awp.jpg"
        }
      ],
      totalSkins: 3
    };

    console.log(`[DEBUG] Returning test case info:`, testCaseInfo);
    res.json(testCaseInfo);
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
