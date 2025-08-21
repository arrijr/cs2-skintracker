import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const API_KEY = process.env.STEAM_API_KEY;

// node-fetch importieren (ESM)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function importAllSkins() {
  const url = `https://www.steamwebapi.com/steam/api/items?key=${API_KEY}&game=cs2`;
  const res = await fetch(url);
  const data = await res.json();
  console.log("RAW DATA:", Array.isArray(data), data.length);

  const items = Array.isArray(data) ? data : data.items;
  if (!items || !Array.isArray(items)) {
    console.error("❌ Kein items-Array im Response! Prüfe API-Key und Endpoint.");
    process.exit(1);
  }
  let count = 0;
  for (const item of items) {
    try {
      await prisma.skin.upsert({
        where: { marketHashName: item.markethashname },
        update: {
          name: item.marketname,
          imageUrl: item.itemimage,
          collection: item.collection || null,
          wear: item.wear || null,
          rarity: item.rarity || null,
          priceMedian: item.pricemedian || null,
          priceMin: item.pricemin || null,
          priceMax: item.pricemax || null,
          priceAvg: item.priceavg || null,
          weaponType: item.itemtype || null,
          itemName: item.itemname || null,
          offerVolume: item.offervolume || null,
          sold24h: item.sold24h || null,
          quality: item.quality || null,
          isStattrak: item.isstattrack === 1,
          isStar: item.isstar === 1,
        },
        create: {
          name: item.marketname,
          marketHashName: item.markethashname,
          imageUrl: item.itemimage,
          collection: item.collection || null,
          wear: item.wear || null,
          rarity: item.rarity || null,
          priceMedian: item.pricemedian || null,
          priceMin: item.pricemin || null,
          priceMax: item.pricemax || null,
          priceAvg: item.priceavg || null,
          weaponType: item.itemtype || null,
          itemName: item.itemname || null,
          offerVolume: item.offervolume || null,
          sold24h: item.sold24h || null,
          quality: item.quality || null,
          isStattrak: item.isstattrack === 1,
          isStar: item.isstar === 1,
        }
      });
      count++;
      if (count % 100 === 0) console.log(`${count} Skins importiert...`);
    } catch (e) {
      console.error("Fehler beim Importieren:", item.marketname, e);
    }
  }

  console.log(`✅ Import abgeschlossen! ${count} Skins importiert/aktualisiert.`);
  await prisma.$disconnect();
}
importAllSkins()
  .catch(err => {
    console.error("❌ Import-Fehler:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
