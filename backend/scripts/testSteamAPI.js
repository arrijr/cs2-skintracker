// backend/scripts/testSteamAPI.js
// {/* Test Script: Check if enhanced steamService returns all new fields */}
import "dotenv/config";
import { fetchSkinPrice } from "../src/services/steamService.js";

async function testSteamAPI() {
  console.log("🧪 Testing Enhanced Steam API Service...\n");
  
  // Check environment variables
  console.log("🔑 Environment Check:");
  console.log(`   STEAM_API_KEY: ${process.env.STEAM_API_KEY ? 'Set' : 'NOT SET'}`);
  if (process.env.STEAM_API_KEY) {
    console.log(`   Key length: ${process.env.STEAM_API_KEY.length} characters`);
    console.log(`   Key starts with: ${process.env.STEAM_API_KEY.substring(0, 8)}...`);
  }
  console.log("");
  
  // Test with a known CS2 skin
  const testSkins = [
    "M4A4 | Howl (Minimal Wear)",
    "AK-47 | Redline (Field-Tested)",
    "★ StatTrak™ Flip Knife | Fade (Minimal Wear)"
  ];
  
  for (const skinName of testSkins) {
    console.log(`\n🔍 Testing: ${skinName}`);
    console.log("=".repeat(50));
    
    try {
      const result = await fetchSkinPrice(skinName);
      
      if (result) {
        console.log("✅ API Response received!");
        console.log("📊 Data Summary:");
        console.log(`   Source: ${result.source}`);
        console.log(`   Latest Price: ${result.pricelatest || 'N/A'}`);
        console.log(`   Median Price: ${result.pricemedian || 'N/A'}`);
        console.log(`   Average Price: ${result.priceavg || 'N/A'}`);
        console.log(`   Safe Price: ${result.pricesafe || 'N/A'}`);
        console.log(`   Min Price (90d): ${result.pricemin || 'N/A'}`);
        console.log(`   Max Price (90d): ${result.pricemax || 'N/A'}`);
        
        console.log("\n📈 Historical Prices:");
        console.log(`   24h Median: ${result.pricemedian24h || 'N/A'}`);
        console.log(`   7d Median: ${result.pricemedian7d || 'N/A'}`);
        console.log(`   30d Median: ${result.pricemedian30d || 'N/A'}`);
        console.log(`   90d Median: ${result.pricemedian90d || 'N/A'}`);
        
        console.log("\n🛒 Sales Data:");
        console.log(`   Sold Today: ${result.soldtoday || 'N/A'}`);
        console.log(`   Sold 24h: ${result.sold24h || 'N/A'}`);
        console.log(`   Sold 7d: ${result.sold7d || 'N/A'}`);
        console.log(`   Hours to Sold: ${result.hourstosold || 'N/A'}`);
        
        console.log("\n🎯 Item Details:");
        console.log(`   Wear: ${result.wear || 'N/A'}`);
        console.log(`   Rarity: ${result.rarity || 'N/A'}`);
        console.log(`   Quality: ${result.quality || 'N/A'}`);
        console.log(`   StatTrak: ${result.isstattrack ? 'Yes' : 'No'}`);
        console.log(`   Star: ${result.isstar ? 'Yes' : 'No'}`);
        console.log(`   Item Group: ${result.itemgroup || 'N/A'}`);
        console.log(`   Item Type: ${result.itemtype || 'N/A'}`);
        
        console.log("\n💰 Steam Market:");
        console.log(`   Buy Order Price: ${result.buyorderprice || 'N/A'}`);
        console.log(`   Offer Volume: ${result.offervolume || 'N/A'}`);
        console.log(`   Buy Order Volume: ${result.buyordervolume || 'N/A'}`);
        
        console.log("\n🖼️  Media:");
        console.log(`   Image URL: ${result.itemimage ? 'Available' : 'N/A'}`);
        
        console.log("\n📅 Metadata:");
        console.log(`   Price Updated: ${result.priceupdatedat || 'N/A'}`);
        console.log(`   Unstable: ${result.unstable ? 'Yes' : 'No'}`);
        if (result.unstablereason) {
          console.log(`   Unstable Reason: ${result.unstablereason}`);
        }
        
        // Check for missing critical data
        const missingFields = [];
        if (!result.pricelatest && !result.pricemedian) missingFields.push('prices');
        if (!result.wear) missingFields.push('wear');
        if (!result.rarity) missingFields.push('rarity');
        if (!result.isstattrack === undefined) missingFields.push('stattrak');
        
        if (missingFields.length > 0) {
          console.log(`\n⚠️  Missing critical fields: ${missingFields.join(', ')}`);
        } else {
          console.log("\n✅ All critical fields present!");
        }
        
      } else {
        console.log("❌ No data received from API");
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${skinName}:`, error.message);
    }
    
    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log("\n🏁 Test completed!");
}

testSteamAPI().catch(console.error);
