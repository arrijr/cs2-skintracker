// /backend/scripts/steamImportLimited.js (Backend)
// {/* Limited Steam Import for testing */}

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety } from "./safety-guard.js";

const prisma = new PrismaClient();
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Safety check: Only allow in development
checkProductionSafety("Limited Steam Import", false);

// node-fetch importieren (ESM)
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function importLimitedSkins() {
  console.log("🔍 [IMPORT] Starting limited Steam import...");
  console.log(`🔑 [IMPORT] API Key: ${STEAM_API_KEY ? 'SET' : 'NOT SET'}`);
  
  if (!STEAM_API_KEY) {
    console.error("❌ [IMPORT] STEAM_API_KEY not found");
    return;
  }

  try {
    // Import first 100 skins
    const url = `https://www.steamwebapi.com/steam/api/items?key=${STEAM_API_KEY}&game=cs2&start=0&count=100`;
    console.log(`📡 [IMPORT] Fetching from: ${url}`);
    
    const response = await fetch(url, { 
      timeout: 60000,
      signal: AbortSignal.timeout(60000)
    });
    
    if (!response.ok) {
      console.error(`❌ [IMPORT] HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`📊 [IMPORT] Got ${Array.isArray(data) ? data.length : 0} items`);
    
    if (Array.isArray(data) && data.length > 0) {
      // Check existing count
      const existingSkinsCount = await prisma.skin.count();
      console.log(`📊 [IMPORT] Existing skins in DB: ${existingSkinsCount}`);
      
      let insertedCount = 0;
      let updatedCount = 0;
      
      // Import skins
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const skinData = {
          name: item.itemname || 'Unknown',
          marketHashName: item.markethashname || 'unknown',
          imageUrl: item.itemimage || null,
          weaponType: item.itemgroup || null,
          rarity: item.rarity || null,
          collection: item.collection || null,
          wear: item.wear || null,
          quality: item.quality || null,
          isStattrak: item.isstattrak || false,
          isStar: item.isstar || false,
          itemType: item.itemtype || null,
          itemName: item.itemname || null,
          itemGroup: item.itemgroup || null,
        };
        
        try {
          const existingSkin = await prisma.skin.findUnique({
            where: { marketHashName: skinData.marketHashName }
          });
          
          if (existingSkin) {
            console.log(`🔄 [IMPORT] Updating: ${skinData.name}`);
            await prisma.skin.update({
              where: { marketHashName: skinData.marketHashName },
              data: {
                name: skinData.name,
                imageUrl: skinData.imageUrl,
                weaponType: skinData.weaponType,
                rarity: skinData.rarity,
                collection: skinData.collection,
                wear: skinData.wear,
                quality: skinData.quality,
                isStattrak: skinData.isStattrak,
                isStar: skinData.isStar,
                itemType: skinData.itemType,
                itemName: skinData.itemName,
                itemGroup: skinData.itemGroup,
              }
            });
            updatedCount++;
          } else {
            console.log(`➕ [IMPORT] Inserting: ${skinData.name}`);
            await prisma.skin.create({
              data: skinData
            });
            insertedCount++;
          }
        } catch (error) {
          console.error(`❌ [IMPORT] Error with ${skinData.name}:`, error.message);
        }
      }
      
      // Check final count
      const finalSkinsCount = await prisma.skin.count();
      console.log(`📊 [IMPORT] Final skins in DB: ${finalSkinsCount}`);
      console.log(`✅ [IMPORT] Import completed: ${insertedCount} inserted, ${updatedCount} updated`);
      
    }
    
  } catch (error) {
    console.error("❌ [IMPORT] Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

importLimitedSkins();
