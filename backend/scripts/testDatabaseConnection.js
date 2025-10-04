// /backend/scripts/testDatabaseConnection.js — [Backend]
// {/* Test database connection */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDatabaseConnection() {
  console.log("🔍 Testing database connection...");
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connection successful");
    
    // Test case count
    const caseCount = await prisma.case.count();
    console.log(`📦 Cases in database: ${caseCount}`);
    
    // Test skin count
    const skinCount = await prisma.skin.count();
    console.log(`🎨 Skins in database: ${skinCount}`);
    
    // Test case-skin relationships
    const caseSkinCount = await prisma.caseSkin.count();
    console.log(`🔗 Case-skin relationships: ${caseSkinCount}`);
    
    // Test a specific case
    const testCase = await prisma.case.findFirst({
      where: { name: "CS:GO Weapon Case" },
      include: {
        _count: {
          select: { caseSkins: true }
        }
      }
    });
    
    if (testCase) {
      console.log(`✅ Test case found: ${testCase.name} with ${testCase._count.caseSkins} skins`);
    } else {
      console.log("❌ Test case not found");
    }
    
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
