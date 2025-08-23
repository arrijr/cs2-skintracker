// backend/scripts/testProductionAPI.js
// {/* Test Production API: Check if Render has working STEAM_API_KEY */}
import axios from "axios";

async function testProductionAPI() {
  console.log("🧪 Testing Production API in Render...\n");
  
  // Test the production API endpoint
  const productionURL = "https://cs2-skintracker.onrender.com/api/v1/skins/filters";
  
  try {
    console.log(`🔍 Testing: ${productionURL}`);
    console.log("=".repeat(50));
    
    const response = await axios.get(productionURL, { timeout: 15000 });
    
    console.log(`✅ Response Status: ${response.status}`);
    console.log("📊 Response Data:");
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data && response.data.weaponTypes) {
      console.log("\n✅ Filter options loaded successfully!");
      console.log(`   Weapon Types: ${response.data.weaponTypes.length} available`);
      console.log(`   Wears: ${response.data.wears.length} available`);
      console.log(`   Rarities: ${response.data.rarities.length} available`);
      console.log(`   Qualities: ${response.data.qualities.length} available`);
      
      // Show some sample weapon types
      console.log("\n🔫 Sample Weapon Types:");
      response.data.weaponTypes.slice(0, 10).forEach((type, i) => {
        console.log(`   ${i + 1}. ${type}`);
      });
      
    } else {
      console.log("❌ No filter options in response");
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
  }
  
  // Now test a specific skin search to see if Steam Web API works
  console.log("\n🔍 Testing Skin Search with Filters...");
  console.log("=".repeat(50));
  
  const searchURL = "https://cs2-skintracker.onrender.com/api/v1/skins?weaponType=m4a4&limit=5";
  
  try {
    console.log(`🔍 Testing: ${searchURL}`);
    
    const searchResponse = await axios.get(searchURL, { timeout: 15000 });
    
    console.log(`✅ Search Response Status: ${searchResponse.status}`);
    console.log("📊 Search Response Data:");
    console.log(JSON.stringify(searchResponse.data, null, 2));
    
    if (searchResponse.data && searchResponse.data.skins) {
      console.log(`\n✅ Found ${searchResponse.data.skins.length} skins`);
      if (searchResponse.data.skins.length > 0) {
        const firstSkin = searchResponse.data.skins[0];
        console.log("🎯 First Skin Sample:");
        console.log(`   Name: ${firstSkin.name}`);
        console.log(`   Weapon Type: ${firstSkin.weaponType}`);
        console.log(`   StatTrak: ${firstSkin.isStattrak}`);
        console.log(`   Star: ${firstSkin.isStar}`);
        console.log(`   Price Median: ${firstSkin.priceMedian}`);
        console.log(`   Price Avg: ${firstSkin.priceAvg}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Search request failed: ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
  }
  
  console.log("\n🏁 Production API test completed!");
}

testProductionAPI().catch(console.error);
