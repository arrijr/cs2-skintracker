// One-off backfill: detect skins where multiple wear variants share the same
// `priceLatest` (a strong signal they were all seeded from the parent skin's
// price during the bymykel catalog sync, never individually refreshed from
// Steam Market). Clear their `priceUpdatedAt` to NULL so the daily
// `priceRefreshJob` (sorted by priceUpdatedAt asc nulls first) picks them up
// in the next few runs and replaces with real per-wear Steam prices.
//
// Run: `cd backend && node scripts/reprioritizeStaleWearVariants.js`
//
// Idempotent — re-runs only touch rows that still meet the duplicate-price
// signal AND still have a non-null priceUpdatedAt.

import prisma from '../src/prisma/prismaClient.js';

async function run() {
  console.log('[reprioritize] scanning…');

  // Get all skins grouped by base name (strip wear suffix + StatTrak™ prefix).
  // For each group with >= 2 wear variants sharing the same priceLatest, mark
  // them as needing refresh.
  // Prisma 6 quirk: `not: null` on nullable fields is rejected. Use a coarse
  // filter (only filter what we can) and JS-side filter the rest.
  const allSkins = await prisma.skin.findMany({
    select: { id: true, marketHashName: true, priceLatest: true, priceUpdatedAt: true },
  });
  const skins = allSkins.filter((s) => s.marketHashName && s.priceLatest != null && s.priceUpdatedAt != null);

  // Group by "base name" — everything before the final wear-suffix parenthesis.
  const groups = new Map(); // base → [{id, mhn, price}]
  for (const s of skins) {
    const m = s.marketHashName.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (!m) continue; // no wear suffix
    const base = m[1].trim();
    if (!groups.has(base)) groups.set(base, []);
    groups.get(base).push({ id: s.id, mhn: s.marketHashName, price: s.priceLatest });
  }

  const toReset = [];
  for (const [base, variants] of groups.entries()) {
    if (variants.length < 2) continue;
    // Detect duplicate prices across variants.
    const priceCount = new Map();
    for (const v of variants) priceCount.set(v.price, (priceCount.get(v.price) || 0) + 1);
    for (const v of variants) {
      if ((priceCount.get(v.price) || 0) >= 2) toReset.push(v.id);
    }
  }

  console.log(`[reprioritize] groups: ${groups.size}, variants_to_reset: ${toReset.length}`);

  if (toReset.length === 0) {
    console.log('[reprioritize] nothing to do.');
    process.exit(0);
  }

  // Reset in chunks of 500 to keep transactions sane.
  let written = 0;
  for (let i = 0; i < toReset.length; i += 500) {
    const chunk = toReset.slice(i, i + 500);
    const result = await prisma.skin.updateMany({
      where: { id: { in: chunk } },
      data: { priceUpdatedAt: null },
    });
    written += result.count;
    console.log(`[reprioritize] chunk ${i / 500 + 1}: ${result.count} rows`);
  }

  console.log(`[reprioritize] DONE — reset priceUpdatedAt on ${written} rows. Next cron at 03:30 UTC will refresh them with real per-wear Steam prices.`);
  process.exit(0);
}

run().catch((e) => {
  console.error('[reprioritize] FAIL', e);
  process.exit(1);
});
