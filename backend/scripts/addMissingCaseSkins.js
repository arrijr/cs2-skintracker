// /backend/scripts/addMissingCaseSkins.js — [Backend]
// {/* Add missing case-skin relationships */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addMissingCaseSkins() {
  console.log("🔧 Adding missing case-skin relationships...");
  
  try {
    // Get all cases without skins
    const casesWithoutSkins = await prisma.case.findMany({
      where: {
        caseSkins: {
          none: {}
        }
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📦 Found ${casesWithoutSkins.length} cases without skins`);
    
    // Get some sample skins to assign
    const sampleSkins = await prisma.skin.findMany({
      where: {
        rarity: {
          in: ['covert', 'classified', 'restricted', 'milspec']
        }
      },
      take: 50,
      orderBy: { priceLatest: 'desc' }
    });
    
    console.log(`🎯 Using ${sampleSkins.length} sample skins`);
    
    let addedCount = 0;
    
    for (const caseItem of casesWithoutSkins) {
      console.log(`\n📦 Adding skins to: ${caseItem.name}`);
      
      // Select 5-10 random skins for each case
      const numSkins = Math.floor(Math.random() * 6) + 5; // 5-10 skins
      const selectedSkins = sampleSkins
        .sort(() => 0.5 - Math.random())
        .slice(0, numSkins);
      
      console.log(`   Adding ${selectedSkins.length} skins:`);
      
      for (const skin of selectedSkins) {
        try {
          await prisma.caseSkin.create({
            data: {
              caseId: caseItem.id,
              skinId: skin.id,
              rarity: skin.rarity || 'milspec',
              isSpecial: Math.random() < 0.1, // 10% chance of being special
              dropChance: Math.random() * 0.1 + 0.01 // Random drop rate 1-11%
            }
          });
          
          console.log(`     ✅ ${skin.name} (${skin.rarity}) - $${skin.priceLatest || 'N/A'}`);
          addedCount++;
        } catch (error) {
          console.log(`     ❌ Failed to add ${skin.name}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n🎉 Added ${addedCount} case-skin relationships`);
    
    // Verify results
    const updatedCases = await prisma.case.findMany({
      where: {
        caseSkins: {
          some: {}
        }
      },
      include: {
        _count: {
          select: { caseSkins: true }
        }
      }
    });
    
    console.log(`\n📊 Updated summary:`);
    console.log(`✅ Cases with skins: ${updatedCases.length}`);
    console.log(`✅ Total case-skin relationships: ${await prisma.caseSkin.count()}`);
    
    // Show some examples
    console.log(`\n📋 Sample cases with skins:`);
    updatedCases.slice(0, 5).forEach(caseItem => {
      console.log(`  - ${caseItem.name}: ${caseItem._count.caseSkins} skins`);
    });
    
  } catch (error) {
    console.error("❌ Error adding case-skin relationships:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addMissingCaseSkins();
