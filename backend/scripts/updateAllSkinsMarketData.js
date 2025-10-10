// /backend/scripts/updateAllSkinsMarketData.js — [Backend]
// {/* Update all skins with current market data from SteamWebAPI.com */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();
const STEAMWEBAPI_KEY = process.env.STEAMWEBAPI_KEY;
const BATCH_SIZE = 50; // Process 50 skins at a time
const DELAY_MS = 100; // 100ms delay between API calls

async function updateAllSkinsMarketData() {
  console.log("🔄 Updating ALL skins with current market data from SteamWebAPI.com...");

  if (!STEAMWEBAPI_KEY) {
    console.error("❌ STEAMWEBAPI_KEY not found in environment variables");
    return { success: false, error: "STEAMWEBAPI_KEY not found" };
  }

  try {
    // Get all skins
    const totalSkins = await prisma.skin.count();
    console.log(`📦 Found ${totalSkins} skins to update`);

    const totalBatches = Math.ceil(totalSkins / BATCH_SIZE);
    let updatedCount = 0;
    let errorCount = 0;

    for (let batch = 0; batch < totalBatches; batch++) {
      const skip = batch * BATCH_SIZE;
      console.log(`\n📦 Processing batch ${batch + 1}/${totalBatches} (${skip + 1}-${Math.min(skip + BATCH_SIZE, totalSkins)})`);

      const skins = await prisma.skin.findMany({
        select: { id: true, name: true, marketHashName: true },
        skip,
        take: BATCH_SIZE
      });

      for (const skin of skins) {
        try {
          // Fetch data from SteamWebAPI.com
          const apiUrl = `https://www.steamwebapi.com/steam/api/item?key=${STEAMWEBAPI_KEY}&game=cs2&item=${encodeURIComponent(skin.marketHashName)}`;
          
          const response = await fetch(apiUrl);
          if (!response.ok) {
            console.warn(`  ⚠️ Failed to fetch data for ${skin.name}: HTTP ${response.status}`);
            errorCount++;
            continue;
          }
          
          const steamData = await response.json();

          if (!steamData || !steamData.pricelatest) {
            console.log(`  ❌ No valid data found for ${skin.name}`);
            errorCount++;
            continue;
          }

          // Update skin with all available market data
          await prisma.skin.update({
            where: { id: skin.id },
            data: {
              priceLatest: steamData.pricelatest || null,
              priceMedian: steamData.pricemedian || null,
              priceAvg: steamData.priceavg || null,
              priceMin: steamData.pricemin || null,
              priceMax: steamData.pricemax || null,
              priceMedian24h: steamData.pricemedian24h || null,
              priceMedian7d: steamData.pricemedian7d || null,
              priceMedian30d: steamData.pricemedian30d || null,
              // Sales data
              soldToday: steamData.soldtoday || null,
              sold24h: steamData.sold24h || null,
              sold7d: steamData.sold7d || null,
              sold30d: steamData.sold30d || null,
              sold90d: steamData.sold90d || null,
              soldTotal: steamData.soldtotal || null,
              // Market data
              offerVolume: steamData.offervolume || null,
              buyOrderVolume: steamData.buyordervolume || null,
              buyOrderPrice: steamData.buyorderprice || null,
              buyOrderMedian: steamData.buyordermedian || null,
              buyOrderAvg: steamData.buyorderavg || null,
              // Metadata
              priceUpdatedAt: new Date(),
              unstable: steamData.unstable === 1 || steamData.unstable === true,
              unstableReason: steamData.unstablereason || null
            }
          });

          updatedCount++;
          
          // Log progress every 10 skins
          if (updatedCount % 10 === 0) {
            console.log(`  ✅ Updated ${updatedCount}/${totalSkins} skins...`);
          }

          // Delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));

        } catch (fetchError) {
          console.error(`  ❌ Error updating ${skin.name}:`, fetchError.message);
          errorCount++;
        }
      }
    }

    console.log("\n============================================================");
    console.log("🎉 Market data update completed!");
    console.log(`📊 Skins updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log("============================================================");

    return { success: true, updatedCount, errorCount };

  } catch (error) {
    console.error("❌ Error in updateAllSkinsMarketData:", error);
    return { success: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

updateAllSkinsMarketData();

