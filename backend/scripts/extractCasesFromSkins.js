// /backend/scripts/extractCasesFromSkins.js — [Backend]
// {/* Extract cases from existing skins data */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety, safeDatabaseOperation } from "./safety-guard.js";

const prisma = new PrismaClient();

// Safety check: Only allow in development or with explicit production flag
checkProductionSafety("Extract cases from skins", false);

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
  console.log("Usage: node extractCasesFromSkins.js --dry-run|--real-run");
  process.exit(1);
}

/**
 * Extract cases from existing skins
 */
async function extractCasesFromSkins() {
  try {
    console.log("🎲 Extracting cases from existing skins...");

    // Get all distinct itemGroup values that could be cases
    const itemGroups = await prisma.skin.findMany({
      select: { itemGroup: true },
      distinct: ['itemGroup'],
      where: { 
        itemGroup: { not: null },
        itemGroup: { not: '' }
      },
      orderBy: { itemGroup: 'asc' }
    });

    console.log(`📦 Found ${itemGroups.length} distinct item groups`);

    // Filter for potential cases
    const potentialCases = itemGroups.filter(item => {
      const group = item.itemGroup.toLowerCase();
      return group.includes('case') || 
             group.includes('collection') ||
             group.includes('weapon') ||
             group.includes('operation') ||
             group.includes('major');
    });

    console.log(`🎯 Found ${potentialCases.length} potential cases`);

    if (isDryRun) {
      console.log("🔍 [DRY-RUN] Potential cases that would be created:");
      potentialCases.forEach((item, index) => {
        console.log(`${index + 1}. ${item.itemGroup}`);
      });
      return;
    }

    // Create cases from item groups
    let createdCount = 0;
    let skippedCount = 0;

    for (const item of potentialCases) {
      try {
        const caseName = item.itemGroup;
        
        // Check if case already exists
        const existingCase = await prisma.case.findFirst({
          where: { name: caseName }
        });

        if (existingCase) {
          console.log(`⏭️ Skipping existing case: ${caseName}`);
          skippedCount++;
          continue;
        }

        // Count skins in this case
        const skinCount = await prisma.skin.count({
          where: { itemGroup: caseName }
        });

        // Get average price for this case
        const avgPriceResult = await prisma.skin.aggregate({
          where: { 
            itemGroup: caseName,
            priceAvg: { not: null }
          },
          _avg: { priceAvg: true }
        });

        // Create case data
        const caseData = {
          name: caseName,
          imageUrl: '/images/placeholder-case.png',
          description: `A case containing ${caseName.toLowerCase()} skins`,
          releaseDate: new Date(),
          isDiscontinued: false,
          price: avgPriceResult._avg.priceAvg || 0,
          marketCap: (avgPriceResult._avg.priceAvg || 0) * skinCount,
          remaining: skinCount,
          dropped: skinCount,
          unboxed: 0,
          timeToExtinction: 999,
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

        console.log(`✅ Created case: ${caseName} (${skinCount} skins)`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating case ${item.itemGroup}:`, error.message);
        continue;
      }
    }

    console.log("🎉 Case extraction completed!");
    console.log(`✅ Created: ${createdCount} cases`);
    console.log(`⏭️ Skipped: ${skippedCount} cases`);

  } catch (error) {
    console.error("❌ Error during case extraction:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  extractCasesFromSkins();
}

export default extractCasesFromSkins;
