// /backend/scripts/fixCaseDataInconsistencies.js — [Backend]
// {/* Fix case data inconsistencies */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixCaseDataInconsistencies() {
  console.log("🔧 Fixing case data inconsistencies...");
  
  try {
    // Get all cases
    const cases = await prisma.case.findMany({
      include: {
        casePriceHistory: {
          orderBy: { date: 'desc' },
          take: 1
        },
        caseSupply: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });
    
    console.log(`📦 Processing ${cases.length} cases...`);
    
    let fixedCount = 0;
    
    for (const caseItem of cases) {
      let needsUpdate = false;
      const updateData = {};
      
      // Fix price inconsistencies
      if (caseItem.casePriceHistory.length > 0) {
        const latestPrice = caseItem.casePriceHistory[0].price;
        const currentPrice = caseItem.price;
        
        if (Math.abs(latestPrice - currentPrice) > 0.01) {
          console.log(`🔧 ${caseItem.name}: Updating price from $${currentPrice} to $${latestPrice}`);
          updateData.price = latestPrice;
          needsUpdate = true;
        }
      }
      
      // Fix supply inconsistencies
      if (caseItem.caseSupply.length > 0) {
        const latestSupply = caseItem.caseSupply[0];
        const currentRemaining = caseItem.remaining;
        
        if (latestSupply.remaining !== currentRemaining) {
          console.log(`🔧 ${caseItem.name}: Updating remaining from ${currentRemaining} to ${latestSupply.remaining}`);
          updateData.remaining = latestSupply.remaining;
          updateData.dropped = latestSupply.dropped;
          updateData.unboxed = latestSupply.unboxed;
          needsUpdate = true;
        }
      }
      
      // Fix discontinued logic
      if (caseItem.isDiscontinued && !caseItem.discontinuedDate) {
        // Set discontinued date to a reasonable date (e.g., 1 year after release)
        const releaseDate = new Date(caseItem.releaseDate);
        const discontinuedDate = new Date(releaseDate);
        discontinuedDate.setFullYear(discontinuedDate.getFullYear() + 1);
        
        console.log(`🔧 ${caseItem.name}: Setting discontinued date to ${discontinuedDate.toISOString().split('T')[0]}`);
        updateData.discontinuedDate = discontinuedDate;
        needsUpdate = true;
      }
      
      // Update market cap based on current price and remaining supply
      if (updateData.price || updateData.remaining) {
        const newPrice = updateData.price || caseItem.price;
        const newRemaining = updateData.remaining || caseItem.remaining;
        
        if (newPrice && newRemaining) {
          const newMarketCap = newPrice * newRemaining;
          console.log(`🔧 ${caseItem.name}: Updating market cap to $${newMarketCap.toFixed(2)}`);
          updateData.marketCap = newMarketCap;
        }
      }
      
      if (needsUpdate) {
        await prisma.case.update({
          where: { id: caseItem.id },
          data: updateData
        });
        fixedCount++;
      }
    }
    
    console.log(`\n🎉 Fixed ${fixedCount} cases`);
    
    // Verify CS:GO Weapon Case specifically
    const csgoCase = await prisma.case.findUnique({
      where: { id: 2 },
      include: {
        casePriceHistory: {
          orderBy: { date: 'desc' },
          take: 1
        },
        caseSupply: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });
    
    if (csgoCase) {
      console.log(`\n✅ CS:GO Weapon Case verification:`);
      console.log(`   Price: $${csgoCase.price}`);
      console.log(`   Market Cap: $${csgoCase.marketCap}`);
      console.log(`   Remaining: ${csgoCase.remaining}`);
      console.log(`   Is Discontinued: ${csgoCase.isDiscontinued}`);
      console.log(`   Discontinued Date: ${csgoCase.discontinuedDate?.toISOString().split('T')[0] || 'N/A'}`);
      
      if (csgoCase.casePriceHistory.length > 0) {
        const latestPrice = csgoCase.casePriceHistory[0].price;
        console.log(`   Latest History Price: $${latestPrice}`);
        console.log(`   Price Match: ${Math.abs(latestPrice - csgoCase.price) < 0.01 ? '✅' : '❌'}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error fixing case data inconsistencies:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCaseDataInconsistencies();
