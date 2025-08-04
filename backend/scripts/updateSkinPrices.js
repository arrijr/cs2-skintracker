const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const API_KEY = "1F737QB957GZJT4I";

async function fetchSkinData(marketHashName) {
  const url = `https://www.steamwebapi.com/steam/api/item?key=${API_KEY}&market_hash_name=${encodeURIComponent(marketHashName)}&game=cs2`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success || !data.price) return null;
    return {
      price: data.price, // Aktueller Preis
      offerVolume: data.offervolume || null, // Verfügbare Stückzahl
    };
  } catch {
    return null;
  }
}

async function updateAllSkinPrices() {
  const skins = await prisma.skin.findMany();
  let count = 0;
  for (const skin of skins) {
    const result = await fetchSkinData(skin.marketHashName);
    if (result && result.price) {
      // Preisverlauf speichern
      await prisma.priceHistory.create({
        data: {
          skinId: skin.id,
          date: new Date(),
          price: result.price,
        },
      });
      // Angebotene Stückzahl in Skin speichern
      await prisma.skin.update({
        where: { id: skin.id },
        data: {
          offerVolume: result.offerVolume,
        },
      });
      count++;
      console.log(`[${skin.marketHashName}] Preis: ${result.price} | Angebot: ${result.offerVolume}`);
    } else {
      console.log(`[${skin.marketHashName}] Kein Preis gefunden!`);
    }
    // Optional: Sleep (zur Entlastung der API, falls nötig)
    // await new Promise(resolve => setTimeout(resolve, 80));
  }
  await prisma.$disconnect();
  console.log(`✅ Preisupdate abgeschlossen! ${count} Skins aktualisiert.`);
}

updateAllSkinPrices();
