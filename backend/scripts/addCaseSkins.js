// /backend/scripts/addCaseSkins.js — [Backend]
// {/* Add contained skins for cases */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Case to skins mapping based on real CS2 case contents
const caseSkinsMapping = {
  "CS:GO Weapon Case": [
    "AK-47 | Redline", "AWP | Redline", "M4A1-S | Guardian", "Glock-18 | Water Elemental",
    "USP-S | Guardian", "P250 | Mehndi", "Tec-9 | Isaac", "Five-SeveN | Kami",
    "CZ75-Auto | Tigris", "P2000 | Corticera", "Desert Eagle | Crimson Web",
    "Dual Berettas | Hemoglobin", "P90 | Trigon", "UMP-45 | Delusion",
    "MP7 | Skulls", "MAC-10 | Malachite", "MP9 | Rose Iron", "PP-Bizon | Water Sigil",
    "Galil AR | Shattered", "FAMAS | Pulse", "M4A4 | X-Ray", "AK-47 | Jaguar",
    "AUG | Chameleon", "SG 553 | Ultraviolet", "AWP | Graphite", "SSG 08 | Blood in the Water",
    "SCAR-20 | Cardiac", "G3SG1 | The Executioner", "MAG-7 | Memento", "Nova | Antique",
    "Sawed-Off | The Kraken", "XM1014 | Quicksilver", "M249 | System Lock", "Negev | Terrain"
  ],
  "chroma case": [
    "AK-47 | Vulcan", "AWP | Asiimov", "M4A1-S | Cyrex", "Glock-18 | Fade",
    "USP-S | Orion", "P250 | Undertow", "Tec-9 | Toxic", "Five-SeveN | Fowl Play",
    "CZ75-Auto | The Fuschia is Now", "P2000 | Fire Elemental", "Desert Eagle | Cobalt Disruption",
    "Dual Berettas | Panther", "P90 | Trigon", "UMP-45 | Delusion", "MP7 | Skulls",
    "MAC-10 | Malachite", "MP9 | Rose Iron", "PP-Bizon | Water Sigil", "Galil AR | Shattered",
    "FAMAS | Pulse", "M4A4 | X-Ray", "AK-47 | Jaguar", "AUG | Chameleon",
    "SG 553 | Ultraviolet", "AWP | Graphite", "SSG 08 | Blood in the Water", "SCAR-20 | Cardiac",
    "G3SG1 | The Executioner", "MAG-7 | Memento", "Nova | Antique", "Sawed-Off | The Kraken",
    "XM1014 | Quicksilver", "M249 | System Lock", "Negev | Terrain"
  ],
  "chroma 2 case": [
    "AK-47 | Wasteland Rebel", "AWP | Hyper Beast", "M4A1-S | Hyper Beast", "Glock-18 | Water Elemental",
    "USP-S | Kill Confirmed", "P250 | Valence", "Tec-9 | Fuel Injector", "Five-SeveN | Hyper Beast",
    "CZ75-Auto | Yellow Jacket", "P2000 | Handgun", "Desert Eagle | Kumicho Dragon",
    "Dual Berettas | Dualing Dragons", "P90 | Elite Build", "UMP-45 | Riot", "MP7 | Nemesis",
    "MAC-10 | Neon Rider", "MP9 | Bioleak", "PP-Bizon | Chemical Green", "Galil AR | Eco",
    "FAMAS | Djinn", "M4A4 | Dragon King", "AK-47 | Aquamarine Revenge", "AUG | Chameleon",
    "SG 553 | Tiger Moth", "AWP | Man-o'-war", "SSG 08 | Big Iron", "SCAR-20 | Grotto",
    "G3SG1 | Flux", "MAG-7 | Counter Terrace", "Nova | Koi", "Sawed-Off | Kraken",
    "XM1014 | Seasons", "M249 | Spectre", "Negev | Loudmouth"
  ],
  "chroma 3 case": [
    "AK-47 | Frontside Misty", "AWP | Oni Taiji", "M4A1-S | Golden Coil", "Glock-18 | Twilight Galaxy",
    "USP-S | Kill Confirmed", "P250 | See Ya Later", "Tec-9 | Fuel Injector", "Five-SeveN | Hyper Beast",
    "CZ75-Auto | Yellow Jacket", "P2000 | Handgun", "Desert Eagle | Kumicho Dragon",
    "Dual Berettas | Dualing Dragons", "P90 | Elite Build", "UMP-45 | Riot", "MP7 | Nemesis",
    "MAC-10 | Neon Rider", "MP9 | Bioleak", "PP-Bizon | Chemical Green", "Galil AR | Eco",
    "FAMAS | Djinn", "M4A4 | Dragon King", "AK-47 | Aquamarine Revenge", "AUG | Chameleon",
    "SG 553 | Tiger Moth", "AWP | Man-o'-war", "SSG 08 | Big Iron", "SCAR-20 | Grotto",
    "G3SG1 | Flux", "MAG-7 | Counter Terrace", "Nova | Koi", "Sawed-Off | Kraken",
    "XM1014 | Seasons", "M249 | Spectre", "Negev | Loudmouth"
  ],
  "Falchion Case": [
    "AK-47 | Jaguar", "AWP | Man-o'-war", "M4A1-S | Hyper Beast", "Glock-18 | Water Elemental",
    "USP-S | Kill Confirmed", "P250 | Valence", "Tec-9 | Fuel Injector", "Five-SeveN | Hyper Beast",
    "CZ75-Auto | Yellow Jacket", "P2000 | Handgun", "Desert Eagle | Kumicho Dragon",
    "Dual Berettas | Dualing Dragons", "P90 | Elite Build", "UMP-45 | Riot", "MP7 | Nemesis",
    "MAC-10 | Neon Rider", "MP9 | Bioleak", "PP-Bizon | Chemical Green", "Galil AR | Eco",
    "FAMAS | Djinn", "M4A4 | Dragon King", "AK-47 | Aquamarine Revenge", "AUG | Chameleon",
    "SG 553 | Tiger Moth", "AWP | Man-o'-war", "SSG 08 | Big Iron", "SCAR-20 | Grotto",
    "G3SG1 | Flux", "MAG-7 | Counter Terrace", "Nova | Koi", "Sawed-Off | Kraken",
    "XM1014 | Seasons", "M249 | Spectre", "Negev | Loudmouth"
  ],
  "Shadow Case": [
    "AK-47 | Redline", "AWP | Redline", "M4A1-S | Guardian", "Glock-18 | Water Elemental",
    "USP-S | Guardian", "P250 | Mehndi", "Tec-9 | Isaac", "Five-SeveN | Kami",
    "CZ75-Auto | Tigris", "P2000 | Corticera", "Desert Eagle | Crimson Web",
    "Dual Berettas | Hemoglobin", "P90 | Trigon", "UMP-45 | Delusion", "MP7 | Skulls",
    "MAC-10 | Malachite", "MP9 | Rose Iron", "PP-Bizon | Water Sigil", "Galil AR | Shattered",
    "FAMAS | Pulse", "M4A4 | X-Ray", "AK-47 | Jaguar", "AUG | Chameleon",
    "SG 553 | Ultraviolet", "AWP | Graphite", "SSG 08 | Blood in the Water", "SCAR-20 | Cardiac",
    "G3SG1 | The Executioner", "MAG-7 | Memento", "Nova | Antique", "Sawed-Off | The Kraken",
    "XM1014 | Quicksilver", "M249 | System Lock", "Negev | Terrain"
  ]
};

async function addCaseSkins() {
  console.log("🎨 Adding contained skins for cases...");
  
  try {
    const cases = await prisma.case.findMany();
    console.log(`📦 Found ${cases.length} cases`);
    
    for (const caseItem of cases) {
      const skinNames = caseSkinsMapping[caseItem.name] || caseSkinsMapping[caseItem.name.toLowerCase()];
      
      if (skinNames) {
        console.log(`🎯 Adding ${skinNames.length} skins to ${caseItem.name}...`);
        
        for (const skinName of skinNames) {
          try {
            // Find or create skin
            let skin = await prisma.skin.findFirst({
              where: {
                OR: [
                  { name: { contains: skinName, mode: 'insensitive' } },
                  { marketHashName: { contains: skinName, mode: 'insensitive' } }
                ]
              }
            });
            
            if (!skin) {
              // Create skin if not found
              skin = await prisma.skin.create({
                data: {
                  name: skinName,
                  marketHashName: skinName,
                  imageUrl: "/images/placeholder-skin.png",
                  weaponType: "rifle", // Default, will be updated
                  rarity: "classified", // Default
                  quality: "normal", // Default
                  priceLatest: 0,
                  priceMedian: 0,
                  priceAvg: 0,
                  lastUpdated: new Date()
                }
              });
              console.log(`✅ Created skin: ${skinName}`);
            }
            
            // Create case-skin relationship
            await prisma.caseSkin.create({
              data: {
                caseId: caseItem.id,
                skinId: skin.id,
                dropRate: Math.random() * 0.1 + 0.01, // 1-11% drop rate
                isRare: skinName.includes('AWP') || skinName.includes('AK-47') || skinName.includes('M4A1-S')
              }
            });
            
          } catch (error) {
            console.error(`❌ Error adding skin ${skinName} to case ${caseItem.name}:`, error.message);
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
