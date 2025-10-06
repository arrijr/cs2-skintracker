// /backend/scripts/testSupplyHistoryFixDetailed.js — [Backend]
// {/* Detailed test of the fixed supply history */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testSupplyHistoryFixDetailed() {
  console.log("🧪 Detailed test of fixed supply history...");
  
  try {
    // Test all cases with supply data
    const cases = await prisma.case.findMany({
      where: {
        caseSupply: {
          some: {}
        }
      },
      include: {
        caseSupply: {
          orderBy: { date: 'asc' }
        }
      },
      orderBy: { releaseDate: 'asc' }
    });
    
    console.log(`📊 Found ${cases.length} cases with supply data\n`);
    
    // Test discontinued cases
    const discontinuedCases = cases.filter(c => c.isDiscontinued);
    console.log(`🚫 Discontinued cases with data: ${discontinuedCases.length}`);
    
    discontinuedCases.forEach(caseItem => {
      console.log(`\n📈 ${caseItem.name}:`);
      console.log(`   Release: ${caseItem.releaseDate?.toISOString().split('T')[0]}`);
      console.log(`   Discontinued: ${caseItem.discontinuedDate?.toISOString().split('T')[0]}`);
      console.log(`   Data points: ${caseItem.caseSupply.length}`);
      
      if (caseItem.caseSupply.length > 0) {
        const firstData = caseItem.caseSupply[0];
        const lastData = caseItem.caseSupply[caseItem.caseSupply.length - 1];
        
        console.log(`   Date range: ${firstData.date.toISOString().split('T')[0]} to ${lastData.date.toISOString().split('T')[0]}`);
        console.log(`   First: Drops=${firstData.dropped}, Unboxed=${firstData.unboxed}, Remaining=${firstData.remaining}`);
        console.log(`   Last: Drops=${lastData.dropped}, Unboxed=${lastData.unboxed}, Remaining=${lastData.remaining}`);
        
        // Check if discontinued logic is working
        const discontinuedDate = caseItem.discontinuedDate;
        if (discontinuedDate) {
          const afterDiscontinued = caseItem.caseSupply.filter(s => s.date >= discontinuedDate);
          const hasDropsAfterDiscontinued = afterDiscontinued.some(s => s.dropped > 0);
          
          if (afterDiscontinued.length > 0) {
            console.log(`   After discontinued: ${afterDiscontinued.length} data points`);
            console.log(`   Has drops after discontinued: ${hasDropsAfterDiscontinued ? '❌ YES (PROBLEM)' : '✅ NO (CORRECT)'}`);
          } else {
            console.log(`   No data after discontinued date (case too old)`);
          }
        }
      }
    });
    
    // Test active cases
    const activeCases = cases.filter(c => !c.isDiscontinued);
    console.log(`\n✅ Active cases with data: ${activeCases.length}`);
    
    activeCases.forEach(caseItem => {
      console.log(`\n📈 ${caseItem.name}:`);
      console.log(`   Release: ${caseItem.releaseDate?.toISOString().split('T')[0]}`);
      console.log(`   Data points: ${caseItem.caseSupply.length}`);
      
      if (caseItem.caseSupply.length > 0) {
        const lastData = caseItem.caseSupply[caseItem.caseSupply.length - 1];
        console.log(`   Latest: Drops=${lastData.dropped}, Unboxed=${lastData.unboxed}, Remaining=${lastData.remaining}`);
      }
    });
    
    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   Total cases with supply data: ${cases.length}`);
    console.log(`   Discontinued cases: ${discontinuedCases.length}`);
    console.log(`   Active cases: ${activeCases.length}`);
    
    // Check for cases that should have data but don't
    const allCases = await prisma.case.findMany();
    const casesWithoutData = allCases.filter(c => c.caseSupply.length === 0);
    console.log(`   Cases without supply data: ${casesWithoutData.length}`);
    
    if (casesWithoutData.length > 0) {
      console.log(`\n⚠️ Cases without supply data:`);
      casesWithoutData.forEach(caseItem => {
        const yearsOld = caseItem.releaseDate ? 
          Math.round(((new Date() - caseItem.releaseDate) / (1000 * 60 * 60 * 24 * 365)) * 10) / 10 : 'Unknown';
        console.log(`   ${caseItem.name} (${yearsOld}y old, ${caseItem.isDiscontinued ? 'DISCONTINUED' : 'ACTIVE'})`);
      });
    }
    
    console.log(`\n🎉 Detailed supply history test completed!`);
    
  } catch (error) {
    console.error("❌ Error in detailed test:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testSupplyHistoryFixDetailed();
