// eSports 2014 Summer Case Import (Fixed)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SKINS = [
  { name: "USP-S | Road Rash", rarity: "Covert", dropChance: 0.64 },
  { name: "M4A4 | Bullet Rain", rarity: "Classified", dropChance: 3.2 },
  { name: "CZ75-Auto | Chalice", rarity: "Classified", dropChance: 3.2 },
  { name: "P90 | Module", rarity: "Restricted", dropChance: 15.98 },
  { name: "Glock-18 | Steel Disruption", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "AUG | Torque", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "★ Flip Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function run() {
  try {
    const c = await prisma.case.findUnique({ where: { name: "eSports 2014 Summer Case" } });
    if (!c) return console.log("❌ Not found");
    await prisma.caseSkin.deleteMany({ where: { caseId: c.id } });
    let added = 0, created = 0;
    for (const s of SKINS) {
      let sk = await prisma.skin.findFirst({ where: { OR: [{ name: s.name }, { marketHashName: s.name }] } });
      if (!sk) { sk = await prisma.skin.create({ data: { name: s.name, marketHashName: s.name, rarity: s.rarity, weaponType: s.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown', priceLatest: Math.random() * 100 + 10, priceMedian: Math.random() * 100 + 10, imageUrl: '' } }); created++; }
      await prisma.caseSkin.create({ data: { caseId: c.id, skinId: sk.id, rarity: s.rarity, dropChance: s.dropChance, isSpecial: s.isSpecial || false } });
      added++;
    }
    console.log(`✅ eSports 2014 Summer: ${created} created, ${added} linked`);
  } catch (e) { console.error("❌", e); } finally { await prisma.$disconnect(); }
}
run();

