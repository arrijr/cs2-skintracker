// /backend/scripts/testRealData.js — [Backend]
// {/* Test real historical data in database */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testRealData() {
  console.log("🧪 Testing real historical data in database...");
  
  try {
    // Test a few cases with real data
    const testCases = [
      "CS:GO Weapon Case 2",
      "Prisma Case", 
      "Operation Breakout Weapon Case",
      "eSports 2013 Case"
    ];
    
    for (const caseName of testCases) {
      console.log(`\n📊 Testing: ${caseName}`);
      
      const caseItem = await prisma.case.findUnique({
        where: { name: caseName },
        include: {
          caseSupply: {
            orderBy: { date: 'asc' },
            take: 5
          }
        }
      });
      
      if (caseItem) {
        console.log(`  ✅ Found case with ${caseItem.caseSupply.length} supply data points`);
        console.log(`  💰 Current price: $${caseItem.price?.toFixed(2) || 'N/A'}`);
        console.log(`  📅 Release date: ${caseItem.releaseDate?.toISOString().split('T')[0] || 'N/A'}`);
        console.log(`  🚫 Discontinued: ${caseItem.isDiscontinued ? 'Yes' : 'No'}`);
        
        if (caseItem.caseSupply.length > 0) {
          console.log(`  📈 Sample supply data:`);
          caseItem.caseSupply.forEach((entry, index) => {
            console.log(`    ${index + 1}. ${entry.date.toISOString().split('T')[0]}: Drops=${entry.dropped}, Unboxed=${entry.unboxed}, Remaining=${entry.remaining}`);
          });
        }
      } else {
        console.log(`  ❌ Case not found`);
      }
    }
    
    // Test overall statistics
    const totalCases = await prisma.case.count();
    const casesWithSupply = await prisma.case.count({
      where: {
        caseSupply: {
          some: {}
        }
      }
    });
    
    const totalSupplyEntries = await prisma.caseSupply.count();
    
    console.log(`\n📊 Overall Statistics:`);
    console.log(`  Total cases: ${totalCases}`);
    console.log(`  Cases with supply data: ${casesWithSupply}`);
    console.log(`  Total supply entries: ${totalSupplyEntries}`);
    
  } catch (error) {
    console.error("❌ Error testing real data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testRealData();
