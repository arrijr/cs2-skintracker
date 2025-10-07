// Batch 2: Spectrum 2, Prisma 2, Fracture, Horizon
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CASES = {
  "Spectrum 2 Case": [
    { name: "AK-47 | The Empress", rarity: "Covert", dropChance: 0.64 },
    { name: "MAC-10 | Disco Tech", rarity: "Covert", dropChance: 0.64 },
    { name: "XM1014 | Ziggy", rarity: "Classified", dropChance: 3.2 },
    { name: "SSG 08 | Bloodshot", rarity: "Classified", dropChance: 3.2 },
    { name: "Desert Eagle | Cobra Strike", rarity: "Classified", dropChance: 3.2 },
    { name: "M4A1-S | Leaded Glass", rarity: "Restricted", dropChance: 15.98 },
    { name: "P90 | Off World", rarity: "Restricted", dropChance: 15.98 },
    { name: "Five-SeveN | Capillary", rarity: "Restricted", dropChance: 15.98 },
    { name: "Glock-18 | Off World", rarity: "Restricted", dropChance: 15.98 },
    { name: "AUG | Tom Cat", rarity: "Restricted", dropChance: 15.98 },
    { name: "Tec-9 | Cracked Opal", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "USP-S | Flashback", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "P250 | Ripple", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "UMP-45 | Scaffold", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "MP7 | Cirrus", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "PP-Bizon | High Roller", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "SCAR-20 | Enforcer", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Flip Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Prisma 2 Case": [
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
  ],
  "Fracture Case": [
    { name: "AK-47 | Legion of Anubis", rarity: "Covert", dropChance: 0.64 },
    { name: "M4A4 | Cyber Security", rarity: "Covert", dropChance: 0.64 },
    { name: "Glock-18 | Vogue", rarity: "Classified", dropChance: 3.2 },
    { name: "M4A1-S | Printstream", rarity: "Classified", dropChance: 3.2 },
    { name: "Five-SeveN | Fairy Tale", rarity: "Classified", dropChance: 3.2 },
    { name: "UMP-45 | Fade", rarity: "Restricted", dropChance: 15.98 },
    { name: "AWP | Chromatic Aberration", rarity: "Restricted", dropChance: 15.98 },
    { name: "P250 | Cassette", rarity: "Restricted", dropChance: 15.98 },
    { name: "MP5-SD | Kitbash", rarity: "Restricted", dropChance: 15.98 },
    { name: "Desert Eagle | Printstream", rarity: "Restricted", dropChance: 15.98 },
    { name: "Tec-9 | Blast From the Past", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "MAG-7 | Monster Call", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "Negev | Ultralight", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "XM1014 | Entombed", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "PP-Bizon | Lapis Gator", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "R8 Revolver | Crazy 8", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "Nova | Clear Polymer", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Paracord Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
  "Horizon Case": [
    { name: "AK-47 | Neon Rider", rarity: "Covert", dropChance: 0.64 },
    { name: "Desert Eagle | Code Red", rarity: "Covert", dropChance: 0.64 },
    { name: "AUG | Stymphalian", rarity: "Classified", dropChance: 3.2 },
    { name: "P250 | Nevermore", rarity: "Classified", dropChance: 3.2 },
    { name: "R8 Revolver | Llama Cannon", rarity: "Classified", dropChance: 3.2 },
    { name: "AWP | Neo-Noir", rarity: "Restricted", dropChance: 15.98 },
    { name: "MAG-7 | SWAG-7", rarity: "Restricted", dropChance: 15.98 },
    { name: "P2000 | Acid Etched", rarity: "Restricted", dropChance: 15.98 },
    { name: "CZ75-Auto | Polymer", rarity: "Restricted", dropChance: 15.98 },
    { name: "Five-SeveN | Angry Mob", rarity: "Restricted", dropChance: 15.98 },
    { name: "Galil AR | Signal", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "SG 553 | Phantom", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "Tec-9 | Bamboozle", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "M249 | Emerald Poison Dart", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "Nova | Toys", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "UMP-45 | Metal Flowers", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "MAC-10 | Pipe Down", rarity: "Mil-Spec Grade", dropChance: 15.98 },
    { name: "★ Gut Knife", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
  ],
};

async function importBatch2() {
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

importBatch2();

