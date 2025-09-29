// /backend/scripts/steamImportSkins.js (Backend)
// {/* Safe Steam API skin import with upsert logic and production guards */}

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety, safeDatabaseOperation } from "./safety-guard.js";

const prisma = new PrismaClient();
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Safety check: Only allow in development or with explicit production flag
checkProductionSafety("Steam API skin import", false);

// Rate limiting configuration
const BATCH_SIZE = 100;
const BATCH_DELAY = 1000; // 1 second between batches
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds base delay

/**
 * Sleep utility for rate limiting
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry logic
 */
async function retryWithBackoff(fn, maxRetries = MAX_RETRIES) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      if (error.status === 429 || error.status >= 500) {
        const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`⚠️ [RETRY] Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Fetch skins from Steam API with pagination
 */
async function fetchSteamSkins() {
  if (!STEAM_API_KEY) {
    throw new Error("❌ STEAM_API_KEY not found in environment variables");
  }

  console.log("🔍 [STEAM] Starting Steam API skin fetch...");
  
  const allSkins = [];
  let hasMore = true;
  let start = 0;
  let totalFetched = 0;

  while (hasMore) {
    try {
      const url = `https://api.steampowered.com/IEconItems_730/GetItems/v0001/?key=${STEAM_API_KEY}&appid=730&start=${start}&count=${BATCH_SIZE}`;
      
      console.log(`📡 [STEAM] Fetching batch starting at ${start}...`);
      
      const response = await retryWithBackoff(async () => {
        const res = await fetch(url);
        if (!res.ok) {
          const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
          error.status = res.status;
          throw error;
        }
        return res;
      });

      const data = await response.json();
      
      if (!data.result || !data.result.items) {
        console.log("⚠️ [STEAM] No items in response, stopping pagination");
        break;
      }

      const items = data.result.items;
      allSkins.push(...items);
      totalFetched += items.length;
      
      console.log(`✅ [STEAM] Fetched ${items.length} items (total: ${totalFetched})`);
      
      // Check if we have more items
      hasMore = items.length === BATCH_SIZE;
      start += BATCH_SIZE;
      
      // Rate limiting
      if (hasMore) {
        await sleep(BATCH_DELAY);
      }
      
    } catch (error) {
      console.error(`❌ [STEAM] Error fetching batch at ${start}:`, error.message);
      throw error;
    }
  }

  console.log(`🎯 [STEAM] Total skins fetched: ${allSkins.length}`);
  return allSkins;
}

/**
 * Map Steam API item to our database schema
 */
function mapSteamItemToSkin(item) {
  return {
    name: item.name || item.market_name || 'Unknown',
    marketHashName: item.market_hash_name || item.name || 'Unknown',
    imageUrl: item.icon_url || item.icon_url_large || null,
    type: item.type || null,
    weapon: item.weapon_type || null,
    rarity: item.rarity || null,
    collection: item.collection || null,
    case: item.case || null,
    exterior: item.exterior || null,
    quality: item.quality || null,
    // Set default values for required fields
    currentPrice: 0,
    priceHistory: [],
    lastUpdated: new Date(),
  };
}

/**
 * Upsert skin into database
 */
async function upsertSkin(skinData) {
  const where = {
    marketHashName: skinData.marketHashName
  };

  const existingSkin = await prisma.skin.findUnique({
    where: { marketHashName: skinData.marketHashName }
  });

  if (existingSkin) {
    // Update existing skin
    return await prisma.skin.update({
      where: { marketHashName: skinData.marketHashName },
      data: {
        name: skinData.name,
        imageUrl: skinData.imageUrl,
        type: skinData.type,
        weapon: skinData.weapon,
        rarity: skinData.rarity,
        collection: skinData.collection,
        case: skinData.case,
        exterior: skinData.exterior,
        quality: skinData.quality,
        lastUpdated: new Date(),
      }
    });
  } else {
    // Insert new skin
    return await prisma.skin.create({
      data: skinData
    });
  }
}

/**
 * Create job run record
 */
async function createJobRun() {
  return await prisma.jobRun.create({
    data: {
      jobName: 'steam_skin_import',
      status: 'running',
      startedAt: new Date(),
      details: 'Starting Steam API skin import...'
    }
  });
}

/**
 * Update job run record
 */
async function updateJobRun(jobRunId, status, details, stats = {}) {
  return await prisma.jobRun.update({
    where: { id: jobRunId },
    data: {
      status,
      details,
      completedAt: status === 'completed' || status === 'failed' ? new Date() : null,
      ...stats
    }
  });
}

/**
 * Main import function
 */
async function importSteamSkins() {
  let jobRun = null;
  let insertedCount = 0;
  let updatedCount = 0;
  let failedCount = 0;

  try {
    console.log("🚀 [IMPORT] Starting Steam skin import...");
    
    // Create job run record
    jobRun = await createJobRun();
    console.log(`📊 [JOB] Created job run: ${jobRun.id}`);

    // Get initial skin count
    const initialSkinCount = await prisma.skin.count();
    console.log(`📊 [DB] Initial skin count: ${initialSkinCount}`);

    // Safety check: If we already have many skins, this is an update operation
    if (initialSkinCount > 100) {
      console.log(`⚠️ [SAFETY] Database already has ${initialSkinCount} skins - running as UPDATE operation`);
    }

    // Fetch skins from Steam API
    const steamSkins = await fetchSteamSkins();
    
    if (steamSkins.length === 0) {
      throw new Error("No skins fetched from Steam API");
    }

    // Process skins in batches
    console.log(`🔄 [IMPORT] Processing ${steamSkins.length} skins in batches of ${BATCH_SIZE}...`);
    
    for (let i = 0; i < steamSkins.length; i += BATCH_SIZE) {
      const batch = steamSkins.slice(i, i + BATCH_SIZE);
      console.log(`📦 [BATCH] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(steamSkins.length / BATCH_SIZE)}`);
      
      for (const item of batch) {
        try {
          const skinData = mapSteamItemToSkin(item);
          const existingSkin = await prisma.skin.findUnique({
            where: { marketHashName: skinData.marketHashName }
          });
          
          if (existingSkin) {
            await upsertSkin(skinData);
            updatedCount++;
          } else {
            await upsertSkin(skinData);
            insertedCount++;
          }
        } catch (error) {
          console.error(`❌ [SKIN] Failed to process skin: ${item.name || 'Unknown'}`, error.message);
          failedCount++;
        }
      }
      
      // Update job progress
      await updateJobRun(jobRun.id, 'running', 
        `Processed ${Math.min(i + BATCH_SIZE, steamSkins.length)}/${steamSkins.length} skins. Inserted: ${insertedCount}, Updated: ${updatedCount}, Failed: ${failedCount}`,
        { insertedCount, updatedCount, failedCount }
      );
      
      // Rate limiting between batches
      if (i + BATCH_SIZE < steamSkins.length) {
        await sleep(BATCH_DELAY);
      }
    }

    // Get final skin count
    const finalSkinCount = await prisma.skin.count();
    const totalProcessed = insertedCount + updatedCount;
    
    console.log(`✅ [IMPORT] Import completed!`);
    console.log(`📊 [STATS] Inserted: ${insertedCount}, Updated: ${updatedCount}, Failed: ${failedCount}`);
    console.log(`📊 [DB] Skin count: ${initialSkinCount} → ${finalSkinCount} (+${finalSkinCount - initialSkinCount})`);

    // Update job as completed
    await updateJobRun(jobRun.id, 'completed', 
      `Import completed successfully. Total processed: ${totalProcessed}, Final skin count: ${finalSkinCount}`,
      { 
        insertedCount, 
        updatedCount, 
        failedCount,
        finalSkinCount,
        totalProcessed
      }
    );

    return {
      success: true,
      insertedCount,
      updatedCount,
      failedCount,
      initialSkinCount,
      finalSkinCount,
      totalProcessed
    };

  } catch (error) {
    console.error("❌ [IMPORT] Import failed:", error.message);
    
    if (jobRun) {
      await updateJobRun(jobRun.id, 'failed', 
        `Import failed: ${error.message}`,
        { insertedCount, updatedCount, failedCount }
      );
    }
    
    throw error;
  }
}

/**
 * Verify import results
 */
async function verifyImport() {
  console.log("🔍 [VERIFY] Verifying import results...");
  
  const skinCount = await prisma.skin.count();
  const userCount = await prisma.user.count();
  const portfolioCount = await prisma.portfolio.count();
  const watchlistCount = await prisma.watchlist.count();
  
  console.log(`📊 [VERIFY] Database counts:`);
  console.log(`  - Skins: ${skinCount}`);
  console.log(`  - Users: ${userCount}`);
  console.log(`  - Portfolio: ${portfolioCount}`);
  console.log(`  - Watchlist: ${watchlistCount}`);
  
  // Test API endpoints
  try {
    const testSkins = await prisma.skin.findMany({ take: 5 });
    console.log(`🎯 [VERIFY] Sample skins:`, testSkins.map(s => s.name));
    
    const akSkins = await prisma.skin.findMany({
      where: { name: { contains: 'AK' } },
      take: 3
    });
    console.log(`🔍 [VERIFY] AK skins found: ${akSkins.length}`);
    
  } catch (error) {
    console.error("❌ [VERIFY] Verification failed:", error.message);
  }
  
  return {
    skinCount,
    userCount,
    portfolioCount,
    watchlistCount
  };
}

// Run the import
async function main() {
  try {
    const result = await importSteamSkins();
    await verifyImport();
    
    console.log("🎉 [SUCCESS] Steam skin import completed successfully!");
    console.log(`📈 [RESULT] ${result.finalSkinCount} skins in database`);
    
  } catch (error) {
    console.error("💥 [ERROR] Steam skin import failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Only run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { importSteamSkins, verifyImport };
