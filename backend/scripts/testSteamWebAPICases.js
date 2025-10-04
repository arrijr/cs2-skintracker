// /backend/scripts/testSteamWebAPICases.js — [Backend]
// {/* Test SteamWebAPI for case data */}
import "dotenv/config";
import fetch from 'node-fetch';

const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;

async function testSteamWebAPICases() {
  console.log("🔍 Testing SteamWebAPI for case data...");
  
  if (!STEAM_WEB_API_KEY) {
    console.error("❌ STEAM_API_KEY not found in environment variables");
    return;
  }
  
  try {
    // Test 1: Get all cases (containers)
    console.log("📦 Testing: Get all cases (itemgroup=container)");
    const casesResponse = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&itemgroup=container`);
    
    if (!casesResponse.ok) {
      throw new Error(`SteamWebAPI error: ${casesResponse.status}`);
    }
    
    const cases = await casesResponse.json();
    console.log(`✅ Found ${cases.length} cases from SteamWebAPI`);
    
    // Show first 5 cases with their data
    console.log("\n📋 Sample cases from SteamWebAPI:");
    cases.slice(0, 5).forEach((caseItem, index) => {
      console.log(`${index + 1}. ${caseItem.marketname || caseItem.name}`);
      console.log(`   Latest Price: $${caseItem.pricelatest || 'N/A'}`);
      console.log(`   Latest Sell: $${caseItem.pricelatestsell || 'N/A'}`);
      console.log(`   Median Price: $${caseItem.pricemedian || 'N/A'}`);
      console.log(`   Average Price: $${caseItem.priceavg || 'N/A'}`);
      console.log(`   Sold 24h: ${caseItem.sold24h || 'N/A'}`);
      console.log(`   Image: ${caseItem.itemimage?.substring(0, 60)}...`);
      console.log(`   Updated: ${caseItem.priceupdatedat || 'N/A'}`);
      console.log("");
    });
    
    // Test 2: Search for specific cases we have in our DB
    console.log("🔍 Testing: Search for specific cases in our database");
    const testCases = ["Operation Bravo Case", "CS:GO Weapon Case", "Falchion Case"];
    
    for (const caseName of testCases) {
      console.log(`\n🔎 Searching for: ${caseName}`);
      
      // Search by name
      const searchResponse = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&itemgroup=container&search=${encodeURIComponent(caseName)}`);
      
      if (searchResponse.ok) {
        const searchResults = await searchResponse.json();
        const foundCase = searchResults.find(item => 
          item.marketname?.toLowerCase().includes(caseName.toLowerCase()) ||
          item.name?.toLowerCase().includes(caseName.toLowerCase())
        );
        
        if (foundCase) {
          console.log(`✅ Found: ${foundCase.marketname || foundCase.name}`);
          console.log(`   Price: $${foundCase.pricelatest || 'N/A'}`);
          console.log(`   Image: ${foundCase.itemimage?.substring(0, 60)}...`);
        } else {
          console.log(`❌ Not found: ${caseName}`);
        }
      } else {
        console.log(`❌ Search failed: ${searchResponse.status}`);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
  } catch (error) {
    console.error("❌ Error testing SteamWebAPI:", error);
  }
}

testSteamWebAPICases();
