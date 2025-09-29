// /backend/scripts/testSteamImportReal.js (Backend)
// {/* Real test of Steam Import with actual database writes */}

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety } from "./safety-guard.js";

const prisma = new PrismaClient();
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Safety check: Only allow in development
checkProductionSafety("Real Steam Import test", false);

// node-fetch importieren (ESM)
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testSteamImportReal() {
  console.log("🔍 [TEST] Starting real Steam import test...");
  console.log(`🔑 [TEST] API Key: ${STEAM_API_KEY ? 'SET' : 'NOT SET'}`);
  
  if (!STEAM_API_KEY) {
    console.error("❌ [TEST] STEAM_API_KEY not found");
    return;
  }

  try {
    // Test with a small batch
    const url = `https://www.steamwebapi.com/steam/api/items?key=${STEAM_API_KEY}&game=cs2&start=0&count=3`;
    console.log(`📡 [TEST] Fetching from: ${url}`);
    
    const response = await fetch(url, { 
      timeout: 30000,
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      console.error(`❌ [TEST] HTTP Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const data = await response.json();
    console.log(`📊 [TEST] Got ${Array.isArray(data) ? data.length : 0} items`);
    
    if (Array.isArray(data) && data.length > 0) {
      // Test database connection
      const existingSkinsCount = await prisma.skin.count();
      console.log(`📊 [TEST] Existing skins in DB: ${existingSkinsCount}`);
      
      // Test real upsert
      for (let i = 0; i < Math.min(3, data.length); i++) {
        const item = data[i];
        const testSkin = {
          name: item.itemname || 'Test Skin',
          marketHashName: item.markethashname || 'test-skin',
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
        
        console.log(`🔍 [TEST] Upserting skin: ${testSkin.name}`);
        
        const existingSkin = await prisma.skin.findUnique({
          where: { marketHashName: testSkin.marketHashName }
        });
        
        if (existingSkin) {
          console.log(`🔄 [TEST] Updating existing skin: ${existingSkin.name}`);
          await prisma.skin.update({
            where: { marketHashName: testSkin.marketHashName },
            data: {
              name: testSkin.name,
              imageUrl: testSkin.imageUrl,
              weaponType: testSkin.weaponType,
              rarity: testSkin.rarity,
              collection: testSkin.collection,
              wear: testSkin.wear,
              quality: testSkin.quality,
              isStattrak: testSkin.isStattrak,
              isStar: testSkin.isStar,
              itemType: testSkin.itemType,
              itemName: testSkin.itemName,
              itemGroup: testSkin.itemGroup,
            }
          });
        } else {
          console.log(`➕ [TEST] Inserting new skin: ${testSkin.name}`);
          await prisma.skin.create({
            data: testSkin
          });
        }
      }
      
      // Check final count
      const finalSkinsCount = await prisma.skin.count();
      console.log(`📊 [TEST] Final skins in DB: ${finalSkinsCount}`);
      
    }
    
  } catch (error) {
    console.error("❌ [TEST] Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSteamImportReal();
