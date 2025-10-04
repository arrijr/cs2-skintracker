// /backend/scripts/verifySupplyData.js — [Backend]
// {/* Verify supply data from SteamWebAPI */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;

async function verifySupplyData() {
  console.log("🔍 Verifying supply data from SteamWebAPI...");
  
  if (!STEAM_WEB_API_KEY) {
    console.error("❌ STEAM_API_KEY not found in environment variables.");
    return;
  }

  try {
    // Get sample cases from our database
    const sampleCases = await prisma.case.findMany({
      take: 5,
      orderBy: { price: 'desc' }
    });
    
    console.log(`📦 Checking ${sampleCases.length} sample cases:`);
    
    // Fetch data from SteamWebAPI
    const response = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&itemgroup=container`);
    
    if (!response.ok) {
      throw new Error(`SteamWebAPI.com error: ${response.status} - ${await response.text()}`);
    }
    
    const allItems = await response.json();
    const casesFromAPI = allItems.filter(item => item.itemgroup === 'container');
    console.log(`✅ Found ${casesFromAPI.length} cases from SteamWebAPI`);
    
    for (const dbCase of sampleCases) {
      console.log(`\n📦 Checking: ${dbCase.name}`);
      console.log(`   Our DB - Price: $${dbCase.price}`);
      console.log(`   Our DB - Remaining: ${dbCase.remaining}`);
      console.log(`   Our DB - Dropped: ${dbCase.dropped}`);
      console.log(`   Our DB - Unboxed: ${dbCase.unboxed}`);
      
      // Find matching case in API
      const apiCase = casesFromAPI.find(apiItem =>
        (apiItem.marketname && apiItem.marketname.toLowerCase().includes(dbCase.name.toLowerCase())) ||
        (apiItem.name && apiItem.name.toLowerCase().includes(dbCase.name.toLowerCase()))
      );
      
      if (apiCase) {
        console.log(`   SteamWebAPI - Price: $${apiCase.pricelatest || apiCase.pricelatestsell || 'N/A'}`);
        console.log(`   SteamWebAPI - Sold 24h: ${apiCase.sold24h || 'N/A'}`);
        console.log(`   SteamWebAPI - Sold 7d: ${apiCase.sold7d || 'N/A'}`);
        console.log(`   SteamWebAPI - Sold 30d: ${apiCase.sold30d || 'N/A'}`);
        
        // Check if we have supply data in API
        if (apiCase.supply || apiCase.remaining || apiCase.total_supply) {
          console.log(`   SteamWebAPI - Supply: ${apiCase.supply || apiCase.remaining || apiCase.total_supply || 'N/A'}`);
        } else {
          console.log(`   SteamWebAPI - Supply: No supply data available`);
        }
        
        // Check if we have drop/unbox data
        if (apiCase.dropped || apiCase.unboxed || apiCase.total_dropped) {
          console.log(`   SteamWebAPI - Dropped: ${apiCase.dropped || apiCase.total_dropped || 'N/A'}`);
          console.log(`   SteamWebAPI - Unboxed: ${apiCase.unboxed || 'N/A'}`);
        } else {
          console.log(`   SteamWebAPI - Dropped/Unboxed: No data available`);
        }
        
        // Analysis
        console.log(`   📊 Analysis:`);
        if (apiCase.sold24h) {
          console.log(`     - 24h sales: ${apiCase.sold24h} (this is real data)`);
        } else {
          console.log(`     - 24h sales: Not available in API`);
        }
        
        if (!apiCase.supply && !apiCase.remaining && !apiCase.total_supply) {
          console.log(`     - Supply data: NOT available in SteamWebAPI`);
          console.log(`     - Our remaining numbers are estimated/calculated`);
        }
        
        if (!apiCase.dropped && !apiCase.unboxed && !apiCase.total_dropped) {
          console.log(`     - Drop/Unbox data: NOT available in SteamWebAPI`);
          console.log(`     - Our dropped/unboxed numbers are estimated/calculated`);
        }
        
      } else {
        console.log(`   SteamWebAPI - No matching case found`);
      }
    }
    
    console.log(`\n📋 Summary:`);
    console.log(`- SteamWebAPI provides: Real-time prices, 24h/7d/30d sales data`);
    console.log(`- SteamWebAPI does NOT provide: Total supply, dropped, unboxed counts`);
    console.log(`- Our remaining/dropped/unboxed numbers are estimated/calculated`);
    console.log(`- This is normal - Steam doesn't publish total supply data`);
    
  } catch (error) {
    console.error("❌ Error verifying supply data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifySupplyData();
