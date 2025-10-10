// /backend/scripts/updateAllCasesWithCurrentData.js — [Backend]
// {/* Update ALL cases with current sales and price data from SteamWebAPI */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

const API_KEY = process.env.STEAMWEBAPI_KEY;
const API_BASE_URL = "https://www.steamwebapi.com/steam/api/items";

if (!API_KEY) {
  console.error("❌ STEAMWEBAPI_KEY not found in environment variables");
  process.exit(1);
}

async function fetchSteamData(caseName) {
  try {
    const url = `${API_BASE_URL}?key=${API_KEY}&game=cs2&search=${encodeURIComponent(caseName)}`;
    console.log(`  🔍 Fetching: ${caseName}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`  ⚠️ HTTP ${response.status} for ${caseName}`);
      return null;
    }
    
    const data = await response.json();
    if (!data || !data.data || data.data.length === 0) {
      console.log(`  ❌ No data found for ${caseName}`);
      return null;
    }
    
    // Find the exact case match
    const caseItem = data.data.find(item => 
      item.market_hash_name && 
      item.market_hash_name.toLowerCase().includes(caseName.toLowerCase())
    );
    
    if (!caseItem) {
      console.log(`  ❌ No matching case found for ${caseName}`);
      return null;
    }
    
    console.log(`  ✅ Found: ${caseItem.market_hash_name}`);
    return caseItem;
    
  } catch (error) {
    console.error(`  ❌ Error fetching ${caseName}:`, error.message);
    return null;
  }
}

async function updateAllCasesWithCurrentData() {
  try {
    console.log("🔄 Updating ALL cases with current SteamWebAPI data...\n");
    
    const cases = await prisma.case.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📦 Processing ${cases.length} cases...\n`);
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    let updatedCount = 0;
    let skippedCount = 0;
    
    for (const caseItem of cases) {
      console.log(`\n🎯 Processing: ${caseItem.name} (ID: ${caseItem.id})`);
      
      // Fetch current data from SteamWebAPI
      const steamData = await fetchSteamData(caseItem.name);
      
      if (!steamData) {
        console.log(`  ⏭️ Skipping ${caseItem.name} - no data available`);
        skippedCount++;
        continue;
      }
      
      // Check if today's data already exists
      const existingToday = await prisma.caseSupply.findFirst({
        where: {
          caseId: caseItem.id,
          date: new Date(today)
        }
      });
      
      // Prepare new supply data
      const newSupply = {
        caseId: caseItem.id,
        date: new Date(today),
        dropped: existingToday?.dropped || 0,
        unboxed: existingToday?.unboxed || 0,
        remaining: existingToday?.remaining || 1000000,
        offerVolume: steamData.offervolume || 0,
        price: steamData.pricelatest || 0,
        soldData: JSON.stringify({
          sold24h: steamData.sold24h || 0,
          sold7d: steamData.sold7d || 0,
          sold30d: steamData.sold30d || 0,
          sold90d: steamData.sold90d || 0,
          soldTotal: steamData.soldtotal || 0
        })
      };
      
      if (existingToday) {
        // Update existing today's data
        await prisma.caseSupply.update({
          where: { id: existingToday.id },
          data: {
            offerVolume: newSupply.offerVolume,
            price: newSupply.price,
            soldData: newSupply.soldData
          }
        });
        console.log(`  ✅ Updated today's data for ${caseItem.name}`);
      } else {
        // Create new today's data
        await prisma.caseSupply.create({
          data: newSupply
        });
        console.log(`  ✅ Created today's data for ${caseItem.name}`);
      }
      
      // Update case with latest price
      await prisma.case.update({
        where: { id: caseItem.id },
        data: {
          price: steamData.pricelatest || 0,
          lastUpdated: new Date()
        }
      });
      
      updatedCount++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Update completed!");
    console.log(`📊 Cases updated: ${updatedCount}`);
    console.log(`⏭️ Cases skipped: ${skippedCount}`);
    console.log(`📅 Date: ${today}`);
    console.log("=".repeat(60));
    
    // Verify the update
    console.log("\n🔍 Verifying update...");
    const casesWithTodayData = await prisma.caseSupply.count({
      where: { date: new Date(today) }
    });
    console.log(`✅ Cases with today's data: ${casesWithTodayData}/${cases.length}`);
    
  } catch (error) {
    console.error("❌ Error updating cases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllCasesWithCurrentData();
