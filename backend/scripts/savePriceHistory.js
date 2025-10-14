// backend/scripts/savePriceHistory.js — [Backend]
// {/* Daily script to save current skin prices to PriceHistory table */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Daily script to store skin prices in PriceHistory table
 * Runs daily via GitHub Actions to build historical price data for charts
 * Processes skins in batches to avoid memory issues
 */
async function savePriceHistory() {
  console.log("📊 [SCRIPT] Starting daily price history save...");
  console.log(`📅 [SCRIPT] Save time: ${new Date().toISOString()}`);
  
  const BATCH_SIZE = 100; // Process 100 skins at a time
  let totalSuccess = 0;
  let totalErrors = 0;
  let totalSkipped = 0;
  const errors = [];

  try {
    // Get total count of skins with prices
    const totalSkins = await prisma.skin.count({
      where: {
        OR: [
          { priceLatest: { not: null, gt: 0 } },
          { priceMedian: { not: null, gt: 0 } },
          { priceAvg: { not: null, gt: 0 } }
        ]
      }
    });
    
    console.log(`📦 [SCRIPT] Found ${totalSkins} skins with price data to process`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process in batches
    const totalBatches = Math.ceil(totalSkins / BATCH_SIZE);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const skip = batch * BATCH_SIZE;
      console.log(`\n📦 [SCRIPT] Processing batch ${batch + 1}/${totalBatches} (${skip + 1}-${Math.min(skip + BATCH_SIZE, totalSkins)})`);

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
          priceAvg: true
        },
        skip,
        take: BATCH_SIZE
      });

      for (const skin of skins) {
        try {
          // Priority: priceLatest > priceMedian > priceAvg
          const currentPrice = skin.priceLatest || skin.priceMedian || skin.priceAvg;
          
          if (!currentPrice || currentPrice === 0) {
            totalSkipped++;
            continue; // Skip skins without price
          }

          // Check if we already have a price history entry for today
          const existingEntry = await prisma.priceHistory.findFirst({
            where: {
              skinId: skin.id,
              date: {
                gte: today,
                lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
              }
            }
          });

          if (existingEntry) {
            // Update existing entry
            await prisma.priceHistory.update({
              where: { id: existingEntry.id },
              data: { price: currentPrice }
            });
          } else {
            // Create new entry
            await prisma.priceHistory.create({
              data: {
                skinId: skin.id,
                date: today,
                price: currentPrice
              }
            });
          }

          totalSuccess++;
          
          // Log progress every 50 skins
          if (totalSuccess % 50 === 0) {
            console.log(`  ✅ [SCRIPT] Processed ${totalSuccess}/${totalSkins} skins...`);
          }
        } catch (error) {
          console.error(`  ❌ [SCRIPT] Error processing skin ${skin.id} (${skin.marketHashName}):`, error.message);
          totalErrors++;
          errors.push(`${skin.marketHashName}: ${error.message}`);
        }
      }
    }

    console.log("\n============================================================");
    console.log("✅ [SCRIPT] Daily price history save completed!");
    console.log(`📊 Success: ${totalSuccess} skins`);
    console.log(`⏭️ Skipped: ${totalSkipped} skins (no price data)`);
    console.log(`❌ Errors: ${totalErrors} skins`);
    if (errors.length > 0 && errors.length <= 10) {
      console.log("📝 Error details:", errors);
    } else if (errors.length > 10) {
      console.log(`📝 ${errors.length} errors occurred (showing first 10):`, errors.slice(0, 10));
    }
    console.log("============================================================\n");

    // Exit with error code if too many errors
    if (totalErrors > totalSuccess * 0.1) { // More than 10% errors
      console.error("⚠️ Too many errors occurred during price history save!");
      process.exit(1);
    }

    return {
      success: true,
      successCount: totalSuccess,
      skippedCount: totalSkipped,
      errorCount: totalErrors,
      errors
    };

  } catch (error) {
    console.error("❌ [SCRIPT] Fatal error in price history save:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
savePriceHistory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
