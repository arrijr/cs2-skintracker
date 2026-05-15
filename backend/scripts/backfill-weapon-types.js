#!/usr/bin/env node
/**
 * One-shot: derive `weaponType` and `itemType` from skin `name` for all skins where these fields are NULL.
 *
 * bymykel/CSGO-API doesn't ship weaponType per item, but the name field reliably encodes it:
 *   "AK-47 | Redline"            → weaponType: "AK-47",          itemType: "Rifle"
 *   "★ Karambit | Doppler"      → weaponType: "★ Karambit",    itemType: "Knife"
 *   "★ Hand Wraps | Spruce DDPAT" → weaponType: "★ Hand Wraps", itemType: "Gloves"
 *
 * Usage: node scripts/backfill-weapon-types.js [--dry-run]
 */
import process from 'node:process';
import prisma from '../src/prisma/prismaClient.js';
import { extractWeaponType, categorizeWeapon as categorize } from '../src/services/catalog/weaponClassifier.js';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`[backfill-weapon-types] mode=${dryRun ? 'DRY-RUN' : 'WRITE'}`);

  const skins = await prisma.skin.findMany({
    where: { OR: [{ weaponType: null }, { itemType: null }] },
    select: { id: true, name: true, marketHashName: true, weaponType: true, itemType: true },
  });
  console.log(`[backfill-weapon-types] ${skins.length} skins need backfill.`);

  let updated = 0;
  let skipped = 0;
  const sample = [];
  const unknownWeapons = new Map();

  for (const s of skins) {
    const wt = extractWeaponType(s.name);
    const it = categorize(wt);
    if (!wt) { skipped++; continue; }

    const newWT = s.weaponType == null ? wt : s.weaponType;
    const newIT = s.itemType == null ? it : s.itemType;
    if (newWT === s.weaponType && newIT === s.itemType) { skipped++; continue; }

    if (sample.length < 12) sample.push({ id: s.id, name: s.name, weaponType: newWT, itemType: newIT });
    if (!it && wt) unknownWeapons.set(wt, (unknownWeapons.get(wt) ?? 0) + 1);

    if (!dryRun) {
      try {
        await prisma.skin.update({ where: { id: s.id }, data: { weaponType: newWT, itemType: newIT } });
        updated++;
      } catch (e) {
        console.error(`[backfill-weapon-types] FAIL id=${s.id}:`, e.message);
      }
    } else {
      updated++;
    }
  }

  console.log(`[backfill-weapon-types] Updated: ${updated}, Skipped: ${skipped}`);
  console.log('Sample updates:');
  for (const x of sample) console.log(` `, x);
  if (unknownWeapons.size > 0) {
    console.log('Weapons without category mapping (will have itemType=null):');
    const sorted = [...unknownWeapons.entries()].sort((a, b) => b[1] - a[1]);
    for (const [w, c] of sorted.slice(0, 20)) console.log(`  ${c.toString().padStart(5)} × ${w}`);
  }
}

main()
  .catch((err) => {
    console.error('[backfill-weapon-types] FATAL:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
