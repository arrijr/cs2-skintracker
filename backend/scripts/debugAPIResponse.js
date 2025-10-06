// /backend/scripts/debugAPIResponse.js — [Backend]
// {/* Debug Market.CSGO API response format for specific cases */}
import "dotenv/config";

async function debugAPIResponse() {
  console.log("🔍 Debugging Market.CSGO API response format...");
  
  try {
    // Test with a few different case IDs
    const testCases = [
      { name: "CS:GO Weapon Case 2", id: 1 },
      { name: "Chroma Case", id: 2 },
      { name: "Prisma Case", id: 39 }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n📊 Testing ${testCase.name} (ID: ${testCase.id})`);
      
      const historyResponse = await fetch(`https://market.csgo.com/api/v2/full-history/${testCase.id}.json`);
      
      if (!historyResponse.ok) {
        console.log(`  ❌ API Error: ${historyResponse.status} ${historyResponse.statusText}`);
        continue;
      }
      
      const historyData = await historyResponse.json();
      console.log(`  📋 Response type:`, typeof historyData);
      console.log(`  📋 Response keys:`, Object.keys(historyData));
      
      if (Array.isArray(historyData)) {
        console.log(`  📊 Array length: ${historyData.length}`);
        if (historyData.length > 0) {
          console.log(`  📊 First item:`, historyData[0]);
        }
      } else if (historyData && typeof historyData === 'object') {
        console.log(`  📊 Object structure:`, JSON.stringify(historyData, null, 2).substring(0, 500) + '...');
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
  } catch (error) {
    console.error("❌ Error debugging API response:", error);
  }
}

debugAPIResponse();
