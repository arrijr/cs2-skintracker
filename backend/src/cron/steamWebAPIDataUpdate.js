// /backend/src/cron/steamWebAPIDataUpdate.js — [Backend]
// {/* Daily cron job to update data from SteamWebAPI.com */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;

export async function updateSteamWebAPIData() {
  console.log("🕐 [CRON] Starting daily SteamWebAPI.com data update...");
  console.log(`📅 [CRON] Update time: ${new Date().toISOString()}`);
  
  if (!STEAM_WEB_API_KEY) {
    console.error("❌ [CRON] STEAM_API_KEY not found, skipping update");
    return;
  }

  try {
    // 1. Update cases with real market data
    await updateCasesData();
    
    // 2. Update skins with real prices
    await updateSkinsData();
    
    // 3. Log update completion
    await logUpdateCompletion();
    
    console.log("✅ [CRON] Daily SteamWebAPI.com data update completed");
    
  } catch (error) {
    console.error("❌ [CRON] Error during SteamWebAPI.com update:", error);
    await logUpdateError(error);
  } finally {
    await prisma.$disconnect();
  }
}

async function updateCasesData() {
  console.log("🎲 [CRON] Updating cases data...");
  
  try {
    // Fetch cases from SteamWebAPI.com
    const response = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&itemgroup=container`);
    
    if (!response.ok) {
      throw new Error(`SteamWebAPI.com error: ${response.status}`);
    }
    
    const cases = await response.json();
    console.log(`📦 [CRON] Fetched ${cases.length} cases from SteamWebAPI.com`);
    
    let updatedCount = 0;
    
    for (const caseItem of cases) {
      try {
        const caseName = caseItem.marketname || caseItem.name;
        const realPrice = caseItem.pricelatest || 0;
        const realPriceSell = caseItem.pricelatestsell || realPrice;
        const sold24h = caseItem.sold24h || 0;
        const sold7d = caseItem.sold7d || 0;
        const sold30d = caseItem.sold30d || 0;
        
        // Find existing case
        const existingCase = await prisma.case.findFirst({
          where: {
            OR: [
              { name: { contains: caseName, mode: 'insensitive' } },
              { name: { contains: caseName.replace(' Case', ''), mode: 'insensitive' } }
            ]
          }
        });
        
        if (existingCase && realPrice > 0) {
          await prisma.case.update({
            where: { id: existingCase.id },
            data: {
              price: realPrice,
              marketCap: realPrice * (existingCase.remaining || 0),
              priceChange24h: calculatePriceChange(caseItem.pricelatestsell24h, realPriceSell),
              priceChange7d: calculatePriceChange(caseItem.pricelatestsell7d, realPriceSell),
              priceChange30d: calculatePriceChange(caseItem.pricelatestsell30d, realPriceSell),
              lastUpdated: new Date(),
              // Update supply based on sales
              dropped: (existingCase.dropped || 0) + sold24h,
              unboxed: (existingCase.unboxed || 0) + sold24h,
              remaining: Math.max(0, (existingCase.remaining || 0) - sold24h)
            }
          });
          
          updatedCount++;
        }
        
      } catch (error) {
        console.error(`❌ [CRON] Error updating case ${caseItem.marketname}:`, error.message);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✅ [CRON] Updated ${updatedCount} cases with real data`);
    
  } catch (error) {
    console.error("❌ [CRON] Error updating cases:", error);
    throw error;
  }
}

async function updateSkinsData() {
  console.log("🎨 [CRON] Updating skins data...");
  
  try {
    // Fetch skins from SteamWebAPI.com (limit to avoid timeout)
    const response = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&game=cs2&limit=1000`);
    
    if (!response.ok) {
      throw new Error(`SteamWebAPI.com error: ${response.status}`);
    }
    
    const items = await response.json();
    const skins = items.filter(item => 
      item.itemgroup !== 'container' && 
      item.pricelatest && 
      item.pricelatest > 0
    );
    
    console.log(`🎯 [CRON] Fetched ${skins.length} skins with prices`);
    
    let updatedCount = 0;
    
    for (const skinItem of skins) {
      try {
        const marketHashName = skinItem.markethashname || skinItem.marketname;
        const realPrice = skinItem.pricelatest || 0;
        const realPriceSell = skinItem.pricelatestsell || realPrice;
        const realPriceMedian = skinItem.pricemedian || realPrice;
        const realPriceAvg = skinItem.priceavg || realPrice;
        
        // Find existing skin
        const existingSkin = await prisma.skin.findFirst({
          where: {
            OR: [
              { marketHashName: marketHashName },
              { name: { contains: skinItem.itemname, mode: 'insensitive' } }
            ]
          }
        });
        
        if (existingSkin) {
          await prisma.skin.update({
            where: { id: existingSkin.id },
            data: {
              priceLatest: realPrice,
              priceMedian: realPriceMedian,
              priceAvg: realPriceAvg,
              lastUpdated: new Date()
            }
          });
          
          updatedCount++;
        }
        
      } catch (error) {
        console.error(`❌ [CRON] Error updating skin ${skinItem.marketname}:`, error.message);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`✅ [CRON] Updated ${updatedCount} skins with real prices`);
    
  } catch (error) {
    console.error("❌ [CRON] Error updating skins:", error);
    throw error;
  }
}

async function logUpdateCompletion() {
  try {
    await prisma.jobRun.create({
      data: {
        jobName: 'steamwebapi_data_update',
        status: 'completed',
        startedAt: new Date(),
        completedAt: new Date(),
        details: 'Successfully updated cases and skins with real SteamWebAPI.com data'
      }
    });
  } catch (error) {
    console.error("❌ [CRON] Error logging completion:", error);
  }
}

async function logUpdateError(error) {
  try {
    await prisma.jobRun.create({
      data: {
        jobName: 'steamwebapi_data_update',
        status: 'failed',
        startedAt: new Date(),
        completedAt: new Date(),
        details: `Error: ${error.message}`
      }
    });
  } catch (logError) {
    console.error("❌ [CRON] Error logging error:", logError);
  }
}

function calculatePriceChange(oldPrice, newPrice) {
  if (!oldPrice || oldPrice === 0) return 0;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}
