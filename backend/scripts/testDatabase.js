// /backend/scripts/testDatabase.js — [Backend]
// {/* Test database connection */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testDatabase() {
  try {
    console.log("🔍 Testing database connection...");
    
    // Test basic connection
    await prisma.$connect();
    console.log("✅ Database connected");
    
    // Test skin count
    const skinCount = await prisma.skin.count();
    console.log(`📊 Total skins in database: ${skinCount}`);
    
    // Test distinct item groups
    const itemGroups = await prisma.skin.findMany({
      select: { itemGroup: true },
      distinct: ['itemGroup'],
      where: { 
        itemGroup: { not: null },
        itemGroup: { not: '' }
      },
      take: 10
    });
    
    console.log(`📦 Sample item groups (first 10):`);
    itemGroups.forEach((item, index) => {
      console.log(`${index + 1}. ${item.itemGroup}`);
    });
    
    // Test case count
    const caseCount = await prisma.case.count();
    console.log(`🎲 Total cases in database: ${caseCount}`);
    
  } catch (error) {
    console.error("❌ Database error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();
