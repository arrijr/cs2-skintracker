// /backend/scripts/loadRealSteamWebAPIData.js — [Backend]
// {/* Load real market data from SteamWebAPI.com */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fetch from 'node-fetch';
import { checkProductionSafety, safeDatabaseOperation } from "./safety-guard.js";

const prisma = new PrismaClient();
checkProductionSafety("Load real SteamWebAPI.com data", false);

const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isRealRun = args.includes('--real-run');

async function loadRealSteamWebAPIData() {
  console.log("🎯 Loading real SteamWebAPI.com data...");
  console.log("🔑 API Key present:", !!STEAM_WEB_API_KEY);
  
  if (!STEAM_WEB_API_KEY) {
    console.error("❌ STEAM_API_KEY environment variable is required");
    return;
  }

  try {
    // 1. Load all CS2 items from SteamWebAPI.com
    console.log("📡 Fetching CS2 items from SteamWebAPI.com...");
    const itemsResponse = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&game=cs2`);
    
    if (!itemsResponse.ok) {
      throw new Error(`SteamWebAPI.com error: ${itemsResponse.status} ${itemsResponse.statusText}`);
    }
    
    const items = await itemsResponse.json();
    console.log(`✅ Loaded ${items.length} CS2 items from SteamWebAPI.com`);
    
    // 2. Filter for cases (containers)
    const cases = items.filter(item => 
      item.itemgroup === 'container' || 
      (item.marketname && item.marketname.toLowerCase().includes('case')) ||
      (item.name && item.name.toLowerCase().includes('case'))
    );
    
    console.log(`🎲 Found ${cases.length} cases in SteamWebAPI.com data`);
    
    // 3. Update our database with real data
    await updateCasesWithRealData(cases);
    
    // 4. Update skins with real prices
    await updateSkinsWithRealPrices(items);
    
    console.log("🎉 Real data loading completed!");
    
  } catch (error) {
    console.error("❌ Error loading real data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function updateCasesWithRealData(cases) {
  console.log("🎲 Updating cases with real SteamWebAPI.com data...");
  
  for (const caseItem of cases) {
    try {
      const caseName = caseItem.marketname || caseItem.name;
      const realPrice = caseItem.pricelatest || caseItem.price || 0;
      const realPriceSell = caseItem.pricelatestsell || realPrice;
      const sold24h = caseItem.sold24h || 0;
      const sold7d = caseItem.sold7d || 0;
      const sold30d = caseItem.sold30d || 0;
      const offerVolume = caseItem.offervolume || 0;
      
      // Find existing case in our database
      const existingCase = await prisma.case.findFirst({
        where: {
          OR: [
            { name: { contains: caseName, mode: 'insensitive' } },
            { name: { contains: caseName.replace(' Case', ''), mode: 'insensitive' } }
          ]
        }
      });
      
      if (existingCase) {
        if (isRealRun) {
          await safeDatabaseOperation(async () => {
            await prisma.case.update({
              where: { id: existingCase.id },
              data: {
                price: realPrice,
                marketCap: realPrice * (existingCase.remaining || 0),
                priceChange24h: calculatePriceChange(caseItem.pricelatestsell24h, realPriceSell),
                priceChange7d: calculatePriceChange(caseItem.pricelatestsell7d, realPriceSell),
                priceChange30d: calculatePriceChange(caseItem.pricelatestsell30d, realPriceSell),
                lastUpdated: new Date(),
                // Update supply data based on sales
                dropped: (existingCase.dropped || 0) + sold24h,
                unboxed: (existingCase.unboxed || 0) + sold24h,
                remaining: Math.max(0, (existingCase.remaining || 0) - sold24h)
              }
            });
          }, `updating case ${caseName}`);
          
          console.log(`✅ Updated case: ${caseName} - $${realPrice.toFixed(2)} (${sold24h} sold today)`);
        } else {
          console.log(`🔍 Dry run - would update case: ${caseName} - $${realPrice.toFixed(2)}`);
        }
      } else {
        console.log(`⚠️ Case not found in our database: ${caseName}`);
      }
      
    } catch (error) {
      console.error(`❌ Error updating case ${caseItem.marketname}:`, error.message);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function updateSkinsWithRealPrices(items) {
  console.log("🎨 Updating skins with real SteamWebAPI.com prices...");
  
  const skins = items.filter(item => 
    item.itemgroup !== 'container' && 
    item.pricelatest && 
    item.pricelatest > 0
  );
  
  console.log(`🎯 Found ${skins.length} skins with real prices`);
  
  let updatedCount = 0;
  
  for (const skinItem of skins) {
    try {
      const marketHashName = skinItem.markethashname || skinItem.marketname;
      const realPrice = skinItem.pricelatest || 0;
      const realPriceSell = skinItem.pricelatestsell || realPrice;
      const realPriceMedian = skinItem.pricemedian || realPrice;
      const realPriceAvg = skinItem.priceavg || realPrice;
      
      // Find existing skin in our database
      const existingSkin = await prisma.skin.findFirst({
        where: {
          OR: [
            { marketHashName: marketHashName },
            { name: { contains: skinItem.itemname, mode: 'insensitive' } }
          ]
        }
      });
      
      if (existingSkin) {
        if (isRealRun) {
          await safeDatabaseOperation(async () => {
            await prisma.skin.update({
              where: { id: existingSkin.id },
              data: {
                priceLatest: realPrice,
                priceMedian: realPriceMedian,
                priceAvg: realPriceAvg,
                lastUpdated: new Date()
              }
            });
          }, `updating skin ${marketHashName}`);
          
          updatedCount++;
          if (updatedCount % 100 === 0) {
            console.log(`📊 Updated ${updatedCount} skins...`);
          }
        }
      }
      
    } catch (error) {
      console.error(`❌ Error updating skin ${skinItem.marketname}:`, error.message);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  console.log(`✅ Updated ${updatedCount} skins with real prices`);
}

function calculatePriceChange(oldPrice, newPrice) {
  if (!oldPrice || oldPrice === 0) return 0;
  return ((newPrice - oldPrice) / oldPrice) * 100;
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  loadRealSteamWebAPIData();
}
