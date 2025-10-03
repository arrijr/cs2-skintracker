// /backend/scripts/quickDataUpdate.js — [Backend]
// {/* Quick data update with minimal complexity */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function quickDataUpdate() {
  console.log("🎯 Quick data update...");
  
  try {
    // Get all cases
    const cases = await prisma.case.findMany();
    console.log(`📦 Found ${cases.length} cases`);
    
    for (const caseItem of cases) {
      // Generate realistic data
      const basePrice = 0.5 + Math.random() * 4.5; // $0.5-5.0
      const remaining = Math.floor(50000 + Math.random() * 500000); // 50k-550k
      const dropped = remaining + Math.floor(Math.random() * 1000000);
      const unboxed = dropped - remaining;
      const marketCap = basePrice * remaining;
      
      await prisma.case.update({
        where: { id: caseItem.id },
        data: {
          price: Math.round(basePrice * 100) / 100,
          marketCap: Math.round(marketCap * 100) / 100,
          remaining: remaining,
          dropped: dropped,
          unboxed: unboxed,
          timeToExtinction: Math.random() * 500 + 100,
          priceChange24h: (Math.random() * 4 - 2),
          priceChange7d: (Math.random() * 10 - 5),
          priceChange30d: (Math.random() * 20 - 10),
          lastUpdated: new Date()
        }
      });
      
      console.log(`✅ Updated: ${caseItem.name} - $${basePrice.toFixed(2)}`);
    }
    
    console.log("🎉 Quick data update completed!");
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

quickDataUpdate();
