// /backend/scripts/checkCaseDataStatus.js — [Backend]
// {/* Check which cases have real sales and price data */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkCaseDataStatus() {
  try {
    console.log("🔍 Checking case data status for sales and prices...\n");
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Get all cases with their latest supply and price data
    const cases = await prisma.case.findMany({
      select: {
        id: true,
        name: true,
        caseSupply: {
          take: 1,
          orderBy: { date: 'desc' },
          select: {
            date: true,
            price: true,
            soldData: true,
            offerVolume: true
          }
        },
        casePriceHistory: {
          take: 2,
          orderBy: { date: 'desc' },
          select: {
            date: true,
            price: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`📊 DATA STATUS FOR ${cases.length} CASES:`);
    console.log("=".repeat(80));
    
    let casesWithPriceData = 0;
    let casesWithSalesData = 0;
    let casesWithTodayData = 0;
    let casesWithPriceHistory = 0;
    
    cases.forEach(caseItem => {
      const latestSupply = caseItem.caseSupply[0];
      const latestPrice = caseItem.casePriceHistory[0];
      const previousPrice = caseItem.casePriceHistory[1];
      
      let status = [];
      
      // Check today's data
      if (latestSupply?.date === today) {
        status.push("✅ Today");
        casesWithTodayData++;
      } else {
        status.push("❌ No Today");
      }
      
      // Check price data
      if (latestSupply?.price && latestSupply.price > 0) {
        status.push("💰 Price");
        casesWithPriceData++;
      } else {
        status.push("❌ No Price");
      }
      
      // Check sales data
      let hasSalesData = false;
      if (latestSupply?.soldData) {
        try {
          const soldData = JSON.parse(latestSupply.soldData);
          if (soldData.sold7d || soldData.sold30d || soldData.soldTotal) {
            hasSalesData = true;
            casesWithSalesData++;
          }
        } catch (e) {
          // Invalid JSON
        }
      }
      
      if (hasSalesData) {
        status.push("📈 Sales");
      } else {
        status.push("❌ No Sales");
      }
      
      // Check price history for changes
      if (latestPrice && previousPrice && latestPrice.price && previousPrice.price) {
        status.push("📊 History");
        casesWithPriceHistory++;
      } else {
        status.push("❌ No History");
      }
      
      console.log(`${caseItem.id.toString().padStart(2)}: ${caseItem.name.padEnd(35)} ${status.join(' ')}`);
    });
    
    console.log("\n📈 SUMMARY:");
    console.log("=".repeat(50));
    console.log(`Cases with today's data: ${casesWithTodayData}/${cases.length}`);
    console.log(`Cases with price data: ${casesWithPriceData}/${cases.length}`);
    console.log(`Cases with sales data: ${casesWithSalesData}/${cases.length}`);
    console.log(`Cases with price history: ${casesWithPriceHistory}/${cases.length}`);
    
    // Show cases that need data
    const casesNeedingData = cases.filter(c => {
      const latestSupply = c.caseSupply[0];
      return !latestSupply?.soldData || latestSupply.date !== today;
    });
    
    if (casesNeedingData.length > 0) {
      console.log(`\n⚠️  CASES NEEDING DATA (${casesNeedingData.length}):`);
      console.log("-".repeat(40));
      casesNeedingData.forEach(c => {
        console.log(`${c.id}: ${c.name}`);
      });
    } else {
      console.log("\n✅ ALL CASES HAVE COMPLETE DATA!");
    }
    
  } catch (error) {
    console.error("❌ Error checking case data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCaseDataStatus();
