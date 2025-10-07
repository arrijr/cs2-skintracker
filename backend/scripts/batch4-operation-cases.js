// Batch 4: All Operation Cases
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CASES = {
  "Operation Phoenix Weapon Case": [
    { name: "AK-47 | Redline", rarity: "Classified", dropChance: 3.2 },
    { name: "AWP | Corticera", rarity: "Classified", dropChance: 3.2 },
    { name: "M4A4 | Asiimov", rarity: "Covert", dropChance: 0.64 },
    { name: "P90 | Trigon", rarity: "Restricted", dropChance: 15.98 },
    { name: "MAC-10 | Heat", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Huntsman Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Operation Vanguard Weapon Case": [
    { name: "M4A4 | Basilisk", rarity: "Classified", dropChance: 3.2 },
    { name: "AK-47 | Wasteland Rebel", rarity: "Covert", dropChance: 0.64 },
    { name: "P2000 | Fire Elemental", rarity: "Classified", dropChance: 3.2 },
    { name: "UMP-45 | Delusion", rarity: "Restricted", dropChance: 15.98 },
    { name: "XM1014 | Quicksilver", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Butterfly Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Operation Wildfire Case": [
    { name: "M4A1-S | Hyper Beast", rarity: "Covert", dropChance: 0.64 },
    { name: "AK-47 | Elite Build", rarity: "Restricted", dropChance: 15.98 },
    { name: "AWP | Hyper Beast", rarity: "Covert", dropChance: 0.64 },
    { name: "Desert Eagle | Kumicho Dragon", rarity: "Classified", dropChance: 3.2 },
    { name: "Nova | Hyper Beast", rarity: "Restricted", dropChance: 15.98 },
    { name: "P250 | Wingshot", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Bowie Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Operation Hydra Case": [
    { name: "AK-47 | Orbit Mk01", rarity: "Covert", dropChance: 0.64 },
    { name: "Five-SeveN | Hyper Beast", rarity: "Classified", dropChance: 3.2 },
    { name: "Dual Berettas | Cobra Strike", rarity: "Restricted", dropChance: 15.98 },
    { name: "P250 | Red Rock", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Bloodhound Gloves", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Operation Broken Fang Case": [
    { name: "M4A1-S | Printstream", rarity: "Covert", dropChance: 0.64 },
    { name: "Glock-18 | Neo-Noir", rarity: "Covert", dropChance: 0.64 },
    { name: "USP-S | Monster Mashup", rarity: "Classified", dropChance: 3.2 },
    { name: "P90 | Cocoa Rampage", rarity: "Classified", dropChance: 3.2 },
    { name: "M4A4 | Cyber Security", rarity: "Restricted", dropChance: 15.98 },
    { name: "MP9 | Food Chain", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Broken Fang Gloves", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Operation Riptide Case": [
    { name: "AK-47 | Leet Museo", rarity: "Covert", dropChance: 0.64 },
    { name: "M4A4 | Eye of Horus", rarity: "Covert", dropChance: 0.64 },
    { name: "AWP | Fade", rarity: "Classified", dropChance: 3.2 },
    { name: "USP-S | Black Lotus", rarity: "Classified", dropChance: 3.2 },
    { name: "Five-SeveN | Scrawl", rarity: "Restricted", dropChance: 15.98 },
    { name: "P250 | Cyber Shell", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Skeleton Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Operation Bravo Case": [
    { name: "Desert Eagle | Golden Koi", rarity: "Covert", dropChance: 0.64 },
    { name: "AK-47 | Fire Serpent", rarity: "Covert", dropChance: 0.64 },
    { name: "AWP | Graphite", rarity: "Classified", dropChance: 3.2 },
    { name: "USP-S | Overgrowth", rarity: "Classified", dropChance: 3.2 },
    { name: "P90 | Emerald Dragon", rarity: "Restricted", dropChance: 15.98 },
    { name: "MAC-10 | Graven", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Karambit", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Winter Offensive Weapon Case": [
    { name: "M4A4 | Asiimov", rarity: "Covert", dropChance: 0.64 },
    { name: "AWP | Redline", rarity: "Classified", dropChance: 3.2 },
    { name: "P250 | Mehndi", rarity: "Classified", dropChance: 3.2 },
    { name: "PP-Bizon | Cobalt Halftone", rarity: "Restricted", dropChance: 15.98 },
    { name: "M4A1-S | Guardian", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Gut Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
};

async function importBatch4() {
  for (const [caseName, skins] of Object.entries(CASES)) {
    try {
      const c = await prisma.case.findFirst({ where: { OR: [{ name: caseName }, { name: { contains: caseName.replace('Weapon ', '') } }] } });
      if (!c) { console.log(`❌ ${caseName} not found`); continue; }
      await prisma.caseSkin.deleteMany({ where: { caseId: c.id } });
      let added = 0, created = 0;
      for (const s of skins) {
        let sk = await prisma.skin.findFirst({ where: { OR: [{ name: s.name }, { marketHashName: s.name }] } });
        if (!sk) { sk = await prisma.skin.create({ data: { name: s.name, marketHashName: s.name, rarity: s.rarity, weaponType: s.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown', priceLatest: Math.random() * 100 + 10, priceMedian: Math.random() * 100 + 10, imageUrl: '' } }); created++; }
        await prisma.caseSkin.create({ data: { caseId: c.id, skinId: sk.id, rarity: s.rarity, dropChance: s.dropChance, isSpecial: s.isSpecial || false } });
        added++;
      }
      console.log(`✅ ${caseName}: ${created} created, ${added} linked`);
    } catch (e) { console.error(`❌ ${caseName}:`, e.message); }
  }
  await prisma.$disconnect();
}

importBatch4();

