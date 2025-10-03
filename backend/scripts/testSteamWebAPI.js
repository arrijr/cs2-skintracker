// /backend/scripts/testSteamWebAPI.js — [Backend]
// {/* Test SteamWebAPI.com for real CS2 market data */}
import "dotenv/config";
import fetch from 'node-fetch';

const STEAM_WEB_API_KEY = process.env.STEAM_WEB_API_KEY || process.env.STEAM_API_KEY;

async function testSteamWebAPI() {
  console.log("🔍 Testing SteamWebAPI.com...");
  console.log("🔑 API Key present:", !!STEAM_WEB_API_KEY);
  console.log("🔑 API Key (first 10 chars):", STEAM_WEB_API_KEY?.substring(0, 10) + "...");

  if (!STEAM_WEB_API_KEY) {
    console.error("❌ STEAM_WEB_API_KEY environment variable is required");
    console.log("💡 Set STEAM_WEB_API_KEY in your .env file");
    return;
  }

  // Test SteamWebAPI.com endpoints
  const endpoints = [
    {
      name: "Get All Items (CS2)",
      url: `https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}`,
      description: "Get all CS2 items with market data"
    },
    {
      name: "Get Items by Game (CS2)",
      url: `https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&game=cs2`,
      description: "Get CS2 items only"
    },
    {
      name: "Get Items by Type (Cases)",
      url: `https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&itemgroup=container`,
      description: "Get container/case items"
    }
  ];

  for (const endpoint of endpoints) {
    console.log(`\n🧪 Testing: ${endpoint.name}`);
    console.log(`📝 Description: ${endpoint.description}`);
    console.log(`🌐 URL: ${endpoint.url}`);
    
    try {
      const response = await fetch(endpoint.url);
      console.log(`📡 Status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success! Data type:`, Array.isArray(data) ? 'Array' : typeof data);
        
        if (Array.isArray(data)) {
          console.log(`📦 Items count: ${data.length}`);
          
          if (data.length > 0) {
            console.log(`🎯 First item sample:`);
            const firstItem = data[0];
            console.log(`   - Name: ${firstItem.marketname || firstItem.name}`);
            console.log(`   - Price: $${firstItem.pricelatest || firstItem.price || 'N/A'}`);
            console.log(`   - Type: ${firstItem.itemgroup || firstItem.type || 'N/A'}`);
            console.log(`   - Rarity: ${firstItem.rarity || 'N/A'}`);
            
            // Look for cases
            const cases = data.filter(item => 
              item.itemgroup === 'container' || 
              (item.marketname && item.marketname.toLowerCase().includes('case')) ||
              (item.name && item.name.toLowerCase().includes('case'))
            );
            console.log(`🎲 Cases found: ${cases.length}`);
            
            if (cases.length > 0) {
              console.log(`🎲 First 3 cases:`);
              cases.slice(0, 3).forEach((caseItem, index) => {
                console.log(`   ${index + 1}. ${caseItem.marketname || caseItem.name} - $${caseItem.pricelatest || caseItem.price || 'N/A'}`);
              });
            }
          }
        } else {
          console.log(`📊 Response keys:`, Object.keys(data));
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error: ${errorText.substring(0, 300)}...`);
      }
    } catch (error) {
      console.log(`❌ Exception: ${error.message}`);
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

testSteamWebAPI();
