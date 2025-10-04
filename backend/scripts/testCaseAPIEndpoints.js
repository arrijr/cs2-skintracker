// /backend/scripts/testCaseAPIEndpoints.js — [Backend]
// {/* Test case API endpoints for supply data */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testCaseAPIEndpoints() {
  console.log("🔍 Testing case API endpoints for supply data...");
  
  try {
    // Test 1: Get all cases endpoint
    console.log("📦 Testing: GET /api/v1/cases");
    const allCases = await prisma.case.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        price: true,
        remaining: true,
        dropped: true,
        unboxed: true,
        marketCap: true,
        lastUpdated: true
      }
    });
    
    console.log("✅ Sample cases from API:");
    allCases.forEach((caseItem, index) => {
      console.log(`${index + 1}. ${caseItem.name}`);
      console.log(`   Price: $${caseItem.price}`);
      console.log(`   Remaining: ${caseItem.remaining}`);
      console.log(`   Dropped: ${caseItem.dropped}`);
      console.log(`   Unboxed: ${caseItem.unboxed}`);
      console.log(`   Market Cap: $${caseItem.marketCap}`);
      console.log("");
    });
    
    // Test 2: Get specific case with contained skins
    if (allCases.length > 0) {
      const testCaseId = allCases[0].id;
      console.log(`🎯 Testing: GET /api/v1/cases/${testCaseId}`);
      
      const caseWithSkins = await prisma.case.findUnique({
        where: { id: testCaseId },
        include: {
          caseSkins: {
            include: {
              skin: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  rarity: true,
                  priceLatest: true
                }
              }
            },
            take: 5
          }
        }
      });
      
      if (caseWithSkins) {
        console.log(`✅ Case: ${caseWithSkins.name}`);
        console.log(`   Supply data:`);
        console.log(`   - Remaining: ${caseWithSkins.remaining}`);
        console.log(`   - Dropped: ${caseWithSkins.dropped}`);
        console.log(`   - Unboxed: ${caseWithSkins.unboxed}`);
        console.log(`   - Market Cap: $${caseWithSkins.marketCap}`);
        console.log(`   Contained skins: ${caseWithSkins.caseSkins.length}`);
        
        if (caseWithSkins.caseSkins.length > 0) {
          console.log(`   Sample skins:`);
          caseWithSkins.caseSkins.forEach((caseSkin, index) => {
            console.log(`     ${index + 1}. ${caseSkin.skin.name} (${caseSkin.skin.rarity}) - $${caseSkin.skin.priceLatest || 'N/A'}`);
          });
        } else {
          console.log(`   ⚠️  No contained skins found!`);
        }
      }
    }
    
    // Test 3: Check if we have case-skin relationships
    console.log("\n🔗 Testing: Case-Skin relationships");
    const caseSkinCount = await prisma.caseSkin.count();
    console.log(`✅ Total case-skin relationships: ${caseSkinCount}`);
    
    if (caseSkinCount === 0) {
      console.log("❌ No case-skin relationships found! This means contained skins won't show.");
    } else {
      // Show sample relationships
      const sampleRelations = await prisma.caseSkin.findMany({
        take: 5,
        include: {
          case: { select: { name: true } },
          skin: { select: { name: true, rarity: true } }
        }
      });
      
      console.log("📋 Sample relationships:");
      sampleRelations.forEach((rel, index) => {
        console.log(`  ${index + 1}. ${rel.case.name} → ${rel.skin.name} (${rel.skin.rarity})`);
      });
    }
    
    // Test 4: Check case supply history
    console.log("\n📊 Testing: Case supply history");
    const supplyCount = await prisma.caseSupply.count();
    console.log(`✅ Total supply history records: ${supplyCount}`);
    
    if (supplyCount > 0) {
      const recentSupply = await prisma.caseSupply.findMany({
        take: 3,
        include: {
          case: { select: { name: true } }
        },
        orderBy: { date: 'desc' }
      });
      
      console.log("📈 Recent supply data:");
      recentSupply.forEach((supply, index) => {
        console.log(`  ${index + 1}. ${supply.case.name} (${supply.date.toISOString().split('T')[0]}):`);
        console.log(`     - Remaining: ${supply.remaining}`);
        console.log(`     - Dropped: ${supply.dropped}`);
        console.log(`     - Unboxed: ${supply.unboxed}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error testing case API endpoints:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCaseAPIEndpoints();
