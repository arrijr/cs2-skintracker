// /backend/scripts/checkCases.js — [Backend]
// {/* Check current case data in database */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkCases() {
  console.log("🔍 Checking case data in database...");
  
  try {
    const cases = await prisma.case.findMany({
      take: 10,
      orderBy: { id: 'asc' }
    });
    
    console.log(`📦 Found ${cases.length} cases (showing first 10):`);
    console.log("");
    
    cases.forEach((c, index) => {
      console.log(`${index + 1}. ${c.name}`);
      console.log(`   Price: $${c.price}`);
      console.log(`   Image: ${c.imageUrl?.substring(0, 60)}...`);
      console.log(`   Market Cap: $${c.marketCap}`);
      console.log(`   Last Updated: ${c.lastUpdated}`);
      console.log("");
    });
    
    // Check total count
    const totalCases = await prisma.case.count();
    console.log(`📊 Total cases in database: ${totalCases}`);
    
  } catch (error) {
    console.error("❌ Error checking cases:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCases();
