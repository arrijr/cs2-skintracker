// /backend/scripts/testSteamAPIKey.js — [Backend]
// {/* Test Steam API key validity with basic endpoints */}
import "dotenv/config";
import fetch from 'node-fetch';

const STEAM_API_KEY = process.env.STEAM_API_KEY;

async function testSteamAPIKey() {
  console.log("🔍 Testing Steam API key validity...");
  console.log("🔑 API Key present:", !!STEAM_API_KEY);
  console.log("🔑 API Key length:", STEAM_API_KEY?.length);
  console.log("🔑 API Key format:", /^[A-Z0-9]{17}$/.test(STEAM_API_KEY) ? "Valid format" : "Invalid format");

  if (!STEAM_API_KEY) {
    console.error("❌ STEAM_API_KEY environment variable is required");
    return;
  }

  // Test basic Steam API endpoints that don't require special permissions
  const endpoints = [
    {
      name: "GetAppList",
      url: `https://api.steampowered.com/ISteamApps/GetAppList/v2/?key=${STEAM_API_KEY}`
    },
    {
      name: "GetPlayerSummaries (public data)",
      url: `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=76561198000000000`
    },
    {
      name: "GetGlobalAchievementPercentagesForApp",
      url: `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v0002/?key=${STEAM_API_KEY}&gameid=730`
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    
    try {
      const response = await fetch(endpoint.url);
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success! Response keys:`, Object.keys(data));
        
        if (data.response) {
          console.log(`📦 Response keys:`, Object.keys(data.response));
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

  // Test CS2 specific endpoints
  console.log(`\n🎮 Testing CS2 specific endpoints...`);
  
  const cs2Endpoints = [
    {
      name: "GetSchema (CS2) - Alternative format",
      url: `https://api.steampowered.com/IEconItems_730/GetSchema/v2/?key=${STEAM_API_KEY}`
    },
    {
      name: "GetSchema (CS2) - v1",
      url: `https://api.steampowered.com/IEconItems_730/GetSchema/v1/?key=${STEAM_API_KEY}`
    }
  ];

  for (const endpoint of cs2Endpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    
    try {
      const response = await fetch(endpoint.url);
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success! Response keys:`, Object.keys(data));
        
        if (data.result && data.result.items) {
          console.log(`🎯 Items count: ${data.result.items.length}`);
          
          // Look for cases
          const cases = data.result.items.filter(item => 
            item.type === "Container" && 
            item.name && 
            item.name.toLowerCase().includes('case')
          );
          console.log(`🎲 Cases found: ${cases.length}`);
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

testSteamAPIKey();
