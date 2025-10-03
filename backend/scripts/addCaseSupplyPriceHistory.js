// /backend/scripts/addCaseSupplyPriceHistory.js — [Backend]
// {/* Add supply and price history data for cases */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addCaseSupplyPriceHistory() {
  console.log("📊 Adding supply and price history for cases...");
  
  try {
    const cases = await prisma.case.findMany();
    console.log(`📦 Found ${cases.length} cases`);
    
    for (const caseItem of cases) {
      console.log(`📈 Adding history for: ${caseItem.name}`);
      
      // Generate 30 days of supply data
      const supplyData = [];
      const priceData = [];
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Generate realistic supply data (decreasing over time)
        const baseSupply = caseItem.remaining || 1000000;
        const dailyDecrease = Math.floor(Math.random() * 1000) + 100; // 100-1100 per day
        const currentSupply = Math.max(baseSupply - (dailyDecrease * (30 - i)), 10000);
        
        // Generate realistic price data (fluctuating around base price)
        const basePrice = caseItem.price || 2.50;
        const dailyChange = (Math.random() - 0.5) * 0.2; // ±10% daily change
        const currentPrice = Math.max(basePrice * (1 + dailyChange), 0.01);
        
        supplyData.push({
          caseId: caseItem.id,
          date: date,
          remaining: currentSupply,
          dropped: caseItem.dropped || currentSupply + Math.floor(Math.random() * 5000000),
          unboxed: (caseItem.dropped || currentSupply + Math.floor(Math.random() * 5000000)) - currentSupply
        });
        
        priceData.push({
          caseId: caseItem.id,
          date: date,
          price: currentPrice,
          marketCap: currentPrice * currentSupply,
          remaining: currentSupply
        });
      }
      
      // Insert supply data
      await prisma.caseSupply.createMany({
        data: supplyData,
        skipDuplicates: true
      });
      
      // Insert price data
      await prisma.casePriceHistory.createMany({
        data: priceData,
        skipDuplicates: true
      });
      
      console.log(`✅ Added 30 days of history for: ${caseItem.name}`);
    }
    
    console.log("🎉 Case supply and price history added!");
    
  } catch (error) {
    console.error("❌ Error adding case history:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addCaseSupplyPriceHistory();
