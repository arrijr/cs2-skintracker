// /backend/scripts/testRenderBackend.js — [Backend]
// {/* Test Render backend endpoints */}
import "dotenv/config";
import fetch from 'node-fetch';

async function testRenderBackend() {
  console.log("🔍 Testing Render backend endpoints...");
  
  const endpoints = [
    "https://cs2-skintracker-dev.onrender.com/api/v1/cases",
    "https://cs2-skintracker-dev.onrender.com/api/v1/cases/1",
    "https://cs2-skintracker-dev.onrender.com/api/v1/skins?limit=5",
    "https://cs2-skintracker-dev.onrender.com/health"
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🌐 Testing: ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Success: ${response.status}`);
        console.log(`📊 Response type: ${typeof data}`);
        if (Array.isArray(data)) {
          console.log(`📊 Array length: ${data.length}`);
        }
      } else {
        console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }
}

testRenderBackend();
