// eSports 2013 Winter Case Import (Fixed)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SKINS = [
  { name: "M4A4 | X-Ray", rarity: "Covert", dropChance: 0.64 },
  { name: "P2000 | Ocean Foam", rarity: "Classified", dropChance: 3.2 },
  { name: "AK-47 | Blue Laminate", rarity: "Restricted", dropChance: 15.98 },
  { name: "AWP | Corticera", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "P250 | Hive", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "★ Bayonet", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function run() {
  try {
    const c = await prisma.case.findUnique({ where: { name: "eSports 2013 Winter Case" } });
    if (!c) return console.log("❌ Not found");
    await prisma.caseSkin.deleteMany({ where: { caseId: c.id } });
    let added = 0, created = 0;
    for (const s of SKINS) {
      let sk = await prisma.skin.findFirst({ where: { OR: [{ name: s.name }, { marketHashName: s.name }] } });
      if (!sk) { sk = await prisma.skin.create({ data: { name: s.name, marketHashName: s.name, rarity: s.rarity, weaponType: s.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown', priceLatest: Math.random() * 100 + 10, priceMedian: Math.random() * 100 + 10, imageUrl: '' } }); created++; }
      await prisma.caseSkin.create({ data: { caseId: c.id, skinId: sk.id, rarity: s.rarity, dropChance: s.dropChance, isSpecial: s.isSpecial || false } });
      added++;
    }
    console.log(`✅ eSports 2013 Winter: ${created} created, ${added} linked`);
  } catch (e) { console.error("❌", e); } finally { await prisma.$disconnect(); }
}
run();

