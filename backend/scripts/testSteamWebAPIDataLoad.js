// /backend/scripts/testSteamWebAPIDataLoad.js — [Backend]
// {/* Test SteamWebAPI.com data loading with timeout */}
import "dotenv/config";
import fetch from 'node-fetch';

const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;

async function testSteamWebAPIDataLoad() {
  console.log("🧪 Testing SteamWebAPI.com data loading...");
  console.log("🔑 API Key present:", !!STEAM_WEB_API_KEY);
  
  if (!STEAM_WEB_API_KEY) {
    console.error("❌ STEAM_API_KEY environment variable is required");
    return;
  }

  try {
    // Test with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    console.log("📡 Fetching CS2 items from SteamWebAPI.com...");
    const response = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&game=cs2&limit=100`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`SteamWebAPI.com error: ${response.status} ${response.statusText}`);
    }
    
    const items = await response.json();
    console.log(`✅ Successfully loaded ${items.length} CS2 items`);
    
    // Filter for cases
    const cases = items.filter(item => 
      item.itemgroup === 'container' || 
      (item.marketname && item.marketname.toLowerCase().includes('case')) ||
      (item.name && item.name.toLowerCase().includes('case'))
    );
    
    console.log(`🎲 Found ${cases.length} cases in sample`);
    
    // Show sample data
    if (cases.length > 0) {
      console.log("🎲 Sample cases:");
      cases.slice(0, 5).forEach((caseItem, index) => {
        console.log(`${index + 1}. ${caseItem.marketname || caseItem.name}`);
        console.log(`   Price: $${caseItem.pricelatest || 'N/A'}`);
        console.log(`   Sold 24h: ${caseItem.sold24h || 0}`);
        console.log(`   Offer Volume: ${caseItem.offervolume || 0}`);
        console.log("");
      });
    }
    
    // Filter for skins with prices
    const skins = items.filter(item => 
      item.itemgroup !== 'container' && 
      item.pricelatest && 
      item.pricelatest > 0
    );
    
    console.log(`🎨 Found ${skins.length} skins with prices`);
    
    if (skins.length > 0) {
      console.log("🎨 Sample skins:");
      skins.slice(0, 5).forEach((skinItem, index) => {
        console.log(`${index + 1}. ${skinItem.marketname || skinItem.name}`);
        console.log(`   Price: $${skinItem.pricelatest || 'N/A'}`);
        console.log(`   Median: $${skinItem.pricemedian || 'N/A'}`);
        console.log(`   Avg: $${skinItem.priceavg || 'N/A'}`);
        console.log("");
      });
    }
    
    console.log("✅ Test completed successfully!");
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error("❌ Request timed out after 30 seconds");
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

testSteamWebAPIDataLoad();
