/**
 * Sprint 2: Fetch CS2 Skin Prices
 * Fetches current prices for all 56 skins from Steam Market API
 * and inserts/updates price_history table.
 *
 * Usage: node scripts/fetch-prices.js
 * Requires: DATABASE_URL environment variable
 * GitHub Actions: npm run fetch-prices
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const RATE_LIMIT_DELAY_MS = 500; // 500ms delay between requests (Steam API)
const BATCH_SIZE = 10; // Process in batches for better control
const LOG_PREFIX = '[fetch-prices]';

/**
 * Helper: Wait for a given time
 */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Helper: Parse price string to float
 * Handles formats like: "$1.23", "€12,34", "1.23"
 */
function parsePrice(val) {
  if (val == null) return null;
  const s = String(val)
    .replace(/[^\d.,-]/g, '')
    .replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Helper: Parse volume to integer
 */
function parseVolume(val) {
  if (val == null) return 0;
  const m = String(val).match(/\d+/g);
  return m ? parseInt(m.join(''), 10) : 0;
}

/**
 * Fetch price from Steam Market API
 * Uses the public Steam Market price lookup (no auth needed)
 *
 * @param {string} marketHashName - Skin's market hash name (e.g., "AWP | Dragon Lore (Field-Tested)")
 * @returns {Promise<{price: number, volume: number} | null>}
 */
async function fetchPriceFromSteam(marketHashName) {
  const appId = 730; // CS2 app ID
  const url = `https://steamcommunity.com/market/priceoverview/?appid=${appId}&market_hash_name=${encodeURIComponent(
    marketHashName
  )}&currency=1`; // currency=1 for USD

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      console.error(`  Error fetching ${marketHashName}: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Steam API returns { success: true, median_price: "€1.23", volume: "123", lowest_sell_price: "..." }
    if (!data.success || !data.median_price) {
      console.warn(`  No price data for ${marketHashName}`);
      return null;
    }

    const price = parsePrice(data.median_price);
    const volume = parseVolume(data.volume);

    if (price === null || price === 0) {
      console.warn(`  Invalid price for ${marketHashName}`);
      return null;
    }

    return { price, volume };
  } catch (error) {
    console.error(`  Failed to fetch ${marketHashName}:`, error.message);
    return null;
  }
}

/**
 * Check if price already exists for today (avoid duplicates)
 */
async function priceExistsForToday(skinId) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Start of today UTC

  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1); // Start of tomorrow UTC

  const existing = await prisma.priceHistory.findFirst({
    where: {
      skinId: skinId,
      date: {
        gte: today,
        lt: tomorrow,
      },
    },
  });

  return !!existing;
}

/**
 * Also check SkinQuantityHistory to avoid duplicates
 */
async function quantityExistsForToday(skinId) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const existing = await prisma.skinQuantityHistory.findFirst({
    where: {
      skinId: skinId,
      date: today,
    },
  });

  return !!existing;
}

/**
 * Main: Fetch all skin prices and insert into database
 */
async function main() {
  console.log(`${LOG_PREFIX} Starting price fetch for CS2 skins...`);
  console.log(`${LOG_PREFIX} Time: ${new Date().toISOString()}`);

  // Verify DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error(
      `${LOG_PREFIX} ERROR: DATABASE_URL not set in environment variables`
    );
    console.error(`${LOG_PREFIX} Set it in .env or GitHub Secrets`);
    process.exit(1);
  }

  try {
    // Fetch all skins from database
    console.log(`${LOG_PREFIX} Fetching skins from database...`);
    const skins = await prisma.skin.findMany({
      where: {
        marketHashName: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        marketHashName: true,
      },
      orderBy: { id: 'asc' },
    });

    if (skins.length === 0) {
      console.warn(`${LOG_PREFIX} No skins found in database`);
      process.exit(1);
    }

    console.log(`${LOG_PREFIX} Found ${skins.length} skins to process`);

    let inserted = 0;
    let skipped = 0;
    let failed = 0;

    // Process in batches
    for (let i = 0; i < skins.length; i += BATCH_SIZE) {
      const batch = skins.slice(i, i + BATCH_SIZE);

      for (const skin of batch) {
        try {
          // Check if price already exists for today
          const priceExists = await priceExistsForToday(skin.id);
          const quantityExists = await quantityExistsForToday(skin.id);

          if (priceExists && quantityExists) {
            console.log(
              `${LOG_PREFIX} ⊘ ${skin.name} - Already recorded for today, skipping`
            );
            skipped++;
            await wait(RATE_LIMIT_DELAY_MS);
            continue;
          }

          // Fetch price from Steam
          const priceData = await fetchPriceFromSteam(skin.marketHashName);

          if (!priceData) {
            console.log(
              `${LOG_PREFIX} ✗ ${skin.name} - Failed to fetch price`
            );
            failed++;
            await wait(RATE_LIMIT_DELAY_MS);
            continue;
          }

          const { price, volume } = priceData;

          // Insert into PriceHistory (if not already done today)
          if (!priceExists) {
            await prisma.priceHistory.create({
              data: {
                skinId: skin.id,
                date: new Date(),
                price: price,
              },
            });
          }

          // Insert into SkinQuantityHistory (if not already done today)
          if (!quantityExists) {
            await prisma.skinQuantityHistory.create({
              data: {
                skinId: skin.id,
                date: new Date(),
                quantity: volume,
                activeListings: volume,
              },
            });
          }

          console.log(
            `${LOG_PREFIX} ✓ ${skin.name} - $${price.toFixed(2)} (volume: ${volume})`
          );
          inserted++;

          // Rate limiting
          await wait(RATE_LIMIT_DELAY_MS);
        } catch (error) {
          console.error(
            `${LOG_PREFIX} ERROR processing ${skin.name}:`,
            error.message
          );
          failed++;
          await wait(RATE_LIMIT_DELAY_MS);
        }
      }

      // Small delay between batches
      if (i + BATCH_SIZE < skins.length) {
        await wait(100);
      }
    }

    // Summary
    console.log(`${LOG_PREFIX} ============================================`);
    console.log(`${LOG_PREFIX} Price fetch completed!`);
    console.log(`${LOG_PREFIX} Inserted: ${inserted} records`);
    console.log(`${LOG_PREFIX} Skipped: ${skipped} records (already recorded)`);
    console.log(`${LOG_PREFIX} Failed: ${failed} records`);
    console.log(`${LOG_PREFIX} Total skins: ${skins.length}`);
    console.log(`${LOG_PREFIX} Timestamp: ${new Date().toISOString()}`);
    console.log(`${LOG_PREFIX} ============================================`);

    // Exit with code 1 if any failures
    if (failed > 0) {
      console.warn(`${LOG_PREFIX} Warnings: ${failed} skins failed to fetch`);
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error(`${LOG_PREFIX} FATAL ERROR:`, error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run
main();
