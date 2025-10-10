// /backend/scripts/importRealCaseSkinsFromClash.js — [Backend]
// {/* Import real case-skin relationships from Clash.gg data */}
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import fetch from "node-fetch";

const prisma = new PrismaClient();

// Clash.gg case IDs mapping to our case names
const clashCaseMapping = {
  "prisma case": 274,
  "prisma 2 case": 273,
  "chroma case": 256,
  "chroma 2 case": 257,
  "chroma 3 case": 258,
  "gamma case": 266,
  "gamma 2 case": 267,
  "spectrum case": 270,
  "spectrum 2 case": 271,
  "clutch case": 259,
  "danger zone case": 260,
  "horizon case": 268,
  "cs20 case": 255,
  "fracture case": 264,
  "operation broken fang case": 277,
  "snakebite case": 281,
  "operation riptide case": 278,
  "dreams & nightmares case": 261,
  "recoil case": 279,
  "revolution case": 280,
  "kilowatt case": 269,
  "gallery case": 265,
  "glove case": 262,
  "shadow case": 272,
  "revolver case": 263,
  "operation wildfire case": 286,
  "operation breakout weapon case": 275,
  "operation phoenix weapon case": 276,
  "operation vanguard weapon case": 285,
  "operation hydra case": 284,
  "huntsman weapon case": 283,
  "falchion case": 282,
  "cs:go weapon case": 251,
  "cs:go weapon case 2": 252,
  "cs:go weapon case 3": 253,
  "esports 2013 case": 287,
  "esports 2013 winter case": 288,
  "esports 2014 summer case": 289,
  "operation bravo case": 290,
  "winter offensive weapon case": 254,
  "shattered web case": 291,
  "fever case": 292
};

// Rarity mapping from Clash.gg to our system
const rarityMapping = {
  "Covert": "Covert",
  "Classified": "Classified",
  "Restricted": "Restricted",
  "Mil-Spec": "Mil-Spec",
  "Industrial Grade": "Industrial",
  "Consumer Grade": "Consumer",
  "Extraordinary": "Covert" // Knives
};

async function fetchClashCaseData(clashCaseId) {
  try {
    const url = `https://stash.clash.gg/api/case/${clashCaseId}`;
    console.log(`  Fetching: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`  ⚠️ HTTP ${response.status} for case ${clashCaseId}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`  ❌ Error fetching case ${clashCaseId}:`, error.message);
    return null;
  }
}

function findMatchingSkin(skinName, allSkins) {
  // Try exact match first
  let match = allSkins.find(s => 
    s.name.toLowerCase() === skinName.toLowerCase()
  );
  
  if (match) return match;
  
  // Try matching without wear/condition
  const baseName = skinName.split('(')[0].trim();
  match = allSkins.find(s => 
    s.name.toLowerCase().startsWith(baseName.toLowerCase())
  );
  
  if (match) return match;
  
  // Try matching weapon + skin name
  const parts = skinName.split('|');
  if (parts.length === 2) {
    const weapon = parts[0].trim().toLowerCase();
    const skin = parts[1].trim().toLowerCase();
    
    match = allSkins.find(s => {
      const sName = s.name.toLowerCase();
      return sName.includes(weapon) && sName.includes(skin);
    });
  }
  
  return match;
}

async function importRealCaseSkins() {
  try {
    console.log("🎨 Importing real case-skin relationships from Clash.gg...\n");
    
    // Get all our cases
    const cases = await prisma.case.findMany({
      orderBy: { id: 'asc' }
    });
    
    // Get all skins for matching
    const allSkins = await prisma.skin.findMany({
      select: {
        id: true,
        name: true,
        marketHashName: true,
        weaponType: true,
        rarity: true
      }
    });
    
    console.log(`📦 Found ${cases.length} cases in database`);
    console.log(`🔫 Found ${allSkins.length} skins in database\n`);
    
    let totalAdded = 0;
    let totalSkipped = 0;
    
    for (const caseItem of cases) {
      const caseName = caseItem.name.toLowerCase();
      const clashCaseId = clashCaseMapping[caseName];
      
      if (!clashCaseId) {
        console.log(`⏭️  Skipping ${caseItem.name} (no Clash.gg mapping)`);
        totalSkipped++;
        continue;
      }
      
      console.log(`\n🎯 Processing: ${caseItem.name} (Clash ID: ${clashCaseId})`);
      
      // Fetch case data from Clash.gg
      const clashData = await fetchClashCaseData(clashCaseId);
      
      if (!clashData || !clashData.items) {
        console.log(`  ❌ No data found for ${caseItem.name}`);
        totalSkipped++;
        continue;
      }
      
      // Clear existing case-skin relationships
      await prisma.caseSkin.deleteMany({
        where: { caseId: caseItem.id }
      });
      
      const skinEntries = [];
      let matchedCount = 0;
      let unmatchedCount = 0;
      
      // Process each skin from Clash.gg
      for (const item of clashData.items) {
        const skinName = item.name;
        const rarity = rarityMapping[item.rarity] || item.rarity;
        const isSpecial = item.rarity === "Extraordinary" || item.type === "Knife";
        
        // Find matching skin in our database
        const matchedSkin = findMatchingSkin(skinName, allSkins);
        
        if (matchedSkin) {
          skinEntries.push({
            caseId: caseItem.id,
            skinId: matchedSkin.id,
            rarity: rarity,
            dropChance: item.dropChance || null,
            isSpecial: isSpecial
          });
          matchedCount++;
        } else {
          console.log(`  ⚠️ No match found for: ${skinName} (${rarity})`);
          unmatchedCount++;
        }
      }
      
      // Insert case-skin relationships
      if (skinEntries.length > 0) {
        await prisma.caseSkin.createMany({
          data: skinEntries,
          skipDuplicates: true
        });
        
        console.log(`  ✅ Added ${matchedCount} skins to ${caseItem.name}`);
        if (unmatchedCount > 0) {
          console.log(`  ⚠️ ${unmatchedCount} skins could not be matched`);
        }
        totalAdded += matchedCount;
      } else {
        console.log(`  ❌ No skins matched for ${caseItem.name}`);
        totalSkipped++;
      }
      
      // Rate limiting - wait 500ms between requests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 Import completed!");
    console.log(`📊 Total skins added: ${totalAdded}`);
    console.log(`⏭️  Cases skipped: ${totalSkipped}`);
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

importRealCaseSkins();

