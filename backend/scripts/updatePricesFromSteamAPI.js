import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety } from "./safety-guard.js";
import { setTimeout } from 'timers/promises';

const prisma = new PrismaClient();
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Safety check: Only allow in development
checkProductionSafety("Steam API price update", false);

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function sleep(ms) {
  return setTimeout(ms);
}

async function retryWithBackoff(fn, retries = 3, delay = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`Attempt ${i + 1} failed. Retrying in ${delay}ms...`);
        await sleep(delay);
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

/**
 * Fetch price data from Steam Web API and update skins
 */
async function updatePricesFromSteamAPI() {
  if (!STEAM_API_KEY) {
    throw new Error("❌ STEAM_API_KEY not found in environment variables");
  }

  console.log("🔍 [STEAM] Starting Steam Web API price update...");
  console.log(`🔑 [STEAM] API Key: ${STEAM_API_KEY.slice(-4)} (last 4 chars)`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const BATCH_SIZE = 100; // Process skins in batches
  const BATCH_DELAY = 1000; // 1 second between batches

  try {
    // Get total count of skins without prices
    const totalSkinsWithoutPrices = await prisma.skin.count({
      where: {
        AND: [
          { priceLatest: null },
          { priceMedian: null },
          { priceAvg: null }
        ]
      }
    });

    console.log(`📊 [STEAM] Found ${totalSkinsWithoutPrices} skins without prices`);

    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      // Get batch of skins without prices
      const skins = await prisma.skin.findMany({
        where: {
          AND: [
            { priceLatest: null },
            { priceMedian: null },
            { priceAvg: null }
          ]
        },
        take: BATCH_SIZE,
        skip: offset,
        select: {
          id: true,
          marketHashName: true,
          name: true
        }
      });

      if (skins.length === 0) {
        hasMore = false;
        break;
      }

      console.log(`📡 [STEAM] Processing batch ${Math.floor(offset / BATCH_SIZE) + 1} (${skins.length} skins)...`);

      // Fetch price data from Steam API for this batch
      for (const skin of skins) {
        try {
          // Use the Steam Web API to get price data
          const url = `https://www.steamwebapi.com/steam/api/items?key=${STEAM_API_KEY}&game=cs2&start=0&count=1&search=${encodeURIComponent(skin.marketHashName)}`;
          
          const response = await retryWithBackoff(async () => {
            const res = await fetch(url, {
              timeout: 15000,
              signal: AbortSignal.timeout(15000)
            });
            if (!res.ok) {
              const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
              error.status = res.status;
              throw error;
            }
            return res;
          });

          const data = await response.json();

          if (Array.isArray(data) && data.length > 0) {
            const item = data[0];
            
            // Update skin with price data from Steam API
            await prisma.skin.update({
              where: { id: skin.id },
              data: {
                priceLatest: item.pricelatest || null,
                priceMedian: item.pricemedian || null,
                priceAvg: item.priceavg || null,
                priceMin: item.pricemin || null,
                priceMax: item.pricemax || null,
                priceReal: item.pricereal || null,
                offerVolume: item.offervolume || null,
                buyOrderVolume: item.buyordervolume || null,
                sold24h: item.sold24h || null,
                sold7d: item.sold7d || null,
                sold30d: item.sold30d || null,
                priceUpdatedAt: item.priceupdatedat ? new Date(item.priceupdatedat) : new Date(),
                winLossPercentage: item.winlosspercentage || null,
                unstable: item.unstable || false,
                unstableReason: item.unstablereason || null,
                // Update other fields if available
                rarity: item.rarity || null,
                quality: item.quality || null,
                isStattrak: item.isstattrack === 1,
                isStar: item.isstar === 1,
                wear: item.wear || null,
                imageUrl: item.itemimage || null,
              }
            });

            // Add to price history if we have a price
            if (item.pricelatest) {
              await prisma.priceHistory.create({
                data: {
                  skinId: skin.id,
                  date: new Date(),
                  price: item.pricelatest
                }
              });
            }

            updatedCount++;
            console.log(`✅ [STEAM] Updated ${skin.name} - Price: $${item.pricelatest || 'N/A'}`);
          } else {
            skippedCount++;
            console.log(`⏭️ [STEAM] No price data found for ${skin.name}`);
          }

          // Rate limiting - small delay between requests
          await sleep(100);

        } catch (error) {
          errorCount++;
          console.error(`❌ [STEAM] Error updating ${skin.name}: ${error.message}`);
        }
      }

      offset += BATCH_SIZE;
      
      // Rate limiting between batches
      if (hasMore) {
        await sleep(BATCH_DELAY);
      }
    }

    console.log(`🎯 [STEAM] Price update completed!`);
    console.log(`✅ Updated: ${updatedCount} skins`);
    console.log(`⏭️ Skipped: ${skippedCount} skins`);
    console.log(`❌ Errors: ${errorCount} skins`);

  } catch (error) {
    console.error("❌ [STEAM] Fatal error during price update:", error);
    throw error;
  }
}

async function main() {
  try {
    await updatePricesFromSteamAPI();
  } catch (error) {
    console.error("❌ Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
