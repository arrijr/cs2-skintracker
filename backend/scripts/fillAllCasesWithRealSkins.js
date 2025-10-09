// /backend/scripts/fillAllCasesWithRealSkins.js — [Backend]
// {/* Fill all cases with real weapon skins from database */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Real weapon skins to add to cases (diverse rarities)
const realWeaponSkins = [
  // Covert (Red)
  { name: "AK-47 | Vulcan", rarity: "Covert" },
  { name: "AWP | Asiimov", rarity: "Covert" },
  { name: "M4A1-S | Cyrex", rarity: "Covert" },
  { name: "Glock-18 | Fade", rarity: "Covert" },
  { name: "Desert Eagle | Blaze", rarity: "Covert" },
  
  // Classified (Pink)
  { name: "AK-47 | Jaguar", rarity: "Classified" },
  { name: "AWP | Graphite", rarity: "Classified" },
  { name: "M4A4 | X-Ray", rarity: "Classified" },
  { name: "USP-S | Orion", rarity: "Classified" },
  { name: "P250 | Undertow", rarity: "Classified" },
  
  // Restricted (Purple)
  { name: "Tec-9 | Toxic", rarity: "Restricted" },
  { name: "Five-SeveN | Fowl Play", rarity: "Restricted" },
  { name: "CZ75-Auto | The Fuschia is Now", rarity: "Restricted" },
  { name: "P2000 | Fire Elemental", rarity: "Restricted" },
  { name: "Desert Eagle | Cobalt Disruption", rarity: "Restricted" },
  
  // Mil-Spec (Blue)
  { name: "Dual Berettas | Panther", rarity: "Mil-Spec" },
  { name: "P90 | Trigon", rarity: "Mil-Spec" },
  { name: "UMP-45 | Delusion", rarity: "Mil-Spec" },
  { name: "MP7 | Skulls", rarity: "Mil-Spec" },
  { name: "MAC-10 | Malachite", rarity: "Mil-Spec" },
  
  // Industrial (Light Blue)
  { name: "MP9 | Rose Iron", rarity: "Industrial" },
  { name: "PP-Bizon | Water Sigil", rarity: "Industrial" },
  { name: "Galil AR | Shattered", rarity: "Industrial" },
  { name: "FAMAS | Pulse", rarity: "Industrial" },
  { name: "AUG | Chameleon", rarity: "Industrial" },
  
  // Consumer (White)
  { name: "SG 553 | Ultraviolet", rarity: "Consumer" },
  { name: "SSG 08 | Blood in the Water", rarity: "Consumer" },
  { name: "SCAR-20 | Cardiac", rarity: "Consumer" },
  { name: "G3SG1 | The Executioner", rarity: "Consumer" },
  { name: "MAG-7 | Memento", rarity: "Consumer" },
  { name: "Nova | Antique", rarity: "Consumer" },
  { name: "Sawed-Off | The Kraken", rarity: "Consumer" },
  { name: "XM1014 | Quicksilver", rarity: "Consumer" },
  { name: "M249 | System Lock", rarity: "Consumer" },
  { name: "Negev | Terrain", rarity: "Consumer" }
];

async function fillAllCasesWithRealSkins() {
  try {
    console.log("🎨 Filling all cases with real weapon skins...");
    
    // Get all cases
    const cases = await prisma.case.findMany({
      orderBy: { id: 'asc' }
    });
    
    console.log(`📦 Found ${cases.length} cases`);
    
    for (const caseItem of cases) {
      console.log(`\n🎯 Adding skins to ${caseItem.name}...`);
      
      // Clear existing case-skin relationships
      await prisma.caseSkin.deleteMany({
        where: { caseId: caseItem.id }
      });
      
      // Find matching skins in database
      const matchingSkins = [];
      
      for (const skinTemplate of realWeaponSkins) {
        const skin = await prisma.skin.findFirst({
          where: {
            name: {
              contains: skinTemplate.name.split(' | ')[1] // Match by weapon name
            },
            rarity: skinTemplate.rarity,
            weaponType: { not: 'container' }
          }
        });
        
        if (skin) {
          matchingSkins.push({
            ...skin,
            templateRarity: skinTemplate.rarity
          });
        }
      }
      
      // If no exact matches found, get random weapon skins
      if (matchingSkins.length === 0) {
        console.log(`⚠️ No exact matches for ${caseItem.name}, using random weapon skins`);
        
        const randomSkins = await prisma.skin.findMany({
          where: {
            weaponType: { not: 'container' },
            rarity: { not: null }
          },
          take: 30,
          orderBy: { id: 'asc' }
        });
        
        matchingSkins.push(...randomSkins.map(skin => ({
          ...skin,
          templateRarity: skin.rarity || 'Consumer'
        })));
      }
      
      // Add skins to case with realistic drop rates
      const rarityWeights = {
        'Consumer': 0.7992,      // 79.92%
        'Industrial': 0.1598,    // 15.98%
        'Mil-Spec': 0.0319,      // 3.19%
        'Restricted': 0.0064,    // 0.64%
        'Classified': 0.0025,    // 0.25%
        'Covert': 0.0006         // 0.06%
      };
      
      let totalWeight = 0;
      const skinEntries = [];
      
      for (const skin of matchingSkins.slice(0, 25)) { // Max 25 skins per case
        const weight = rarityWeights[skin.templateRarity] || 0.1;
        totalWeight += weight;
        
        skinEntries.push({
          caseId: caseItem.id,
          skinId: skin.id,
          rarity: skin.templateRarity,
          dropChance: weight * 100, // Convert to percentage
          isSpecial: skin.templateRarity === 'Covert'
        });
      }
      
      
      // Insert case-skin relationships
      if (skinEntries.length > 0) {
        await prisma.caseSkin.createMany({
          data: skinEntries
        });
        
        console.log(`✅ Added ${skinEntries.length} skins to ${caseItem.name}`);
      } else {
        console.log(`❌ No skins found for ${caseItem.name}`);
      }
    }
    
    console.log("\n🎉 All cases filled with real weapon skins!");
    
    // Show summary
    const caseCounts = await prisma.caseSkin.groupBy({
      by: ['caseId'],
      _count: { skinId: true }
    });
    
    console.log("\n📊 Summary:");
    for (const count of caseCounts) {
      const caseData = await prisma.case.findUnique({
        where: { id: count.caseId },
        select: { name: true }
      });
      console.log(`  ${caseData?.name}: ${count._count.skinId} skins`);
    }
    
  } catch (error) {
    console.error("❌ Error filling cases with skins:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fillAllCasesWithRealSkins();
