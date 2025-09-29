import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety, safeDatabaseOperation } from "./safety-guard.js";

const prisma = new PrismaClient();
const API_KEY = process.env.STEAM_API_KEY;

// Safety check: Only allow in development or with explicit production flag
checkProductionSafety("Skin import from Steam API", false);

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
  
  // Debug: Show first few items structure
  console.log("🔍 First 3 items structure:");
  for (let i = 0; i < Math.min(3, items.length); i++) {
    const item = items[i];
    console.log(`Item ${i + 1}:`, {
      name: item.marketname,
      stattrak: item.isstattrack,
      star: item.isstar,
      allFields: Object.keys(item)
    });
  }
  
  let count = 0;
  let stattrakCount = 0;
  let starCount = 0;
  
  for (const item of items) {
    try {
      // Debug logging for StatTrak and Star items
      if (item.isstattrack === 1) {
        stattrakCount++;
        console.log(`[DEBUG] StatTrak item found: ${item.marketname} (isstattrack: ${item.isstattrack})`);
      }
      if (item.isstar === 1) {
        starCount++;
        console.log(`[DEBUG] Star item found: ${item.marketname} (isstar: ${item.isstar})`);
      }
      
      // Fix: Parse StatTrak from market name since isstattrak field is undefined
      const isStattrak = item.marketname.includes('StatTrak™') || item.marketname.includes('StatTrak');
      const isStar = item.marketname.includes('★') || item.isstar === 1;
      
      if (isStattrak) {
        stattrakCount++;
        console.log(`[DEBUG] StatTrak detected from name: ${item.marketname}`);
      }
      if (isStar) {
        starCount++;
        console.log(`[DEBUG] Star detected from name: ${item.marketname}`);
      }
      
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
          isStattrak: isStattrak,
          isStar: isStar,
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
          isStattrak: isStattrak,
          isStar: isStar,
        }
      });
      count++;
      if (count % 100 === 0) console.log(`${count} Skins importiert...`);
    } catch (e) {
      console.error("Fehler beim Importieren:", item.marketname, e);
    }
  }

  console.log(`✅ Import abgeschlossen! ${count} Skins importiert/aktualisiert.`);
  console.log(`📊 StatTrak Skins: ${stattrakCount}`);
  console.log(`⭐ Star Skins: ${starCount}`);
  
  // Debug: Check what's actually in the database
  const dbStattrakCount = await prisma.skin.count({ where: { isStattrak: true } });
  const dbStarCount = await prisma.skin.count({ where: { isStar: true } });
  console.log(`🗄️ DB StatTrak count: ${dbStattrakCount}`);
  console.log(`🗄️ DB Star count: ${dbStarCount}`);
  
  await prisma.$disconnect();
}
importAllSkins()
  .catch(err => {
    console.error("❌ Import-Fehler:", err);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
