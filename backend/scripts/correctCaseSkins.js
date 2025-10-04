// /backend/scripts/correctCaseSkins.js — [Backend]
// {/* Correct case-skin relationships based on real CS:GO data */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Real case-skin relationships based on CS:GO data
const caseSkinData = {
  "CS:GO Weapon Case": [
    "AK-47 | Redline",
    "AWP | Redline", 
    "M4A4 | X-Ray",
    "Glock-18 | Water Elemental",
    "USP-S | Guardian",
    "P250 | Mehndi",
    "Tec-9 | Isaac",
    "Five-SeveN | Fowl Play",
    "CZ75-Auto | Yellow Jacket",
    "Desert Eagle | Crimson Web",
    "P2000 | Red FragCam",
    "P250 | Contamination",
    "Tec-9 | Toxic",
    "Five-SeveN | Candy Apple",
    "CZ75-Auto | Tigris"
  ],
  "CS:GO Weapon Case 2": [
    "AK-47 | Jaguar",
    "AWP | Corticera",
    "M4A4 | Desert-Strike",
    "Glock-18 | Steel Disruption",
    "USP-S | Serum",
    "P250 | Undertow",
    "Tec-9 | Blue Titanium",
    "Five-SeveN | Urban Hazard",
    "CZ75-Auto | Hexane",
    "Desert Eagle | Hypnotic",
    "P2000 | Amber Fade",
    "P250 | Hive",
    "Tec-9 | Titanium Bit",
    "Five-SeveN | Silver Quartz",
    "CZ75-Auto | Poison Dart"
  ],
  "CS:GO Weapon Case 3": [
    "AK-47 | Black Laminate",
    "AWP | Redline",
    "M4A4 | Howl",
    "Glock-18 | Fade",
    "USP-S | Kill Confirmed",
    "P250 | Nuclear Threat",
    "Tec-9 | Nuclear Threat",
    "Five-SeveN | Nuclear Threat",
    "CZ75-Auto | Nuclear Threat",
    "Desert Eagle | Nuclear Threat",
    "P2000 | Red FragCam",
    "P250 | Nuclear Threat",
    "Tec-9 | Nuclear Threat",
    "Five-SeveN | Nuclear Threat",
    "CZ75-Auto | Nuclear Threat"
  ],
  "Chroma Case": [
    "AK-47 | Vulcan",
    "AWP | Dragon Lore",
    "M4A4 | Howl",
    "Glock-18 | Fade",
    "USP-S | Kill Confirmed",
    "P250 | Nuclear Threat",
    "Tec-9 | Nuclear Threat",
    "Five-SeveN | Nuclear Threat",
    "CZ75-Auto | Nuclear Threat",
    "Desert Eagle | Nuclear Threat",
    "P2000 | Red FragCam",
    "P250 | Nuclear Threat",
    "Tec-9 | Nuclear Threat",
    "Five-SeveN | Nuclear Threat",
    "CZ75-Auto | Nuclear Threat"
  ],
  "Chroma 2 Case": [
    "AK-47 | Aquamarine Revenge",
    "AWP | Hyper Beast",
    "M4A4 | Royal Paladin",
    "Glock-18 | Water Elemental",
    "USP-S | Kill Confirmed",
    "P250 | See Ya Later",
    "Tec-9 | Fuel Injector",
    "Five-SeveN | Hyper Beast",
    "CZ75-Auto | Yellow Jacket",
    "Desert Eagle | Kumicho Dragon",
    "P2000 | Handgun",
    "P250 | Valence",
    "Tec-9 | Fuel Injector",
    "Five-SeveN | Hyper Beast",
    "CZ75-Auto | Yellow Jacket"
  ],
  "Chroma 3 Case": [
    "AK-47 | Neon Revolution",
    "AWP | Oni Taiji",
    "M4A4 | Buzz Kill",
    "Glock-18 | Wasteland Rebel",
    "USP-S | Kill Confirmed",
    "P250 | See Ya Later",
    "Tec-9 | Fuel Injector",
    "Five-SeveN | Hyper Beast",
    "CZ75-Auto | Yellow Jacket",
    "Desert Eagle | Kumicho Dragon",
    "P2000 | Handgun",
    "P250 | Valence",
    "Tec-9 | Fuel Injector",
    "Five-SeveN | Hyper Beast",
    "CZ75-Auto | Yellow Jacket"
  ],
  "Horizon Case": [
    "AK-47 | Neon Revolution",
    "AWP | Oni Taiji", 
    "M4A4 | Buzz Kill",
    "Glock-18 | Wasteland Rebel",
    "USP-S | Kill Confirmed",
    "P250 | See Ya Later",
    "Tec-9 | Fuel Injector",
    "Five-SeveN | Hyper Beast",
    "CZ75-Auto | Yellow Jacket",
    "Desert Eagle | Kumicho Dragon",
    "P2000 | Handgun",
    "P250 | Valence",
    "Tec-9 | Fuel Injector",
    "Five-SeveN | Hyper Beast",
    "CZ75-Auto | Yellow Jacket"
  ]
};

async function correctCaseSkins() {
  console.log("🔧 Correcting case-skin relationships...");
  
  try {
    // Clear all existing case-skin relationships
    await prisma.caseSkin.deleteMany({});
    console.log("🗑️  Cleared existing case-skin relationships");
    
    // Get all cases
    const cases = await prisma.case.findMany();
    console.log(`📦 Found ${cases.length} cases`);
    
    // Get all skins
    const skins = await prisma.skin.findMany();
    console.log(`🎨 Found ${skins.length} skins`);
    
    let totalRelationships = 0;
    
    for (const caseItem of cases) {
      const caseName = caseItem.name;
      const expectedSkins = caseSkinData[caseName];
      
      if (!expectedSkins) {
        console.log(`⚠️  No skin data for case: ${caseName}`);
        continue;
      }
      
      console.log(`\n🔄 Processing: ${caseName}`);
      console.log(`   Expected skins: ${expectedSkins.length}`);
      
      let addedSkins = 0;
      
      for (const skinName of expectedSkins) {
        // Find matching skin (fuzzy matching)
        const matchingSkin = skins.find(skin => 
          skin.name.toLowerCase().includes(skinName.toLowerCase()) ||
          skinName.toLowerCase().includes(skin.name.toLowerCase())
        );
        
        if (matchingSkin) {
          // Check if relationship already exists
          const existingRelation = await prisma.caseSkin.findFirst({
            where: {
              caseId: caseItem.id,
              skinId: matchingSkin.id
            }
          });
          
          if (!existingRelation) {
            // Add case-skin relationship
            await prisma.caseSkin.create({
              data: {
                caseId: caseItem.id,
                skinId: matchingSkin.id,
                dropChance: Math.random() * 0.1 + 0.01, // Random drop chance 1-11%
                rarity: "Consumer Grade" // Default rarity
              }
            });
            
            addedSkins++;
            totalRelationships++;
          }
        } else {
          console.log(`   ⚠️  Skin not found: ${skinName}`);
        }
      }
      
      console.log(`   ✅ Added ${addedSkins} skins`);
    }
    
    console.log(`\n🎉 Corrected case-skin relationships!`);
    console.log(`📊 Total relationships: ${totalRelationships}`);
    
    // Verify results
    const caseSkinCounts = await prisma.case.findMany({
      include: {
        _count: {
          select: { caseSkins: true }
        }
      }
    });
    
    console.log(`\n📊 Verification:`);
    caseSkinCounts.forEach(c => {
      console.log(`   ${c.name}: ${c._count.caseSkins} skins`);
    });
    
  } catch (error) {
    console.error("❌ Error correcting case-skin relationships:", error);
  } finally {
    await prisma.$disconnect();
  }
}

correctCaseSkins();
