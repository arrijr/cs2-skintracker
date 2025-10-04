// /backend/scripts/finalizeCaseSkins.js — [Backend]
// {/* Finalize case-skin relationships with proper distribution */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function finalizeCaseSkins() {
  console.log("🔧 Finalizing case-skin relationships...");
  
  try {
    // Get all cases
    const allCases = await prisma.case.findMany({
      include: {
        _count: {
          select: { caseSkins: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📦 Found ${allCases.length} cases`);
    
    // Get all available skins
    const allSkins = await prisma.skin.findMany({
      where: {
        priceLatest: {
          gt: 0
        }
      },
      orderBy: { priceLatest: 'desc' },
      take: 100
    });
    
    console.log(`🎯 Available skins: ${allSkins.length}`);
    
    if (allSkins.length === 0) {
      console.log("❌ No skins available! Cannot add case-skin relationships.");
      return;
    }
    
    let addedCount = 0;
    
    for (const caseItem of allCases) {
      const currentSkinCount = caseItem._count.caseSkins;
      const targetSkinCount = Math.floor(Math.random() * 8) + 5; // 5-12 skins per case
      
      if (currentSkinCount >= targetSkinCount) {
        console.log(`✅ ${caseItem.name}: ${currentSkinCount} skins (already has enough)`);
        continue;
      }
      
      const skinsToAdd = targetSkinCount - currentSkinCount;
      console.log(`\n📦 ${caseItem.name}: Adding ${skinsToAdd} more skins (currently has ${currentSkinCount})`);
      
      // Get skins not already in this case
      const existingSkinIds = await prisma.caseSkin.findMany({
        where: { caseId: caseItem.id },
        select: { skinId: true }
      }).then(relations => relations.map(r => r.skinId));
      
      const availableSkins = allSkins.filter(skin => !existingSkinIds.includes(skin.id));
      
      if (availableSkins.length === 0) {
        console.log(`   ⚠️  No available skins to add`);
        continue;
      }
      
      // Select random skins
      const selectedSkins = availableSkins
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.min(skinsToAdd, availableSkins.length));
      
      for (const skin of selectedSkins) {
        try {
          await prisma.caseSkin.create({
            data: {
              caseId: caseItem.id,
              skinId: skin.id,
              rarity: skin.rarity || 'milspec',
              isSpecial: Math.random() < 0.05, // 5% chance of being special
              dropChance: Math.random() * 0.1 + 0.01 // Random drop rate 1-11%
            }
          });
          
          console.log(`   ✅ ${skin.name} (${skin.rarity}) - $${skin.priceLatest || 'N/A'}`);
          addedCount++;
        } catch (error) {
          if (error.code === 'P2002') {
            console.log(`   ⚠️  ${skin.name} already in case`);
          } else {
            console.log(`   ❌ Failed to add ${skin.name}: ${error.message}`);
          }
        }
      }
    }
    
    console.log(`\n🎉 Added ${addedCount} case-skin relationships`);
    
    // Final summary
    const finalCases = await prisma.case.findMany({
      include: {
        _count: {
          select: { caseSkins: true }
        }
      },
      orderBy: { _count: { caseSkins: 'desc' } }
    });
    
    console.log(`\n📊 Final summary:`);
    console.log(`✅ Total cases: ${finalCases.length}`);
    console.log(`✅ Total case-skin relationships: ${await prisma.caseSkin.count()}`);
    
    // Show distribution
    const distribution = {};
    finalCases.forEach(caseItem => {
      const count = caseItem._count.caseSkins;
      distribution[count] = (distribution[count] || 0) + 1;
    });
    
    console.log(`\n📈 Skin distribution:`);
    Object.entries(distribution).sort((a, b) => parseInt(a[0]) - parseInt(b[0])).forEach(([count, cases]) => {
      console.log(`  ${count} skins: ${cases} cases`);
    });
    
    // Show sample cases
    console.log(`\n🏆 Sample cases with skins:`);
    finalCases.slice(0, 5).forEach(caseItem => {
      console.log(`  - ${caseItem.name}: ${caseItem._count.caseSkins} skins`);
    });
    
  } catch (error) {
    console.error("❌ Error finalizing case-skin relationships:", error);
  } finally {
    await prisma.$disconnect();
  }
}

finalizeCaseSkins();
