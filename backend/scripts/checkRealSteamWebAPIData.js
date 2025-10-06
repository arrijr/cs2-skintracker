// /backend/scripts/checkRealSteamWebAPIData.js — [Backend]
// {/* Check real SteamWebAPI.com data for Operation Breakout */}
import "dotenv/config";

async function checkRealSteamWebAPIData() {
  console.log("🔍 Checking real SteamWebAPI.com data for Operation Breakout Weapon Case...");
  
  const STEAM_API_KEY = process.env.STEAM_API_KEY;
  if (!STEAM_API_KEY) {
    console.log("❌ STEAM_API_KEY not found in environment");
    return;
  }

  try {
    // Search for Operation Breakout Weapon Case
    const searchUrl = `https://www.steamwebapi.com/steam/api/items?key=${STEAM_API_KEY}&game=cs2&search=Operation Breakout Weapon Case`;
    
    console.log("📡 Fetching data from SteamWebAPI.com...");
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const items = await response.json();
    console.log(`📊 Found ${items.length} items matching search`);
    
    // Find Operation Breakout Weapon Case
    const breakoutCase = items.find(item => 
      item.markethashname && 
      item.markethashname.toLowerCase().includes('operation breakout') &&
      item.markethashname.toLowerCase().includes('weapon case')
    );
    
    if (breakoutCase) {
      console.log("\n✅ Found Operation Breakout Weapon Case:");
      console.log(`   Market Hash Name: ${breakoutCase.markethashname}`);
      console.log(`   Current Price: $${breakoutCase.pricelatest || 'N/A'}`);
      console.log(`   Latest Sell Price: $${breakoutCase.pricelatestsell || 'N/A'}`);
      console.log(`   Real Market Price: $${breakoutCase.pricereal || 'N/A'}`);
      console.log(`   Offer Volume: ${breakoutCase.offervolume || 'N/A'}`);
      console.log(`   Sold Today: ${breakoutCase.soldtoday || 'N/A'}`);
      console.log(`   Sold 24h: ${breakoutCase.sold24h || 'N/A'}`);
      console.log(`   Sold 7d: ${breakoutCase.sold7d || 'N/A'}`);
      console.log(`   Sold 30d: ${breakoutCase.sold30d || 'N/A'}`);
      console.log(`   Sold 90d: ${breakoutCase.sold90d || 'N/A'}`);
      console.log(`   Buy Order Price: $${breakoutCase.buyorderprice || 'N/A'}`);
      console.log(`   Buy Order Volume: ${breakoutCase.buyordervolume || 'N/A'}`);
      console.log(`   Hours to Sold: ${breakoutCase.hourstosold || 'N/A'}`);
      console.log(`   Win/Loss %: ${breakoutCase.winlosspercentage || 'N/A'}%`);
      console.log(`   Item Group: ${breakoutCase.itemgroup || 'N/A'}`);
      console.log(`   Rarity: ${breakoutCase.rarity || 'N/A'}`);
      console.log(`   Quality: ${breakoutCase.quality || 'N/A'}`);
      console.log(`   Unstable: ${breakoutCase.unstable ? 'Yes' : 'No'}`);
      console.log(`   Last Updated: ${breakoutCase.updatedat || 'N/A'}`);
    } else {
      console.log("❌ Operation Breakout Weapon Case not found");
      console.log("\n📋 Available items:");
      items.slice(0, 10).forEach(item => {
        console.log(`   - ${item.markethashname || item.marketname}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error checking SteamWebAPI data:", error);
  }
}

checkRealSteamWebAPIData();
