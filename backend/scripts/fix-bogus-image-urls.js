#!/usr/bin/env node
/**
 * One-shot migration: replace bogus `class/730/{slug}` Steam CDN URLs with real ones.
 *
 * Strategy:
 *   For each skin where imageUrl matches `/class/730/`:
 *     1. Look for a sibling skin with the same base name (before " (Wear)") that has a real URL.
 *     2. If found, copy that URL over.
 *     3. If not found, set imageUrl to NULL so the frontend placeholder kicks in cleanly.
 *
 * Usage: node scripts/fix-bogus-image-urls.js [--dry-run]
 */
import process from 'node:process';
import prisma from '../src/prisma/prismaClient.js';

const BOGUS_PATTERN = /\/economy\/image\/class\/730\//;

function stripWearSuffix(name) {
  // "AK-47 | Redline (Field-Tested)" → "AK-47 | Redline"
  return name.replace(/\s*\([^)]+\)\s*$/, '').trim();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`[fix-bogus-urls] mode=${dryRun ? 'DRY-RUN' : 'WRITE'}`);

  // 1. Find all skins with bogus URLs
  const bogus = await prisma.skin.findMany({
    where: {
      imageUrl: { contains: '/economy/image/class/730/' },
    },
    select: { id: true, name: true, marketHashName: true, imageUrl: true },
  });
  console.log(`[fix-bogus-urls] Found ${bogus.length} skins with bogus image URLs.`);

  if (bogus.length === 0) {
    console.log('[fix-bogus-urls] Nothing to do.');
    return;
  }

  // 2. Build lookup: name → real URL (from non-bogus entries)
  const realEntries = await prisma.skin.findMany({
    where: {
      imageUrl: { not: null },
      NOT: { imageUrl: { contains: '/economy/image/class/730/' } },
    },
    select: { name: true, imageUrl: true },
  });
  console.log(`[fix-bogus-urls] Index built from ${realEntries.length} skins with real URLs.`);

  const byName = new Map();
  for (const e of realEntries) {
    if (e.name && e.imageUrl) {
      byName.set(e.name, e.imageUrl);
      // Also index without wear suffix in case the lookup needs it
      const base = stripWearSuffix(e.name);
      if (base !== e.name && !byName.has(base)) {
        byName.set(base, e.imageUrl);
      }
    }
  }

  // 3. For each bogus, try to match
  let matched = 0;
  let nulled = 0;
  let unchanged = 0;
  const updates = [];

  for (const s of bogus) {
    const baseName = stripWearSuffix(s.name ?? '');
    const realUrl = byName.get(baseName) || byName.get(s.name);
    if (realUrl) {
      matched++;
      updates.push({ id: s.id, name: s.name, newUrl: realUrl });
    } else {
      nulled++;
      updates.push({ id: s.id, name: s.name, newUrl: null });
    }
  }

  console.log(`[fix-bogus-urls] Plan: ${matched} copied from sibling, ${nulled} cleared to null.`);

  if (dryRun) {
    console.log('[fix-bogus-urls] DRY-RUN — sample of plan:');
    for (const u of updates.slice(0, 10)) {
      console.log(`  id=${u.id} ${u.name?.slice(0, 50).padEnd(50)} → ${u.newUrl ? 'COPY ' + u.newUrl.slice(-40) : 'NULL'}`);
    }
    return;
  }

  // 4. Apply updates (batched)
  let written = 0;
  for (const u of updates) {
    try {
      await prisma.skin.update({
        where: { id: u.id },
        data: { imageUrl: u.newUrl },
      });
      written++;
    } catch (err) {
      unchanged++;
      console.error(`[fix-bogus-urls] FAILED id=${u.id}:`, err.message);
    }
  }

  console.log(`[fix-bogus-urls] Done. Updated ${written} records. Failed ${unchanged}.`);
}

main()
  .catch((err) => {
    console.error('[fix-bogus-urls] FATAL:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
