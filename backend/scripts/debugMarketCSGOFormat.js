// /backend/scripts/debugMarketCSGOFormat.js — [Backend]
// {/* Debug Market.CSGO API response format */}
import "dotenv/config";

async function debugMarketCSGOFormat() {
  console.log("🔍 Debugging Market.CSGO API response format...");
  
  try {
    // Test with a specific case ID
    const testCaseId = 39; // Prisma Case
    console.log(`📊 Testing with Prisma Case (ID: ${testCaseId})`);
    
    const historyResponse = await fetch(`https://market.csgo.com/api/v2/full-history/${testCaseId}.json`);
    
    if (!historyResponse.ok) {
      console.log(`❌ API Error: ${historyResponse.status} ${historyResponse.statusText}`);
      return;
    }
    
    const historyData = await historyResponse.json();
    console.log(`📋 Response structure:`, Object.keys(historyData));
    console.log(`📋 Response type:`, typeof historyData);
    
    if (Array.isArray(historyData)) {
      console.log(`📊 Array length: ${historyData.length}`);
      if (historyData.length > 0) {
        console.log(`📈 First item:`, historyData[0]);
        console.log(`📈 Last item:`, historyData[historyData.length - 1]);
      }
    } else {
      console.log(`📋 Full response:`, JSON.stringify(historyData, null, 2));
    }
    
  } catch (error) {
    console.error("❌ Error debugging format:", error);
  }
}

debugMarketCSGOFormat();
