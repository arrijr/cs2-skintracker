// /backend/scripts/fixCaseReleaseDates.js — [Backend]
// {/* Fix case release dates using Steam API data */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fetch from 'node-fetch';

const prisma = new PrismaClient();
const STEAM_WEB_API_KEY = process.env.STEAM_API_KEY;

async function fixCaseReleaseDates() {
  console.log("🔧 Fixing case release dates from Steam API...");
  
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
      
      if (matchingSteamCase && matchingSteamCase.firstseenat) {
        const releaseDate = new Date(matchingSteamCase.firstseenat.date);
        
        // Only update if the release date is different
        if (!ourCase.releaseDate || ourCase.releaseDate.getTime() !== releaseDate.getTime()) {
          await prisma.case.update({
            where: { id: ourCase.id },
            data: {
              releaseDate: releaseDate,
              lastUpdated: new Date()
            }
          });
          
          console.log(`✅ Updated: ${ourCase.name}`);
          console.log(`   Release Date: ${ourCase.releaseDate ? ourCase.releaseDate.toISOString().split('T')[0] : 'N/A'} → ${releaseDate.toISOString().split('T')[0]}`);
          console.log("");
          
          updatedCount++;
        } else {
          console.log(`⏭️  Skipped: ${ourCase.name} (already correct)`);
        }
      } else {
        console.log(`❌ Not found in SteamWebAPI: ${ourCase.name}`);
        notFoundCount++;
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`🎉 Release date update completed!`);
    console.log(`✅ Updated: ${updatedCount} cases`);
    console.log(`❌ Not found: ${notFoundCount} cases`);
    
    // Show some examples of corrected dates
    console.log("\n📅 Sample corrected release dates:");
    const sampleCases = await prisma.case.findMany({
      take: 5,
      orderBy: { releaseDate: 'asc' }
    });
    
    sampleCases.forEach(caseItem => {
      console.log(`  - ${caseItem.name}: ${caseItem.releaseDate?.toISOString().split('T')[0] || 'N/A'}`);
    });
    
  } catch (error) {
    console.error("❌ Error fixing case release dates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCaseReleaseDates();
