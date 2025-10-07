// Snakebite Case Import
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SKINS = [
  { name: "M4A1-S | Welcome to the Jungle", rarity: "Covert", dropChance: 0.64 },
  { name: "SSG 08 | Bloodshot", rarity: "Covert", dropChance: 0.64 },
  { name: "UMP-45 | Wild Child", rarity: "Classified", dropChance: 3.2 },
  { name: "P90 | Cocoa Rampage", rarity: "Classified", dropChance: 3.2 },
  { name: "Nova | Red Quartz", rarity: "Classified", dropChance: 3.2 },
  { name: "Glock-18 | Snack Attack", rarity: "Restricted", dropChance: 15.98 },
  { name: "MP5-SD | Condition Zero", rarity: "Restricted", dropChance: 15.98 },
  { name: "AWP | Phobos", rarity: "Restricted", dropChance: 15.98 },
  { name: "XM1014 | XOXO", rarity: "Restricted", dropChance: 15.98 },
  { name: "Galil AR | Chromatic Aberration", rarity: "Restricted", dropChance: 15.98 },
  { name: "MAC-10 | Button Masher", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MAG-7 | BI83 Spectrum", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MP7 | Guerrilla", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MP9 | Food Chain", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "P2000 | Acid Etched", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Tec-9 | Bamboozle", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "UMP-45 | Gold Bismuth", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "★ Broken Fang Gloves", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function importSnakebiteFromCSGODB() {
  try {
    const c = await prisma.case.findFirst({ where: { OR: [{ name: "Snakebite Case" }, { name: { contains: "Snakebite" } }] } });
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
    console.log(`✅ Snakebite Case: ${created} created, ${added} linked`);
  } catch (error) {
    console.error("❌", error);
  } finally {
    await prisma.$disconnect();
  }
}

importSnakebiteFromCSGODB();

