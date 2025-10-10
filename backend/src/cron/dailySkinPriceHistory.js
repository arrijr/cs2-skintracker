// /backend/src/cron/dailySkinPriceHistory.js — [Backend]
// {/* Daily Skin Price History Cronjob - Store daily skin prices for historical tracking */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Daily cronjob to store skin prices in PriceHistory table
 * Runs daily to build historical price data for charts and analytics
 * Processes skins in batches to avoid memory issues
 */
export async function dailySkinPriceHistory() {
  console.log("📊 [CRON] Starting daily skin price history update...");
  
  const BATCH_SIZE = 100; // Process 100 skins at a time
  let totalSuccess = 0;
  let totalErrors = 0;
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
    
    console.log(`📦 [CRON] Found ${totalSkins} skins with price data to process`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process in batches
    const totalBatches = Math.ceil(totalSkins / BATCH_SIZE);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const skip = batch * BATCH_SIZE;
      console.log(`\n📦 [CRON] Processing batch ${batch + 1}/${totalBatches} (${skip + 1}-${Math.min(skip + BATCH_SIZE, totalSkins)})`);

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
          priceLatest: true,
          priceMedian: true,
          priceAvg: true
        },
        skip,
        take: BATCH_SIZE
      });

      for (const skin of skins) {
        try {
          // Use priceLatest, fallback to priceMedian, then priceAvg
          const currentPrice = skin.priceLatest || skin.priceMedian || skin.priceAvg || 0;
          
          if (currentPrice === 0) {
            continue; // Skip skins without price
          }

          // Check if we already have a price history entry for today
          const existingEntry = await prisma.priceHistory.findUnique({
            where: {
              skinId_date: {
                skinId: skin.id,
                date: today
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
            console.log(`  ✅ [CRON] Processed ${totalSuccess}/${totalSkins} skins...`);
          }
        } catch (error) {
          console.error(`  ❌ [CRON] Error processing skin ${skin.id} (${skin.name}):`, error.message);
          totalErrors++;
          errors.push(`${skin.name}: ${error.message}`);
        }
      }
    }

    console.log("\n============================================================");
    console.log("✅ [CRON] Daily skin price history update completed!");
    console.log(`📊 Success: ${totalSuccess} skins`);
    console.log(`❌ Errors: ${totalErrors} skins`);
    if (errors.length > 0 && errors.length <= 10) {
      console.log("📝 Error details:", errors);
    } else if (errors.length > 10) {
      console.log(`📝 ${errors.length} errors occurred (showing first 10):`, errors.slice(0, 10));
    }
    console.log("============================================================\n");

    return {
      success: true,
      successCount: totalSuccess,
      errorCount: totalErrors,
      errors
    };

  } catch (error) {
    console.error("❌ [CRON] Fatal error in daily skin price history update:", error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running directly for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  dailySkinPriceHistory()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

