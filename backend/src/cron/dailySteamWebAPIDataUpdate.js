// /backend/src/cron/dailySteamWebAPIDataUpdate.js — [Backend]
// {/* Daily SteamWebAPI.com data update cron job */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function dailySteamWebAPIDataUpdate() {
  console.log("🔄 [CRON] Starting daily SteamWebAPI.com data update...");
  
  const STEAM_API_KEY = process.env.STEAM_API_KEY;
  if (!STEAM_API_KEY) {
    console.log("❌ [CRON] STEAM_API_KEY not found in environment");
    return { success: false, error: "STEAM_API_KEY not found" };
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];

  try {
    // Get all cases from database
    const cases = await prisma.case.findMany();
    console.log(`📊 [CRON] Found ${cases.length} cases to update`);

    for (const caseItem of cases) {
      try {
        console.log(`📈 [CRON] Updating: ${caseItem.name}`);

        // Search for the case in SteamWebAPI.com
        const searchUrl = `https://www.steamwebapi.com/steam/api/items?key=${STEAM_API_KEY}&game=cs2&search=${encodeURIComponent(caseItem.name)}`;
        const response = await fetch(searchUrl);
        
        if (!response.ok) {
          console.log(`  ❌ [CRON] API Error: ${response.status}`);
          errorCount++;
          errors.push(`${caseItem.name}: API Error ${response.status}`);
          continue;
        }
        
        const items = await response.json();
        
        // Find matching case
        const steamCase = items.find(item => 
          item.markethashname && 
          item.markethashname.toLowerCase().includes(caseItem.name.toLowerCase().replace(/[^a-z0-9\s]/gi, ''))
        );
        
        if (!steamCase) {
          console.log(`  ❌ [CRON] No matching case found in SteamWebAPI`);
          errorCount++;
          errors.push(`${caseItem.name}: No matching case found`);
          continue;
        }

        console.log(`  ✅ [CRON] Found: ${steamCase.markethashname}`);
        console.log(`  💰 [CRON] Price: $${steamCase.pricelatest}`);
        console.log(`  📦 [CRON] Offer Volume: ${steamCase.offervolume}`);
        console.log(`  📦 [CRON] Sold 24h: ${steamCase.sold24h}, 7d: ${steamCase.sold7d}`);

        // Update case with latest data
        await prisma.case.update({
          where: { id: caseItem.id },
          data: {
            price: steamCase.pricelatest || steamCase.pricereal || 0,
            lastUpdated: new Date()
          }
        });

        // Add new supply data entry for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if we already have data for today
        const existingToday = await prisma.caseSupply.findFirst({
          where: {
            caseId: caseItem.id,
            date: today
          }
        });

        if (!existingToday) {
          // Get the most recent supply data to calculate new values
          const lastSupply = await prisma.caseSupply.findFirst({
            where: { caseId: caseItem.id },
            orderBy: { date: 'desc' }
          });

          // Calculate new supply values based on real sales data
          const dailySales = steamCase.sold24h || 0;
          const dailyDrops = Math.floor(dailySales * 0.7);
          const dailyUnboxings = Math.floor(dailySales * 0.3);

          const newSupply = {
            caseId: caseItem.id,
            date: today,
            dropped: (lastSupply?.dropped || 0) + dailyDrops,
            unboxed: (lastSupply?.unboxed || 0) + dailyUnboxings,
            remaining: Math.max(0, (lastSupply?.remaining || 1000000) - dailyDrops + dailyUnboxings),
            offerVolume: steamCase.offervolume || 0
          };

          await prisma.caseSupply.create({
            data: newSupply
          });

          console.log(`  ✅ [CRON] Added new supply data for today`);
        } else {
          // Update existing today's data
          await prisma.caseSupply.update({
            where: { id: existingToday.id },
            data: {
              offerVolume: steamCase.offervolume || 0
            }
          });

          console.log(`  ✅ [CRON] Updated existing supply data for today`);
        }

        successCount++;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`  ❌ [CRON] Error processing ${caseItem.name}:`, error.message);
        errorCount++;
        errors.push(`${caseItem.name}: ${error.message}`);
      }
    }

    // Log job completion
    const jobResult = {
      success: errorCount === 0,
      successCount,
      errorCount,
      errors: errors.length > 0 ? errors : null,
      timestamp: new Date()
    };

    await prisma.jobRun.create({
      data: {
        jobName: 'dailySteamWebAPIDataUpdate',
        status: errorCount === 0 ? 'success' : 'partial_success',
        startTime: new Date(),
        endTime: new Date(),
        successCount,
        failedCount: errorCount,
        details: JSON.stringify(jobResult),
        parameters: JSON.stringify({ totalCases: cases.length })
      }
    });

    console.log(`\n🎉 [CRON] Daily SteamWebAPI.com data update completed!`);
    console.log(`   ✅ Successfully updated: ${successCount} cases`);
    console.log(`   ❌ Failed: ${errorCount} cases`);

    return jobResult;

  } catch (error) {
    console.error("❌ [CRON] Error in daily SteamWebAPI data update:", error);
    
    // Log failed job
    await prisma.jobRun.create({
      data: {
        jobName: 'dailySteamWebAPIDataUpdate',
        status: 'failed',
        startTime: new Date(),
        endTime: new Date(),
        successCount: 0,
        failedCount: 1,
        details: JSON.stringify({ error: error.message }),
        parameters: JSON.stringify({})
      }
    });

    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}
