// /backend/scripts/testCaseAPI.js — [Backend]
// {/* Test case API endpoints */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testCaseAPI() {
  console.log("🔍 Testing case API endpoints...");
  
  try {
    // Test 1: Get all cases
    console.log("📦 Testing: GET /api/v1/cases");
    const cases = await prisma.case.findMany({
      take: 5,
      orderBy: { price: 'desc' }
    });
    
    console.log("✅ Top 5 most expensive cases:");
    cases.forEach((caseItem, index) => {
      console.log(`${index + 1}. ${caseItem.name}`);
      console.log(`   Price: $${caseItem.price}`);
      console.log(`   Market Cap: $${caseItem.marketCap}`);
      console.log(`   Image: ${caseItem.imageUrl?.substring(0, 60)}...`);
      console.log(`   Price Change 24h: ${caseItem.priceChange24h}%`);
      console.log("");
    });
    
    // Test 2: Get specific case by ID
    if (cases.length > 0) {
      const testCaseId = cases[0].id;
      console.log(`🎯 Testing: GET /api/v1/cases/${testCaseId}`);
      
      const specificCase = await prisma.case.findUnique({
        where: { id: testCaseId },
        include: {
          caseSkins: {
            include: {
              skin: {
                select: {
                  id: true,
                  name: true,
                  imageUrl: true,
                  rarity: true
                }
              }
            },
            take: 3
          }
        }
      });
      
      if (specificCase) {
        console.log(`✅ Found case: ${specificCase.name}`);
        console.log(`   Price: $${specificCase.price}`);
        console.log(`   Skins count: ${specificCase.caseSkins.length}`);
        console.log(`   Sample skins:`);
        specificCase.caseSkins.forEach(skin => {
          console.log(`     - ${skin.skin.name} (${skin.skin.rarity})`);
        });
      }
    }
    
    // Test 3: Search cases
    console.log("\n🔍 Testing: Search for 'operation' cases");
    const searchResults = await prisma.case.findMany({
      where: {
        name: {
          contains: 'operation',
          mode: 'insensitive'
        }
      },
      take: 3
    });
    
    console.log(`✅ Found ${searchResults.length} operation cases:`);
    searchResults.forEach(caseItem => {
      console.log(`   - ${caseItem.name}: $${caseItem.price}`);
    });
    
  } catch (error) {
    console.error("❌ Error testing case API:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testCaseAPI();
