// /backend/scripts/testByMykelAPI.js — [Backend]
// {/* Test ByMykel CSGO-API for case-skin relationships */}
import "dotenv/config";
import fetch from 'node-fetch';

async function testByMykelAPI() {
  console.log("🔍 Testing ByMykel CSGO-API...");
  
  const baseUrl = "https://csgo-api.com";
  
  try {
    // Test different endpoints
    const endpoints = [
      "/v1/items",
      "/v1/weapons", 
      "/v1/cases",
      "/v1/collections",
      "/v1/skins",
      "/api/items",
      "/api/weapons",
      "/api/cases",
      "/api/collections",
      "/api/skins"
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n🌐 Testing: ${baseUrl}${endpoint}`);
        const response = await fetch(`${baseUrl}${endpoint}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success: ${response.status}`);
          console.log(`📊 Data type: ${typeof data}`);
          console.log(`📊 Data length: ${Array.isArray(data) ? data.length : 'N/A'}`);
          
          if (Array.isArray(data) && data.length > 0) {
            console.log(`📦 Sample item:`, JSON.stringify(data[0], null, 2));
          }
        } else {
          console.log(`❌ Failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
    // Test specific case lookup
    console.log(`\n🔍 Testing specific case lookup...`);
    const caseEndpoints = [
      "/v1/cases/1",
      "/v1/cases/CS:GO-Weapon-Case",
      "/api/cases/1",
      "/api/cases/CS:GO-Weapon-Case"
    ];
    
    for (const endpoint of caseEndpoints) {
      try {
        console.log(`\n🌐 Testing: ${baseUrl}${endpoint}`);
        const response = await fetch(`${baseUrl}${endpoint}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Success: ${response.status}`);
          console.log(`📦 Case data:`, JSON.stringify(data, null, 2));
        } else {
          console.log(`❌ Failed: ${response.status} ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error("❌ Error testing ByMykel API:", error);
  }
}

testByMykelAPI();