// backend/scripts/updateSkinPrices.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const API_KEY = process.env.STEAM_API_KEY || "1F737QB957GZJT4I"; // besser per .env einlesen

// node-fetch als ESM
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function fetchSkinData(marketHashName) {
  const url = `https://www.steamwebapi.com/steam/api/item?key=${API_KEY}&market_hash_name=${encodeURIComponent(
    marketHashName
  )}&game=cs2`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (!data.success || !data.price) return null;

    return {
      price: data.price,
      offerVolume: data.offervolume || null,
    };
  } catch (err) {
    console.error("❌ API-Fehler:", err);
    return null;
  }
}

async function updateAllSkinPrices() {
  try {
    const skins = await prisma.skin.findMany();
    let count = 0;

    for (const skin of skins) {
      const result = await fetchSkinData(skin.marketHashName);

      if (result && result.price) {
        // Preis-Historie speichern
        await prisma.priceHistory.create({
          data: {
            skinId: skin.id,
            date: new Date(),
            price: result.price,
          },
        });

        // Skin updaten (z. B. Angebot)
        await prisma.skin.update({
          where: { id: skin.id },
          data: {
            offerVolume: result.offerVolume,
          },
        });

        count++;
        console.log(
          `[${skin.marketHashName}] Preis: ${result.price} | Angebot: ${result.offerVolume}`
        );
      } else {
        console.log(`[${skin.marketHashName}] ❌ Kein Preis gefunden!`);
      }

      // Optionale Pause → API Rate Limit schonen
      // await new Promise(resolve => setTimeout(resolve, 80));
    }

    console.log(`✅ Preisupdate abgeschlossen! ${count} Skins aktualisiert.`);
  } catch (err) {
    console.error("❌ Fehler beim Update:", err);
  } finally {
    await prisma.$disconnect();
  }
}

// Start
updateAllSkinPrices();
