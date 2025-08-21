import express from "express";
import prisma from "../prisma/prismaClient.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`[DEBUG] Starting portfolio history for userId: ${userId}`);

    // 1. Get all user's transactions
    const transactions = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true },
      orderBy: { buyDate: 'asc' },
    });
    console.log(`[DEBUG] Found ${transactions.length} transactions.`);

    if (transactions.length === 0) {
      console.log("[DEBUG] No transactions, returning empty history.");
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
    console.log(`[DEBUG] Found ${priceHistories.length} total price history records for ${skinIds.length} unique skins.`);

    // 3. Create a map for easy price lookups: { skinId: { 'YYYY-MM-DD': price } }
    const priceMap = {};
    for (const ph of priceHistories) {
      if (!priceMap[ph.skinId]) {
        priceMap[ph.skinId] = {};
      }
      const dateStr = ph.date.toISOString().split('T')[0];
      priceMap[ph.skinId][dateStr] = ph.price;
    }
    console.log(`[DEBUG] Built priceMap for ${Object.keys(priceMap).length} skins.`);

    // 4. Generate portfolio value for each day
    const history = [];
    const today = new Date();
    const startDate = new Date(transactions[0].buyDate);
    console.log(`[DEBUG] Calculating history from ${startDate.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]}`);

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

    let loopCount = 0;
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      loopCount++;
      const dateStr = d.toISOString().split('T')[0];
      let dailyValue = 0;

      const ownedSkins = transactions.filter(t => new Date(t.buyDate) <= d);

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

      if(loopCount < 5 || loopCount > 360) { // Log first few and last few days
        console.log(`[DEBUG] Day ${dateStr}: Total Value = ${dailyValue.toFixed(2)}`);
      }

      history.push({ date: dateStr, value: dailyValue });
    }

    console.log(`[DEBUG] Finished calculation. Total history points: ${history.length}. Final value: ${history[history.length - 1]?.value}`);
    res.json(history);
  } catch (error) {
    console.error("Failed to generate portfolio history:", error);
    res.status(500).json({ error: "Could not generate portfolio history." });
  }
});

export default router;
