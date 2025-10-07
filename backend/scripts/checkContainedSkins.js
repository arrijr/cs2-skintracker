// /backend/scripts/checkContainedSkins.js — [Backend]
// {/* Check which cases have contained skins */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkContainedSkins() {
  console.log("🎨 Checking contained skins for all cases...");

  try {
    const cases = await prisma.case.findMany({
      include: {
        caseSkins: {
          include: {
            skin: {
              select: {
                id: true,
                name: true,
                rarity: true,
                priceLatest: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Found ${cases.length} cases in database`);

    let casesWithSkins = 0;
    let totalSkins = 0;

    cases.forEach(caseItem => {
      const skinCount = caseItem.caseSkins.length;
      if (skinCount > 0) {
        casesWithSkins++;
        totalSkins += skinCount;
        
        console.log(`\n🎨 ${caseItem.name}: ${skinCount} skins`);
        caseItem.caseSkins.slice(0, 5).forEach((cs, index) => {
          console.log(`  ${index + 1}. ${cs.skin.name} (${cs.skin.rarity}) - $${cs.skin.priceLatest?.toFixed(2) || 'N/A'}`);
        });
        if (skinCount > 5) {
          console.log(`  ... and ${skinCount - 5} more skins`);
        }
      }
    });

    console.log(`\n📊 Summary:`);
    console.log(`  Cases with skins: ${casesWithSkins}/${cases.length}`);
    console.log(`  Total contained skins: ${totalSkins}`);
    console.log(`  Average skins per case: ${casesWithSkins > 0 ? (totalSkins / casesWithSkins).toFixed(1) : 0}`);

    // Check specific case
    const breakoutCase = cases.find(c => c.name === "Operation Breakout Weapon Case");
    if (breakoutCase) {
      console.log(`\n🔍 Operation Breakout Weapon Case details:`);
      console.log(`  Contained skins: ${breakoutCase.caseSkins.length}`);
      if (breakoutCase.caseSkins.length === 0) {
        console.log(`  ⚠️ No skins found - this needs to be populated!`);
      }
    }

  } catch (error) {
    console.error("❌ Error checking contained skins:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkContainedSkins();

