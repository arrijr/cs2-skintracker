// /backend/scripts/testByMykelAPI.js — [Backend]
// {/* Test ByMykel CSGO API for case-skin relationships */}
import fetch from 'node-fetch';

async function testByMykelAPI() {
  console.log("🔍 Testing ByMykel CSGO API for case-skin relationships...");
  
  try {
    // Test the ByMykel CSGO API
    const baseUrl = 'https://csgo-api.com/v1';
    
    console.log("📦 Testing cases endpoint...");
    const casesResponse = await fetch(`${baseUrl}/cases`);
    
    if (casesResponse.ok) {
      const cases = await casesResponse.json();
      console.log(`✅ Found ${cases.length} cases`);
      
      // Look for Horizon Case specifically
      const horizonCase = cases.find(c => c.name && c.name.toLowerCase().includes('horizon'));
      if (horizonCase) {
        console.log("\n🔍 Horizon Case found:");
        console.log(JSON.stringify(horizonCase, null, 2));
      }
      
      // Test a specific case to see if it has contains array
      if (cases.length > 0) {
        const sampleCase = cases[0];
        console.log("\n📋 Sample case structure:");
        console.log(`  - ID: ${sampleCase.id}`);
        console.log(`  - Name: ${sampleCase.name}`);
        console.log(`  - Contains: ${sampleCase.contains ? sampleCase.contains.length : 'N/A'} items`);
        
        if (sampleCase.contains && sampleCase.contains.length > 0) {
          console.log("  - Sample contained skin:");
          console.log(JSON.stringify(sampleCase.contains[0], null, 2));
        }
      }
    } else {
      console.log(`❌ Cases endpoint error: ${casesResponse.status}`);
    }
    
    // Test skins endpoint
    console.log("\n📦 Testing skins endpoint...");
    const skinsResponse = await fetch(`${baseUrl}/skins`);
    
    if (skinsResponse.ok) {
      const skins = await skinsResponse.json();
      console.log(`✅ Found ${skins.length} skins`);
    } else {
      console.log(`❌ Skins endpoint error: ${skinsResponse.status}`);
    }
    
    // Test collections endpoint
    console.log("\n📦 Testing collections endpoint...");
    const collectionsResponse = await fetch(`${baseUrl}/collections`);
    
    if (collectionsResponse.ok) {
      const collections = await collectionsResponse.json();
      console.log(`✅ Found ${collections.length} collections`);
      
      // Look for Horizon collection
      const horizonCollection = collections.find(c => c.name && c.name.toLowerCase().includes('horizon'));
      if (horizonCollection) {
        console.log("\n🔍 Horizon Collection found:");
        console.log(JSON.stringify(horizonCollection, null, 2));
      }
    } else {
      console.log(`❌ Collections endpoint error: ${collectionsResponse.status}`);
    }
    
  } catch (error) {
    console.error("❌ Error testing ByMykel API:", error);
  }
}

testByMykelAPI();
