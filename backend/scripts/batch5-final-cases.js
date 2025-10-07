// Batch 5: Final Remaining Cases
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CASES = {
  "eSports 2013 Case": [
    { name: "AWP | BOOM", rarity: "Covert", dropChance: 0.64 },
    { name: "P90 | Death by Kitty", rarity: "Classified", dropChance: 3.2 },
    { name: "Glock-18 | Brass", rarity: "Restricted", dropChance: 15.98 },
    { name: "Famas | Doomkitty", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Karambit", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "eSports 2013 Winter Case": [
    { name: "M4A4 | X-Ray", rarity: "Covert", dropChance: 0.64 },
    { name: "P2000 | Ocean Foam", rarity: "Classified", dropChance: 3.2 },
    { name: "AK-47 | Blue Laminate", rarity: "Restricted", dropChance: 15.98 },
    { name: "AWP | Corticera", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Bayonet", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "eSports 2014 Summer Case": [
    { name: "USP-S | Road Rash", rarity: "Covert", dropChance: 0.64 },
    { name: "M4A4 | Bullet Rain", rarity: "Classified", dropChance: 3.2 },
    { name: "CZ75-Auto | Chalice", rarity: "Classified", dropChance: 3.2 },
    { name: "P90 | Module", rarity: "Restricted", dropChance: 15.98 },
    { name: "Glock-18 | Steel Disruption", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Flip Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
};

async function importBatch5() {
  for (const [caseName, skins] of Object.entries(CASES)) {
    try {
      const c = await prisma.case.findFirst({ where: { OR: [{ name: caseName }, { name: { contains: caseName.split(' ')[0] } }] } });
      if (!c) { console.log(`❌ ${caseName} not found`); continue; }
      await prisma.caseSkin.deleteMany({ where: { caseId: c.id } });
      let added = 0, created = 0;
      for (const s of skins) {
        let sk = await prisma.skin.findFirst({ where: { OR: [{ name: s.name }, { marketHashName: s.name }] } });
        if (!sk) { sk = await prisma.skin.create({ data: { name: s.name, marketHashName: s.name, rarity: s.rarity, weaponType: s.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown', priceLatest: Math.random() * 100 + 10, priceMedian: Math.random() * 100 + 10, imageUrl: '' } }); created++; }
        await prisma.caseSkin.create({ data: { caseId: c.id, skinId: sk.id, rarity: s.rarity, dropChance: s.dropChance, isSpecial: s.isSpecial || false } });
        added++;
      }
      console.log(`✅ ${caseName}: ${created} created, ${added} linked`);
    } catch (e) { console.error(`❌ ${caseName}:`, e.message); }
  }
  await prisma.$disconnect();
}

importBatch5();

