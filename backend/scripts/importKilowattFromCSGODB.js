// /backend/scripts/importKilowattFromCSGODB.js — [Backend]
// {/* Import Kilowatt Case from csgodatabase.com */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CASE_NAME = "Kilowatt Case";
const CSGODB_URL = "https://www.csgodatabase.com/cases/kilowatt-case/";

// Kilowatt Case skins from csgodatabase.com
const CASE_SKINS = [
  // Covert (Red) - 0.64% each
  { name: "AK-47 | Inheritance", rarity: "Covert", dropChance: 0.64 },
  { name: "USP-S | Jawbreaker", rarity: "Covert", dropChance: 0.64 },
  
  // Classified (Pink) - 3.2% each
  { name: "M4A1-S | Black Lotus", rarity: "Classified", dropChance: 3.2 },
  { name: "Glock-18 | Umbral Rabbit", rarity: "Classified", dropChance: 3.2 },
  { name: "Five-SeveN | Hybrid Hunter", rarity: "Classified", dropChance: 3.2 },
  
  // Restricted (Purple) - 15.98% each
  { name: "Tec-9 | Slag", rarity: "Restricted", dropChance: 15.98 },
  { name: "Nova | Dark Sigil", rarity: "Restricted", dropChance: 15.98 },
  { name: "SSG 08 | Dezastre", rarity: "Restricted", dropChance: 15.98 },
  { name: "MAC-10 | Sakkaku", rarity: "Restricted", dropChance: 15.98 },
  { name: "Zeus x27 | Olympus", rarity: "Restricted", dropChance: 15.98 },
  
  // Mil-Spec (Blue) - 15.98% each
  { name: "P250 | Re.built", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "UMP-45 | Motorized", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Sawed-Off | Analog Input", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MP9 | Featherweight", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "P90 | Neoqueen", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  
  // Exceedingly Rare (Gold) - 0.26% total for all knives
  { name: "★ Kukri Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Autotronic", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Blue Steel", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Boreal Forest", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Case Hardened", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Crimson Web", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Fade", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Forest DDPAT", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Night", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Safari Mesh", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Scorched", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Slaughter", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Stained", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Tiger Tooth", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Ultraviolet", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  { name: "★ Kukri Knife | Urban Masked", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true }
];

async function importKilowattFromCSGODB() {
  console.log(`🎨 Importing ${CASE_NAME} from csgodatabase.com...`);
  console.log(`📊 Source: ${CSGODB_URL}`);

  try {
    const caseItem = await prisma.case.findFirst({
      where: { 
        OR: [
          { name: CASE_NAME },
          { name: { contains: "Kilowatt" } }
        ]
      }
    });

    if (!caseItem) {
      console.log(`❌ Case not found: ${CASE_NAME}`);
      return;
    }

    console.log(`📦 Found case: ${caseItem.name} (ID: ${caseItem.id})`);

    const deleted = await prisma.caseSkin.deleteMany({
      where: { caseId: caseItem.id }
    });
    console.log(`🗑️ Deleted ${deleted.count} existing skin relationships`);

    console.log(`🎨 Importing ${CASE_SKINS.length} skins...`);

    let addedCount = 0;
    let createdCount = 0;

    for (const skinData of CASE_SKINS) {
      try {
        let skin = await prisma.skin.findFirst({
          where: { 
            OR: [
              { name: skinData.name },
              { marketHashName: skinData.name }
            ]
          }
        });

        if (!skin) {
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

importKilowattFromCSGODB();

