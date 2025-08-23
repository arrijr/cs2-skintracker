// backend/scripts/checkEnv.js
// {/* Environment Check: Show all Steam-related env vars */}
import "dotenv/config";

console.log("🔍 Environment Variables Check\n");

console.log("📋 Steam API Configuration:");
console.log(`   STEAM_API_KEY: ${process.env.STEAM_API_KEY ? 'SET' : 'NOT SET'}`);
if (process.env.STEAM_API_KEY) {
  console.log(`   Key Length: ${process.env.STEAM_API_KEY.length} characters`);
  console.log(`   Key Preview: ${process.env.STEAM_API_KEY.substring(0, 8)}...`);
} else {
  console.log("   ⚠️  STEAM_API_KEY is missing!");
}

console.log("\n🌐 API URLs:");
console.log(`   Steam Web API: https://www.steamwebapi.com/steam/api/item?key=${process.env.STEAM_API_KEY ? 'HIDDEN' : 'MISSING'}&game=cs2&market_hash_name=test`);
console.log(`   Steam Community: https://steamcommunity.com/market/priceoverview/?appid=730&currency=3&market_hash_name=test`);

console.log("\n🔧 Other Config:");
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);

console.log("\n📝 To set STEAM_API_KEY in Render:");
console.log("   1. Go to Render Dashboard");
console.log("   2. Select your backend service");
console.log("   3. Go to Environment tab");
console.log("   4. Add: STEAM_API_KEY = your_api_key_here");
console.log("   5. Redeploy the service");
