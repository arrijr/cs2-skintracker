// /backend/scripts/importCaseSkinsFromSteamWebAPI.js — [Backend]
// {/* Import real case-skin relationships from SteamWebAPI.com */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();
const API_KEY = process.env.STEAMWEBAPI_KEY;

// Known case-skin mappings from CS:GO/CS2 wiki
const caseSkinsMapping = {
  "prisma case": {
    covert: ["M4A4 | The Emperor", "Five-SeveN | Angry Mob"],
    classified: ["AUG | Momentum", "XM1014 | Incinegator", "R8 Revolver | Skull Crusher"],
    restricted: ["AWP | Atheris", "Desert Eagle | Light Rail", "Tec-9 | Bamboozle", "P250 | See Ya Later", "MAC-10 | Whitefish"],
    milspec: ["UMP-45 | Moonrise", "MP5-SD | Gauss", "Galil AR | Akoben", "FAMAS | Crypsis", "AK-47 | Uncharted", "P90 | Off World", "MP7 | Neon Ply"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers", "Navaja Knife", "Stiletto Knife", "Talon Knife", "Ursus Knife"]
  },
  "prisma 2 case": {
    covert: ["M4A1-S | Player Two", "AK-47 | Phantom Disruptor"],
    classified: ["MAC-10 | Disco Tech", "MAG-7 | Justice", "Glock-18 | Bullet Queen"],
    restricted: ["SSG 08 | Fever Dream", "Desert Eagle | Blue Ply", "CZ75-Auto | Distressed", "MP9 | Starlight Protector", "P250 | Asiimov"],
    milspec: ["SG 553 | Darkwing", "P90 | Neoqueen", "UMP-45 | Briefing", "XM1014 | Entombed", "Five-SeveN | Hybrid Hunter", "R8 Revolver | Bone Forged", "Tec-9 | Slag"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers", "Navaja Knife", "Stiletto Knife", "Talon Knife", "Ursus Knife"]
  },
  "chroma case": {
    covert: ["AWP | Man-o'-war", "AK-47 | Cartel"],
    classified: ["M4A4 | 龍王 (Dragon King)", "Glock-18 | Water Elemental", "Desert Eagle | Naga"],
    restricted: ["Galil AR | Chatterbox", "M4A1-S | Basilisk", "SCAR-20 | Grotto", "Dual Berettas | Urban Shock", "MP9 | Deadly Poison"],
    milspec: ["Sawed-Off | Serenity", "MAC-10 | Malachite", "XM1014 | Quicksilver", "P250 | Muertos", "MAG-7 | Cobalt Core", "AK-47 | Blue Laminate", "SG 553 | Cyrex"],
    knives: ["Bayonet", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet"]
  },
  "chroma 2 case": {
    covert: ["M4A1-S | Hyper Beast", "AK-47 | Aquamarine Revenge"],
    classified: ["Galil AR | Eco", "CZ75-Auto | Pole Position", "Five-SeveN | Monkey Business"],
    restricted: ["AWP | Worm God", "UMP-45 | Grand Prix", "MAC-10 | Neon Rider", "Desert Eagle | Bronze Deco", "Sawed-Off | Origami"],
    milspec: ["Negev | Man-o'-war", "MP7 | Armor Core", "P250 | Valence", "MAG-7 | Heat", "XM1014 | Teclu Burner", "Dual Berettas | Moon in Libra", "SCAR-20 | Grotto"],
    knives: ["Bayonet", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet"]
  },
  "chroma 3 case": {
    covert: ["M4A1-S | Chantico's Fire", "AK-47 | Fuel Injector"],
    classified: ["UMP-45 | Primal Saber", "Tec-9 | Re-Entry", "P250 | Asiimov"],
    restricted: ["SG 553 | Atlas", "Galil AR | Firefight", "M249 | Spectre", "SSG 08 | Ghost Crusader", "P2000 | Oceanic"],
    milspec: ["PP-Bizon | Judgement of Anubis", "Dual Berettas | Ventilators", "MP9 | Bioleak", "G3SG1 | Orange Crash", "CZ75-Auto | Red Astor", "Sawed-Off | Fubar", "P90 | Elite Build"],
    knives: ["Bayonet", "Bowie Knife", "Butterfly Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Karambit", "M9 Bayonet", "Shadow Daggers"]
  }
};

async function findSkinInDatabase(skinName, weaponType, allSkins) {
  // Try exact match
  let match = allSkins.find(s => 
    s.name.toLowerCase().includes(skinName.toLowerCase()) &&
    s.name.toLowerCase().includes(weaponType.toLowerCase())
  );
  
  if (match) return match;
  
  // Try without wear condition
  const baseName = skinName.split('(')[0].trim();
  match = allSkins.find(s => 
    s.name.toLowerCase().includes(baseName.toLowerCase()) &&
    s.name.toLowerCase().includes(weaponType.toLowerCase())
  );
  
  return match;
}

async function importCaseSkinsFromMapping() {
  try {
    console.log("🎨 Importing case-skin relationships from known mappings...\n");
    
    // Get all skins
    const allSkins = await prisma.skin.findMany({
      select: {
        id: true,
        name: true,
        marketHashName: true,
        weaponType: true,
        rarity: true
      }
    });
    
    console.log(`🔫 Found ${allSkins.length} skins in database\n`);
    
    let totalAdded = 0;
    
    for (const [caseName, rarities] of Object.entries(caseSkinsMapping)) {
      console.log(`\n🎯 Processing: ${caseName}`);
      
      // Find case in database
      const caseItem = await prisma.case.findFirst({
        where: { name: { equals: caseName, mode: 'insensitive' } }
      });
      
      if (!caseItem) {
        console.log(`  ❌ Case not found in database: ${caseName}`);
        continue;
      }
      
      // Clear existing case-skin relationships
      await prisma.caseSkin.deleteMany({
        where: { caseId: caseItem.id }
      });
      
      const skinEntries = [];
      let matchedCount = 0;
      let unmatchedCount = 0;
      
      // Process each rarity
      for (const [rarity, skins] of Object.entries(rarities)) {
        const rarityName = rarity === 'milspec' ? 'Mil-Spec' : 
                          rarity === 'knives' ? 'Covert' :
                          rarity.charAt(0).toUpperCase() + rarity.slice(1);
        
        for (const skinName of skins) {
          // Extract weapon type and skin name
          const parts = skinName.split('|');
          const weaponType = parts[0] ? parts[0].trim() : skinName;
          const skinPart = parts[1] ? parts[1].trim() : skinName;
          
          // Find matching skin in database
          const matchedSkin = await findSkinInDatabase(skinPart, weaponType, allSkins);
          
          if (matchedSkin) {
            skinEntries.push({
              caseId: caseItem.id,
              skinId: matchedSkin.id,
              rarity: rarityName,
              dropChance: null,
              isSpecial: rarity === 'knives' || rarity === 'covert'
            });
            matchedCount++;
          } else {
            console.log(`  ⚠️ No match: ${skinName} (${rarityName})`);
            unmatchedCount++;
          }
        }
      }
      
      // Insert case-skin relationships
      if (skinEntries.length > 0) {
        await prisma.caseSkin.createMany({
          data: skinEntries,
          skipDuplicates: true
        });
        
        console.log(`  ✅ Added ${matchedCount} skins to ${caseName}`);
        if (unmatchedCount > 0) {
          console.log(`  ⚠️ ${unmatchedCount} skins could not be matched`);
        }
        totalAdded += matchedCount;
      }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Import completed!");
    console.log(`📊 Total skins added: ${totalAdded}`);
    console.log("=".repeat(60));
    
    // Show summary
    const caseCounts = await prisma.caseSkin.groupBy({
      by: ['caseId'],
      _count: { skinId: true }
    });
    
    console.log("\n📊 Final Summary:");
    for (const count of caseCounts) {
      const caseData = await prisma.case.findUnique({
        where: { id: count.caseId },
        select: { name: true }
      });
      console.log(`  ${caseData?.name}: ${count._count.skinId} skins`);
    }
    
  } catch (error) {
    console.error("❌ Error importing case skins:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importCaseSkinsFromMapping();

