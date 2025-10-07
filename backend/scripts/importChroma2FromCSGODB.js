// Chroma 2 Case Import
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SKINS = [
  { name: "M4A1-S | Hyper Beast", rarity: "Covert", dropChance: 0.64 },
  { name: "Galil AR | Eco", rarity: "Covert", dropChance: 0.64 },
  { name: "Five-SeveN | Monkey Business", rarity: "Classified", dropChance: 3.2 },
  { name: "AWP | Worm God", rarity: "Classified", dropChance: 3.2 },
  { name: "CZ75-Auto | Yellow Jacket", rarity: "Classified", dropChance: 3.2 },
  { name: "AK-47 | Elite Build", rarity: "Restricted", dropChance: 15.98 },
  { name: "MAG-7 | Heat", rarity: "Restricted", dropChance: 15.98 },
  { name: "UMP-45 | Grand Prix", rarity: "Restricted", dropChance: 15.98 },
  { name: "Negev | Man-o'-war", rarity: "Restricted", dropChance: 15.98 },
  { name: "P250 | Valence", rarity: "Restricted", dropChance: 15.98 },
  { name: "Desert Eagle | Naga", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Sawed-Off | Origami", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MP7 | Armor Core", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "XM1014 | Quicksilver", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Dual Berettas | Urban Shock", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "SCAR-20 | Grotto", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MAC-10 | Malachite", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "★ Karambit", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function run() {
  try {
    const c = await prisma.case.findFirst({ where: { OR: [{ name: "Chroma 2 Case" }, { name: { contains: "Chroma 2" } }] } });
    if (!c) return console.log("❌ Not found");
    await prisma.caseSkin.deleteMany({ where: { caseId: c.id } });
    let added = 0, created = 0;
    for (const s of SKINS) {
      let sk = await prisma.skin.findFirst({ where: { OR: [{ name: s.name }, { marketHashName: s.name }] } });
      if (!sk) { sk = await prisma.skin.create({ data: { name: s.name, marketHashName: s.name, rarity: s.rarity, weaponType: s.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown', priceLatest: Math.random() * 100 + 10, priceMedian: Math.random() * 100 + 10, imageUrl: '' } }); created++; }
      await prisma.caseSkin.create({ data: { caseId: c.id, skinId: sk.id, rarity: s.rarity, dropChance: s.dropChance, isSpecial: s.isSpecial || false } });
      added++;
    }
    console.log(`✅ Chroma 2: ${created} created, ${added} linked`);
  } catch (e) { console.error("❌", e); } finally { await prisma.$disconnect(); }
}
run();

