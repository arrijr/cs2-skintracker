// /backend/scripts/testSupplyHistoryFix.js — [Backend]
// {/* Test the fixed supply history for discontinued cases */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testSupplyHistoryFix() {
  console.log("🧪 Testing fixed supply history for discontinued cases...");
  
  try {
    // Test Operation Breakout Case specifically
    const breakoutCase = await prisma.case.findFirst({
      where: { name: "Operation Breakout Weapon Case" },
      include: {
        caseSupply: {
          orderBy: { date: 'asc' }
        }
      }
    });
    
    if (!breakoutCase) {
      console.log("❌ Operation Breakout Case not found");
      return;
    }
    
    console.log(`\n📊 Testing: ${breakoutCase.name}`);
    console.log(`   Status: ${breakoutCase.isDiscontinued ? 'DISCONTINUED' : 'ACTIVE'}`);
    console.log(`   Release: ${breakoutCase.releaseDate?.toISOString().split('T')[0]}`);
    console.log(`   Discontinued: ${breakoutCase.discontinuedDate?.toISOString().split('T')[0]}`);
    console.log(`   Supply data points: ${breakoutCase.caseSupply.length}`);
    
    if (breakoutCase.caseSupply.length > 0) {
      console.log(`\n📈 Supply History Analysis:`);
      console.log(`   Date Range: ${breakoutCase.caseSupply[0].date.toISOString().split('T')[0]} to ${breakoutCase.caseSupply[breakoutCase.caseSupply.length - 1].date.toISOString().split('T')[0]}`);
      
      // Check for discontinued behavior
      const discontinuedDate = breakoutCase.discontinuedDate;
      const beforeDiscontinued = breakoutCase.caseSupply.filter(s => s.date < discontinuedDate);
      const afterDiscontinued = breakoutCase.caseSupply.filter(s => s.date >= discontinuedDate);
      
      console.log(`   Before discontinued: ${beforeDiscontinued.length} data points`);
      console.log(`   After discontinued: ${afterDiscontinued.length} data points`);
      
      if (beforeDiscontinued.length > 0) {
        const avgDropsBefore = beforeDiscontinued.reduce((sum, s) => sum + s.dropped, 0) / beforeDiscontinued.length;
        console.log(`   Avg drops before discontinued: ${Math.round(avgDropsBefore)}`);
      }
      
      if (afterDiscontinued.length > 0) {
        const avgDropsAfter = afterDiscontinued.reduce((sum, s) => sum + s.dropped, 0) / afterDiscontinued.length;
        const avgUnboxingsAfter = afterDiscontinued.reduce((sum, s) => sum + s.unboxed, 0) / afterDiscontinued.length;
        console.log(`   Avg drops after discontinued: ${Math.round(avgDropsAfter)}`);
        console.log(`   Avg unboxings after discontinued: ${Math.round(avgUnboxingsAfter)}`);
        
        if (avgDropsAfter === 0) {
          console.log(`   ✅ CORRECT: No drops after discontinued date`);
        } else {
          console.log(`   ❌ PROBLEM: Still showing drops after discontinued date`);
        }
      }
      
      // Show sample data
      console.log(`\n📋 Sample Data (last 5 entries):`);
      breakoutCase.caseSupply.slice(-5).forEach(s => {
        const isAfterDiscontinued = discontinuedDate && s.date >= discontinuedDate;
        console.log(`   ${s.date.toISOString().split('T')[0]}: Drops=${s.dropped}, Unboxed=${s.unboxed}, Remaining=${s.remaining} ${isAfterDiscontinued ? '(AFTER DISCONTINUED)' : ''}`);
      });
    }
    
    // Test a few more discontinued cases
    console.log(`\n🔍 Testing other discontinued cases...`);
    const otherDiscontinuedCases = await prisma.case.findMany({
      where: { 
        isDiscontinued: true,
        name: { not: "Operation Breakout Weapon Case" }
      },
      include: {
        caseSupply: {
          orderBy: { date: 'desc' },
          take: 3
        }
      },
      take: 3
    });
    
    otherDiscontinuedCases.forEach(caseItem => {
      const latestSupply = caseItem.caseSupply[0];
      if (latestSupply) {
        const isAfterDiscontinued = caseItem.discontinuedDate && latestSupply.date >= caseItem.discontinuedDate;
        console.log(`   ${caseItem.name}: Latest drops=${latestSupply.dropped}, unboxed=${latestSupply.unboxed} ${isAfterDiscontinued ? '(AFTER DISCONTINUED)' : ''}`);
      }
    });
    
    console.log(`\n🎉 Supply history fix test completed!`);
    
  } catch (error) {
    console.error("❌ Error testing supply history fix:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSupplyHistoryFix();
