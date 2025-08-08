import prisma from "../prisma/prismaClient.js";
const prisma = new PrismaClient();

// GET /api/v1/watchlist
exports.getWatchlist = async (req, res) => {
  // User-ID sauber auslesen (id oder userId)
  const userId = req.user.id || req.user.userId;
  const list = await prisma.watchlist.findMany({
    where: { userId },
    include: { skin: true }
  });
  res.json(list);
};

// {/* Add Watchlist Entry Validation */}
exports.addToWatchlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { skinId, priceAlert } = req.body;

    // skinId muss vorhanden sein!
    if (!skinId) {
      return res.status(400).json({
        error: "Missing or invalid fields. Please provide a valid skinId.",
      });
    }

    // Preisalarm ist optional, aber falls angegeben: Muss Zahl > 0 sein!
    if (
      priceAlert !== undefined &&
      (typeof priceAlert !== "number" || isNaN(priceAlert) || priceAlert <= 0)
    ) {
      return res.status(400).json({
        error: "Invalid priceAlert. Please enter a number greater than 0.",
      });
    }

    // Hier prüfst du noch auf Limits (max 5 Skins in Watchlist) und ob der Skin schon in der Liste ist etc.
    // ...

    // Jetzt Eintrag anlegen:
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
exports.updatePriceAlert = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const skinId = parseInt(req.params.skinId);
    const { priceAlert } = req.body;

    // Zuerst explizit prüfen, ob Eintrag existiert und User gehört
    const entry = await prisma.watchlist.findFirst({ where: { userId, skinId } });
    if (!entry) {
      return res.status(404).json({ error: "Watchlist entry not found" });
    }

    // Max. 1 Preisalarm pro User
    const hasAlert = await prisma.watchlist.findFirst({
      where: { userId, priceAlert: { not: null }, skinId: { not: skinId } }
    });
    if (priceAlert && hasAlert)
      return res.status(400).json({ error: "Only 1 price alert allowed per user." });

    // Jetzt Update durchführen
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
exports.removeFromWatchlist = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const skinId = parseInt(req.params.skinId);

    // Explizit prüfen, ob Eintrag existiert und zu User gehört
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

// Zusätzlicher Preisalarm-Setter (optional)
exports.setPriceAlert = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
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
