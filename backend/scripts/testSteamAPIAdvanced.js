// /backend/scripts/testSteamAPIAdvanced.js — [Backend]
// {/* Advanced Steam API testing with multiple endpoints */}
import "dotenv/config";
import fetch from 'node-fetch';

const STEAM_API_KEY = process.env.STEAM_API_KEY;

async function testSteamAPIAdvanced() {
  console.log("🔍 Advanced Steam API testing...");
  console.log("🔑 API Key present:", !!STEAM_API_KEY);
  console.log("🔑 API Key (first 10 chars):", STEAM_API_KEY?.substring(0, 10) + "...");

  if (!STEAM_API_KEY) {
    console.error("❌ STEAM_API_KEY environment variable is required");
    return;
  }

  // Test different Steam API endpoints
  const endpoints = [
    {
      name: "GetSchema (CS2 Items)",
      url: `https://api.steampowered.com/IEconItems_730/GetSchema/v2/?key=${STEAM_API_KEY}&format=json`
    },
    {
      name: "GetPlayerItems (CS2)",
      url: `https://api.steampowered.com/IEconItems_730/GetPlayerItems/v1/?key=${STEAM_API_KEY}&steamid=76561198000000000&format=json`
    },
    {
      name: "GetSchemaOverview (CS2)",
      url: `https://api.steampowered.com/IEconItems_730/GetSchemaOverview/v1/?key=${STEAM_API_KEY}&format=json`
    },
    {
      name: "GetAssetClassInfo (CS2)",
      url: `https://api.steampowered.com/IEconItems_730/GetAssetClassInfo/v1/?key=${STEAM_API_KEY}&appid=730&classid=0&format=json`
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`🌐 URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url);
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success! Response keys:`, Object.keys(data));
        
        if (data.result) {
          console.log(`📦 Result keys:`, Object.keys(data.result));
          if (data.result.items) {
            console.log(`🎯 Items count: ${data.result.items.length}`);
          }
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText.substring(0, 200)}...`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testSteamAPIAdvanced();
