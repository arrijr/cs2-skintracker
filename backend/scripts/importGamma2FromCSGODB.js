// Gamma 2 Case Import
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SKINS = [
  { name: "AK-47 | Neon Revolution", rarity: "Covert", dropChance: 0.64 },
  { name: "FAMAS | Roll Cage", rarity: "Covert", dropChance: 0.64 },
  { name: "Tec-9 | Fuel Injector", rarity: "Classified", dropChance: 3.2 },
  { name: "P90 | Shallow Grave", rarity: "Classified", dropChance: 3.2 },
  { name: "Five-SeveN | Hyper Beast", rarity: "Classified", dropChance: 3.2 },
  { name: "SSG 08 | Big Iron", rarity: "Restricted", dropChance: 15.98 },
  { name: "SG 553 | Triarch", rarity: "Restricted", dropChance: 15.98 },
  { name: "P250 | Ripple", rarity: "Restricted", dropChance: 15.98 },
  { name: "CZ75-Auto | Imprint", rarity: "Restricted", dropChance: 15.98 },
  { name: "Glock-18 | Weasel", rarity: "Restricted", dropChance: 15.98 },
  { name: "R8 Revolver | Reboot", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "UMP-45 | Exposure", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MAG-7 | Sonar", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Negev | Loudmouth", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MP9 | Airlock", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Dual Berettas | Ventilators", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "PP-Bizon | Photic Zone", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "★ Huntsman Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function run() {
  try {
    const c = await prisma.case.findFirst({ where: { OR: [{ name: "Gamma 2 Case" }, { name: { contains: "Gamma 2" } }] } });
    if (!c) return console.log("❌ Not found");
    await prisma.caseSkin.deleteMany({ where: { caseId: c.id } });
    let added = 0, created = 0;
    for (const s of SKINS) {
      let sk = await prisma.skin.findFirst({ where: { OR: [{ name: s.name }, { marketHashName: s.name }] } });
      if (!sk) { sk = await prisma.skin.create({ data: { name: s.name, marketHashName: s.name, rarity: s.rarity, weaponType: s.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown', priceLatest: Math.random() * 100 + 10, priceMedian: Math.random() * 100 + 10, imageUrl: '' } }); created++; }
      await prisma.caseSkin.create({ data: { caseId: c.id, skinId: sk.id, rarity: s.rarity, dropChance: s.dropChance, isSpecial: s.isSpecial || false } });
      added++;
    }
    console.log(`✅ Gamma 2: ${created} created, ${added} linked`);
  } catch (e) { console.error("❌", e); } finally { await prisma.$disconnect(); }
}
run();

