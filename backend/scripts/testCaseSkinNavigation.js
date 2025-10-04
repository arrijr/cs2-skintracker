// /backend/scripts/testCaseSkinNavigation.js — [Backend]
// {/* Test case-skin navigation and API endpoints */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testCaseSkinNavigation() {
  console.log("🔍 Testing case-skin navigation and API endpoints...");
  
  try {
    // Get a case with contained skins
    const caseWithSkins = await prisma.case.findFirst({
      where: {
        caseSkins: {
          some: {}
        }
      },
      include: {
        caseSkins: {
          include: {
            skin: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                rarity: true,
                priceLatest: true,
                weaponType: true
              }
            }
          },
          take: 5
        }
      }
    });
    
    if (!caseWithSkins) {
      console.log("❌ No case with contained skins found!");
      return;
    }
    
    console.log(`📦 Testing Case: ${caseWithSkins.name} (ID: ${caseWithSkins.id})`);
    console.log(`🔗 Contained Skins: ${caseWithSkins.caseSkins.length}`);
    console.log("");
    
    // Test each contained skin
    for (const caseSkin of caseWithSkins.caseSkins) {
      console.log(`🎯 Testing Skin: ${caseSkin.skin.name} (ID: ${caseSkin.skin.id})`);
      console.log(`   Rarity: ${caseSkin.rarity}`);
      console.log(`   Weapon Type: ${caseSkin.skin.weaponType || 'N/A'}`);
      console.log(`   Price: $${caseSkin.skin.priceLatest || 'N/A'}`);
      console.log(`   Image: ${caseSkin.skin.imageUrl ? 'Available' : 'Missing'}`);
      console.log(`   Navigation URL: /skins/${caseSkin.skin.id}`);
      
      // Check if skin exists in database
      const skinExists = await prisma.skin.findUnique({
        where: { id: caseSkin.skin.id },
        select: { id: true, name: true, priceLatest: true }
      });
      
      if (skinExists) {
        console.log(`   ✅ Skin exists in database`);
        console.log(`   ✅ Current price: $${skinExists.priceLatest || 'N/A'}`);
      } else {
        console.log(`   ❌ Skin NOT found in database!`);
      }
      
      console.log("");
    }
    
    // Test API endpoint for case details
    console.log(`🌐 Testing API: GET /api/v1/cases/${caseWithSkins.id}`);
    
    // Simulate the API call by fetching the same data
    const apiCaseData = await prisma.case.findUnique({
      where: { id: caseWithSkins.id },
      include: {
        caseSkins: {
          include: {
            skin: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                rarity: true,
                priceLatest: true,
                weaponType: true
              }
            }
          }
        }
      }
    });
    
    if (apiCaseData) {
      console.log(`✅ API would return:`);
      console.log(`   - Case Name: ${apiCaseData.name}`);
      console.log(`   - Case Price: $${apiCaseData.price}`);
      console.log(`   - Contained Skins: ${apiCaseData.caseSkins.length}`);
      console.log(`   - Supply Data: Remaining ${apiCaseData.remaining}, Dropped ${apiCaseData.dropped}, Unboxed ${apiCaseData.unboxed}`);
    }
    
    // Test skin API endpoint
    if (caseWithSkins.caseSkins.length > 0) {
      const testSkinId = caseWithSkins.caseSkins[0].skin.id;
      console.log(`\n🌐 Testing API: GET /api/v1/skins/${testSkinId}`);
      
      const skinData = await prisma.skin.findUnique({
        where: { id: testSkinId },
        select: {
          id: true,
          name: true,
          priceLatest: true,
          imageUrl: true,
          rarity: true,
          weaponType: true
        }
      });
      
      if (skinData) {
        console.log(`✅ Skin API would return:`);
        console.log(`   - Skin Name: ${skinData.name}`);
        console.log(`   - Skin Price: $${skinData.priceLatest || 'N/A'}`);
        console.log(`   - Skin Image: ${skinData.imageUrl ? 'Available' : 'Missing'}`);
        console.log(`   - Skin Rarity: ${skinData.rarity || 'N/A'}`);
        console.log(`   - Weapon Type: ${skinData.weaponType || 'N/A'}`);
      } else {
        console.log(`❌ Skin API would return 404 - Skin not found`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error testing case-skin navigation:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCaseSkinNavigation();
