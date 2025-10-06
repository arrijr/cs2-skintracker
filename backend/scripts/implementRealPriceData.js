// /backend/scripts/implementRealPriceData.js — [Backend]
// {/* Implement real price data from Market.CSGO API */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fs from 'fs';

const prisma = new PrismaClient();

async function implementRealPriceData() {
  console.log("💰 Implementing real price data from Market.CSGO API...");
  
  try {
    // Load case mappings
    const mappingData = JSON.parse(fs.readFileSync('scripts/case-mapping.json', 'utf8'));
    console.log(`📊 Loaded ${mappingData.mappings.length} case mappings`);

    // Process each case
    for (let i = 0; i < mappingData.mappings.length; i++) {
      const mapping = mappingData.mappings[i];
      console.log(`\n📈 Processing ${i + 1}/${mappingData.mappings.length}: ${mapping.ourCaseName}`);

      try {
        // Fetch historical price data from Market.CSGO API
        const historyResponse = await fetch(`https://market.csgo.com/api/v2/full-history/${mapping.marketItemId}.json`);

        if (!historyResponse.ok) {
          console.log(`  ❌ Failed to fetch data: ${historyResponse.status} ${historyResponse.statusText}`);
          continue;
        }

        const historyData = await historyResponse.json();
        let salesData = [];

        // Parse the response format
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

        // Process sales data and calculate price history
        const priceHistory = calculatePriceHistory(salesData, mapping.ourCaseName);

        // Update case with real price data
        await updateCasePriceData(mapping.ourCaseId, priceHistory);

        console.log(`  ✅ Updated price data with ${priceHistory.length} data points`);

        // Rate limiting - be nice to the API
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`  ❌ Error processing ${mapping.ourCaseName}:`, error.message);
      }
    }

    console.log(`\n🎉 Real price data implementation completed!`);

  } catch (error) {
    console.error("❌ Error implementing real price data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

function calculatePriceHistory(salesData, caseName) {
  console.log(`  🔢 Calculating price history for ${caseName}...`);

  // Group sales by date
  const dailyPrices = {};

  salesData.forEach(sale => {
    // sale format: [timestamp, price, original_price, converted_price]
    const date = new Date(sale[0] * 1000).toISOString().split('T')[0];
    const price = sale[1];

    if (!dailyPrices[date]) {
      dailyPrices[date] = [];
    }

    dailyPrices[date].push(price);
  });

  // Convert to array and sort by date
  const dailyArray = Object.entries(dailyPrices)
    .map(([date, prices]) => ({
      date: new Date(date),
      avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      salesCount: prices.length
    }))
    .sort((a, b) => a.date - b.date);

  return dailyArray;
}

async function updateCasePriceData(caseId, priceHistory) {
  try {
    // Update case with latest price
    if (priceHistory.length > 0) {
      const latestEntry = priceHistory[priceHistory.length - 1];
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

implementRealPriceData();
