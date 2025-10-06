// /backend/scripts/debugOperationBreakout.js — [Backend]
// {/* Debug Operation Breakout Weapon Case data */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugOperationBreakout() {
  console.log("🔍 Debugging Operation Breakout Weapon Case data...");
  
  try {
    const caseItem = await prisma.case.findUnique({
      where: { name: "Operation Breakout Weapon Case" },
      include: {
        caseSupply: {
          orderBy: { date: 'asc' }
        }
      }
    });
    
    if (caseItem) {
      console.log(`\n📊 Case: ${caseItem.name}`);
      console.log(`💰 Current price: $${caseItem.price?.toFixed(2) || 'N/A'}`);
      console.log(`📅 Release date: ${caseItem.releaseDate?.toISOString().split('T')[0] || 'N/A'}`);
      console.log(`🚫 Discontinued: ${caseItem.isDiscontinued ? 'Yes' : 'No'}`);
      console.log(`📅 Discontinued date: ${caseItem.discontinuedDate?.toISOString().split('T')[0] || 'N/A'}`);
      console.log(`📈 Total supply data points: ${caseItem.caseSupply.length}`);
      
      if (caseItem.caseSupply.length > 0) {
        console.log(`\n📈 First 10 supply entries:`);
        caseItem.caseSupply.slice(0, 10).forEach((entry, index) => {
          console.log(`  ${index + 1}. ${entry.date.toISOString().split('T')[0]}: Drops=${entry.dropped}, Unboxed=${entry.unboxed}, Remaining=${entry.remaining}`);
        });
        
        console.log(`\n📈 Last 10 supply entries:`);
        caseItem.caseSupply.slice(-10).forEach((entry, index) => {
          console.log(`  ${index + 1}. ${entry.date.toISOString().split('T')[0]}: Drops=${entry.dropped}, Unboxed=${entry.unboxed}, Remaining=${entry.remaining}`);
        });
        
        // Check if drops are increasing (which shouldn't happen for discontinued cases)
        const drops = caseItem.caseSupply.map(s => s.dropped);
        const isIncreasing = drops.every((drop, i) => i === 0 || drop >= drops[i-1]);
        console.log(`\n🔍 Analysis:`);
        console.log(`  Drops increasing over time: ${isIncreasing ? 'YES (PROBLEM!)' : 'No'}`);
        console.log(`  First drop count: ${drops[0]}`);
        console.log(`  Last drop count: ${drops[drops.length - 1]}`);
        console.log(`  Max drop count: ${Math.max(...drops)}`);
        console.log(`  Min drop count: ${Math.min(...drops)}`);
        
        // Check remaining supply consistency
        const remaining = caseItem.caseSupply.map(s => s.remaining);
        const isRemainingConsistent = remaining.every((rem, i) => i === 0 || rem <= remaining[i-1]);
        console.log(`  Remaining supply decreasing: ${isRemainingConsistent ? 'Yes' : 'No (PROBLEM!)'}`);
        console.log(`  First remaining: ${remaining[0]}`);
        console.log(`  Last remaining: ${remaining[remaining.length - 1]}`);
      }
    } else {
      console.log(`❌ Case not found`);
    }
    
  } catch (error) {
    console.error("❌ Error debugging Operation Breakout:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugOperationBreakout();
