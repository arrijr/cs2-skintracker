// /backend/scripts/testSteamImportSimple.js (Backend)
// {/* Simple test of Steam Import with minimal data */}

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety } from "./safety-guard.js";

const prisma = new PrismaClient();
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Safety check: Only allow in development
checkProductionSafety("Simple Steam Import test", false);

// node-fetch importieren (ESM)
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testSteamImport() {
  console.log("🔍 [TEST] Starting simple Steam import test...");
  console.log(`🔑 [TEST] API Key: ${STEAM_API_KEY ? 'SET' : 'NOT SET'}`);
  
  if (!STEAM_API_KEY) {
    console.error("❌ [TEST] STEAM_API_KEY not found");
    return;
  }

  try {
    // Test with a small batch
    const url = `https://www.steamwebapi.com/steam/api/items?key=${STEAM_API_KEY}&game=cs2&start=0&count=5`;
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
      console.log(`🎮 [TEST] Sample item:`, {
        name: data[0].itemname,
        market_hash_name: data[0].markethashname,
        type: data[0].itemtype
      });
      
      // Test database connection
      const existingSkinsCount = await prisma.skin.count();
      console.log(`📊 [TEST] Existing skins in DB: ${existingSkinsCount}`);
      
      // Test dry-run upsert
      const testSkin = {
        name: data[0].itemname || 'Test Skin',
        marketHashName: data[0].markethashname || 'test-skin',
        imageUrl: data[0].itemimage || null,
        type: data[0].itemtype || null,
        weapon: data[0].itemgroup || null,
        rarity: data[0].rarity || null,
        collection: data[0].collection || null,
        case: data[0].case || null,
        exterior: data[0].wear || null,
        quality: data[0].quality || null,
        currentPrice: 0,
        priceHistory: [],
        lastUpdated: new Date(),
      };
      
      console.log(`🔍 [TEST] Would upsert skin: ${testSkin.name}`);
      
      const existingSkin = await prisma.skin.findUnique({
        where: { marketHashName: testSkin.marketHashName }
      });
      
      if (existingSkin) {
        console.log(`🔍 [TEST] Would UPDATE existing skin: ${existingSkin.name}`);
      } else {
        console.log(`🔍 [TEST] Would INSERT new skin: ${testSkin.name}`);
      }
    }
    
  } catch (error) {
    console.error("❌ [TEST] Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testSteamImport();
