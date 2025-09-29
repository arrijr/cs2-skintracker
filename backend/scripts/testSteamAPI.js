// /backend/scripts/testSteamAPI.js (Backend)
// {/* Test Steam API connection and response */}

import "dotenv/config";

const STEAM_API_KEY = process.env.STEAM_API_KEY;

async function testSteamAPI() {
  console.log("🔍 [TEST] Testing Steam API connection...");
  console.log(`🔑 [TEST] API Key: ${STEAM_API_KEY ? 'SET' : 'NOT SET'}`);
  
  if (!STEAM_API_KEY) {
    console.error("❌ [TEST] STEAM_API_KEY not found");
    return;
  }

  try {
    // Use the same endpoint as our existing steamService
    const url = `https://www.steamwebapi.com/steam/api/items?key=${STEAM_API_KEY}&game=cs2&start=0&count=5`;
    console.log(`📡 [TEST] Fetching from: ${url}`);
    
    const response = await fetch(url);
    console.log(`📊 [TEST] Response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`❌ [TEST] HTTP Error: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error(`📄 [TEST] Response body: ${text}`);
      return;
    }
    
    const data = await response.json();
    console.log(`📄 [TEST] Full response:`, JSON.stringify(data, null, 2));
    
    if (Array.isArray(data)) {
      console.log(`✅ [TEST] Success! Got ${data.length} items`);
      
      if (data.length > 0) {
        console.log(`🎮 [TEST] Sample item:`, {
          name: data[0].itemname,
          market_hash_name: data[0].markethashname,
          type: data[0].itemtype
        });
      }
    } else {
      console.log(`⚠️ [TEST] Unexpected response format`);
    }
    
  } catch (error) {
    console.error("❌ [TEST] Error:", error.message);
  }
}

testSteamAPI();