#!/usr/bin/env node
/**
 * Backfill Skin.weaponSlug for knives.
 *
 * Per audit 2026-05-22 (Important §B1): knife rows currently have
 * weaponSlug='unknown' because earlier weaponSlugFor() runs treated the ★
 * prefix family inconsistently. Result: /skins/unknown is a junk drawer,
 * /skins/karambit etc. are empty, SEO loses every knife-family long-tail.
 *
 * Strategy:
 *   - Find every Skin row where marketHashName starts with '★ '.
 *   - Re-derive weaponSlug from marketHashName using the shared
 *     weaponSlugFor() helper (already strips ★ / StatTrak™ / Souvenir).
 *   - Only write rows where the new slug differs from the current value.
 *   - Skip rows that already have a meaningful weaponSlug — idempotent.
 *
 * Run:
 *   node backend/scripts/backfillKnifeWeaponSlugs.js --dry-run
 *   node backend/scripts/backfillKnifeWeaponSlugs.js
 */
import prisma from '../src/prisma/prismaClient.js';
import { weaponSlugFor } from '../src/utils/slugify.js';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 100;
const KNIFE_PREFIX = '★ '; // ★ followed by a space

async function main() {
  const rows = await prisma.skin.findMany({
    where: { marketHashName: { startsWith: KNIFE_PREFIX } },
    select: { id: true, marketHashName: true, weaponSlug: true },
  });
  console.log(
    `[knife-backfill] ${rows.length} knife rows found${DRY_RUN ? ' (DRY RUN)' : ''}`,
  );

  const planned = [];
  const skipped = { sameSlug: 0, unresolvable: 0 };
  const slugTally = new Map();

  for (const r of rows) {
    const newSlug = weaponSlugFor(r.marketHashName);
    if (!newSlug || newSlug === 'unknown') {
      // weaponSlugFor returns 'unknown' when marketHashName has no '|'.
      // Some knife rows in older data omit the pipe and skin name — skip
      // rather than write 'unknown' on top of 'unknown'.
      skipped.unresolvable += 1;
      continue;
    }
    if (r.weaponSlug === newSlug) {
      skipped.sameSlug += 1;
      continue;
    }
    slugTally.set(newSlug, (slugTally.get(newSlug) || 0) + 1);
    planned.push({ id: r.id, newSlug, oldSlug: r.weaponSlug });
  }

  console.log(
    `[knife-backfill] planned writes: ${planned.length}; skipped: same=${skipped.sameSlug}, unresolvable=${skipped.unresolvable}`,
  );
  console.log('[knife-backfill] unique target slugs:');
  const tally = [...slugTally.entries()].sort((a, b) => b[1] - a[1]);
  for (const [slug, count] of tally) {
    console.log(`  ${slug.padEnd(28)} ${count}`);
  }

  if (DRY_RUN) {
    console.log('[knife-backfill] DRY RUN — first 5 planned writes:');
    console.log(planned.slice(0, 5));
    return;
  }

  let written = 0;
  for (let i = 0; i < planned.length; i += BATCH_SIZE) {
    const batch = planned.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      batch.map((p) =>
        prisma.skin.update({
          where: { id: p.id },
          data: { weaponSlug: p.newSlug },
        }),
      ),
    );
    written += batch.length;
    console.log(`[knife-backfill] wrote ${written}/${planned.length}`);
  }

  console.log('[knife-backfill] complete');
}

main()
  .catch((e) => {
    console.error('[knife-backfill] failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
