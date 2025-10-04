// /backend/scripts/generateRealisticPriceHistory.js — [Backend]
// {/* Generate realistic historical price data for cases */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function generateRealisticPriceHistory() {
  console.log("📈 Generating realistic historical price data...");
  
  try {
    const cases = await prisma.case.findMany();
    console.log(`📦 Found ${cases.length} cases`);
    
    for (const caseItem of cases) {
      console.log(`\n🔄 Processing: ${caseItem.name}`);
      
      // Delete existing price history
      await prisma.casePriceHistory.deleteMany({
        where: { caseId: caseItem.id }
      });
      
      // Generate realistic historical data
      const releaseDate = caseItem.releaseDate || new Date('2013-08-01');
      const now = new Date();
      const daysSinceRelease = Math.floor((now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Generate data points (every 7 days for older cases, every 3 days for newer ones)
      const intervalDays = daysSinceRelease > 365 ? 7 : 3;
      const dataPoints = Math.floor(daysSinceRelease / intervalDays);
      
      if (dataPoints < 10) {
        console.log(`   ⏭️  Skipping (too new): ${caseItem.name}`);
        continue;
      }
      
      // Generate realistic price progression
      const currentPrice = caseItem.price || 1.0;
      const basePrice = currentPrice * 0.1; // Start at 10% of current price
      const priceHistory = [];
      
      for (let i = 0; i < dataPoints; i++) {
        const daysAgo = dataPoints - i;
        const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        
        // Skip if before release date
        if (date < releaseDate) continue;
        
        // Generate realistic price progression
        const progress = i / dataPoints;
        const volatility = 0.1 + (Math.random() - 0.5) * 0.2; // ±10% volatility
        const trend = Math.sin(progress * Math.PI) * 0.5 + 0.5; // S-curve trend
        const price = basePrice + (currentPrice - basePrice) * trend + volatility;
        
        // Ensure price is positive and reasonable
        const finalPrice = Math.max(0.01, price);
        const marketCap = finalPrice * (caseItem.remaining || 100000);
        
        priceHistory.push({
          caseId: caseItem.id,
          date: date,
          price: finalPrice,
          marketCap: marketCap
        });
      }
      
      // Insert price history
      if (priceHistory.length > 0) {
        await prisma.casePriceHistory.createMany({
          data: priceHistory
        });
        
        console.log(`   ✅ Generated ${priceHistory.length} data points`);
        console.log(`   📅 Range: ${priceHistory[0].date.toISOString().split('T')[0]} to ${priceHistory[priceHistory.length - 1].date.toISOString().split('T')[0]}`);
        console.log(`   💰 Price range: $${priceHistory[0].price.toFixed(2)} to $${priceHistory[priceHistory.length - 1].price.toFixed(2)}`);
      }
    }
    
    console.log(`\n🎉 Generated realistic price history for all cases!`);
    
    // Verify data
    const sampleCase = await prisma.case.findFirst({
      include: {
        casePriceHistory: {
          orderBy: { date: 'asc' }
        }
      }
    });
    
    if (sampleCase) {
      console.log(`\n📊 Sample verification - ${sampleCase.name}:`);
      console.log(`   Total entries: ${sampleCase.casePriceHistory.length}`);
      console.log(`   Date range: ${sampleCase.casePriceHistory[0]?.date.toISOString().split('T')[0]} to ${sampleCase.casePriceHistory[sampleCase.casePriceHistory.length - 1]?.date.toISOString().split('T')[0]}`);
    }
    
  } catch (error) {
    console.error("❌ Error generating price history:", error);
  } finally {
    await prisma.$disconnect();
  }
}

generateRealisticPriceHistory();
