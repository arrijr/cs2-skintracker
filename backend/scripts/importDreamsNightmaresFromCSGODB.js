// /backend/scripts/importDreamsNightmaresFromCSGODB.js — [Backend]
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const CASE_NAME = "Dreams & Nightmares Case";
const CSGODB_URL = "https://www.csgodatabase.com/cases/dreams-and-nightmares-case/";

const CASE_SKINS = [
  { name: "AK-47 | Nightwish", rarity: "Covert", dropChance: 0.64 },
  { name: "MP9 | Starlight Protector", rarity: "Covert", dropChance: 0.64 },
  { name: "M4A1-S | Night Terror", rarity: "Classified", dropChance: 3.2 },
  { name: "USP-S | Ticket to Hell", rarity: "Classified", dropChance: 3.2 },
  { name: "FAMAS | Rapid Eye Movement", rarity: "Classified", dropChance: 3.2 },
  { name: "Dual Berettas | Melondrama", rarity: "Restricted", dropChance: 15.98 },
  { name: "G3SG1 | Dream Glade", rarity: "Restricted", dropChance: 15.98 },
  { name: "MAC-10 | Ensnared", rarity: "Restricted", dropChance: 15.98 },
  { name: "PP-Bizon | Space Cat", rarity: "Restricted", dropChance: 15.98 },
  { name: "XM1014 | Zombie Offensive", rarity: "Restricted", dropChance: 15.98 },
  { name: "Galil AR | Destroyer", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "M249 | Deep Relief", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "MP5-SD | Necro Jr.", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "P2000 | Lifted Spirits", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "P250 | Re.built", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Sawed-Off | Spirit Board", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "Tec-9 | Terrace", rarity: "Mil-Spec Grade", dropChance: 15.98 },
  { name: "★ Bayonet", rarity: "Exceedingly Rare", dropChance: 0.26, isSpecial: true },
];

async function importDreamsNightmaresFromCSGODB() {
  try {
    const caseItem = await prisma.case.findFirst({ where: { OR: [{ name: CASE_NAME }, { name: { contains: "Dreams" } }] } });
    if (!caseItem) { console.log(`❌ Not found: ${CASE_NAME}`); return; }
    
    console.log(`📦 ${caseItem.name} (ID: ${caseItem.id})`);
    const deleted = await prisma.caseSkin.deleteMany({ where: { caseId: caseItem.id } });
    
    let added = 0, created = 0;
    for (const skinData of CASE_SKINS) {
      let skin = await prisma.skin.findFirst({ where: { OR: [{ name: skinData.name }, { marketHashName: skinData.name }] } });
      if (!skin) {
        skin = await prisma.skin.create({
          data: {
            name: skinData.name, marketHashName: skinData.name, rarity: skinData.rarity,
            weaponType: skinData.name.match(/^([^|]+)/)?.[1].trim().replace('★ ', '') || 'Unknown',
            priceLatest: Math.random() * 100 + 10, priceMedian: Math.random() * 100 + 10,
            imageUrl: `https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP5gVO8vywwMiukcZice1M9ZViD-ATrle7v15O46cifzHFhunZ243yInxW-10sZOrBp1qTLVxzAUNxEoFAP`
          }
        });
        created++;
      }
      await prisma.caseSkin.create({ data: { caseId: caseItem.id, skinId: skin.id, rarity: skinData.rarity, dropChance: skinData.dropChance, isSpecial: skinData.isSpecial || false } });
      added++;
    }
    console.log(`🎉 Dreams & Nightmares: ${deleted.count} deleted | ${created} created | ${added} linked`);
  } catch (error) {
    console.error("❌", error);
  } finally {
    await prisma.$disconnect();
  }
}

importDreamsNightmaresFromCSGODB();

