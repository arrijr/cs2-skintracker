import express from "express";
import prisma from "../prisma/prismaClient.js";
import { getPriceHistory } from "../controllers/skinController.js";
import { fetchSkinPrice } from "../services/steamService.js";

const router = express.Router();

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
      console.log(`[DEBUG] No DB price, trying live Steam fetch...`);
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
