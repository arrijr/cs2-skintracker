// /backend/scripts/checkPriceHistoryData.js — [Backend]
// {/* Check if we have enough price history data for different time ranges */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPriceHistoryData() {
  console.log("🔍 Checking price history data availability...");
  
  try {
    // Get all cases with their price history
    const cases = await prisma.case.findMany({
      include: {
        casePriceHistory: {
          orderBy: { date: 'asc' }
        }
      }
    });
    
    console.log(`📦 Found ${cases.length} cases`);
    
    // Check data availability for different time ranges
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const oneYearAgo = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
    
    let casesWith30dData = 0;
    let casesWith1yData = 0;
    let casesWithAllData = 0;
    
    cases.forEach(caseItem => {
      const history = caseItem.casePriceHistory;
      
      if (history.length > 0) {
        const oldestDate = new Date(history[0].date);
        const newestDate = new Date(history[history.length - 1].date);
        
        // Check 30d data
        const has30dData = history.some(h => new Date(h.date) >= thirtyDaysAgo);
        if (has30dData) casesWith30dData++;
        
        // Check 1y data
        const has1yData = history.some(h => new Date(h.date) >= oneYearAgo);
        if (has1yData) casesWith1yData++;
        
        // Check all data
        if (history.length > 0) casesWithAllData++;
        
        // Show sample for first case
        if (caseItem.id === cases[0].id) {
          console.log(`\n📊 Sample case: ${caseItem.name}`);
          console.log(`   Total history entries: ${history.length}`);
          console.log(`   Oldest date: ${oldestDate.toISOString().split('T')[0]}`);
          console.log(`   Newest date: ${newestDate.toISOString().split('T')[0]}`);
          console.log(`   Has 30d data: ${has30dData ? '✅' : '❌'}`);
          console.log(`   Has 1y data: ${has1yData ? '✅' : '❌'}`);
          
          // Show sample data points
          console.log("   Sample data points:");
          history.slice(0, 5).forEach((h, index) => {
            console.log(`     ${index + 1}. ${h.date.toISOString().split('T')[0]}: $${h.price}`);
          });
        }
      }
    });
    
    console.log(`\n📈 Data availability summary:`);
    console.log(`   Cases with any data: ${casesWithAllData}/${cases.length}`);
    console.log(`   Cases with 30d data: ${casesWith30dData}/${cases.length}`);
    console.log(`   Cases with 1y data: ${casesWith1yData}/${cases.length}`);
    
    // Check if we need to generate more historical data
    if (casesWith30dData < cases.length * 0.8) {
      console.log("\n⚠️  Warning: Many cases lack 30-day price history data");
    }
    
    if (casesWith1yData < cases.length * 0.5) {
      console.log("\n⚠️  Warning: Many cases lack 1-year price history data");
    }
    
  } catch (error) {
    console.error("❌ Error checking price history data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPriceHistoryData();
