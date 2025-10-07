// Spectrum Case Import
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SKINS = [
  { name: "M4A1-S | Decimator", rarity: "Covert", dropChance: 0.64 },
  { name: "AK-47 | Bloodsport", rarity: "Covert", dropChance: 0.64 },
  { name: "USP-S | Neo-Noir", rarity: "Classified", dropChance: 3.2 },
  { name: "P250 | See Ya Later", rarity: "Classified", dropChance: 3.2 },
  { name: "CZ75-Auto | Xiangliu", rarity: "Classified", dropChance: 3.2 },
  { name: "SSG 08 | Dragonfire", rarity: "Restricted", dropChance: 15.98 },
  { name: "M249 | Emerald Poison Dart", rarity: "Restricted", dropChance: 15.98 },
  { name: "AUG | Syd Mead", rarity: "Restricted", dropChance: 15.98 },
  { name: "PP-Bizon | Judgement of Anubis", rarity: "Restricted", dropChance: 15.98 },
  { name: "Galil AR | Crimson Tsunami", rarity: "Restricted", dropChance: 15.98 },
  { name: "MAC-10 | Oceanic", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Tec-9 | Snek-9", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "P2000 | Turf", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MP7 | Cirrus", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "XM1014 | Seasons", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "UMP-45 | Scaffold", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "SCAR-20 | Blueprint", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "★ Butterfly Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function importSpectrumFromCSGODB() {
  try {
    const c = await prisma.case.findFirst({ where: { OR: [{ name: "Spectrum Case" }, { name: { contains: "Spectrum" } }] } });
    if (!c) { console.log("❌ Not found"); return; }
    
    await prisma.caseSkin.deleteMany({ where: { caseId: c.id } });
    
    let added = 0, created = 0;
    for (const s of SKINS) {
      let sk = await prisma.skin.findFirst({ where: { OR: [{ name: s.name }, { marketHashName: s.name }] } });
      if (!sk) {
        sk = await prisma.skin.create({
          data: {
            name: s.name, marketHashName: s.name, rarity: s.rarity,
            weaponType: s.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown',
            priceLatest: Math.random() * 100 + 10, priceMedian: Math.random() * 100 + 10,
            imageUrl: ''
          }
        });
        created++;
      }
      await prisma.caseSkin.create({ data: { caseId: c.id, skinId: sk.id, rarity: s.rarity, dropChance: s.dropChance, isSpecial: s.isSpecial || false } });
      added++;
    }
    console.log(`✅ Spectrum Case: ${created} created, ${added} linked`);
  } catch (error) {
    console.error("❌", error);
  } finally {
    await prisma.$disconnect();
  }
}

importSpectrumFromCSGODB();

