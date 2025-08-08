import prisma from "../prisma/prismaClient.js";
import axios from "axios";

async function getCurrentSteamPrice(marketHashName) {
  const url = `https://steamcommunity.com/market/priceoverview/?appid=730&market_hash_name=${encodeURIComponent(marketHashName)}&currency=3`;
  try {
    const res = await axios.get(url);
    // Prioritize lowest_price, fallback to median_price
    let price = null;
    if (res.data && res.data.lowest_price) {
      price = parseFloat(res.data.lowest_price.replace('€', '').replace(',', '.').trim());
    } else if (res.data && res.data.median_price) {
      price = parseFloat(res.data.median_price.replace('€', '').replace(',', '.').trim());
    }
    return price;
  } catch (e) {
    console.error("Steam API error:", e.message);
    return null;
  }
}

export const getPortfolio = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;

    // 1. Get all portfolio entries for this user, incl. skin
    const entries = await prisma.portfolio.findMany({
      where: { userId },
      include: { skin: true },
      orderBy: { buyDate: 'asc' }
    });

    // 2. Aggregate by skin ID
    const skinMap = {};

    for (const entry of entries) {
      const sid = entry.skinId;
      if (!skinMap[sid]) {
        skinMap[sid] = {
          skin: entry.skin,
          purchases: [],
          amount: 0,
          totalInvested: 0,
        };
      }
      skinMap[sid].purchases.push({
        id: entry.id,
        amount: entry.amount,
        buyPrice: entry.buyPrice,
        buyDate: entry.buyDate,
      });
      skinMap[sid].amount += entry.amount;
      skinMap[sid].totalInvested += entry.amount * entry.buyPrice;
    }

    // 3. Calculate avgPrice
    const portfolio = Object.values(skinMap).map((item) => ({
      skin: item.skin,
      purchases: item.purchases,
      amount: item.amount,
      avgPrice: item.amount > 0 ? item.totalInvested / item.amount : 0,
    }));

    return res.json(portfolio);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const addToPortfolio = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { skinId, amount, buyPrice, buyDate } = req.body;

    // Validation
    if (
      !skinId ||
      !amount ||
      typeof buyPrice !== "number" ||
      isNaN(buyPrice) ||
      buyPrice <= 0 ||
      !buyDate ||
      isNaN(Date.parse(buyDate))
    ) {
      return res.status(400).json({
        error: "Missing or invalid fields. Please enter all required data (Skin, Amount, Price > 0, Date).",
      });
    }

    const entry = await prisma.portfolio.create({
      data: {
        userId,
        skinId,
        amount,
        buyPrice,
        buyDate: new Date(buyDate)
      }
    });

    return res.json({ message: "Added to portfolio", id: entry.id });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error" });
    }
    return;
  }
};

export const removeFromPortfolio = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const id = parseInt(req.params.id);

    // Check if entry exists and belongs to user
    const entry = await prisma.portfolio.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) {
      return res.status(404).json({ error: "Portfolio entry not found" });
    }

    await prisma.portfolio.delete({ where: { id } });
    return res.json({ message: "Removed from portfolio" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updatePortfolio = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const id = parseInt(req.params.id);
    const { amount, buyPrice, buyDate } = req.body;

    // Find entry and check ownership
    const entry = await prisma.portfolio.findUnique({ where: { id } });
    if (!entry || entry.userId !== userId) {
      return res.status(404).json({ error: "Portfolio entry not found" });
    }

    // Only update provided fields
    const data = {};
    if (amount !== undefined) data.amount = amount;
    if (buyPrice !== undefined) data.buyPrice = buyPrice;
    if (buyDate !== undefined) data.buyDate = new Date(buyDate);

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: "No update data provided" });
    }

    await prisma.portfolio.update({
      where: { id },
      data
    });

    return res.json({ message: "Portfolio entry updated" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
