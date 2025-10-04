// /backend/scripts/findBrokenFangCase.js — [Backend]
// {/* Find the actual Operation Broken Fang Case in Steam API */}
import "dotenv/config";
import fetch from 'node-fetch';

const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;

async function findBrokenFangCase() {
  console.log("🔍 Searching for Operation Broken Fang Case...");
  
  if (!STEAM_WEB_API_KEY) {
    console.error("❌ STEAM_API_KEY not found in environment variables");
    return;
  }
  
  try {
    // Search for cases specifically
    console.log("📦 Searching for cases...");
    const response = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&itemgroup=container`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Found ${data.length} container items`);
    
    // Search for various case name patterns
    const searchTerms = [
      'operation broken fang case',
      'broken fang case',
      'operation broken fang',
      'broken fang',
      'case'
    ];
    
    for (const term of searchTerms) {
      console.log(`\n🔍 Searching for: "${term}"`);
      const matches = data.filter(item => 
        item.marketname && item.marketname.toLowerCase().includes(term.toLowerCase())
      );
      
      console.log(`Found ${matches.length} matches:`);
      matches.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.marketname}`);
        console.log(`     ID: ${item.id}`);
        console.log(`     First Seen: ${item.firstseenat?.date || 'N/A'}`);
        console.log(`     First Seen Time: ${item.firstseentime || 'N/A'}`);
        console.log(`     Price: $${item.pricelatest || 'N/A'}`);
        console.log(`     Image: ${item.itemimage ? 'Yes' : 'No'}`);
        console.log('');
      });
    }
    
    // Also search for any items with "case" in the name that might be actual cases
    console.log("\n🔍 Searching for all items with 'case' in name...");
    const caseItems = data.filter(item => 
      item.marketname && 
      item.marketname.toLowerCase().includes('case') &&
      !item.marketname.toLowerCase().includes('sticker') &&
      !item.marketname.toLowerCase().includes('key')
    );
    
    console.log(`Found ${caseItems.length} potential cases:`);
    caseItems.slice(0, 10).forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.marketname}`);
      console.log(`     First Seen: ${item.firstseenat?.date || 'N/A'}`);
      console.log(`     Price: $${item.pricelatest || 'N/A'}`);
    });
    
  } catch (error) {
    console.error("❌ Error searching for cases:", error);
  }
}

findBrokenFangCase();
