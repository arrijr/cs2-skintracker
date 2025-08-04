const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const skinController = require("../controllers/skinController");

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

// {/* Skin Detail Endpoint (z.B. für /api/v1/skins/2) */}
router.get("/:skinId", async (req, res) => {
  console.log("Backend: Anfrage für Skin params =", req.params); // Debug-Log
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
    res.json(skin);
  } catch (e) {
    res.status(500).json({ message: "Error fetching skin" });
  }
});

// Preisverlauf für Skin
router.get("/:skinId/history", skinController.getPriceHistory);

module.exports = router;