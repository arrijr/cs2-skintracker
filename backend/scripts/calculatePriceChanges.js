// /backend/scripts/calculatePriceChanges.js — [Backend]
// {/* Calculate price changes for all cases based on price history */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function calculatePriceChanges() {
  try {
    console.log("🔄 Calculating price changes for all cases...\n");
    
    const cases = await prisma.case.findMany({
      select: { 
        id: true, 
        name: true,
        casePriceHistory: {
          orderBy: { date: 'desc' },
          take: 31, // Last 31 days
          select: { date: true, price: true }
        }
      }
    });
    
    console.log(`📊 Processing ${cases.length} cases...\n`);
    
    let updatedCount = 0;
    
    for (const caseItem of cases) {
      if (caseItem.casePriceHistory.length === 0) {
        console.log(`  ⏭️ Skipping ${caseItem.name} - no price history`);
        continue;
      }
      
      const priceHistory = caseItem.casePriceHistory;
      const currentPrice = priceHistory[0]?.price;
      
      if (!currentPrice) {
        console.log(`  ⏭️ Skipping ${caseItem.name} - no current price`);
        continue;
      }
      
      // Calculate price changes
      let priceChange24h = 0;
      let priceChange7d = 0;
      let priceChange30d = 0;
      
      // 24h change
      if (priceHistory.length > 1) {
        const price24h = priceHistory[1]?.price;
        if (price24h && price24h > 0) {
          priceChange24h = ((currentPrice - price24h) / price24h) * 100;
        }
      }
      
      // 7d change
      if (priceHistory.length > 7) {
        const price7d = priceHistory[7]?.price;
        if (price7d && price7d > 0) {
          priceChange7d = ((currentPrice - price7d) / price7d) * 100;
        }
      }
      
      // 30d change
      if (priceHistory.length > 30) {
        const price30d = priceHistory[30]?.price;
        if (price30d && price30d > 0) {
          priceChange30d = ((currentPrice - price30d) / price30d) * 100;
        }
      }
      
      // Update case with price changes
      await prisma.case.update({
        where: { id: caseItem.id },
        data: {
          priceChange24h: Math.round(priceChange24h * 100) / 100, // Round to 2 decimal places
          priceChange7d: Math.round(priceChange7d * 100) / 100,
          priceChange30d: Math.round(priceChange30d * 100) / 100
        }
      });
      
      console.log(`  ✅ ${caseItem.name}: 24h: ${priceChange24h.toFixed(2)}%, 7d: ${priceChange7d.toFixed(2)}%, 30d: ${priceChange30d.toFixed(2)}%`);
      updatedCount++;
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Price changes calculated!");
    console.log(`📊 Cases updated: ${updatedCount}`);
    console.log("=".repeat(60));
    
    // Show some examples
    console.log("\n📋 Sample price changes:");
    const sampleCases = await prisma.case.findMany({
      take: 5,
      select: { name: true, priceChange24h: true, priceChange7d: true, priceChange30d: true }
    });
    
    sampleCases.forEach(caseItem => {
      console.log(`  ${caseItem.name}:`);
      console.log(`    24h: ${caseItem.priceChange24h?.toFixed(2) || 'N/A'}%`);
      console.log(`    7d: ${caseItem.priceChange7d?.toFixed(2) || 'N/A'}%`);
      console.log(`    30d: ${caseItem.priceChange30d?.toFixed(2) || 'N/A'}%`);
    });
    
  } catch (error) {
    console.error("❌ Error calculating price changes:", error);
  } finally {
    await prisma.$disconnect();
  }
}

calculatePriceChanges();
