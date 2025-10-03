// /backend/scripts/simpleRealDataUpdate.js — [Backend]
// {/* Simple real data update without complex imports */}
import "dotenv/config";
import fetch from 'node-fetch';

const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;

async function simpleRealDataUpdate() {
  console.log("🎯 Simple real data update test...");
  console.log("🔑 API Key present:", !!STEAM_WEB_API_KEY);
  
  if (!STEAM_WEB_API_KEY) {
    console.error("❌ STEAM_API_KEY environment variable is required");
    return;
  }

  try {
    console.log("📡 Fetching CS2 items from SteamWebAPI.com...");
    const response = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&game=cs2&limit=100`);
    
    if (!response.ok) {
      throw new Error(`SteamWebAPI.com error: ${response.status} ${response.statusText}`);
    }
    
    const items = await response.json();
    console.log(`✅ Loaded ${items.length} CS2 items`);
    
    // Filter for skins with prices
    const skins = items.filter(item => 
      item.itemgroup !== 'container' && 
      item.pricelatest && 
      item.pricelatest > 0
    );
    
    console.log(`🎨 Found ${skins.length} skins with real prices`);
    
    // Show sample data
    if (skins.length > 0) {
      console.log("🎨 Sample skins with real prices:");
      skins.slice(0, 10).forEach((skinItem, index) => {
        console.log(`${index + 1}. ${skinItem.marketname || skinItem.name}`);
        console.log(`   Price: $${skinItem.pricelatest.toFixed(2)}`);
        console.log(`   Median: $${(skinItem.pricemedian || 0).toFixed(2)}`);
        console.log(`   Avg: $${(skinItem.priceavg || 0).toFixed(2)}`);
        console.log(`   Sold 24h: ${skinItem.sold24h || 0}`);
        console.log("");
      });
    }
    
    console.log("✅ Test completed successfully!");
    console.log("💡 Next step: Integrate this data into our database");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

simpleRealDataUpdate();
