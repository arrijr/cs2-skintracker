// /backend/src/cron/dailyCasePriceHistory.js — [Backend]
// {/* Daily Case Price History Cronjob - Store daily prices for historical tracking */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Daily cronjob to store case prices in CasePriceHistory table
 * Runs daily to build historical price data for charts and analytics
 */
export async function dailyCasePriceHistory() {
  console.log("📊 [CRON] Starting daily case price history update...");
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
    // Get all cases with their latest supply data
    const cases = await prisma.case.findMany({
      include: {
        caseSupply: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });
    
    console.log(`📦 [CRON] Found ${cases.length} cases to process`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const caseItem of cases) {
      try {
        // Get current price from latest supply data or case price field
        const currentPrice = caseItem.caseSupply[0]?.price || caseItem.price || 0;
        
        if (currentPrice === 0) {
          console.log(`  ⚠️  [CRON] ${caseItem.name}: No price data available, skipping`);
          continue;
        }

        // Check if we already have a price history entry for today
        const existingEntry = await prisma.casePriceHistory.findUnique({
          where: {
            caseId_date: {
              caseId: caseItem.id,
              date: today
            }
          }
        });

        if (existingEntry) {
          // Update existing entry
          await prisma.casePriceHistory.update({
            where: { id: existingEntry.id },
            data: { price: currentPrice }
          });
          console.log(`  ✅ [CRON] ${caseItem.name}: Updated price $${currentPrice.toFixed(2)}`);
        } else {
          // Create new entry
          await prisma.casePriceHistory.create({
            data: {
              caseId: caseItem.id,
              date: today,
              price: currentPrice
            }
          });
          console.log(`  ✅ [CRON] ${caseItem.name}: Created price history $${currentPrice.toFixed(2)}`);
        }

        successCount++;
      } catch (error) {
        console.error(`  ❌ [CRON] Error processing ${caseItem.name}:`, error.message);
        errorCount++;
        errors.push(`${caseItem.name}: ${error.message}`);
      }
    }

    console.log("\n============================================================");
    console.log("✅ [CRON] Daily case price history update completed!");
    console.log(`📊 Success: ${successCount} cases`);
    console.log(`❌ Errors: ${errorCount} cases`);
    if (errors.length > 0) {
      console.log("📝 Error details:", errors);
    }
    console.log("============================================================\n");

    return {
      success: true,
      successCount,
      errorCount,
      errors
    };

  } catch (error) {
    console.error("❌ [CRON] Fatal error in daily case price history update:", error);
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
  dailyCasePriceHistory()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Fatal error:", error);
      process.exit(1);
    });
}

