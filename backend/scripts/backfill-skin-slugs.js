#!/usr/bin/env node
/**
 * Idempotent slug backfill for the Skin table.
 *
 *   - Reads all rows where slug IS NULL.
 *   - Computes slug + weaponSlug from marketHashName.
 *   - Resolves slug collisions deterministically by appending the integer id.
 *   - Writes in batches of 500 with a console progress line per batch.
 *
 * Run:
 *   node backend/scripts/backfill-skin-slugs.js
 *   node backend/scripts/backfill-skin-slugs.js --dry-run
 */
import prisma from '../src/prisma/prismaClient.js';
import { slugify, weaponSlugFor } from '../src/utils/slugify.js';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 500;

async function main() {
  const rows = await prisma.skin.findMany({
    where: { slug: null },
    select: { id: true, marketHashName: true, name: true },
  });
  console.log(`[backfill] ${rows.length} rows need slugs${DRY_RUN ? ' (DRY RUN)' : ''}`);

  // Pre-compute slugs + resolve collisions deterministically.
  const seen = new Map(); // slug → first id that used it
  const planned = [];
  for (const r of rows) {
    const source = r.marketHashName || r.name || '';
    let slug = slugify(source);
    const weaponSlug = weaponSlugFor(source);

    if (!slug) {
      console.warn(`[backfill] skin id=${r.id} has no slug-able name "${source}" — skipping`);
      continue;
    }

    if (seen.has(slug)) {
      // Collision — append id for deterministic uniqueness.
      slug = `${slug}-${r.id}`;
    }
    seen.set(slug, r.id);
    planned.push({ id: r.id, slug, weaponSlug });
  }

  console.log(`[backfill] planned ${planned.length} writes; ${seen.size === planned.length ? 'no' : (planned.length - seen.size)} collisions resolved`);

  if (DRY_RUN) {
    console.log('[backfill] DRY RUN — first 5 planned writes:');
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
          data: { slug: p.slug, weaponSlug: p.weaponSlug },
        })
      )
    );
    written += batch.length;
    console.log(`[backfill] wrote ${written}/${planned.length}`);
  }

  console.log('[backfill] complete');
}

main()
  .catch((e) => {
    console.error('[backfill] failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
