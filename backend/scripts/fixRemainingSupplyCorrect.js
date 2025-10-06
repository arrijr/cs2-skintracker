// /backend/scripts/fixRemainingSupplyCorrect.js — [Backend]
// {/* Fix remaining supply calculation correctly */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixRemainingSupplyCorrect() {
  console.log("🔧 Fixing remaining supply calculation correctly...");
  
  try {
    const cases = await prisma.case.findMany({
      include: {
        caseSupply: {
          orderBy: { date: 'asc' }
        }
      }
    });
    
    for (const caseItem of cases) {
      console.log(`\n📊 Fixing: ${caseItem.name}`);
      
      if (caseItem.caseSupply.length === 0) {
        console.log(`  ⚠️ No supply data, skipping`);
        continue;
      }
      
      // Fix remaining supply calculation
      const supplyHistory = caseItem.caseSupply;
      let remainingSupply = 1000000; // Start with 1M cases
      
      const fixedSupplyHistory = supplyHistory.map((entry, index) => {
        if (index === 0) {
          // First entry: calculate remaining based on total drops and unboxings
          remainingSupply = 1000000 - entry.dropped + entry.unboxed;
        } else {
          // Subsequent entries: calculate based on total drops and unboxings
          remainingSupply = 1000000 - entry.dropped + entry.unboxed;
        }
        
        return {
          ...entry,
          remaining: remainingSupply
        };
      });
      
      // Update supply history in database
      for (const entry of fixedSupplyHistory) {
        await prisma.caseSupply.update({
          where: { id: entry.id },
          data: { remaining: entry.remaining }
        });
      }
      
      console.log(`  ✅ Fixed remaining supply calculation`);
      console.log(`  📊 Final remaining: ${remainingSupply.toLocaleString()}`);
    }
    
    console.log(`\n🎉 Fixed remaining supply calculation for all cases!`);
    
  } catch (error) {
    console.error("❌ Error fixing remaining supply:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixRemainingSupplyCorrect();
