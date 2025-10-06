// /backend/scripts/testMarketCSGOAPI.js — [Backend]
// {/* Test Market.CSGO API for historical data */}
import "dotenv/config";

async function testMarketCSGOAPI() {
  console.log("🔍 Testing Market.CSGO API for historical data...");
  
  try {
    // Test 1: Get all items with history
    console.log("\n📡 Testing: full-history/all.json");
    const allItemsResponse = await fetch('https://market.csgo.com/api/v2/full-history/all.json');
    
    if (!allItemsResponse.ok) {
      throw new Error(`API Error: ${allItemsResponse.status} ${allItemsResponse.statusText}`);
    }
    
    const allItemsData = await allItemsResponse.json();
    console.log(`📊 API Response structure:`, Object.keys(allItemsData));
    
    // Check if the response has a 'history' key
    let allItems = [];
    if (allItemsData.history && typeof allItemsData.history === 'object') {
      // The API returns an object with item names as keys and item IDs as values
      allItems = Object.entries(allItemsData.history).map(([marketName, itemId]) => ({
        market_name: marketName,
        item_id: itemId
      }));
    } else {
      console.log(`📋 Full response structure:`, JSON.stringify(allItemsData, null, 2));
      return;
    }
    
    console.log(`✅ Successfully loaded ${allItems.length} items with history`);
    
    // Filter for cases/containers
    const cases = allItems.filter(item => 
      item.market_name && (
        item.market_name.toLowerCase().includes('case') ||
        item.market_name.toLowerCase().includes('container') ||
        item.market_name.toLowerCase().includes('weapon case')
      )
    );
    
    console.log(`🎲 Found ${cases.length} cases/containers with history`);
    
    // Show sample cases
    console.log("\n📋 Sample cases found:");
    cases.slice(0, 10).forEach((caseItem, index) => {
      console.log(`  ${index + 1}. ${caseItem.market_name} (ID: ${caseItem.item_id})`);
    });
    
    // Test 2: Get detailed history for a specific case
    if (cases.length > 0) {
      const testCase = cases[0];
      console.log(`\n📊 Testing detailed history for: ${testCase.market_name}`);
      
      const historyResponse = await fetch(`https://market.csgo.com/api/v2/full-history/${testCase.item_id}.json`);
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log(`📊 History response structure:`, Object.keys(historyData));
        
        // Check if history is in a specific key
        let history = [];
        if (Array.isArray(historyData)) {
          history = historyData;
        } else if (historyData.data && Array.isArray(historyData.data)) {
          history = historyData.data;
        } else if (historyData.history && Array.isArray(historyData.history)) {
          history = historyData.history;
        } else {
          console.log(`📋 Full history response:`, JSON.stringify(historyData, null, 2));
          return;
        }
        
        console.log(`✅ Successfully loaded ${history.length} sales records`);
        
        if (history.length > 0) {
          console.log("\n📈 Sample sales data:");
          history.slice(0, 5).forEach((sale, index) => {
            const date = new Date(sale.l_time * 1000);
            console.log(`  ${index + 1}. ${date.toISOString().split('T')[0]} - $${sale.price} (${sale.o_price} original)`);
          });
          
          // Analyze date range
          const dates = history.map(sale => new Date(sale.l_time * 1000));
          const oldest = new Date(Math.min(...dates));
          const newest = new Date(Math.max(...dates));
          
          console.log(`\n📅 Date range: ${oldest.toISOString().split('T')[0]} to ${newest.toISOString().split('T')[0]}`);
          console.log(`📊 Total sales: ${history.length}`);
          
          // Calculate daily sales
          const dailySales = {};
          history.forEach(sale => {
            const date = new Date(sale.l_time * 1000).toISOString().split('T')[0];
            dailySales[date] = (dailySales[date] || 0) + 1;
          });
          
          const dailySalesArray = Object.entries(dailySales)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));
          
          console.log(`\n📊 Daily sales (last 10 days):`);
          dailySalesArray.slice(-10).forEach(day => {
            console.log(`  ${day.date}: ${day.count} sales`);
          });
        }
      } else {
        console.log(`❌ Failed to load history: ${historyResponse.status} ${historyResponse.statusText}`);
      }
    }
    
    // Test 3: Check for specific cases we have in our database
    console.log("\n🔍 Checking for our specific cases...");
    const ourCases = [
      "Operation Breakout Weapon Case",
      "Operation Bravo Case", 
      "Chroma Case",
      "Chroma 2 Case",
      "CS:GO Weapon Case"
    ];
    
    ourCases.forEach(caseName => {
      const found = cases.find(item => 
        item.market_name.toLowerCase().includes(caseName.toLowerCase())
      );
      
      if (found) {
        console.log(`✅ Found: ${found.market_name} (ID: ${found.item_id})`);
      } else {
        console.log(`❌ Not found: ${caseName}`);
      }
    });
    
    console.log("\n🎉 Market.CSGO API test completed!");
    
  } catch (error) {
    console.error("❌ Error testing Market.CSGO API:", error);
  }
}

testMarketCSGOAPI();
