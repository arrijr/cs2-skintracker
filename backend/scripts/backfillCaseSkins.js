// backend/scripts/backfillCaseSkins.js
//
// Backfill the empty CaseSkin join table from bymykel's crates.json.
//
// Why: catalog sync seeds Case + Skin rows, but never wires the join. Case
// detail pages (/cases/[slug]) therefore render an empty drop table and 0/NaN
// EV. This script does the one-time backfill and is safe to re-run (upsert
// keyed on the @@unique([caseId, skinId]) constraint).
//
// Usage:
//   cd backend
//   node scripts/backfillCaseSkins.js             # writes
//   node scripts/backfillCaseSkins.js --dry-run   # logs only, no DB writes
//
// Source: https://bymykel.github.io/CSGO-API/api/en/crates.json (fallback:
// raw.githubusercontent mirror, mirrors what `bymykelClient.js` already uses).
//
// Catalog quirk we work around: our `Skin` rows are per-wear variants
// (marketHashName = "<base> (Field-Tested)"). bymykel's crate `contains` /
// `contains_rare` entries are BASE names without wear and without StatTrak.
// We look up the first existing wear variant (FT → MW → FN → WW → BS) so the
// join references a real, priced Skin row.

import 'dotenv/config';
import defaultPrisma from '../prisma/prismaClient.js';

const PRIMARY_URL = 'https://bymykel.github.io/CSGO-API/api/en/crates.json';
const FALLBACK_URL =
  'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/crates.json';

// Preferred wear order when bymykel only gives us a base name. Field-Tested is
// the most-traded variant for most weapons, so we try it first.
const WEAR_FALLBACK_ORDER = [
  'Field-Tested',
  'Minimal Wear',
  'Factory New',
  'Well-Worn',
  'Battle-Scarred',
];

const DRY_RUN = process.argv.includes('--dry-run');

async function fetchCratesJson() {
  for (const url of [PRIMARY_URL, FALLBACK_URL]) {
    try {
      console.log(`[fetch] ${url}`);
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) {
        console.warn(`[fetch] ${url} -> ${res.status}`);
        continue;
      }
      const data = await res.json();
      if (!Array.isArray(data)) {
        console.warn(`[fetch] ${url} did not return an array`);
        continue;
      }
      return data;
    } catch (err) {
      console.warn(`[fetch] ${url} threw: ${err.message}`);
    }
  }
  throw new Error('Failed to fetch crates.json from any source');
}

/**
 * Find a Skin row that corresponds to a bymykel base name (no wear suffix).
 *
 * Tries in order:
 *   1. exact name match
 *   2. exact marketHashName match
 *   3. marketHashName with each wear suffix appended (FT → MW → FN → WW → BS)
 *   4. name with each wear suffix appended (legacy seeded rows)
 *
 * Returns the first matching Skin (or null). We deliberately do NOT pick the
 * StatTrak variant — vanilla pricing is what crate EV uses.
 */
async function findSkinForBaseName(prisma, baseName) {
  // 1. exact name
  let skin = await prisma.skin.findFirst({
    where: { name: baseName },
    select: { id: true, name: true, marketHashName: true, wear: true },
  });
  if (skin) return skin;

  // 2. exact mhn
  skin = await prisma.skin.findFirst({
    where: { marketHashName: baseName },
    select: { id: true, name: true, marketHashName: true, wear: true },
  });
  if (skin) return skin;

  // 3. mhn + wear suffix
  for (const wear of WEAR_FALLBACK_ORDER) {
    const candidate = `${baseName} (${wear})`;
    skin = await prisma.skin.findFirst({
      where: {
        marketHashName: candidate,
        isStattrak: { not: true },
      },
      select: { id: true, name: true, marketHashName: true, wear: true },
    });
    if (skin) return skin;
  }

  // 4. name + wear suffix
  for (const wear of WEAR_FALLBACK_ORDER) {
    const candidate = `${baseName} (${wear})`;
    skin = await prisma.skin.findFirst({
      where: {
        name: candidate,
        isStattrak: { not: true },
      },
      select: { id: true, name: true, marketHashName: true, wear: true },
    });
    if (skin) return skin;
  }

  return null;
}

async function findCase(prisma, caseName) {
  // exact
  let row = await prisma.case.findUnique({
    where: { name: caseName },
    select: { id: true, name: true },
  });
  if (row) return row;
  // case-insensitive + trim
  row = await prisma.case.findFirst({
    where: { name: { equals: caseName.trim(), mode: 'insensitive' } },
    select: { id: true, name: true },
  });
  return row;
}

/**
 * For one crate, return a deduped list of { baseName, rarity, isSpecial }.
 * `contains` are normal drops; `contains_rare` are special items (knife/glove
 * unusuals). bymykel often lists multiple phases of the same Doppler in
 * contains_rare, so we dedupe by name.
 */
function extractDropList(crate) {
  const out = new Map(); // name -> { baseName, rarity, isSpecial }

  for (const entry of crate.contains ?? []) {
    if (!entry?.name) continue;
    if (out.has(entry.name)) continue;
    out.set(entry.name, {
      baseName: entry.name,
      rarity: entry.rarity?.name ?? null,
      isSpecial: false,
    });
  }

  for (const entry of crate.contains_rare ?? []) {
    if (!entry?.name) continue;
    if (out.has(entry.name)) continue; // contains wins on conflict
    out.set(entry.name, {
      baseName: entry.name,
      rarity: entry.rarity?.name ?? 'Exceedingly Rare',
      isSpecial: true,
    });
  }

  return [...out.values()];
}

async function backfillForCase(prisma, crate, stats) {
  const caseRow = await findCase(prisma, crate.name);
  if (!caseRow) {
    stats.cases_missing++;
    stats.missing_case_names.push(crate.name);
    console.warn(`[case skip] no DB row for "${crate.name}"`);
    return;
  }
  stats.cases_matched++;

  const drops = extractDropList(crate);
  const rows = []; // { skinId, rarity, isSpecial }
  const skipped = []; // { baseName, reason }

  for (const drop of drops) {
    const skin = await findSkinForBaseName(prisma, drop.baseName);
    if (!skin) {
      skipped.push({ baseName: drop.baseName, reason: 'no skin match' });
      continue;
    }
    rows.push({
      skinId: skin.id,
      rarity: drop.rarity || 'Mil-Spec',
      isSpecial: drop.isSpecial,
    });
  }

  // Dedupe by skinId in case multiple base names mapped to the same variant.
  const bySkinId = new Map();
  for (const r of rows) {
    if (!bySkinId.has(r.skinId)) bySkinId.set(r.skinId, r);
  }
  const uniqueRows = [...bySkinId.values()];

  if (DRY_RUN) {
    console.log(
      `[dry] ${caseRow.name}: ${uniqueRows.length} drops would be inserted, ${skipped.length} skipped`,
    );
    for (const s of skipped) {
      console.log(`  - skip "${s.baseName}" (${s.reason})`);
    }
    stats.drops_inserted += uniqueRows.length;
    stats.drops_skipped += skipped.length;
    return;
  }

  await prisma.$transaction(
    uniqueRows.map((r) =>
      prisma.caseSkin.upsert({
        where: {
          caseId_skinId: { caseId: caseRow.id, skinId: r.skinId },
        },
        create: {
          caseId: caseRow.id,
          skinId: r.skinId,
          rarity: r.rarity,
          isSpecial: r.isSpecial,
        },
        update: {
          rarity: r.rarity,
          isSpecial: r.isSpecial,
        },
      }),
    ),
  );

  console.log(
    `[ok] ${caseRow.name}: inserted/updated ${uniqueRows.length} drops, ${skipped.length} skipped`,
  );
  for (const s of skipped) {
    console.log(`  - skip "${s.baseName}" (${s.reason})`);
  }
  stats.drops_inserted += uniqueRows.length;
  stats.drops_skipped += skipped.length;
}

async function main() {
  console.log(`[mode] ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE'}`);
  const prisma = defaultPrisma;

  const allCrates = await fetchCratesJson();
  const cases = allCrates.filter((c) => c.type === 'Case');
  console.log(`[data] ${allCrates.length} crate entries, ${cases.length} of type=Case`);

  const stats = {
    cases_matched: 0,
    cases_missing: 0,
    drops_inserted: 0,
    drops_skipped: 0,
    missing_case_names: [],
  };

  for (const crate of cases) {
    try {
      await backfillForCase(prisma, crate, stats);
    } catch (err) {
      console.error(`[case fail] ${crate.name}: ${err.message}`);
    }
  }

  console.log('\n=== SUMMARY ===');
  console.log(`cases_matched:   ${stats.cases_matched}`);
  console.log(`cases_missing:   ${stats.cases_missing}`);
  if (stats.missing_case_names.length) {
    console.log(`  missing: ${stats.missing_case_names.join(', ')}`);
  }
  console.log(`drops_inserted:  ${stats.drops_inserted}`);
  console.log(`drops_skipped:   ${stats.drops_skipped}`);
  console.log(`mode:            ${DRY_RUN ? 'dry-run (no writes)' : 'live (rows upserted)'}`);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('[fatal]', err);
  try {
    await defaultPrisma.$disconnect();
  } catch {}
  process.exit(1);
});
