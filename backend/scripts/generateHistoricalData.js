// backend/scripts/generateHistoricalData.js — [Backend]
// {/* Generate realistic historical data without API calls */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Generate realistic historical data for skins without API calls
 * Creates 90 days of price and quantity history based on current data
 */
async function generateHistoricalData() {
  console.log("📊 [GENERATE] Starting historical data generation...");
  console.log(`📅 [GENERATE] Start time: ${new Date().toISOString()}`);
  
  let totalProcessed = 0;
  let totalPriceHistoryAdded = 0;
  let totalQuantityHistoryAdded = 0;
  let totalErrors = 0;

  try {
    // Get skins that have current price data
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
      take: 500 // Process first 500 skins
    });

    console.log(`📦 [GENERATE] Found ${skins.length} skins to process`);

    for (const skin of skins) {
      try {
        console.log(`\n🔄 [GENERATE] Processing skin ${skin.id}: ${skin.marketHashName}`);
        
        // Generate price history
        const priceHistoryAdded = await generatePriceHistory(skin);
        totalPriceHistoryAdded += priceHistoryAdded;
        
        // Generate quantity history  
        const quantityHistoryAdded = await generateQuantityHistory(skin);
        totalQuantityHistoryAdded += quantityHistoryAdded;
        
        console.log(`  ✅ Added ${priceHistoryAdded} price entries, ${quantityHistoryAdded} quantity entries`);
        
        totalProcessed++;
        
        // Log progress every 50 skins
        if (totalProcessed % 50 === 0) {
          console.log(`\n📊 [GENERATE] Progress: ${totalProcessed}/${skins.length} skins processed`);
          console.log(`  - Price history entries added: ${totalPriceHistoryAdded}`);
          console.log(`  - Quantity history entries added: ${totalQuantityHistoryAdded}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing skin ${skin.id}:`, error.message);
        totalErrors++;
      }
    }

    console.log("\n============================================================");
    console.log("✅ [GENERATE] Historical data generation completed!");
    console.log(`📊 Processed: ${totalProcessed} skins`);
    console.log(`📈 Price history entries added: ${totalPriceHistoryAdded}`);
    console.log(`📊 Quantity history entries added: ${totalQuantityHistoryAdded}`);
    console.log(`❌ Errors: ${totalErrors} skins`);
    console.log("============================================================\n");

    return {
      success: true,
      processed: totalProcessed,
      priceHistoryAdded: totalPriceHistoryAdded,
      quantityHistoryAdded: totalQuantityHistoryAdded,
      errors: totalErrors
    };

  } catch (error) {
    console.error("❌ [GENERATE] Fatal error during generation:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Generate realistic price history for a skin
 */
async function generatePriceHistory(skin) {
  let added = 0;
  
  try {
    // Get current price (use best available price)
    const currentPrice = skin.priceLatest || skin.priceMedian || skin.priceAvg;
    
    if (!currentPrice || currentPrice <= 0) {
      console.log(`    ⚠️ No valid price for skin ${skin.id}`);
      return 0;
    }
    
    // Generate 90 days of historical data
    const today = new Date();
    const priceHistory = [];
    
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Create realistic price variation
      // More volatile for expensive items, less volatile for cheap items
      const volatility = Math.min(0.15, Math.max(0.05, currentPrice / 1000)); // 5-15% volatility
      const dailyVariation = (Math.random() - 0.5) * volatility;
      
      // Add small trend over time (slight upward bias)
      const trend = (Math.random() - 0.3) * 0.001 * (90 - i); // Slight upward trend
      
      const price = currentPrice * (1 + trend + dailyVariation);
      
      priceHistory.push({
        skinId: skin.id,
        date: date,
        price: Math.max(0.01, price) // Ensure price doesn't go below 0.01
      });
    }
    
    // Insert price history data (upsert to avoid duplicates)
    for (const entry of priceHistory) {
      try {
        await prisma.priceHistory.upsert({
          where: {
            skinId_date: {
              skinId: entry.skinId,
              date: entry.date
            }
          },
          update: {
            price: entry.price
          },
          create: {
            skinId: entry.skinId,
            date: entry.date,
            price: entry.price
          }
        });
        added++;
      } catch (error) {
        // Skip if already exists or other error
        if (!error.message.includes('Unique constraint')) {
          console.log(`    ⚠️ Error inserting price history for ${entry.date}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.log(`  ⚠️ Error generating price history for skin ${skin.id}:`, error.message);
  }
  
  return added;
}

/**
 * Generate realistic quantity history for a skin
 */
async function generateQuantityHistory(skin) {
  let added = 0;
  
  try {
    // Get current quantity data
    const currentQuantity = skin.offerVolume || 10; // Default to 10 if no data
    const currentSold24h = skin.sold24h || 1; // Default to 1 if no data
    
    if (!currentQuantity || currentQuantity <= 0) {
      console.log(`    ⚠️ No valid quantity for skin ${skin.id}`);
      return 0;
    }
    
    // Generate 90 days of historical data
    const today = new Date();
    const quantityHistory = [];
    
    for (let i = 90; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      // Create realistic quantity variation
      const variation = (Math.random() - 0.5) * 0.4; // ±20% daily variation
      const quantity = Math.max(1, Math.floor(currentQuantity * (1 + variation)));
      
      // Generate sold volume with more variation
      const soldVariation = (Math.random() - 0.5) * 0.8; // ±40% daily variation
      const soldVolume24h = Math.max(0, Math.floor(currentSold24h * (0.3 + Math.random() * 0.7 + soldVariation)));
      
      quantityHistory.push({
        skinId: skin.id,
        date: date,
        quantity: quantity,
        activeListings: quantity,
        soldVolume24h: soldVolume24h
      });
    }
    
    // Insert quantity history data (upsert to avoid duplicates)
    for (const entry of quantityHistory) {
      try {
        await prisma.skinQuantityHistory.upsert({
          where: {
            skinId_date: {
              skinId: entry.skinId,
              date: entry.date
            }
          },
          update: {
            quantity: entry.quantity,
            activeListings: entry.activeListings,
            soldVolume24h: entry.soldVolume24h
          },
          create: {
            skinId: entry.skinId,
            date: entry.date,
            quantity: entry.quantity,
            activeListings: entry.activeListings,
            soldVolume24h: entry.soldVolume24h
          }
        });
        added++;
      } catch (error) {
        // Skip if already exists or other error
        if (!error.message.includes('Unique constraint')) {
          console.log(`    ⚠️ Error inserting quantity history for ${entry.date}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.log(`  ⚠️ Error generating quantity history for skin ${skin.id}:`, error.message);
  }
  
  return added;
}

// Run the script
generateHistoricalData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
