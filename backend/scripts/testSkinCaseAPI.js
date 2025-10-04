// /backend/scripts/testSkinCaseAPI.js — [Backend]
// {/* Test skin case API for breadcrumbs */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testSkinCaseAPI() {
  console.log("🔍 Testing skin case API for breadcrumbs...");
  
  try {
    // Get a skin that has case relationships
    const skinWithCase = await prisma.skin.findFirst({
      where: {
        caseSkins: {
          some: {}
        }
      },
      include: {
        caseSkins: {
          include: {
            case: {
              select: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          }
        }
      }
    });
    
    if (!skinWithCase) {
      console.log("❌ No skin with case relationships found");
      return;
    }
    
    console.log(`📦 Testing with skin: ${skinWithCase.name} (ID: ${skinWithCase.id})`);
    console.log(`🔗 Found ${skinWithCase.caseSkins.length} case relationships:`);
    
    skinWithCase.caseSkins.forEach((cs, index) => {
      console.log(`  ${index + 1}. Case: ${cs.case.name} (ID: ${cs.case.id})`);
    });
    
    // Test the API endpoint
    const apiUrl = `http://localhost:3001/api/v1/skins/${skinWithCase.id}/case-breadcrumb`;
    console.log(`\n🌐 Testing API: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      console.log("✅ API Response:");
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(`❌ API Error: ${response.status} - ${await response.text()}`);
    }
    
  } catch (error) {
    console.error("❌ Error testing skin case API:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSkinCaseAPI();
