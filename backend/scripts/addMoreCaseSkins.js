// /backend/scripts/addMoreCaseSkins.js — [Backend]
// {/* Add more diverse skins to cases */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addMoreCaseSkins() {
  console.log("🔧 Adding more diverse skins to cases...");
  
  try {
    // Get all cases with skins
    const allCasesWithSkins = await prisma.case.findMany({
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
    
    // Filter cases with only 1 skin
    const casesWithOneSkin = allCasesWithSkins.filter(caseItem => caseItem._count.caseSkins === 1);
    
    console.log(`📦 Found ${casesWithOneSkin.length} cases with only 1 skin`);
    
    // Get diverse skins by rarity
    const skinsByRarity = {
      covert: await prisma.skin.findMany({
        where: { rarity: 'covert' },
        take: 20,
        orderBy: { priceLatest: 'desc' }
      }),
      classified: await prisma.skin.findMany({
        where: { rarity: 'classified' },
        take: 30,
        orderBy: { priceLatest: 'desc' }
      }),
      restricted: await prisma.skin.findMany({
        where: { rarity: 'restricted' },
        take: 40,
        orderBy: { priceLatest: 'desc' }
      }),
      milspec: await prisma.skin.findMany({
        where: { rarity: 'milspec' },
        take: 50,
        orderBy: { priceLatest: 'desc' }
      })
    };
    
    console.log(`🎯 Available skins: Covert ${skinsByRarity.covert.length}, Classified ${skinsByRarity.classified.length}, Restricted ${skinsByRarity.restricted.length}, Milspec ${skinsByRarity.milspec.length}`);
    
    let addedCount = 0;
    
    for (const caseItem of casesWithOneSkin) {
      console.log(`\n📦 Adding more skins to: ${caseItem.name}`);
      
      // Add 4-8 more skins per case
      const numSkins = Math.floor(Math.random() * 5) + 4; // 4-8 skins
      
      // Create a realistic skin distribution
      const skinDistribution = [
        ...Array(1).fill('covert'),      // 1 covert
        ...Array(2).fill('classified'),  // 2 classified
        ...Array(3).fill('restricted'),  // 3 restricted
        ...Array(4).fill('milspec')      // 4 milspec
      ].slice(0, numSkins);
      
      console.log(`   Adding ${numSkins} skins with distribution: ${skinDistribution.join(', ')}`);
      
      for (const rarity of skinDistribution) {
        const availableSkins = skinsByRarity[rarity];
        if (availableSkins.length === 0) continue;
        
        const randomSkin = availableSkins[Math.floor(Math.random() * availableSkins.length)];
        
        try {
          await prisma.caseSkin.create({
            data: {
              caseId: caseItem.id,
              skinId: randomSkin.id,
              rarity: rarity,
              isSpecial: Math.random() < 0.05, // 5% chance of being special
              dropChance: Math.random() * 0.1 + 0.01 // Random drop rate 1-11%
            }
          });
          
          console.log(`     ✅ ${randomSkin.name} (${rarity}) - $${randomSkin.priceLatest || 'N/A'}`);
          addedCount++;
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`     ⚠️  ${randomSkin.name} already in case`);
          } else {
            console.log(`     ❌ Failed to add ${randomSkin.name}: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`\n🎉 Added ${addedCount} more case-skin relationships`);
    
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
      },
      orderBy: { _count: { caseSkins: 'desc' } }
    });
    
    console.log(`\n📊 Updated summary:`);
    console.log(`✅ Cases with skins: ${updatedCases.length}`);
    console.log(`✅ Total case-skin relationships: ${await prisma.caseSkin.count()}`);
    
    // Show distribution
    const distribution = {};
    updatedCases.forEach(caseItem => {
      const count = caseItem._count.caseSkins;
      distribution[count] = (distribution[count] || 0) + 1;
    });
    
    console.log(`\n📈 Skin distribution:`);
    Object.entries(distribution).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([count, cases]) => {
      console.log(`  ${count} skins: ${cases} cases`);
    });
    
    // Show top cases
    console.log(`\n🏆 Top cases with most skins:`);
    updatedCases.slice(0, 5).forEach(caseItem => {
      console.log(`  - ${caseItem.name}: ${caseItem._count.caseSkins} skins`);
    });
    
  } catch (error) {
    console.error("❌ Error adding more case-skin relationships:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreCaseSkins();