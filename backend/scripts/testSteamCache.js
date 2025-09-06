// /backend/scripts/testSteamCache.js (Backend)
import "dotenv/config";
import { fetchSkinPrice, getCacheStats, getCachedItems, clearCache } from "../src/services/steamService.js";

async function testSteamCache() {
  console.log("🧪 Testing Steam Price Service with Cache");
  console.log("==========================================");

  // Test skins to fetch
  const testSkins = [
    "AK-47 | Redline (Field-Tested)",
    "AWP | Dragon Lore (Factory New)",
    "M4A4 | Howl (Factory New)",
    "Karambit | Fade (Factory New)",
    "Glock-18 | Fade (Factory New)"
  ];

  try {
    // Clear cache first
    console.log("\n1. Clearing cache...");
    const clearedCount = clearCache();
    console.log(`✅ Cleared ${clearedCount} entries`);

    // Test cache stats
    console.log("\n2. Initial cache stats:");
    let stats = getCacheStats();
    console.log(JSON.stringify(stats, null, 2));

    // Fetch prices (should miss cache)
    console.log("\n3. Fetching prices (cache miss)...");
    const startTime = Date.now();
    
    for (const skin of testSkins) {
      console.log(`\n🔍 Fetching: ${skin}`);
      const priceData = await fetchSkinPrice(skin);
      
      if (priceData) {
        console.log(`✅ Price: $${priceData.pricelatest || priceData.lowest_price || 'N/A'}`);
        console.log(`📊 Source: ${priceData.source}`);
        console.log(`📈 Median: $${priceData.pricemedian || priceData.median_price || 'N/A'}`);
        console.log(`📊 Avg: $${priceData.priceavg || 'N/A'}`);
        console.log(`🛒 Sold 24h: ${priceData.sold24h || 'N/A'}`);
      } else {
        console.log(`❌ No price data found`);
      }
    }

    const firstFetchTime = Date.now() - startTime;
    console.log(`\n⏱️ First fetch took: ${firstFetchTime}ms`);

    // Test cache stats after fetching
    console.log("\n4. Cache stats after fetching:");
    stats = getCacheStats();
    console.log(JSON.stringify(stats, null, 2));

    // Fetch same prices again (should hit cache)
    console.log("\n5. Fetching same prices again (cache hit)...");
    const cacheStartTime = Date.now();
    
    for (const skin of testSkins) {
      console.log(`\n🔍 Fetching: ${skin}`);
      const priceData = await fetchSkinPrice(skin);
      
      if (priceData) {
        console.log(`✅ Price: $${priceData.pricelatest || priceData.lowest_price || 'N/A'}`);
        console.log(`📊 Source: ${priceData.source}`);
      } else {
        console.log(`❌ No price data found`);
      }
    }

    const cacheFetchTime = Date.now() - cacheStartTime;
    console.log(`\n⏱️ Cache fetch took: ${cacheFetchTime}ms`);
    console.log(`🚀 Speed improvement: ${Math.round((firstFetchTime / cacheFetchTime) * 100)}% faster`);

    // Show cached items
    console.log("\n6. Cached items:");
    const cachedItems = getCachedItems();
    cachedItems.forEach(item => {
      console.log(`📦 ${item.marketHashName}`);
      console.log(`   Age: ${item.ageMinutes} minutes`);
      console.log(`   Expired: ${item.isExpired ? 'Yes' : 'No'}`);
    });

    // Test cache expiration (simulate)
    console.log("\n7. Testing cache expiration...");
    console.log("⏳ Waiting 6 seconds to test expiration...");
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    // Try to fetch again (should still be cached)
    const priceData = await fetchSkinPrice(testSkins[0]);
    if (priceData) {
      console.log(`✅ Still cached: ${testSkins[0]}`);
    } else {
      console.log(`❌ Cache expired: ${testSkins[0]}`);
    }

    // Final cache stats
    console.log("\n8. Final cache stats:");
    stats = getCacheStats();
    console.log(JSON.stringify(stats, null, 2));

    console.log("\n✅ Steam Cache Test Completed Successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testSteamCache();
