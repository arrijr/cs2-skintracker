// backend/scripts/createMinimalHistory.js — [Backend]
// {/* Create minimal history using ONLY current real data - no API calls */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Create minimal history using ONLY current real data
 * Uses existing priceLatest, priceMedian, priceAvg from database
 * NO API calls, NO generated numbers - only real current data
 */
async function createMinimalHistory() {
  console.log("📊 [MINIMAL] Creating minimal history from REAL current data...");
  console.log(`📅 [MINIMAL] Start time: ${new Date().toISOString()}`);
  
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
      take: 200 // Process first 200 skins
    });

    console.log(`📦 [MINIMAL] Found ${skins.length} skins to process`);

    for (const skin of skins) {
      try {
        console.log(`\n🔄 [MINIMAL] Processing skin ${skin.id}: ${skin.marketHashName}`);
        
        // Use ONLY current real data - no variations, no generation
        const currentPrice = skin.priceLatest || skin.priceMedian || skin.priceAvg;
        const currentQuantity = skin.offerVolume || 0;
        const currentSold = skin.sold24h || 0;
        
        if (!currentPrice || currentPrice <= 0) {
          console.log(`  ⚠️ No valid price data for skin ${skin.id}`);
          continue;
        }
        
        // Create minimal history using ONLY current real data
        const priceHistoryAdded = await createMinimalPriceHistory(skin.id, currentPrice);
        const quantityHistoryAdded = await createMinimalQuantityHistory(skin.id, currentQuantity, currentSold);
        
        totalPriceHistoryAdded += priceHistoryAdded;
        totalQuantityHistoryAdded += quantityHistoryAdded;
        
        console.log(`  ✅ Added ${priceHistoryAdded} price entries, ${quantityHistoryAdded} quantity entries (using REAL current data)`);
        
        totalProcessed++;
        
        // Log progress every 50 skins
        if (totalProcessed % 50 === 0) {
          console.log(`\n📊 [MINIMAL] Progress: ${totalProcessed}/${skins.length} skins processed`);
          console.log(`  - Price history entries added: ${totalPriceHistoryAdded}`);
          console.log(`  - Quantity history entries added: ${totalQuantityHistoryAdded}`);
        }
        
      } catch (error) {
        console.error(`  ❌ Error processing skin ${skin.id}:`, error.message);
        totalErrors++;
      }
    }

    console.log("\n============================================================");
    console.log("✅ [MINIMAL] Minimal history creation completed!");
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
    console.error("❌ [MINIMAL] Fatal error during creation:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Create minimal price history using ONLY current real price
 */
async function createMinimalPriceHistory(skinId, currentPrice) {
  let added = 0;
  
  try {
    // Create only 7 days of history using the SAME real current price
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      try {
        await prisma.priceHistory.upsert({
          where: {
            skinId_date: {
              skinId: skinId,
              date: date
            }
          },
          update: {
            price: currentPrice
          },
          create: {
            skinId: skinId,
            date: date,
            price: currentPrice
          }
        });
        added++;
      } catch (error) {
        if (!error.message.includes('Unique constraint')) {
          console.log(`    ⚠️ Error inserting price history for ${date.toISOString().split('T')[0]}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.log(`  ⚠️ Error creating minimal price history for skin ${skinId}:`, error.message);
  }
  
  return added;
}

/**
 * Create minimal quantity history using ONLY current real data
 */
async function createMinimalQuantityHistory(skinId, currentQuantity, currentSold) {
  let added = 0;
  
  try {
    // Create only 7 days of history using the SAME real current data
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      try {
        await prisma.skinQuantityHistory.upsert({
          where: {
            skinId_date: {
              skinId: skinId,
              date: date
            }
          },
          update: {
            quantity: currentQuantity,
            activeListings: currentQuantity,
            soldVolume24h: currentSold
          },
          create: {
            skinId: skinId,
            date: date,
            quantity: currentQuantity,
            activeListings: currentQuantity,
            soldVolume24h: currentSold
          }
        });
        added++;
      } catch (error) {
        if (!error.message.includes('Unique constraint')) {
          console.log(`    ⚠️ Error inserting quantity history for ${date.toISOString().split('T')[0]}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.log(`  ⚠️ Error creating minimal quantity history for skin ${skinId}:`, error.message);
  }
  
  return added;
}

// Run the script
createMinimalHistory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
