// /backend/scripts/importRevolutionFromCSGODB.js — [Backend]
// {/* Import Revolution Case from csgodatabase.com */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CASE_NAME = "Revolution Case";
const CSGODB_URL = "https://www.csgodatabase.com/cases/revolution-case/";

const CASE_SKINS = [
  // Covert (Red) - 0.64% each
  { name: "P90 | Neoqueen", rarity: "Covert", dropChance: 0.64 },
  { name: "AK-47 | Ice Coaled", rarity: "Covert", dropChance: 0.64 },
  
  // Classified (Pink) - 3.2% each
  { name: "M4A4 | Temukau", rarity: "Classified", dropChance: 3.2 },
  { name: "AWP | Duality", rarity: "Classified", dropChance: 3.2 },
  { name: "P2000 | Wicked Sick", rarity: "Classified", dropChance: 3.2 },
  
  // Restricted (Purple) - 15.98% each
  { name: "Glock-18 | Umbral Rabbit", rarity: "Restricted", dropChance: 15.98 },
  { name: "R8 Revolver | Banana Cannon", rarity: "Restricted", dropChance: 15.98 },
  { name: "Desert Eagle | Sputnik", rarity: "Restricted", dropChance: 15.98 },
  { name: "USP-S | Ticket to Hell", rarity: "Restricted", dropChance: 15.98 },
  { name: "MAC-10 | Sakkaku", rarity: "Restricted", dropChance: 15.98 },
  
  // Mil-Spec (Blue) - 15.98% each
  { name: "P250 | Visions", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MP9 | Mount Fuji", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Negev | Drop Me", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Tec-9 | Rebel", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "SCAR-20 | Fragments", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "UMP-45 | Gearbox", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Sawed-Off | Apocalypto", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  
  // Exceedingly Rare (Gold) - 0.26% total
  { name: "★ Kukri Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function importRevolutionFromCSGODB() {
  console.log(`🎨 Importing ${CASE_NAME} from csgodatabase.com...`);
  console.log(`📊 Source: ${CSGODB_URL}`);

  try {
    const caseItem = await prisma.case.findFirst({
      where: { 
        OR: [
          { name: CASE_NAME },
          { name: { contains: "Revolution" } }
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
              weaponType: skinData.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown',
              priceLatest: Math.random() * 100 + 10,
              priceMedian: Math.random() * 100 + 10,
              imageUrl: `https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP`
            }
          });
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

      } catch (error) {
        console.log(`  ❌ Error: ${skinData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 ${CASE_NAME} imported!`);
    console.log(`  🗑️ Deleted: ${deleted.count} | ✅ Created: ${createdCount} | 🔗 Linked: ${addedCount}`);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importRevolutionFromCSGODB();

