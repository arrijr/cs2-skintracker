// /backend/scripts/debugSpecificCase.js — [Backend]
// {/* Debug specific case API response */}
import "dotenv/config";

async function debugSpecificCase() {
  console.log("🔍 Debugging specific case API response...");
  
  try {
    // Test with Prisma Case (ID: 39) which we know works
    console.log(`📊 Testing Prisma Case (ID: 39)`);
    
    const historyResponse = await fetch(`https://market.csgo.com/api/v2/full-history/39.json`);
    
    if (!historyResponse.ok) {
      console.log(`❌ API Error: ${historyResponse.status} ${historyResponse.statusText}`);
      return;
    }
    
    const historyData = await historyResponse.json();
    console.log(`📋 Response structure:`);
    console.log(`  - time: ${historyData.time}`);
    console.log(`  - data keys:`, Object.keys(historyData.data));
    console.log(`  - data.sales exists:`, !!historyData.data.sales);
    console.log(`  - data.sales type:`, typeof historyData.data.sales);
    console.log(`  - data.sales length:`, historyData.data.sales ? historyData.data.sales.length : 'N/A');
    
    if (historyData.data.sales && Array.isArray(historyData.data.sales)) {
      console.log(`  - First sale:`, historyData.data.sales[0]);
      console.log(`  - Last sale:`, historyData.data.sales[historyData.data.sales.length - 1]);
    }
    
  } catch (error) {
    console.error("❌ Error debugging specific case:", error);
  }
}

debugSpecificCase();
