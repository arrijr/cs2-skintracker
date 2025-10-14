// backend/scripts/saveQuantityHistory.js — [Backend]
// {/* Daily script to save current skin quantity (offer volume) to SkinQuantityHistory table */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Daily script to store skin quantity data in SkinQuantityHistory table
 * Runs daily via GitHub Actions to build historical quantity data for charts
 * Processes skins in batches to avoid memory issues
 */
async function saveQuantityHistory() {
  console.log("📊 [SCRIPT] Starting daily quantity history save...");
  console.log(`📅 [SCRIPT] Save time: ${new Date().toISOString()}`);
  
  const BATCH_SIZE = 100; // Process 100 skins at a time
  let totalSuccess = 0;
  let totalErrors = 0;
  let totalSkipped = 0;
  const errors = [];

  try {
    // Get total count of skins with offer volume data
    const totalSkins = await prisma.skin.count({
      where: {
        offerVolume: { not: null, gt: 0 }
      }
    });
    
    console.log(`📦 [SCRIPT] Found ${totalSkins} skins with offer volume data to process`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process in batches
    const totalBatches = Math.ceil(totalSkins / BATCH_SIZE);
    
    for (let batch = 0; batch < totalBatches; batch++) {
      const skip = batch * BATCH_SIZE;
      console.log(`\n📦 [SCRIPT] Processing batch ${batch + 1}/${totalBatches} (${skip + 1}-${Math.min(skip + BATCH_SIZE, totalSkins)})`);

      const skins = await prisma.skin.findMany({
        where: {
          offerVolume: { not: null, gt: 0 }
        },
        select: {
          id: true,
          name: true,
          marketHashName: true,
          offerVolume: true,
          sold24h: true
        },
        skip,
        take: BATCH_SIZE
      });

      for (const skin of skins) {
        try {
          const quantity = skin.offerVolume;
          const soldVolume24h = skin.sold24h || 0;
          
          if (!quantity || quantity === 0) {
            totalSkipped++;
            continue; // Skip skins without quantity data
          }

          // Check if we already have a quantity history entry for today
          const existingEntry = await prisma.skinQuantityHistory.findFirst({
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
            await prisma.skinQuantityHistory.update({
              where: { id: existingEntry.id },
              data: { 
                quantity: quantity,
                activeListings: quantity,
                soldVolume24h: soldVolume24h
              }
            });
          } else {
            // Create new entry
            await prisma.skinQuantityHistory.create({
              data: {
                skinId: skin.id,
                date: today,
                quantity: quantity,
                activeListings: quantity,
                soldVolume24h: soldVolume24h
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
    console.log("✅ [SCRIPT] Daily quantity history save completed!");
    console.log(`📊 Success: ${totalSuccess} skins`);
    console.log(`⏭️ Skipped: ${totalSkipped} skins (no quantity data)`);
    console.log(`❌ Errors: ${totalErrors} skins`);
    if (errors.length > 0 && errors.length <= 10) {
      console.log("📝 Error details:", errors);
    } else if (errors.length > 10) {
      console.log(`📝 ${errors.length} errors occurred (showing first 10):`, errors.slice(0, 10));
    }
    console.log("============================================================\n");

    // Exit with error code if too many errors
    if (totalErrors > totalSuccess * 0.1) { // More than 10% errors
      console.error("⚠️ Too many errors occurred during quantity history save!");
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
    console.error("❌ [SCRIPT] Fatal error in quantity history save:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
saveQuantityHistory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
