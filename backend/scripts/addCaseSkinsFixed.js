// /backend/scripts/addCaseSkinsFixed.js — [Backend]
// {/* Add contained skins for cases - Fixed version */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Case to skins mapping based on real CS2 case contents
const caseSkinsMapping = {
  "CS:GO Weapon Case": [
    { name: "AK-47 | Redline", rarity: "classified" },
    { name: "AWP | Redline", rarity: "covert" },
    { name: "M4A1-S | Guardian", rarity: "restricted" },
    { name: "Glock-18 | Water Elemental", rarity: "milspec" },
    { name: "USP-S | Guardian", rarity: "restricted" },
    { name: "P250 | Mehndi", rarity: "industrial" },
    { name: "Tec-9 | Isaac", rarity: "consumer" },
    { name: "Five-SeveN | Kami", rarity: "consumer" },
    { name: "CZ75-Auto | Tigris", rarity: "industrial" },
    { name: "P2000 | Corticera", rarity: "milspec" },
    { name: "Desert Eagle | Crimson Web", rarity: "restricted" },
    { name: "Dual Berettas | Hemoglobin", rarity: "industrial" },
    { name: "P90 | Trigon", rarity: "restricted" },
    { name: "UMP-45 | Delusion", rarity: "milspec" },
    { name: "MP7 | Skulls", rarity: "industrial" },
    { name: "MAC-10 | Malachite", rarity: "consumer" },
    { name: "MP9 | Rose Iron", rarity: "consumer" },
    { name: "PP-Bizon | Water Sigil", rarity: "industrial" },
    { name: "Galil AR | Shattered", rarity: "milspec" },
    { name: "FAMAS | Pulse", rarity: "restricted" },
    { name: "M4A4 | X-Ray", rarity: "classified" },
    { name: "AK-47 | Jaguar", rarity: "covert" },
    { name: "AUG | Chameleon", rarity: "restricted" },
    { name: "SG 553 | Ultraviolet", rarity: "milspec" },
    { name: "AWP | Graphite", rarity: "covert" },
    { name: "SSG 08 | Blood in the Water", rarity: "restricted" },
    { name: "SCAR-20 | Cardiac", rarity: "milspec" },
    { name: "G3SG1 | The Executioner", rarity: "industrial" },
    { name: "MAG-7 | Memento", rarity: "consumer" },
    { name: "Nova | Antique", rarity: "consumer" },
    { name: "Sawed-Off | The Kraken", rarity: "industrial" },
    { name: "XM1014 | Quicksilver", rarity: "milspec" },
    { name: "M249 | System Lock", rarity: "restricted" },
    { name: "Negev | Terrain", rarity: "milspec" }
  ],
  "chroma case": [
    { name: "AK-47 | Vulcan", rarity: "covert" },
    { name: "AWP | Asiimov", rarity: "covert" },
    { name: "M4A1-S | Cyrex", rarity: "classified" },
    { name: "Glock-18 | Fade", rarity: "covert" },
    { name: "USP-S | Orion", rarity: "restricted" },
    { name: "P250 | Undertow", rarity: "milspec" },
    { name: "Tec-9 | Toxic", rarity: "industrial" },
    { name: "Five-SeveN | Fowl Play", rarity: "consumer" },
    { name: "CZ75-Auto | The Fuschia is Now", rarity: "restricted" },
    { name: "P2000 | Fire Elemental", rarity: "milspec" },
    { name: "Desert Eagle | Cobalt Disruption", rarity: "industrial" },
    { name: "Dual Berettas | Panther", rarity: "consumer" },
    { name: "P90 | Trigon", rarity: "restricted" },
    { name: "UMP-45 | Delusion", rarity: "milspec" },
    { name: "MP7 | Skulls", rarity: "industrial" },
    { name: "MAC-10 | Malachite", rarity: "consumer" },
    { name: "MP9 | Rose Iron", rarity: "consumer" },
    { name: "PP-Bizon | Water Sigil", rarity: "industrial" },
    { name: "Galil AR | Shattered", rarity: "milspec" },
    { name: "FAMAS | Pulse", rarity: "restricted" },
    { name: "M4A4 | X-Ray", rarity: "classified" },
    { name: "AK-47 | Jaguar", rarity: "covert" },
    { name: "AUG | Chameleon", rarity: "restricted" },
    { name: "SG 553 | Ultraviolet", rarity: "milspec" },
    { name: "AWP | Graphite", rarity: "covert" },
    { name: "SSG 08 | Blood in the Water", rarity: "restricted" },
    { name: "SCAR-20 | Cardiac", rarity: "milspec" },
    { name: "G3SG1 | The Executioner", rarity: "industrial" },
    { name: "MAG-7 | Memento", rarity: "consumer" },
    { name: "Nova | Antique", rarity: "consumer" },
    { name: "Sawed-Off | The Kraken", rarity: "industrial" },
    { name: "XM1014 | Quicksilver", rarity: "milspec" },
    { name: "M249 | System Lock", rarity: "restricted" },
    { name: "Negev | Terrain", rarity: "milspec" }
  ],
  "chroma 2 case": [
    { name: "AK-47 | Wasteland Rebel", rarity: "covert" },
    { name: "AWP | Hyper Beast", rarity: "covert" },
    { name: "M4A1-S | Hyper Beast", rarity: "classified" },
    { name: "Glock-18 | Water Elemental", rarity: "milspec" },
    { name: "USP-S | Kill Confirmed", rarity: "restricted" },
    { name: "P250 | Valence", rarity: "milspec" },
    { name: "Tec-9 | Fuel Injector", rarity: "industrial" },
    { name: "Five-SeveN | Hyper Beast", rarity: "consumer" },
    { name: "CZ75-Auto | Yellow Jacket", rarity: "restricted" },
    { name: "P2000 | Handgun", rarity: "milspec" },
    { name: "Desert Eagle | Kumicho Dragon", rarity: "industrial" },
    { name: "Dual Berettas | Dualing Dragons", rarity: "consumer" },
    { name: "P90 | Elite Build", rarity: "restricted" },
    { name: "UMP-45 | Riot", rarity: "milspec" },
    { name: "MP7 | Nemesis", rarity: "industrial" },
    { name: "MAC-10 | Neon Rider", rarity: "consumer" },
    { name: "MP9 | Bioleak", rarity: "consumer" },
    { name: "PP-Bizon | Chemical Green", rarity: "industrial" },
    { name: "Galil AR | Eco", rarity: "milspec" },
    { name: "FAMAS | Djinn", rarity: "restricted" },
    { name: "M4A4 | Dragon King", rarity: "classified" },
    { name: "AK-47 | Aquamarine Revenge", rarity: "covert" },
    { name: "AUG | Chameleon", rarity: "restricted" },
    { name: "SG 553 | Tiger Moth", rarity: "milspec" },
    { name: "AWP | Man-o'-war", rarity: "covert" },
    { name: "SSG 08 | Big Iron", rarity: "restricted" },
    { name: "SCAR-20 | Grotto", rarity: "milspec" },
    { name: "G3SG1 | Flux", rarity: "industrial" },
    { name: "MAG-7 | Counter Terrace", rarity: "consumer" },
    { name: "Nova | Koi", rarity: "consumer" },
    { name: "Sawed-Off | Kraken", rarity: "industrial" },
    { name: "XM1014 | Seasons", rarity: "milspec" },
    { name: "M249 | Spectre", rarity: "restricted" },
    { name: "Negev | Loudmouth", rarity: "milspec" }
  ]
};

async function addCaseSkins() {
  console.log("🎨 Adding contained skins for cases...");
  
  try {
    const cases = await prisma.case.findMany();
    console.log(`📦 Found ${cases.length} cases`);
    
    for (const caseItem of cases) {
      const skinData = caseSkinsMapping[caseItem.name] || caseSkinsMapping[caseItem.name.toLowerCase()];
      
      if (skinData) {
        console.log(`🎯 Adding ${skinData.length} skins to ${caseItem.name}...`);
        
        for (const skinInfo of skinData) {
          try {
            // Find or create skin
            let skin = await prisma.skin.findFirst({
              where: {
                OR: [
                  { name: { contains: skinInfo.name, mode: 'insensitive' } },
                  { marketHashName: { contains: skinInfo.name, mode: 'insensitive' } }
                ]
              }
            });
            
            if (!skin) {
              // Create skin if not found
              skin = await prisma.skin.create({
                data: {
                  name: skinInfo.name,
                  marketHashName: skinInfo.name,
                  imageUrl: "/images/placeholder-skin.png",
                  weaponType: "rifle", // Default, will be updated
                  rarity: skinInfo.rarity,
                  quality: "normal", // Default
                  priceLatest: 0,
                  priceMedian: 0,
                  priceAvg: 0
                }
              });
              console.log(`✅ Created skin: ${skinInfo.name}`);
            }
            
            // Create case-skin relationship
            await prisma.caseSkin.create({
              data: {
                caseId: caseItem.id,
                skinId: skin.id,
                rarity: skinInfo.rarity,
                dropChance: Math.random() * 0.1 + 0.01, // 1-11% drop rate
                isSpecial: skinInfo.name.includes('AWP') || skinInfo.name.includes('AK-47') || skinInfo.name.includes('M4A1-S')
              }
            });
            
          } catch (error) {
            console.error(`❌ Error adding skin ${skinInfo.name} to case ${caseItem.name}:`, error.message);
          }
        }
        
        console.log(`✅ Added skins to ${caseItem.name}`);
      } else {
        console.log(`⚠️ No skin mapping found for: ${caseItem.name}`);
      }
    }
    
    console.log("🎉 Case skins added!");
    
  } catch (error) {
    console.error("❌ Error adding case skins:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addCaseSkins();
