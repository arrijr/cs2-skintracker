// Gamma Case Import
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SKINS = [
  { name: "M4A1-S | Mecha Industries", rarity: "Covert", dropChance: 0.64 },
  { name: "Glock-18 | Wasteland Rebel", rarity: "Covert", dropChance: 0.64 },
  { name: "P2000 | Imperial Dragon", rarity: "Classified", dropChance: 3.2 },
  { name: "M4A4 | Desolate Space", rarity: "Classified", dropChance: 3.2 },
  { name: "FAMAS | Mecha Industries", rarity: "Classified", dropChance: 3.2 },
  { name: "AUG | Aristocrat", rarity: "Restricted", dropChance: 15.98 },
  { name: "SCAR-20 | Bloodsport", rarity: "Restricted", dropChance: 15.98 },
  { name: "P250 | Iron Clad", rarity: "Restricted", dropChance: 15.98 },
  { name: "Tec-9 | Bamboo Forest", rarity: "Restricted", dropChance: 15.98 },
  { name: "Five-SeveN | Violent Daimyo", rarity: "Restricted", dropChance: 15.98 },
  { name: "MAC-10 | Carnivore", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "PP-Bizon | Harvester", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "XM1014 | Slipstream", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MP7 | Akoben", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Dual Berettas | Royal Consorts", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Nova | Exo", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MAG-7 | Petroglyph", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "★ Bowie Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function run() {
  try {
    const c = await prisma.case.findFirst({ where: { OR: [{ name: "Gamma Case" }, { name: { contains: "Gamma" } }] } });
    if (!c) return console.log("❌ Not found");
    await prisma.caseSkin.deleteMany({ where: { caseId: c.id } });
    let added = 0, created = 0;
    for (const s of SKINS) {
      let sk = await prisma.skin.findFirst({ where: { OR: [{ name: s.name }, { marketHashName: s.name }] } });
      if (!sk) { sk = await prisma.skin.create({ data: { name: s.name, marketHashName: s.name, rarity: s.rarity, weaponType: s.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown', priceLatest: Math.random() * 100 + 10, priceMedian: Math.random() * 100 + 10, imageUrl: '' } }); created++; }
      await prisma.caseSkin.create({ data: { caseId: c.id, skinId: sk.id, rarity: s.rarity, dropChance: s.dropChance, isSpecial: s.isSpecial || false } });
      added++;
    }
    console.log(`✅ Gamma: ${created} created, ${added} linked`);
  } catch (e) { console.error("❌", e); } finally { await prisma.$disconnect(); }
}
run();

