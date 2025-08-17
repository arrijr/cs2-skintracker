import prisma from "../prisma/prismaClient.js";
import { fetchSkinPrice } from "../services/steamService.js";

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

{/* Price History – apply range filter */}
export const getPriceHistory = async (req, res) => {
  const { skinId } = req.params;
  const { range } = req.query;
  
  try {
    let dateFilter = {};
    
    // Apply date range filter
    if (range) {
      const now = new Date();
      let daysBack;
      
      switch (range) {
        case '1W':
          daysBack = 7;
          break;
        case '1M':
          daysBack = 30;
          break;
        case '6M':
          daysBack = 180;
          break;
        case '1Y':
          daysBack = 365;
          break;
        case 'ALL':
        default:
          daysBack = null;
          break;
      }
      
      if (daysBack) {
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - daysBack);
        dateFilter = {
          date: {
            gte: startDate
          }
        };
      }
    }

    const priceHistory = await prisma.priceHistory.findMany({
      where: { 
        skinId: parseInt(skinId),
        ...dateFilter
      },
      orderBy: { date: "asc" },
      select: { date: true, price: true }
    });
    res.json(priceHistory);
  } catch (err) {
    console.error("Price history error:", err);
    res.status(500).json({ error: "Could not fetch price history" });
  }
};
