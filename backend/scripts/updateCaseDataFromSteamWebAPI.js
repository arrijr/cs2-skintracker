// /backend/scripts/updateCaseDataFromSteamWebAPI.js — [Backend]
// {/* Update case data with real prices and images from SteamWebAPI */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;

async function updateCaseDataFromSteamWebAPI() {
  console.log("🔄 Updating case data from SteamWebAPI...");
  
  if (!STEAM_WEB_API_KEY) {
    console.error("❌ STEAM_API_KEY not found in environment variables");
    return;
  }
  
  try {
    // Get all cases from SteamWebAPI
    console.log("📦 Fetching cases from SteamWebAPI...");
    const response = await fetch(`https://www.steamwebapi.com/steam/api/items?key=${STEAM_WEB_API_KEY}&itemgroup=container`);
    
    if (!response.ok) {
      throw new Error(`SteamWebAPI error: ${response.status}`);
    }
    
    const steamCases = await response.json();
    console.log(`✅ Found ${steamCases.length} cases from SteamWebAPI`);
    
    // Get all cases from our database
    const ourCases = await prisma.case.findMany();
    console.log(`📋 Found ${ourCases.length} cases in our database`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    for (const ourCase of ourCases) {
      // Try to find matching case in SteamWebAPI data
      const matchingSteamCase = steamCases.find(steamCase => {
        const steamName = steamCase.marketname || steamCase.name || '';
        const ourName = ourCase.name || '';
        
        // Exact match or contains match
        return steamName.toLowerCase() === ourName.toLowerCase() ||
               steamName.toLowerCase().includes(ourName.toLowerCase()) ||
               ourName.toLowerCase().includes(steamName.toLowerCase());
      });
      
      if (matchingSteamCase) {
        const realPrice = matchingSteamCase.pricelatest || matchingSteamCase.pricelatestsell || 0;
        const realImage = matchingSteamCase.itemimage;
        const sold24h = matchingSteamCase.sold24h || 0;
        const sold7d = matchingSteamCase.sold7d || 0;
        const sold30d = matchingSteamCase.sold30d || 0;
        
        if (realPrice > 0) {
          // Calculate price changes
          const priceChange24h = matchingSteamCase.pricelatestsell24h ? 
            ((realPrice - matchingSteamCase.pricelatestsell24h) / matchingSteamCase.pricelatestsell24h) * 100 : 0;
          const priceChange7d = matchingSteamCase.pricelatestsell7d ? 
            ((realPrice - matchingSteamCase.pricelatestsell7d) / matchingSteamCase.pricelatestsell7d) * 100 : 0;
          const priceChange30d = matchingSteamCase.pricelatestsell30d ? 
            ((realPrice - matchingSteamCase.pricelatestsell30d) / matchingSteamCase.pricelatestsell30d) * 100 : 0;
          
          // Update remaining supply based on sales
          const currentRemaining = ourCase.remaining || 100000;
          const newRemaining = Math.max(0, currentRemaining - sold24h);
          
          await prisma.case.update({
            where: { id: ourCase.id },
            data: {
              price: realPrice,
              imageUrl: realImage || ourCase.imageUrl,
              marketCap: realPrice * newRemaining,
              priceChange24h: Math.round(priceChange24h * 100) / 100,
              priceChange7d: Math.round(priceChange7d * 100) / 100,
              priceChange30d: Math.round(priceChange30d * 100) / 100,
              remaining: newRemaining,
              dropped: (ourCase.dropped || 0) + sold24h,
              unboxed: (ourCase.unboxed || 0) + sold24h,
              lastUpdated: new Date()
            }
          });
          
          console.log(`✅ Updated: ${ourCase.name}`);
          console.log(`   Price: $${ourCase.price} → $${realPrice}`);
          console.log(`   Image: ${realImage ? 'Updated' : 'Kept existing'}`);
          console.log(`   Sales 24h: ${sold24h}`);
          console.log("");
          
          updatedCount++;
        } else {
          console.log(`⚠️  No price data for: ${ourCase.name}`);
        }
      } else {
        console.log(`❌ Not found in SteamWebAPI: ${ourCase.name}`);
        notFoundCount++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 Update completed!`);
    console.log(`✅ Updated: ${updatedCount} cases`);
    console.log(`❌ Not found: ${notFoundCount} cases`);
    
  } catch (error) {
    console.error("❌ Error updating case data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCaseDataFromSteamWebAPI();
