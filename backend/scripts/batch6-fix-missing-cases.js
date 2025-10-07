// Batch 6: Fix Missing Cases (Name Mismatches)
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CASES = {
  "Cs20 Case": [ // Note: "Cs20" not "CS20"
    { name: "AWP | Wildfire", rarity: "Covert", dropChance: 0.64 },
    { name: "MP9 | Hydra", rarity: "Covert", dropChance: 0.64 },
    { name: "Tec-9 | Flash Out", rarity: "Classified", dropChance: 3.2 },
    { name: "FAMAS | Commemoration", rarity: "Classified", dropChance: 3.2 },
    { name: "Five-SeveN | Triumvirate", rarity: "Restricted", dropChance: 15.98 },
    { name: "P250 | Vino Primo", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Classic Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Glove Case": [
    { name: "M4A4 | Buzz Kill", rarity: "Covert", dropChance: 0.64 },
    { name: "USP-S | Cyrex", rarity: "Classified", dropChance: 3.2 },
    { name: "SSG 08 | Dragonfire", rarity: "Restricted", dropChance: 15.98 },
    { name: "MP7 | Cirrus", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Specialist Gloves", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Gallery Case": [
    { name: "M4A1-S | Emphorosaur-S", rarity: "Covert", dropChance: 0.64 },
    { name: "AK-47 | Leet Museo", rarity: "Classified", dropChance: 3.2 },
    { name: "Glock-18 | Vogue", rarity: "Restricted", dropChance: 15.98 },
    { name: "P250 | Visions", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  ],
  "Fever Case": [
    { name: "M4A4 | Temukau", rarity: "Covert", dropChance: 0.64 },
    { name: "AK-47 | Ice Coaled", rarity: "Classified", dropChance: 3.2 },
    { name: "Five-SeveN | Hybrid Hunter", rarity: "Restricted", dropChance: 15.98 },
    { name: "Nova | Dark Sigil", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  ],
  "Huntsman Weapon Case": [
    { name: "M4A4 | Desert-Strike", rarity: "Covert", dropChance: 0.64 },
    { name: "P2000 | Pulse", rarity: "Classified", dropChance: 3.2 },
    { name: "USP-S | Caiman", rarity: "Classified", dropChance: 3.2 },
    { name: "AK-47 | Vulcan", rarity: "Covert", dropChance: 0.64 },
    { name: "CZ75-Auto | Tigris", rarity: "Restricted", dropChance: 15.98 },
    { name: "MAC-10 | Curse", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Huntsman Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
};

async function importBatch6() {
  for (const [caseName, skins] of Object.entries(CASES)) {
    try {
      const c = await prisma.case.findUnique({ where: { name: caseName } });
      if (!c) { console.log(`❌ ${caseName} not found in DB`); continue; }
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

importBatch6();

