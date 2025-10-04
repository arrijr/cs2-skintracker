// /backend/scripts/checkCurrentCaseSkins.js — [Backend]
// {/* Check current case-skin relationships in our database */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkCurrentCaseSkins() {
  console.log("🔍 Checking current case-skin relationships...");
  
  try {
    // Get all cases with their skins
    const casesWithSkins = await prisma.case.findMany({
      include: {
        caseSkins: {
          include: {
            skin: {
              select: {
                id: true,
                name: true,
                rarity: true
              }
            }
          }
        }
      }
    });
    
    console.log(`📦 Found ${casesWithSkins.length} cases`);
    
    // Show some examples
    casesWithSkins.slice(0, 5).forEach(caseItem => {
      console.log(`\n📦 ${caseItem.name}:`);
      console.log(`   ID: ${caseItem.id}`);
      console.log(`   Skins: ${caseItem.caseSkins.length}`);
      
      if (caseItem.caseSkins.length > 0) {
        console.log("   Sample skins:");
        caseItem.caseSkins.slice(0, 3).forEach(cs => {
          console.log(`     - ${cs.skin.name} (${cs.skin.rarity}) - Drop Chance: ${cs.dropChance}%`);
        });
      }
    });
    
    // Check Horizon Case specifically
    const horizonCase = casesWithSkins.find(c => c.name.toLowerCase().includes('horizon'));
    if (horizonCase) {
      console.log(`\n🔍 Horizon Case Details:`);
      console.log(`   ID: ${horizonCase.id}`);
      console.log(`   Name: ${horizonCase.name}`);
      console.log(`   Skins: ${horizonCase.caseSkins.length}`);
      
      if (horizonCase.caseSkins.length > 0) {
        console.log("   All contained skins:");
        horizonCase.caseSkins.forEach(cs => {
          console.log(`     - ${cs.skin.name} (${cs.skin.rarity}) - Drop Chance: ${cs.dropChance}%`);
        });
      }
    }
    
    // Statistics
    const totalCaseSkins = casesWithSkins.reduce((sum, c) => sum + c.caseSkins.length, 0);
    const casesWithoutSkins = casesWithSkins.filter(c => c.caseSkins.length === 0).length;
    
    console.log(`\n📊 Statistics:`);
    console.log(`   Total case-skin relationships: ${totalCaseSkins}`);
    console.log(`   Cases without skins: ${casesWithoutSkins}`);
    console.log(`   Average skins per case: ${(totalCaseSkins / casesWithSkins.length).toFixed(1)}`);
    
  } catch (error) {
    console.error("❌ Error checking case-skin relationships:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentCaseSkins();
