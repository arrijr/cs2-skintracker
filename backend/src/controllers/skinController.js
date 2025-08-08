import prisma from "../prisma/prismaClient.js";
import { fetchSkinPrice } from "../services/steamService.js";

exports.searchSkin = async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing search query.' });

  // Versuchen, Skin aus DB zu holen
  let skin = await prisma.skin.findUnique({
    where: { marketHashName: q }
  });

  // Wenn nicht gefunden: Preis von Steam holen und Skin anlegen
  if (!skin) {
    const priceData = await fetchSkinPrice(q);
    if (!priceData || !priceData.lowest_price) {
      return res.status(404).json({ error: 'Skin not found on Steam Market.' });
    }

    // Neuen Skin in DB speichern
    skin = await prisma.skin.create({
      data: {
        name: q, // Du kannst hier auch einen sprechenden Namen extrahieren
        marketHashName: q,
        imageUrl: null // Optional: später mit Bildern erweitern
      }
    });

    // Preis auch in PriceHistory speichern
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

  // Aktuellen Preis abrufen
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


exports.getPriceHistory = async (req, res) => {
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
