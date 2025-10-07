// /backend/scripts/importCaseFromCSGODatabase.template.js — [Backend]
// {/* TEMPLATE: Import any case from csgodatabase.com - Copy & customize per case */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ========== CUSTOMIZE THESE VALUES ==========

const CASE_NAME = "YOUR_CASE_NAME_HERE"; // Must match DB exactly!
const CSGODB_URL = "https://www.csgodatabase.com/cases/your-case-url/";

// Copy skin list from csgodatabase.com:
// Visit the URL above, copy all skins with their rarities
const CASE_SKINS = [
  // EXAMPLE FORMAT - Replace with actual data:
  
  // Covert (Red) - 0.64% each
  // { name: "AK-47 | Asiimov", rarity: "Covert", dropChance: 0.64 },
  
  // Classified (Pink) - 3.2% each  
  // { name: "M4A4 | The Emperor", rarity: "Classified", dropChance: 3.2 },
  
  // Restricted (Purple) - 15.98% each
  // { name: "AWP | Chromatic Aberration", rarity: "Restricted", dropChance: 15.98 },
  
  // Mil-Spec (Blue) - 15.98% each (usually 5 items)
  // { name: "P250 | Vino Primo", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  
  // Exceedingly Rare (Gold/Knives) - 0.26% total
  // { name: "★ Karambit", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

// ========== DO NOT EDIT BELOW THIS LINE ==========

async function importCaseFromCSGODatabase() {
  console.log(`🎨 Importing ${CASE_NAME} from csgodatabase.com...`);
  console.log(`📊 Source: ${CSGODB_URL}`);

  try {
    // Find the case
    const caseItem = await prisma.case.findFirst({
      where: { 
        OR: [
          { name: CASE_NAME },
          { name: { contains: CASE_NAME } }
        ]
      }
    });

    if (!caseItem) {
      console.log(`❌ Case not found: ${CASE_NAME}`);
      console.log(`\nAvailable cases:`);
      const cases = await prisma.case.findMany({ select: { name: true } });
      cases.forEach(c => console.log(`  - ${c.name}`));
      return;
    }

    console.log(`📦 Found case: ${caseItem.name} (ID: ${caseItem.id})`);

    // Delete existing skins for this case
    const deleted = await prisma.caseSkin.deleteMany({
      where: { caseId: caseItem.id }
    });
    console.log(`🗑️ Deleted ${deleted.count} existing skin relationships`);

    if (CASE_SKINS.length === 0) {
      console.log(`\n⚠️ WARNING: No skins defined! Please add skins to CASE_SKINS array.`);
      console.log(`\n📋 Instructions:`);
      console.log(`1. Visit: ${CSGODB_URL}`);
      console.log(`2. Copy all skins with their rarities`);
      console.log(`3. Add them to CASE_SKINS array in this script`);
      console.log(`4. Run script again`);
      return;
    }

    console.log(`🎨 Importing ${CASE_SKINS.length} skins...`);

    let addedCount = 0;
    let createdCount = 0;

    for (const skinData of CASE_SKINS) {
      try {
        // Check if skin exists
        let skin = await prisma.skin.findFirst({
          where: { 
            OR: [
              { name: skinData.name },
              { marketHashName: skinData.name }
            ]
          }
        });

        if (!skin) {
          // Create skin
          skin = await prisma.skin.create({
            data: {
              name: skinData.name,
              marketHashName: skinData.name,
              rarity: skinData.rarity,
              weaponType: extractWeaponType(skinData.name),
              priceLatest: generateRealisticPrice(skinData.rarity),
              priceMedian: generateRealisticPrice(skinData.rarity),
              imageUrl: `https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP`
            }
          });
          console.log(`  ✅ Created skin: ${skinData.name}`);
          createdCount++;
        }

        // Create relationship
        await prisma.caseSkin.create({
          data: {
            caseId: caseItem.id,
            skinId: skin.id,
            rarity: skinData.rarity,
            dropChance: skinData.dropChance,
            isSpecial: skinData.isSpecial || false
          }
        });
        addedCount++;
        console.log(`  ✅ Linked: ${skinData.name} (${skinData.rarity})`);

      } catch (error) {
        console.log(`  ❌ Error processing ${skinData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 ${CASE_NAME} imported successfully!`);
    console.log(`  🗑️ Deleted: ${deleted.count} old relationships`);
    console.log(`  ✅ Created: ${createdCount} new skins`);
    console.log(`  🔗 Linked: ${addedCount} skin relationships`);
    console.log(`  📊 Source: ${CSGODB_URL}`);

  } catch (error) {
    console.error("❌ Error importing case:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function extractWeaponType(skinName) {
  const weaponMatch = skinName.match(/^([^|]+)\s*\|/);
  if (weaponMatch) {
    return weaponMatch[1].trim().replace('★ ', '');
  }
  return 'Unknown';
}

function generateRealisticPrice(rarity) {
  const priceRanges = {
    'Consumer Grade': { min: 0.03, max: 0.15 },
    'Industrial Grade': { min: 0.08, max: 0.50 },
    'Mil-Spec Grade': { min: 0.20, max: 2.00 },
    'Restricted': { min: 1.00, max: 15.00 },
    'Classified': { min: 5.00, max: 100.00 },
    'Covert': { min: 50.00, max: 1000.00 },
    'Exceedingly Rare': { min: 200.00, max: 5000.00 }
  };

  const range = priceRanges[rarity] || priceRanges['Consumer Grade'];
  const price = Math.random() * (range.max - range.min) + range.min;
  return Math.round(price * 100) / 100;
}

importCaseFromCSGODatabase();

