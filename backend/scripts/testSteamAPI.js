// /backend/scripts/testSteamAPI.js — [Backend]
// {/* Test Steam API connection */}
import "dotenv/config";

const STEAM_API_KEY = process.env.STEAM_API_KEY;

async function testSteamAPI() {
  try {
    console.log("🔍 Testing Steam API connection...");
    console.log("🔑 API Key present:", !!STEAM_API_KEY);
    
    if (!STEAM_API_KEY) {
      console.error("❌ STEAM_API_KEY environment variable is required");
      return;
    }

    const url = `https://api.steampowered.com/IEconItems_730/GetSchema/v2/?key=${STEAM_API_KEY}&format=json`;
    console.log("🌐 URL:", url);

    const response = await fetch(url);
    console.log("📡 Response status:", response.status);
    console.log("📡 Response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Steam API error:", errorText);
      return;
    }

    const data = await response.json();
    console.log("✅ Steam API response received");
    console.log("📊 Response keys:", Object.keys(data));
    
    if (data.result) {
      console.log("📦 Result keys:", Object.keys(data.result));
      if (data.result.items) {
        console.log("🎯 Items count:", data.result.items.length);
        
        // Find cases
        const cases = data.result.items.filter(item => 
          item.type === "Container" && 
          item.name && 
          item.name.toLowerCase().includes('case') &&
          !item.name.toLowerCase().includes('key')
        );
        
        console.log("🎲 Cases found:", cases.length);
        console.log("🎲 First 5 cases:");
        cases.slice(0, 5).forEach((caseItem, index) => {
          console.log(`${index + 1}. ${caseItem.name} (${caseItem.type})`);
        });
      }
    }

  } catch (error) {
    console.error("❌ Error testing Steam API:", error);
  }
}

testSteamAPI();