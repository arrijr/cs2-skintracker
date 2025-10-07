// Chroma 3 Case Import
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SKINS = [
  { name: "P250 | Asiimov", rarity: "Covert", dropChance: 0.64 },
  { name: "Tec-9 | Fuel Injector", rarity: "Covert", dropChance: 0.64 },
  { name: "M4A1-S | Chantico's Fire", rarity: "Classified", dropChance: 3.2 },
  { name: "Galil AR | Firefight", rarity: "Classified", dropChance: 3.2 },
  { name: "SSG 08 | Ghost Crusader", rarity: "Classified", dropChance: 3.2 },
  { name: "SG 553 | Atlas", rarity: "Restricted", dropChance: 15.98 },
  { name: "PP-Bizon | Judgement of Anubis", rarity: "Restricted", dropChance: 15.98 },
  { name: "UMP-45 | Primal Saber", rarity: "Restricted", dropChance: 15.98 },
  { name: "Dual Berettas | Ventilators", rarity: "Restricted", dropChance: 15.98 },
  { name: "P2000 | Oceanic", rarity: "Restricted", dropChance: 15.98 },
  { name: "MP9 | Bioleak", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Negev | Dazzle", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "G3SG1 | Orange Crash", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "XM1014 | Black Tie", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "CZ75-Auto | Red Astor", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Sawed-Off | Fubar", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MAG-7 | Sonar", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "★ Bayonet", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function run() {
  try {
    const c = await prisma.case.findFirst({ where: { OR: [{ name: "Chroma 3 Case" }, { name: { contains: "Chroma 3" } }] } });
    if (!c) return console.log("❌ Not found");
    await prisma.caseSkin.deleteMany({ where: { caseId: c.id } });
    let added = 0, created = 0;
    for (const s of SKINS) {
      let sk = await prisma.skin.findFirst({ where: { OR: [{ name: s.name }, { marketHashName: s.name }] } });
      if (!sk) { sk = await prisma.skin.create({ data: { name: s.name, marketHashName: s.name, rarity: s.rarity, weaponType: s.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown', priceLatest: Math.random() * 100 + 10, priceMedian: Math.random() * 100 + 10, imageUrl: '' } }); created++; }
      await prisma.caseSkin.create({ data: { caseId: c.id, skinId: sk.id, rarity: s.rarity, dropChance: s.dropChance, isSpecial: s.isSpecial || false } });
      added++;
    }
    console.log(`✅ Chroma 3: ${created} created, ${added} linked`);
  } catch (e) { console.error("❌", e); } finally { await prisma.$disconnect(); }
}
run();

