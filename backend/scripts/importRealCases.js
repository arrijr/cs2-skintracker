// /backend/scripts/importRealCases.js — [Backend]
// {/* Import real cases from container names */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { checkProductionSafety, safeDatabaseOperation } from "./safety-guard.js";

const prisma = new PrismaClient();

// Safety check: Only allow in development or with explicit production flag
checkProductionSafety("Import real cases", false);

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
  console.log("Usage: node importRealCases.js --dry-run|--real-run");
  process.exit(1);
}

/**
 * Import real cases from container names
 */
async function importRealCases() {
  try {
    console.log("🎲 Importing real cases from container names...");

    // Get all distinct container names
    const containers = await prisma.skin.findMany({
      select: { itemName: true },
      distinct: ['itemName'],
      where: { 
        weaponType: 'container',
        itemName: { not: null },
        itemName: { not: '' }
      },
      orderBy: { itemName: 'asc' }
    });

    console.log(`📦 Found ${containers.length} container names`);

    // Filter for real cases (not stickers, capsules, etc.)
    const realCases = containers.filter(container => {
      const name = container.itemName.toLowerCase();
      return (
        name.includes('case') && 
        !name.includes('sticker') &&
        !name.includes('capsule') &&
        !name.includes('souvenir') &&
        !name.includes('autograph') &&
        !name.includes('patch') &&
        !name.includes('graffiti') &&
        !name.includes('music') &&
        !name.includes('pin') &&
        !name.includes('package') &&
        !name.includes('box') &&
        !name.includes('kit')
      );
    });

    console.log(`🎯 Found ${realCases.length} real cases`);

    if (isDryRun) {
      console.log("🔍 [DRY-RUN] Real cases that would be imported:");
      realCases.forEach((item, index) => {
        console.log(`${index + 1}. ${item.itemName}`);
      });
      return;
    }

    // Import cases to database
    let createdCount = 0;
    let skippedCount = 0;

    for (const container of realCases) {
      try {
        const caseName = container.itemName;
        
        // Check if case already exists
        const existingCase = await prisma.case.findFirst({
          where: { name: caseName }
        });

        if (existingCase) {
          console.log(`⏭️ Skipping existing case: ${caseName}`);
          skippedCount++;
          continue;
        }

        // Count skins in this case (skins that reference this case)
        const skinCount = await prisma.skin.count({
          where: { 
            OR: [
              { itemName: caseName },
              { collection: caseName },
              { name: { contains: caseName } }
            ]
          }
        });

        // Get average price for this case
        const avgPriceResult = await prisma.skin.aggregate({
          where: { 
            OR: [
              { itemName: caseName },
              { collection: caseName },
              { name: { contains: caseName } }
            ],
            priceAvg: { not: null }
          },
          _avg: { priceAvg: true }
        });

        // Determine if case is discontinued (older cases)
        const isDiscontinued = caseName.toLowerCase().includes('2013') ||
                              caseName.toLowerCase().includes('2014') ||
                              caseName.toLowerCase().includes('2015') ||
                              caseName.toLowerCase().includes('2016') ||
                              caseName.toLowerCase().includes('2017') ||
                              caseName.toLowerCase().includes('2018') ||
                              caseName.toLowerCase().includes('2019') ||
                              caseName.toLowerCase().includes('2020') ||
                              caseName.toLowerCase().includes('2021');

        // Create case data
        const caseData = {
          name: caseName,
          imageUrl: '/images/placeholder-case.png',
          description: `A case containing ${caseName.toLowerCase()} skins`,
          releaseDate: new Date(),
          isDiscontinued: isDiscontinued,
          price: avgPriceResult._avg.priceAvg || 0,
          marketCap: (avgPriceResult._avg.priceAvg || 0) * skinCount,
          remaining: skinCount,
          dropped: skinCount,
          unboxed: 0,
          timeToExtinction: isDiscontinued ? 0 : 999,
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

        console.log(`✅ Created case: ${caseName} (${skinCount} skins, discontinued: ${isDiscontinued})`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creating case ${container.itemName}:`, error.message);
        continue;
      }
    }

    console.log("🎉 Case import completed!");
    console.log(`✅ Created: ${createdCount} cases`);
    console.log(`⏭️ Skipped: ${skippedCount} cases`);

  } catch (error) {
    console.error("❌ Error during case import:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  importRealCases();
}

export default importRealCases;
