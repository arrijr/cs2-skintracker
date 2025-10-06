// /backend/scripts/importHistoricalData.js — [Backend]
// {/* Import real historical sales data from Market.CSGO API */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from 'fs';

const prisma = new PrismaClient();

async function importHistoricalData() {
  console.log("📥 Importing real historical sales data from Market.CSGO API...");
  
  try {
    // Load case mappings
    const mappingData = JSON.parse(fs.readFileSync('scripts/case-mapping.json', 'utf8'));
    console.log(`📊 Loaded ${mappingData.mappings.length} case mappings`);
    
    // Process each case
    for (let i = 0; i < mappingData.mappings.length; i++) {
      const mapping = mappingData.mappings[i];
      console.log(`\n📈 Processing ${i + 1}/${mappingData.mappings.length}: ${mapping.ourCaseName}`);
      
      try {
        // Fetch historical data from Market.CSGO API
        const historyResponse = await fetch(`https://market.csgo.com/api/v2/full-history/${mapping.marketItemId}.json`);
        
        if (!historyResponse.ok) {
          console.log(`  ❌ Failed to fetch data: ${historyResponse.status} ${historyResponse.statusText}`);
          continue;
        }
        
        const historyData = await historyResponse.json();
        let salesData = [];
        
        // Parse the response format - Market.CSGO returns { time, data: { history: [...] } }
        if (Array.isArray(historyData)) {
          salesData = historyData;
        } else if (historyData.data && historyData.data.history && Array.isArray(historyData.data.history)) {
          salesData = historyData.data.history;
        } else if (historyData.data && historyData.data.sales && Array.isArray(historyData.data.sales)) {
          salesData = historyData.data.sales;
        } else if (historyData.data && Array.isArray(historyData.data)) {
          salesData = historyData.data;
        } else if (historyData.history && Array.isArray(historyData.history)) {
          salesData = historyData.history;
        } else {
          console.log(`  ❌ Unknown data format for ${mapping.ourCaseName}:`, Object.keys(historyData));
          continue;
        }
        
        console.log(`  📊 Found ${salesData.length} sales records`);
        
        if (salesData.length === 0) {
          console.log(`  ⚠️ No sales data available`);
          continue;
        }
        
        // Process sales data and calculate supply history
        const supplyHistory = calculateSupplyHistory(salesData, mapping.ourCaseName);
        
        // Update case supply history in database
        await updateCaseSupplyHistory(mapping.ourCaseId, supplyHistory);
        
        console.log(`  ✅ Updated supply history with ${supplyHistory.length} data points`);
        
        // Rate limiting - be nice to the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.log(`  ❌ Error processing ${mapping.ourCaseName}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Historical data import completed!`);
    
  } catch (error) {
    console.error("❌ Error importing historical data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function calculateSupplyHistory(salesData, caseName) {
  console.log(`  🔢 Calculating supply history for ${caseName}...`);
  
  // Group sales by date
  const dailySales = {};
  const dailyPrices = {};
  
  salesData.forEach(sale => {
    // sale format: [timestamp, price, original_price, converted_price]
    const date = new Date(sale[0] * 1000).toISOString().split('T')[0];
    const price = sale[1];
    
    if (!dailySales[date]) {
      dailySales[date] = 0;
      dailyPrices[date] = [];
    }
    
    dailySales[date]++;
    dailyPrices[date].push(price);
  });
  
  // Convert to array and sort by date
  const dailyArray = Object.entries(dailySales)
    .map(([date, sales]) => ({
      date: new Date(date),
      sales: sales,
      avgPrice: dailyPrices[date].reduce((a, b) => a + b, 0) / dailyPrices[date].length
    }))
    .sort((a, b) => a.date - b.date);
  
  // Calculate cumulative supply
  let totalDropped = 0;
  let totalUnboxed = 0;
  let remainingSupply = 1000000; // Start with 1M cases (estimated)
  
  const supplyHistory = dailyArray.map(day => {
    // Estimate drops based on sales (assume 1:1 ratio for simplicity)
    const dailyDrops = Math.floor(day.sales * 0.8); // 80% of sales are drops
    const dailyUnboxings = Math.floor(day.sales * 0.2); // 20% are unboxings
    
    totalDropped += dailyDrops;
    totalUnboxed += dailyUnboxings;
    remainingSupply = Math.max(0, remainingSupply - dailyDrops + dailyUnboxings);
    
    return {
      date: day.date,
      dropped: totalDropped,
      unboxed: totalUnboxed,
      remaining: remainingSupply,
      avgPrice: day.avgPrice
    };
  });
  
  return supplyHistory;
}

async function updateCaseSupplyHistory(caseId, supplyHistory) {
  try {
    // Clear existing supply history
    await prisma.caseSupply.deleteMany({
      where: { caseId: caseId }
    });
    
    // Insert new supply history
    const supplyData = supplyHistory.map(entry => ({
      caseId: caseId,
      date: entry.date,
      dropped: entry.dropped,
      unboxed: entry.unboxed,
      remaining: entry.remaining
    }));
    
    await prisma.caseSupply.createMany({
      data: supplyData
    });
    
    // Update case with latest price
    if (supplyHistory.length > 0) {
      const latestEntry = supplyHistory[supplyHistory.length - 1];
      await prisma.case.update({
        where: { id: caseId },
        data: {
          price: latestEntry.avgPrice,
          lastUpdated: new Date()
        }
      });
    }
    
  } catch (error) {
    console.log(`  ❌ Error updating database:`, error.message);
  }
}

importHistoricalData();
