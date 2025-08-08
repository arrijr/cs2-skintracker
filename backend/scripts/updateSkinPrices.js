import prisma from "../prisma/prismaClient.js";
const API_KEY = "1F737QB957GZJT4I";

// node-fetch als ESM
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function fetchSkinData(marketHashName) {
  const url = `https://www.steamwebapi.com/steam/api/item?key=${API_KEY}&market_hash_name=${encodeURIComponent(marketHashName)}&game=cs2`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success || !data.price) return null;
    return {
      price: data.price,
      offerVolume: data.offervolume || null,
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
      // Save price history
      await prisma.priceHistory.create({
        data: {
          skinId: skin.id,
          date: new Date(),
          price: result.price,
        },
      });
      // Update skin with offer volume
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
    // Optionally: Sleep (for API rate limiting)
    // await new Promise(resolve => setTimeout(resolve, 80));
  }
  await prisma.$disconnect();
  console.log(`✅ Preisupdate abgeschlossen! ${count} Skins aktualisiert.`);
}

updateAllSkinPrices();
