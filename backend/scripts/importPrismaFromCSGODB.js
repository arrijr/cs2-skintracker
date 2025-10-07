// Prisma Case Import
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SKINS = [
  { name: "M4A4 | The Emperor", rarity: "Covert", dropChance: 0.64 },
  { name: "AK-47 | Phantom Disruptor", rarity: "Covert", dropChance: 0.64 },
  { name: "AWP | Atheris", rarity: "Classified", dropChance: 3.2 },
  { name: "M4A1-S | Leaded Glass", rarity: "Classified", dropChance: 3.2 },
  { name: "R8 Revolver | Skull Crusher", rarity: "Classified", dropChance: 3.2 },
  { name: "Desert Eagle | Light Rail", rarity: "Restricted", dropChance: 15.98 },
  { name: "Galil AR | Akoben", rarity: "Restricted", dropChance: 15.98 },
  { name: "MP5-SD | Gauss", rarity: "Restricted", dropChance: 15.98 },
  { name: "UMP-45 | Moonrise", rarity: "Restricted", dropChance: 15.98 },
  { name: "XM1014 | Incinegator", rarity: "Restricted", dropChance: 15.98 },
  { name: "AUG | Momentum", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "CZ75-Auto | Vendetta", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Glock-18 | Oxide Blaze", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MAC-10 | Whitefish", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MAG-7 | Prism Terrace", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "P250 | Verdigris", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "SG 553 | Phantom", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "★ Navaja Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function importPrismaFromCSGODB() {
  try {
    const c = await prisma.case.findFirst({ where: { OR: [{ name: "Prisma Case" }, { name: { contains: "Prisma" } }] } });
    if (!c) { console.log("❌ Prisma Case not found"); return; }
    
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
    console.log(`✅ Prisma Case: ${created} created, ${added} linked`);
  } catch (error) {
    console.error("❌", error);
  } finally {
    await prisma.$disconnect();
  }
}

importPrismaFromCSGODB();

