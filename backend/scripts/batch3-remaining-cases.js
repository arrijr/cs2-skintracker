// Batch 3: All Remaining Cases
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CASES = {
  "CS:GO Weapon Case": [
    { name: "AWP | Lightning Strike", rarity: "Covert", dropChance: 0.64 },
    { name: "AK-47 | Case Hardened", rarity: "Classified", dropChance: 3.2 },
    { name: "Desert Eagle | Hypnotic", rarity: "Classified", dropChance: 3.2 },
    { name: "Glock-18 | Dragon Tattoo", rarity: "Restricted", dropChance: 15.98 },
    { name: "M4A4 | Faded Zebra", rarity: "Restricted", dropChance: 15.98 },
    { name: "MP7 | Skulls", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "P90 | Virus", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Karambit", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "CS:GO Weapon Case 2": [
    { name: "P90 | Death by Kitty", rarity: "Covert", dropChance: 0.64 },
    { name: "M4A4 | Bullet Rain", rarity: "Classified", dropChance: 3.2 },
    { name: "USP-S | Serum", rarity: "Classified", dropChance: 3.2 },
    { name: "AUG | Wings", rarity: "Restricted", dropChance: 15.98 },
    { name: "P250 | Splash", rarity: "Restricted", dropChance: 15.98 },
    { name: "XM1014 | Red Python", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Bayonet", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "CS:GO Weapon Case 3": [
    { name: "CZ75-Auto | The Fuschia Is Now", rarity: "Covert", dropChance: 0.64 },
    { name: "P250 | Undertow", rarity: "Classified", dropChance: 3.2 },
    { name: "Five-SeveN | Copper Galaxy", rarity: "Classified", dropChance: 3.2 },
    { name: "M4A1-S | Blood Tiger", rarity: "Restricted", dropChance: 15.98 },
    { name: "Tec-9 | Blue Titanium", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Butterfly Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Revolver Case": [
    { name: "R8 Revolver | Fade", rarity: "Covert", dropChance: 0.64 },
    { name: "AK-47 | Point Disarray", rarity: "Classified", dropChance: 3.2 },
    { name: "M4A1-S | Golden Coil", rarity: "Classified", dropChance: 3.2 },
    { name: "P90 | Shapewood", rarity: "Restricted", dropChance: 15.98 },
    { name: "MP7 | Impire", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Shadow Daggers", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Falchion Case": [
    { name: "AK-47 | Aquamarine Revenge", rarity: "Covert", dropChance: 0.64 },
    { name: "AWP | Hyper Beast", rarity: "Covert", dropChance: 0.64 },
    { name: "M4A4 | Royal Paladin", rarity: "Classified", dropChance: 3.2 },
    { name: "CZ75-Auto | Yellow Jacket", rarity: "Classified", dropChance: 3.2 },
    { name: "UMP-45 | Riot", rarity: "Restricted", dropChance: 15.98 },
    { name: "Galil AR | Rocket Pop", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Falchion Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Shadow Case": [
    { name: "M4A1-S | Golden Coil", rarity: "Covert", dropChance: 0.64 },
    { name: "G3SG1 | Flux", rarity: "Covert", dropChance: 0.64 },
    { name: "USP-S | Kill Confirmed", rarity: "Classified", dropChance: 3.2 },
    { name: "P2000 | Handgun", rarity: "Classified", dropChance: 3.2 },
    { name: "MP7 | Special Delivery", rarity: "Restricted", dropChance: 15.98 },
    { name: "FAMAS | Crypt", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Bowie Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Clutch Case": [
    { name: "AWP | Mortis", rarity: "Covert", dropChance: 0.64 },
    { name: "USP-S | Cortex", rarity: "Classified", dropChance: 3.2 },
    { name: "Glock-18 | Moonrise", rarity: "Classified", dropChance: 3.2 },
    { name: "M4A4 | Magnesium", rarity: "Restricted", dropChance: 15.98 },
    { name: "MP7 | Neon Ply", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Navaja Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Danger Zone Case": [
    { name: "AWP | Neo-Noir", rarity: "Covert", dropChance: 0.64 },
    { name: "AK-47 | Asiimov", rarity: "Covert", dropChance: 0.64 },
    { name: "Desert Eagle | Mecha Industries", rarity: "Classified", dropChance: 3.2 },
    { name: "MP5-SD | Phosphor", rarity: "Classified", dropChance: 3.2 },
    { name: "UMP-45 | Momentum", rarity: "Restricted", dropChance: 15.98 },
    { name: "G3SG1 | High Seas", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Ursus Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "CS20 Case": [
    { name: "AWP | Wildfire", rarity: "Covert", dropChance: 0.64 },
    { name: "MP9 | Hydra", rarity: "Covert", dropChance: 0.64 },
    { name: "Tec-9 | Flash Out", rarity: "Classified", dropChance: 3.2 },
    { name: "FAMAS | Commemoration", rarity: "Classified", dropChance: 3.2 },
    { name: "Five-SeveN | Triumvirate", rarity: "Restricted", dropChance: 15.98 },
    { name: "P250 | Vino Primo", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Classic Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Shattered Web Case": [
    { name: "AK-47 | Panthera onca", rarity: "Covert", dropChance: 0.64 },
    { name: "AWP | Containment Breach", rarity: "Covert", dropChance: 0.64 },
    { name: "P90 | Freight", rarity: "Classified", dropChance: 3.2 },
    { name: "Desert Eagle | Light Rail", rarity: "Classified", dropChance: 3.2 },
    { name: "G3SG1 | Black Sand", rarity: "Restricted", dropChance: 15.98 },
    { name: "MAC-10 | Disco Tech", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Nomad Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
};

async function importBatch3() {
  for (const [caseName, skins] of Object.entries(CASES)) {
    try {
      const c = await prisma.case.findFirst({ where: { OR: [{ name: caseName }, { name: { contains: caseName.split(' ')[0] } }] } });
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

importBatch3();

