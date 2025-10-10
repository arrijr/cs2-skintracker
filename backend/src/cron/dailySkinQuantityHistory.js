// /backend/src/cron/dailySkinQuantityHistory.js — [Backend]
// {/* Daily Skin Quantity History Cronjob - Track offer volume over time */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Daily cronjob to store skin offer volume (quantity) in a new SkinQuantityHistory table
 * This tracks how many listings are available on the Steam Market over time
 * Processes skins in batches to avoid memory issues
 */
export async function dailySkinQuantityHistory() {
  console.log("📊 [CRON] Starting daily skin quantity history update...");
  
  const BATCH_SIZE = 100; // Process 100 skins at a time
  let totalSuccess = 0;
  let totalErrors = 0;
  const errors = [];

  try {
    // Get total count of skins with offer volume data
    const totalSkins = await prisma.skin.count({
      where: {
        offerVolume: { not: null, gt: 0 }
      }
    });
    
    console.log(`📦 [CRON] Found ${totalSkins} skins with offer volume data to process`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process in batches
    const totalBatches = Math.ceil(totalSkins / BATCH_SIZE);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const skip = batch * BATCH_SIZE;
      console.log(`\n📦 [CRON] Processing batch ${batch + 1}/${totalBatches} (${skip + 1}-${Math.min(skip + BATCH_SIZE, totalSkins)})`);

      const skins = await prisma.skin.findMany({
        where: {
          offerVolume: { not: null, gt: 0 }
        },
        select: {
          id: true,
          name: true,
          offerVolume: true,
          soldToday: true,
          sold7d: true
        },
        skip,
        take: BATCH_SIZE
      });

      for (const skin of skins) {
        try {
          const offerVolume = skin.offerVolume || 0;
          
          if (offerVolume === 0) {
            continue; // Skip skins without offer volume
          }

          // Check if we already have a quantity history entry for today
          const existingEntry = await prisma.skinQuantityHistory.findUnique({
            where: {
              skinId_date: {
                skinId: skin.id,
                date: today
              }
            }
          });

          if (existingEntry) {
            // Update existing entry
            await prisma.skinQuantityHistory.update({
              where: { id: existingEntry.id },
              data: { 
                quantity: offerVolume,
                activeListings: offerVolume,
                soldVolume24h: skin.soldToday || 0
              }
            });
          } else {
            // Create new entry
            await prisma.skinQuantityHistory.create({
              data: {
                skinId: skin.id,
                date: today,
                quantity: offerVolume,
                activeListings: offerVolume,
                soldVolume24h: skin.soldToday || 0
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
    console.log("✅ [CRON] Daily skin quantity history update completed!");
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
    console.error("❌ [CRON] Fatal error in daily skin quantity history update:", error);
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
  dailySkinQuantityHistory()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

