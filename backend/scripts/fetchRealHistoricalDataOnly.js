// backend/scripts/fetchRealHistoricalDataOnly.js — [Backend]
// {/* Fetch ONLY real historical data from SteamWebAPI.com - NO generated data */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;

/**
 * Fetch ONLY real historical data from SteamWebAPI.com
 * This script attempts to get actual historical data if available
 * NO generated or fake data - only real API data
 */
async function fetchRealHistoricalDataOnly() {
  console.log("📊 [REAL-ONLY] Starting REAL historical data fetch...");
  console.log(`📅 [REAL-ONLY] Start time: ${new Date().toISOString()}`);
  
  if (!STEAM_WEB_API_KEY) {
    console.error("❌ [REAL-ONLY] STEAM_API_KEY not found, cannot proceed");
    process.exit(1);
  }

  let totalProcessed = 0;
  let totalPriceHistoryAdded = 0;
  let totalQuantityHistoryAdded = 0;
  let totalErrors = 0;
  const errors = [];

  try {
    // Get skins that don't have much historical data yet
    const skins = await prisma.skin.findMany({
      where: {
        OR: [
          { priceLatest: { not: null, gt: 0 } },
          { priceMedian: { not: null, gt: 0 } },
          { priceAvg: { not: null, gt: 0 } }
        ]
      },
      select: {
        id: true,
        name: true,
        marketHashName: true,
        priceLatest: true,
        priceMedian: true,
        priceAvg: true,
        offerVolume: true,
        sold24h: true
      },
      take: 100 // Process first 100 skins only
    });

    console.log(`📦 [REAL-ONLY] Found ${skins.length} skins to process`);

    for (const skin of skins) {
      try {
        console.log(`\n🔄 [REAL-ONLY] Processing skin ${skin.id}: ${skin.marketHashName}`);
        
        // Try to fetch real historical data from SteamWebAPI.com
        const historicalData = await fetchRealHistoricalFromAPI(skin.marketHashName);
        
        if (historicalData && historicalData.history) {
          // Process real historical price data
          const priceHistoryAdded = await processRealPriceHistory(skin.id, historicalData.history);
          totalPriceHistoryAdded += priceHistoryAdded;
          
          console.log(`  ✅ Added ${priceHistoryAdded} REAL price history entries`);
        } else {
          console.log(`  ⚠️ No real historical data available for ${skin.marketHashName}`);
        }
        
        totalProcessed++;
        
        // Rate limiting - wait between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Log progress every 25 skins
        if (totalProcessed % 25 === 0) {
          console.log(`\n📊 [REAL-ONLY] Progress: ${totalProcessed}/${skins.length} skins processed`);
          console.log(`  - Real price history entries added: ${totalPriceHistoryAdded}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing skin ${skin.id}:`, error.message);
        totalErrors++;
        errors.push(`${skin.marketHashName}: ${error.message}`);
      }
    }

    console.log("\n============================================================");
    console.log("✅ [REAL-ONLY] Real historical data fetch completed!");
    console.log(`📊 Processed: ${totalProcessed} skins`);
    console.log(`📈 Real price history entries added: ${totalPriceHistoryAdded}`);
    console.log(`❌ Errors: ${totalErrors} skins`);
    if (errors.length > 0 && errors.length <= 5) {
      console.log("📝 Error details:", errors);
    } else if (errors.length > 5) {
      console.log(`📝 ${errors.length} errors occurred (showing first 5):`, errors.slice(0, 5));
    }
    console.log("============================================================\n");

    return {
      success: true,
      processed: totalProcessed,
      priceHistoryAdded: totalPriceHistoryAdded,
      errors: totalErrors
    };

  } catch (error) {
    console.error("❌ [REAL-ONLY] Fatal error during fetch:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Fetch real historical data from SteamWebAPI.com
 */
async function fetchRealHistoricalFromAPI(marketHashName) {
  try {
    // Try different SteamWebAPI.com endpoints for historical data
    const endpoints = [
      `https://www.steamwebapi.com/steam/api/itemhistory?key=${STEAM_WEB_API_KEY}&market_hash_name=${encodeURIComponent(marketHashName)}`,
      `https://www.steamwebapi.com/steam/api/item?key=${STEAM_WEB_API_KEY}&market_hash_name=${encodeURIComponent(marketHashName)}&history=1`,
      `https://www.steamwebapi.com/steam/api/itempricehistory?key=${STEAM_WEB_API_KEY}&market_hash_name=${encodeURIComponent(marketHashName)}`
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`    🔍 Trying endpoint: ${endpoint.split('?')[0]}...`);
        
        const response = await fetch(endpoint);
        
        if (!response.ok) {
          console.log(`    ⚠️ HTTP ${response.status} for ${marketHashName}`);
          continue;
        }
        
        const data = await response.json();
        
        if (data && data.success && data.history) {
          console.log(`    ✅ Found historical data: ${data.history.length} entries`);
          return data;
        }
        
        if (data && data.success && data.data) {
          console.log(`    ✅ Found data: ${data.data.length || 'unknown'} entries`);
          return data;
        }
        
      } catch (error) {
        console.log(`    ⚠️ Error with endpoint: ${error.message}`);
        continue;
      }
    }
    
    console.log(`    ⚠️ No historical data found for ${marketHashName}`);
    return null;
    
  } catch (error) {
    console.log(`    ⚠️ Error fetching historical data for ${marketHashName}:`, error.message);
    return null;
  }
}

/**
 * Process real historical price data
 */
async function processRealPriceHistory(skinId, historyData) {
  let added = 0;
  
  try {
    if (!Array.isArray(historyData)) {
      console.log(`    ⚠️ History data is not an array for skin ${skinId}`);
      return 0;
    }
    
    console.log(`    📊 Processing ${historyData.length} historical entries`);
    
    for (const entry of historyData) {
      try {
        // Parse the date - could be in different formats
        let date;
        if (entry.date) {
          date = new Date(entry.date);
        } else if (entry.timestamp) {
          date = new Date(entry.timestamp * 1000); // Convert Unix timestamp
        } else if (entry.time) {
          date = new Date(entry.time);
        } else {
          continue; // Skip if no date
        }
        
        // Ensure date is valid
        if (isNaN(date.getTime())) {
          continue; // Skip invalid dates
        }
        
        // Normalize date to start of day
        date.setHours(0, 0, 0, 0);
        
        // Get price - could be in different fields
        let price = entry.price || entry.value || entry.avg_price || entry.median_price;
        
        if (!price || price <= 0) {
          continue; // Skip if no valid price
        }
        
        // Insert price history data (upsert to avoid duplicates)
        await prisma.priceHistory.upsert({
          where: {
            skinId_date: {
              skinId: skinId,
              date: date
            }
          },
          update: {
            price: price
          },
          create: {
            skinId: skinId,
            date: date,
            price: price
          }
        });
        added++;
        
      } catch (error) {
        // Skip if already exists or other error
        if (!error.message.includes('Unique constraint')) {
          console.log(`    ⚠️ Error processing history entry:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.log(`  ⚠️ Error processing real price history for skin ${skinId}:`, error.message);
  }
  
  return added;
}

// Run the script
fetchRealHistoricalDataOnly()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
