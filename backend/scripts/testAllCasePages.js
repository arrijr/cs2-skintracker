// /backend/scripts/testAllCasePages.js — [Backend]
// {/* Test all case pages for functionality */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testAllCasePages() {
  console.log("🔍 Testing all case pages for functionality...");
  
  try {
    // Get all cases
    const allCases = await prisma.case.findMany({
      orderBy: { name: 'asc' }
    });
    
    console.log(`📦 Testing ${allCases.length} cases:`);
    console.log("");
    
    let casesWithSkins = 0;
    let casesWithoutSkins = 0;
    let totalSkins = 0;
    
    for (const [index, caseItem] of allCases.entries()) {
      console.log(`${index + 1}. ${caseItem.name} (ID: ${caseItem.id})`);
      console.log(`   Price: $${caseItem.price}`);
      console.log(`   Supply: Remaining ${caseItem.remaining}, Dropped ${caseItem.dropped}, Unboxed ${caseItem.unboxed}`);
      console.log(`   Market Cap: $${caseItem.marketCap}`);
      console.log(`   Image: ${caseItem.imageUrl ? 'Available' : 'Missing'}`);
      
      // Check contained skins
      const caseWithSkins = await prisma.case.findUnique({
        where: { id: caseItem.id },
        include: {
          caseSkins: {
            include: {
              skin: {
                select: {
                  id: true,
                  name: true,
                  priceLatest: true,
                  imageUrl: true,
                  rarity: true
                }
              }
            }
          }
        }
      });
      
      if (caseWithSkins && caseWithSkins.caseSkins.length > 0) {
        console.log(`   ✅ Contained Skins: ${caseWithSkins.caseSkins.length}`);
        casesWithSkins++;
        totalSkins += caseWithSkins.caseSkins.length;
        
        // Show sample skins
        const sampleSkins = caseWithSkins.caseSkins.slice(0, 3);
        sampleSkins.forEach((caseSkin, skinIndex) => {
          console.log(`      ${skinIndex + 1}. ${caseSkin.skin.name} (${caseSkin.rarity}) - $${caseSkin.skin.priceLatest || 'N/A'}`);
        });
        
        if (caseWithSkins.caseSkins.length > 3) {
          console.log(`      ... and ${caseWithSkins.caseSkins.length - 3} more`);
        }
      } else {
        console.log(`   ⚠️  No contained skins`);
        casesWithoutSkins++;
      }
      
      console.log(`   🌐 Frontend URL: /cases/${caseItem.id}`);
      console.log("");
    }
    
    console.log(`📊 Summary:`);
    console.log(`✅ Total Cases: ${allCases.length}`);
    console.log(`✅ Cases with Skins: ${casesWithSkins}`);
    console.log(`⚠️  Cases without Skins: ${casesWithoutSkins}`);
    console.log(`✅ Total Contained Skins: ${totalSkins}`);
    console.log(`✅ Average Skins per Case: ${casesWithSkins > 0 ? (totalSkins / casesWithSkins).toFixed(1) : 0}`);
    
    // Test specific cases that should have skins
    const importantCases = [
      "Operation Bravo Case",
      "CS:GO Weapon Case", 
      "eSports 2013 Case",
      "Prisma Case",
      "Shattered Web Case"
    ];
    
    console.log(`\n🎯 Testing important cases:`);
    for (const caseName of importantCases) {
      const caseItem = allCases.find(c => c.name === caseName);
      if (caseItem) {
        const caseWithSkins = await prisma.case.findUnique({
          where: { id: caseItem.id },
          include: {
            caseSkins: {
              include: {
                skin: {
                  select: {
                    id: true,
                    name: true,
                    priceLatest: true,
                    rarity: true
                  }
                }
              }
            }
          }
        });
        
        if (caseWithSkins) {
          console.log(`✅ ${caseName}: ${caseWithSkins.caseSkins.length} skins`);
          if (caseWithSkins.caseSkins.length > 0) {
            const sampleSkin = caseWithSkins.caseSkins[0];
            console.log(`   Sample: ${sampleSkin.skin.name} (${sampleSkin.rarity}) - $${sampleSkin.skin.priceLatest || 'N/A'}`);
            console.log(`   Navigation: /skins/${sampleSkin.skin.id}`);
          }
        }
      } else {
        console.log(`❌ ${caseName}: Not found`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error testing case pages:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAllCasePages();
