// /backend/scripts/testSteamAPIData.js — [Backend]
// {/* Test Steam API for case data including release dates and case-skin relationships */}
import "dotenv/config";
import fetch from 'node-fetch';

const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;

async function testSteamAPIData() {
  console.log("🔍 Testing Steam API for case data...");
  
  if (!STEAM_WEB_API_KEY) {
    console.error("❌ STEAM_API_KEY not found in environment variables");
    return;
  }
  
  try {
    // Test different Steam API endpoints
    console.log("📦 Testing container items endpoint...");
    const containerResponse = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&itemgroup=container`);
    
    if (!containerResponse.ok) {
      throw new Error(`Container API error: ${containerResponse.status}`);
    }
    
    const containerData = await containerResponse.json();
    console.log(`✅ Found ${containerData.length} container items`);
    
    // Look for Operation Broken Fang Case specifically
    const brokenFangCase = containerData.find(item => 
      item.marketname && item.marketname.toLowerCase().includes('broken fang')
    );
    
    if (brokenFangCase) {
      console.log("\n🔍 Operation Broken Fang Case data:");
      console.log(JSON.stringify(brokenFangCase, null, 2));
    }
    
    // Test if there are any date fields
    console.log("\n📅 Checking for date fields in container data:");
    const sampleItem = containerData[0];
    if (sampleItem) {
      Object.keys(sampleItem).forEach(key => {
        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time') || key.toLowerCase().includes('release')) {
          console.log(`  - ${key}: ${sampleItem[key]}`);
        }
      });
    }
    
    // Test other endpoints that might have case-skin relationships
    console.log("\n🔗 Testing case-skin relationship endpoints...");
    
    // Test if there's a way to get case contents
    const caseContentsResponse = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&itemgroup=weapon`);
    
    if (caseContentsResponse.ok) {
      const weaponData = await caseContentsResponse.json();
      console.log(`✅ Found ${weaponData.length} weapon items`);
      
      // Look for items that might be in cases
      const caseWeapons = weaponData.filter(item => 
        item.marketname && (
          item.marketname.toLowerCase().includes('case') ||
          item.marketname.toLowerCase().includes('collection')
        )
      );
      
      console.log(`🔍 Found ${caseWeapons.length} weapons that might be case-related`);
      if (caseWeapons.length > 0) {
        console.log("Sample case weapons:");
        caseWeapons.slice(0, 3).forEach(weapon => {
          console.log(`  - ${weapon.marketname}`);
        });
      }
    }
    
    // Test if there are any API endpoints for case contents
    console.log("\n🔍 Testing for case contents API...");
    const testEndpoints = [
      'https://www.steamwebapi.com/steam/api/items?key=' + STEAM_WEB_API_KEY + '&itemgroup=case',
      'https://www.steamwebapi.com/steam/api/items?key=' + STEAM_WEB_API_KEY + '&itemgroup=casecontents',
      'https://www.steamwebapi.com/steam/api/items?key=' + STEAM_WEB_API_KEY + '&itemgroup=contained'
    ];
    
    for (const endpoint of testEndpoints) {
      try {
        const response = await fetch(endpoint);
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint}: Found ${data.length} items`);
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

testSteamAPIData();
