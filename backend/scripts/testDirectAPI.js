// backend/scripts/testDirectAPI.js
// {/* Direct API Test: Check steamwebapi.com endpoint directly */}
import "dotenv/config";
import axios from "axios";

async function testDirectAPI() {
  console.log("🧪 Testing Steam Web API Directly...\n");
  
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) {
    console.log("❌ STEAM_API_KEY not set!");
    return;
  }
  
  console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...`);
  
  // Test different URL formats
  const testUrls = [
    {
      name: "CS2 Game Parameter",
      url: `https://www.steamwebapi.com/steam/api/item?key=${apiKey}&game=cs2&market_hash_name=M4A4%20%7C%20Howl%20(Minimal%20Wear)`
    },
    {
      name: "CS:GO Game Parameter (730)",
      url: `https://www.steamwebapi.com/steam/api/item?key=${apiKey}&game=730&market_hash_name=M4A4%20%7C%20Howl%20(Minimal%20Wear)`
    },
    {
      name: "No Game Parameter",
      url: `https://www.steamwebapi.com/steam/api/item?key=${apiKey}&market_hash_name=M4A4%20%7C%20Howl%20(Minimal%20Wear)`
    }
  ];
  
  for (const test of testUrls) {
    console.log(`\n🔍 Testing: ${test.name}`);
    console.log("=".repeat(50));
    console.log(`URL: ${test.url}`);
    
    try {
      const response = await axios.get(test.url, { 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`✅ Response Status: ${response.status}`);
      console.log(`✅ Response Headers:`, response.headers);
      
      if (response.data) {
        console.log("📊 Response Data:");
        console.log(JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
          console.log("✅ API Success!");
          console.log(`   Has Price: ${!!response.data.pricelatest}`);
          console.log(`   Has Median: ${!!response.data.pricemedian}`);
          console.log(`   Has Wear: ${!!response.data.wear}`);
          console.log(`   Has Rarity: ${!!response.data.rarity}`);
        } else {
          console.log("❌ API Success: false");
          if (response.data.error) {
            console.log(`   Error: ${response.data.error}`);
          }
        }
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
      }
    }
    
    // Wait between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log("\n🏁 Direct API test completed!");
}

testDirectAPI().catch(console.error);
