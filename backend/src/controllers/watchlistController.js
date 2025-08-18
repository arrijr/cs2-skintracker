import prisma from "../prisma/prismaClient.js";

// GET /api/v1/watchlist
export const getWatchlist = async (req, res) => {
  const userId = req.user.userId;
  const list = await prisma.watchlist.findMany({
    where: { userId },
    include: { skin: true }
  });
  res.json(list);
};

// POST /api/v1/watchlist
export const addToWatchlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skinId, priceAlert } = req.body;

    if (!skinId) {
      return res.status(400).json({
        error: "Missing or invalid fields. Please provide a valid skinId.",
      });
    }

    if (
      priceAlert !== undefined &&
      (typeof priceAlert !== "number" || isNaN(priceAlert) || priceAlert <= 0)
    ) {
      return res.status(400).json({
        error: "Invalid priceAlert. Please enter a number greater than 0.",
      });
    }

    // (Optional) Check for limits (e.g. max 5 skins)
    // (Optional) Check if skin already in list

    const entry = await prisma.watchlist.create({
      data: {
        userId,
        skinId,
        priceAlert: priceAlert ?? null,
      }
    });

    return res.json({ message: "Added to watchlist", id: entry.id });
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Internal server error" });
    }
    return;
  }
};

// PATCH /api/v1/watchlist/:skinId
export const updatePriceAlert = async (req, res) => {
  try {
    const userId = req.user.userId;
    const skinId = parseInt(req.params.skinId);
    const { priceAlert } = req.body;

    // Check if entry exists and belongs to user
    const entry = await prisma.watchlist.findFirst({ where: { userId, skinId } });
    if (!entry) {
      return res.status(404).json({ error: "Watchlist entry not found" });
    }

    // Max 1 price alert per user
    const hasAlert = await prisma.watchlist.findFirst({
      where: { userId, priceAlert: { not: null }, skinId: { not: skinId } }
    });
    if (priceAlert && hasAlert)
      return res.status(400).json({ error: "Only 1 price alert allowed per user." });

    await prisma.watchlist.update({
      where: { id: entry.id },
      data: { priceAlert }
    });

    res.json({ message: "Price alert updated", skinId, priceAlert });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// DELETE /api/v1/watchlist/:skinId
export const removeFromWatchlist = async (req, res) => {
  try {
    const userId = req.user.userId;
    const skinId = parseInt(req.params.skinId);

    const entry = await prisma.watchlist.findFirst({ where: { userId, skinId } });
    if (!entry) {
      return res.status(404).json({ error: "Watchlist entry not found" });
    }

    await prisma.watchlist.delete({ where: { id: entry.id } });
    res.json({ message: "Removed from watchlist" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// (Optional) Additional price alert setter
export const setPriceAlert = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { skinId, priceAlert } = req.body;

    if (!skinId || priceAlert === undefined) {
      return res.status(400).json({ error: "skinId and priceAlert required" });
    }

    const entry = await prisma.watchlist.findFirst({ where: { userId, skinId } });
    if (!entry) {
      return res.status(404).json({ error: "Skin not found in your watchlist" });
    }

    await prisma.watchlist.update({
      where: { id: entry.id },
      data: { priceAlert }
    });

    return res.json({ message: "Price alert set", skinId, priceAlert });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
