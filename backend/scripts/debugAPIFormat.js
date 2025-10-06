// /backend/scripts/debugAPIFormat.js — [Backend]
// {/* Debug Market.CSGO API response format in detail */}
import "dotenv/config";

async function debugAPIFormat() {
  console.log("🔍 Debugging Market.CSGO API response format in detail...");
  
  try {
    // Test with Prisma Case (ID: 39) which we know works
    console.log(`📊 Testing Prisma Case (ID: 39)`);
    
    const historyResponse = await fetch(`https://market.csgo.com/api/v2/full-history/39.json`);
    
    if (!historyResponse.ok) {
      console.log(`❌ API Error: ${historyResponse.status} ${historyResponse.statusText}`);
      return;
    }
    
    const historyData = await historyResponse.json();
    console.log(`📋 Full response structure:`);
    console.log(JSON.stringify(historyData, null, 2));
    
  } catch (error) {
    console.error("❌ Error debugging API format:", error);
  }
}

debugAPIFormat();
