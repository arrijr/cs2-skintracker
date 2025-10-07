// Prisma 2 Case Import (Fixed)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SKINS = [
  { name: "M4A1-S | Player Two", rarity: "Covert", dropChance: 0.64 },
  { name: "P90 | Death Grip", rarity: "Covert", dropChance: 0.64 },
  { name: "USP-S | Target Acquired", rarity: "Classified", dropChance: 3.2 },
  { name: "Desert Eagle | Blue Ply", rarity: "Classified", dropChance: 3.2 },
  { name: "MAC-10 | Disco Tech", rarity: "Classified", dropChance: 3.2 },
  { name: "AWP | Capillary", rarity: "Restricted", dropChance: 15.98 },
  { name: "XM1014 | XOXO", rarity: "Restricted", dropChance: 15.98 },
  { name: "MP5-SD | Desert Strike", rarity: "Restricted", dropChance: 15.98 },
  { name: "Five-SeveN | Angry Mob", rarity: "Restricted", dropChance: 15.98 },
  { name: "P250 | Epicenter", rarity: "Restricted", dropChance: 15.98 },
  { name: "CZ75-Auto | Distressed", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Galil AR | Akoben", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MP7 | Neon Ply", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Tec-9 | Bamboozle", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "UMP-45 | Metal Flowers", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "R8 Revolver | Bone Forged", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "P2000 | Acid Etched", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "★ Stiletto Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function run() {
  try {
    const c = await prisma.case.findUnique({ where: { name: "Prisma 2 Case" } });
    if (!c) return console.log("❌ Not found");
    await prisma.caseSkin.deleteMany({ where: { caseId: c.id } });
    let added = 0, created = 0;
    for (const s of SKINS) {
      let sk = await prisma.skin.findFirst({ where: { OR: [{ name: s.name }, { marketHashName: s.name }] } });
      if (!sk) { sk = await prisma.skin.create({ data: { name: s.name, marketHashName: s.name, rarity: s.rarity, weaponType: s.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown', priceLatest: Math.random() * 100 + 10, priceMedian: Math.random() * 100 + 10, imageUrl: '' } }); created++; }
      await prisma.caseSkin.create({ data: { caseId: c.id, skinId: sk.id, rarity: s.rarity, dropChance: s.dropChance, isSpecial: s.isSpecial || false } });
      added++;
    }
    console.log(`✅ Prisma 2 Case: ${created} created, ${added} linked`);
  } catch (e) { console.error("❌", e); } finally { await prisma.$disconnect(); }
}
run();

