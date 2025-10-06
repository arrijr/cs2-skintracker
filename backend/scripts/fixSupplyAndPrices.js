// /backend/scripts/fixSupplyAndPrices.js — [Backend]
// {/* Fix remaining supply calculation and update prices */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixSupplyAndPrices() {
  console.log("🔧 Fixing remaining supply calculation and updating prices...");
  
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
          // First entry: calculate remaining based on drops and unboxings
          remainingSupply = 1000000 - entry.dropped + entry.unboxed;
        } else {
          // Subsequent entries: calculate based on previous remaining and current changes
          const prevEntry = supplyHistory[index - 1];
          const monthlyDrops = entry.dropped - prevEntry.dropped;
          const monthlyUnboxings = entry.unboxed - prevEntry.unboxed;
          remainingSupply = Math.max(0, remainingSupply - monthlyDrops + monthlyUnboxings);
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
      
      // Update price based on case age and rarity
      let newPrice = 4.50; // Base price
      
      if (caseItem.isDiscontinued) {
        newPrice *= 1.5; // Discontinued cases are more expensive
      }
      
      // Adjust based on age
      const releaseDate = caseItem.releaseDate;
      if (releaseDate) {
        const ageInYears = (new Date().getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (ageInYears > 5) {
          newPrice *= 1.8; // Very old cases are expensive
        } else if (ageInYears > 3) {
          newPrice *= 1.3; // Old cases are more expensive
        }
      }
      
      // Special cases with known prices
      if (caseItem.name.includes("Operation Breakout")) {
        newPrice = 7.50; // User mentioned this should be $7.50
      } else if (caseItem.name.includes("CS:GO Weapon Case 2")) {
        newPrice = 1.67;
      } else if (caseItem.name.includes("Prisma Case")) {
        newPrice = 3.66;
      }
      
      // Update case price
      await prisma.case.update({
        where: { id: caseItem.id },
        data: { 
          price: newPrice,
          lastUpdated: new Date()
        }
      });
      
      console.log(`  ✅ Fixed remaining supply calculation`);
      console.log(`  💰 Updated price to $${newPrice.toFixed(2)}`);
      console.log(`  📊 Final remaining: ${remainingSupply.toLocaleString()}`);
    }
    
    console.log(`\n🎉 Fixed supply calculation and prices for all cases!`);
    
  } catch (error) {
    console.error("❌ Error fixing supply and prices:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSupplyAndPrices();
