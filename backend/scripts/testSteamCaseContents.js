// /backend/scripts/testSteamCaseContents.js — [Backend]
// {/* Test if Steam API provides case-skin relationships */}
import "dotenv/config";
import fetch from 'node-fetch';

const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;

async function testSteamCaseContents() {
  console.log("🔍 Testing Steam API for case-skin relationships...");
  
  if (!STEAM_WEB_API_KEY) {
    console.error("❌ STEAM_API_KEY not found in environment variables");
    return;
  }
  
  try {
    // Test different endpoints that might contain case-skin relationships
    const endpoints = [
      'https://www.steamwebapi.com/steam/api/items?key=' + STEAM_WEB_API_KEY + '&itemgroup=container',
      'https://www.steamwebapi.com/steam/api/items?key=' + STEAM_WEB_API_KEY + '&itemgroup=weapon',
      'https://www.steamwebapi.com/steam/api/items?key=' + STEAM_WEB_API_KEY + '&itemgroup=case',
      'https://www.steamwebapi.com/steam/api/items?key=' + STEAM_WEB_API_KEY + '&itemgroup=casecontents',
      'https://www.steamwebapi.com/steam/api/items?key=' + STEAM_WEB_API_KEY + '&itemgroup=contained'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`\n🔍 Testing endpoint: ${endpoint}`);
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Found ${data.length} items`);
          
          // Look for any items that might indicate case-skin relationships
          const sampleItem = data[0];
          if (sampleItem) {
            console.log("📋 Sample item structure:");
            Object.keys(sampleItem).forEach(key => {
              if (key.toLowerCase().includes('case') || 
                  key.toLowerCase().includes('contain') || 
                  key.toLowerCase().includes('skin') ||
                  key.toLowerCase().includes('weapon') ||
                  key.toLowerCase().includes('item')) {
                console.log(`  - ${key}: ${typeof sampleItem[key] === 'object' ? JSON.stringify(sampleItem[key]).substring(0, 100) + '...' : sampleItem[key]}`);
              }
            });
          }
        } else {
          console.log(`❌ Error: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    // Test if there are any specific case content endpoints
    console.log("\n🔍 Testing specific case content endpoints...");
    const caseContentEndpoints = [
      'https://www.steamwebapi.com/steam/api/case-contents',
      'https://www.steamwebapi.com/steam/api/case/contents',
      'https://www.steamwebapi.com/steam/api/items/contained',
      'https://www.steamwebapi.com/steam/api/collections'
    ];
    
    for (const endpoint of caseContentEndpoints) {
      try {
        const response = await fetch(endpoint + '?key=' + STEAM_WEB_API_KEY);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: Found ${data.length || 'unknown'} items`);
        } else {
          console.log(`❌ ${endpoint}: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error testing Steam API:", error);
  }
}

testSteamCaseContents();
