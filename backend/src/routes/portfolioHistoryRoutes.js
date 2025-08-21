import express from "express";
import prisma from "../prisma/prismaClient.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Get all user's transactions
    const transactions = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true },
      orderBy: { buyDate: 'asc' },
    });

    if (transactions.length === 0) {
      return res.json([]);
    }

    // 2. Get all relevant price histories
    const skinIds = [...new Set(transactions.map(t => t.skinId))];
    const priceHistories = await prisma.priceHistory.findMany({
      where: {
        skinId: { in: skinIds },
      },
      orderBy: { date: 'asc' },
    });

    // 3. Create a map for easy price lookups: { skinId: { 'YYYY-MM-DD': price } }
    const priceMap = {};
    for (const ph of priceHistories) {
      if (!priceMap[ph.skinId]) {
        priceMap[ph.skinId] = {};
      }
      const dateStr = ph.date.toISOString().split('T')[0];
      priceMap[ph.skinId][dateStr] = ph.price;
    }

    // 4. Generate portfolio value for each day
    const history = [];
    const today = new Date();
    const startDate = new Date(transactions[0].buyDate); // Start from the first purchase

    // Fill in missing prices with the last known price
    for (const skinId of skinIds) {
        if (!priceMap[skinId]) continue;
        let lastPrice = null;
        for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            if (priceMap[skinId][dateStr]) {
                lastPrice = priceMap[skinId][dateStr];
            } else if (lastPrice !== null) {
                priceMap[skinId][dateStr] = lastPrice;
            }
        }
    }

    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      let dailyValue = 0;

      // Find skins owned on this day
      const ownedSkins = transactions.filter(t => new Date(t.buyDate) <= d);

      // Group by skinId to get total amount owned of each skin
      const holdings = {};
      for (const t of ownedSkins) {
          if (!holdings[t.skinId]) holdings[t.skinId] = 0;
          holdings[t.skinId] += t.amount;
      }

      for (const skinId in holdings) {
        const amount = holdings[skinId];
        const price = priceMap[skinId]?.[dateStr];
        if (typeof price === 'number') {
          dailyValue += amount * price;
        }
      }

      history.push({ date: dateStr, value: dailyValue });
    }

    res.json(history);
  } catch (error) {
    console.error("Failed to generate portfolio history:", error);
    res.status(500).json({ error: "Could not generate portfolio history." });
  }
});

export default router;
