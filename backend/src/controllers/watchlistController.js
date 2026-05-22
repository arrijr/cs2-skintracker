import prisma from "../prisma/prismaClient.js";

// GET /api/v1/watchlist
export const getWatchlist = async (req, res) => {
  const userId = req.userId || req.auth?.userId; // From Clerk middleware (optional)
  
  if (!userId) {
    return res.json([]); // Return empty array if no user
  }
  
  const list = await prisma.watchlist.findMany({
    where: { userId },
    include: { skin: true }
  });
  res.json(list);
};

// POST /api/v1/watchlist
export const addToWatchlist = async (req, res) => {
  try {
    const userId = req.userId || req.auth?.userId; // From Clerk middleware (optional)
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required to add to watchlist" });
    }
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

    try {
      const entry = await prisma.watchlist.create({
        data: {
          userId,
          skinId,
          priceAlert: priceAlert ?? null,
        }
      });

      return res.json({ success: true, message: "Added to watchlist", id: entry.id });
    } catch (innerErr) {
      // P2002 = unique constraint violation (userId + skinId already in watchlist)
      if (innerErr?.code === "P2002") {
        return res.status(200).json({
          success: true,
          already: true,
          message: "Already in watchlist"
        });
      }
      throw innerErr;
    }
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
    const userId = req.userId || req.auth?.userId; // From Clerk middleware (optional)
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required to update price alert" });
    }
    const skinId = parseInt(req.params.skinId);
    const { priceAlert } = req.body;

    // Check if entry exists and belongs to user
    const entry = await prisma.watchlist.findFirst({ where: { userId, skinId } });
    if (!entry) {
      return res.status(404).json({ error: "Watchlist entry not found" });
    }

    // NOTE: Tier-based alert quotas (Free=2 / Lite=15 / Pro=unlimited) are
    // enforced in alertController via TIER_QUOTA. The old "1 alert per user"
    // hard limit that lived here was a leftover from the pre-tier era and
    // contradicted both the UI (one bell per row) and the pricing page.

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
    const userId = req.userId || req.auth?.userId; // From Clerk middleware (optional)
    
    if (!userId) {
      return res.status(401).json({ error: "Authentication required to remove from watchlist" });
    }
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
    const userId = req.userId; // From Clerk middleware
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
