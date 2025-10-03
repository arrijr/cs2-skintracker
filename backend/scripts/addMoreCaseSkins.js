// /backend/scripts/addMoreCaseSkins.js — [Backend]
// {/* Add contained skins for more cases */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extended case to skins mapping
const caseSkinsMapping = {
  "operation bravo case": [
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
  "shattered web case": [
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
  "operation phoenix weapon case": [
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
  "prisma case": [
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
  "operation broken fang case": [
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
  ]
};

async function addMoreCaseSkins() {
  console.log("🎨 Adding contained skins for more cases...");
  
  try {
    const cases = await prisma.case.findMany();
    console.log(`📦 Found ${cases.length} cases`);
    
    for (const caseItem of cases) {
      const skinData = caseSkinsMapping[caseItem.name.toLowerCase()] || caseSkinsMapping[caseItem.name];
      
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
                  weaponType: "rifle", // Default
                  rarity: skinInfo.rarity,
                  quality: "normal",
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
    
    console.log("🎉 More case skins added!");
    
  } catch (error) {
    console.error("❌ Error adding case skins:", error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreCaseSkins();
