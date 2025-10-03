// /backend/scripts/importCasesFromSteam.js — [Backend]
// {/* Import all CS2 cases from Steam API */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety, safeDatabaseOperation } from "./safety-guard.js";

const prisma = new PrismaClient();
const STEAM_API_KEY = process.env.STEAM_API_KEY;

// Safety check: Only allow in development or with explicit production flag
checkProductionSafety("Steam API case import", false);

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isRealRun = args.includes('--real-run');

if (isDryRun) {
  console.log("🔍 [DRY-RUN] Mode activated - no database writes will be performed");
} else if (isRealRun) {
  console.log("🚀 [REAL-RUN] Mode activated - database writes will be performed");
} else {
  console.log("⚠️ [MODE] Please specify --dry-run or --real-run");
  console.log("Usage: node importCasesFromSteam.js --dry-run|--real-run");
  process.exit(1);
}

// Rate limiting configuration
const BATCH_DELAY = 1000; // 1 second between requests
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
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
      console.log(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }
}

/**
 * Fetch cases from Steam API
 */
async function fetchCasesFromSteam() {
  const url = `https://api.steampowered.com/IEconItems_730/GetSchema/v2/?key=${STEAM_API_KEY}&format=json`;
  
  console.log("🔍 Fetching cases from Steam API...");
  
  const response = await retryWithBackoff(async () => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Steam API error: ${res.status} ${res.statusText}`);
    }
    return res;
  });
  
  const data = await response.json();
  return data.result;
}

/**
 * Process and import cases
 */
async function importCases() {
  try {
    if (!STEAM_API_KEY) {
      throw new Error("STEAM_API_KEY environment variable is required");
    }

    console.log("🎲 Starting case import from Steam API...");

    // Fetch data from Steam API
    const steamData = await fetchCasesFromSteam();
    
    console.log("🔍 Steam API response structure:", Object.keys(steamData || {}));
    
    if (!steamData || !steamData.items) {
      console.error("❌ Steam API response:", JSON.stringify(steamData, null, 2));
      throw new Error("No items data received from Steam API");
    }

    console.log(`📦 Found ${steamData.items.length} items in Steam API`);

    // Filter for cases (items with type "Container")
    const cases = steamData.items.filter(item => 
      item.type === "Container" && 
      item.name && 
      item.name.toLowerCase().includes('case') &&
      !item.name.toLowerCase().includes('key')
    );

    console.log(`🎯 Found ${cases.length} cases to import`);

    if (isDryRun) {
      console.log("🔍 [DRY-RUN] Cases that would be imported:");
      cases.forEach((caseItem, index) => {
        console.log(`${index + 1}. ${caseItem.name} (${caseItem.type})`);
      });
      return;
    }

    // Import cases to database
    let importedCount = 0;
    let skippedCount = 0;

    for (const caseItem of cases) {
      try {
        // Check if case already exists
        const existingCase = await prisma.case.findFirst({
          where: { name: caseItem.name }
        });

        if (existingCase) {
          console.log(`⏭️ Skipping existing case: ${caseItem.name}`);
          skippedCount++;
          continue;
        }

        // Create case data
        const caseData = {
          name: caseItem.name,
          imageUrl: caseItem.image_url || caseItem.image_url_large || '/images/placeholder-case.png',
          description: caseItem.description || `A case containing ${caseItem.name.toLowerCase()}`,
          releaseDate: new Date(), // Steam API doesn't provide release dates
          isDiscontinued: false, // Assume active unless proven otherwise
          price: 0, // Will be updated by price update script
          marketCap: 0,
          remaining: 0,
          dropped: 0,
          unboxed: 0,
          timeToExtinction: 999, // Default high value
          priceChange24h: 0,
          priceChange7d: 0,
          priceChange30d: 0
        };

        // Insert case
        await safeDatabaseOperation(async () => {
          await prisma.case.create({
            data: caseData
          });
        });

        console.log(`✅ Imported case: ${caseItem.name}`);
        importedCount++;

        // Rate limiting
        await sleep(BATCH_DELAY);

      } catch (error) {
        console.error(`❌ Error importing case ${caseItem.name}:`, error.message);
        continue;
      }
    }

    console.log("🎉 Case import completed!");
    console.log(`✅ Imported: ${importedCount} cases`);
    console.log(`⏭️ Skipped: ${skippedCount} cases`);
    console.log(`📊 Total cases in database: ${importedCount + skippedCount}`);

  } catch (error) {
    console.error("❌ Error during case import:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importCases();
}

export default importCases;
