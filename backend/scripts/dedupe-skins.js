#!/usr/bin/env node
/**
 * One-shot: deduplicate Skin records that share the same `name`.
 *
 * Strategy (per ADR-001):
 *   For each name with multiple rows:
 *     1. Pick canonical row (prefer mhn without "(Wear)" suffix; prefer non-StatTrak)
 *     2. For each non-canonical row: rewrite FKs (Portfolio, Watchlist, Alert, PriceHistory,
 *        MarketSnapshot, SkinQuantityHistory, CaseSkin, PortfolioHistory, Transaction) to point
 *        at canonical, then delete the row
 *     3. Special case: rows that look like StatTrak variants (mhn starts with StatTrak™) are NOT merged.
 *        Instead their `name` is rewritten to include the StatTrak™ prefix so they survive a
 *        future `UNIQUE(name)` constraint as distinct records.
 *
 * Usage: node scripts/dedupe-skins.js [--dry-run]
 */
import process from 'node:process';
import prisma from '../src/prisma/prismaClient.js';

// Tables with a Skin.id FK column (per schema.prisma audit).
// Order matters: history tables migrated last so unique constraint conflicts
// surface on the user-facing tables first.
const FK_TABLES = [
  'portfolio',
  'watchlist',
  'alert',
  'transaction',
  'priceHistory',
  'marketSnapshot',
  'skinQuantityHistory',
  'caseSkin',
];

/**
 * Among rows sharing the same `name`, pick the canonical one.
 * Rules:
 *  1. Prefer rows with NO "(...)" wear suffix in marketHashName
 *  2. Prefer rows that DON'T start with "StatTrak™"
 *  3. Tie-break: lowest id
 */
function pickCanonical(rows) {
  const score = (r) => {
    let s = 0;
    if (!/\([^)]+\)\s*$/.test(r.marketHashName)) s += 10; // no wear suffix
    if (!/^StatTrak™/.test(r.marketHashName)) s += 5; // not stattrak
    return s;
  };
  // Sort: highest score first, then lowest id
  return [...rows].sort((a, b) => {
    const ds = score(b) - score(a);
    if (ds !== 0) return ds;
    return a.id - b.id;
  })[0];
}

function isStatTrak(row) {
  return /^StatTrak™/.test(row.marketHashName || '');
}

function isSouvenir(row) {
  return /^Souvenir\s/.test(row.marketHashName || '');
}

function statTrakName(row) {
  // Strip "(Wear)" suffix from mhn → use as new name
  // "StatTrak™ AWP | Asiimov (Field-Tested)" → "StatTrak™ AWP | Asiimov"
  return row.marketHashName.replace(/\s*\([^)]+\)\s*$/, '').trim();
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(`[dedupe-skins] mode=${dryRun ? 'DRY-RUN' : 'WRITE'}`);

  const all = await prisma.skin.findMany({
    select: { id: true, name: true, marketHashName: true },
  });

  const byName = new Map();
  for (const s of all) {
    if (!byName.has(s.name)) byName.set(s.name, []);
    byName.get(s.name).push(s);
  }
  const groups = [...byName.entries()].filter(([, v]) => v.length > 1);
  console.log(`[dedupe-skins] ${groups.length} duplicate-name groups (${groups.reduce((s, [, v]) => s + v.length, 0)} rows total)`);

  const plan = {
    merges: [], // [{ canonicalId, staleIds: [...], name }]
    renames: [], // [{ id, oldName, newName }]
  };

  for (const [name, rows] of groups) {
    // Separate StatTrak/Souvenir rows — they should NOT be merged with regular skins
    const statTrakRows = rows.filter((r) => isStatTrak(r) || isSouvenir(r));
    const regularRows = rows.filter((r) => !isStatTrak(r) && !isSouvenir(r));

    // Rename StatTrak rows so they survive a UNIQUE(name) constraint
    for (const r of statTrakRows) {
      const newName = statTrakName(r);
      if (newName !== r.name) {
        plan.renames.push({ id: r.id, oldName: r.name, newName });
      }
    }

    // Merge regular rows into one canonical
    if (regularRows.length > 1) {
      const canonical = pickCanonical(regularRows);
      const stale = regularRows.filter((r) => r.id !== canonical.id);
      plan.merges.push({
        canonicalId: canonical.id,
        canonicalMhn: canonical.marketHashName,
        staleIds: stale.map((r) => r.id),
        staleMhns: stale.map((r) => r.marketHashName),
        name,
      });
    }
  }

  console.log(`[dedupe-skins] Plan: ${plan.merges.length} merges, ${plan.renames.length} StatTrak renames`);

  console.log('\nSample merges:');
  for (const m of plan.merges.slice(0, 8)) {
    console.log(`  ${m.name.slice(0, 40).padEnd(40)} canonical=#${m.canonicalId} (${m.canonicalMhn}) ← stale=${m.staleIds.map((id, i) => `#${id} (${m.staleMhns[i]})`).join(', ')}`);
  }
  if (plan.renames.length > 0) {
    console.log('\nStatTrak renames:');
    for (const r of plan.renames) {
      console.log(`  #${r.id}: "${r.oldName}" → "${r.newName}"`);
    }
  }

  if (dryRun) {
    // FK ref count for planned stale ids
    const staleIds = plan.merges.flatMap((m) => m.staleIds);
    console.log(`\nFK refs to migrate across ${staleIds.length} stale rows:`);
    for (const t of FK_TABLES) {
      try {
        const c = await prisma[t].count({ where: { skinId: { in: staleIds } } });
        console.log(`  ${t.padEnd(24)} ${c}`);
      } catch {
        console.log(`  ${t.padEnd(24)} N/A`);
      }
    }
    console.log('\n[dedupe-skins] DRY-RUN — nothing was written.');
    return;
  }

  // Apply
  let mergedCount = 0;
  let renamedCount = 0;
  let fkUpdates = 0;
  let deletedCount = 0;

  for (const merge of plan.merges) {
    const { canonicalId, staleIds } = merge;
    for (const staleId of staleIds) {
      for (const t of FK_TABLES) {
        try {
          const result = await prisma[t].updateMany({
            where: { skinId: staleId },
            data: { skinId: canonicalId },
          });
          fkUpdates += result.count;
        } catch (e) {
          // Some tables have @@unique([userId, skinId]) — duplicate after rewrite would conflict.
          // Drop the conflicting row in that case (preserves data integrity).
          if (/unique/i.test(e.message)) {
            console.warn(`[dedupe-skins] unique conflict on ${t}, dropping duplicate: ${e.message}`);
            await prisma[t].deleteMany({ where: { skinId: staleId } });
          } else {
            throw e;
          }
        }
      }
      // Delete the stale row
      await prisma.skin.delete({ where: { id: staleId } });
      deletedCount++;
    }
    mergedCount++;
  }

  for (const r of plan.renames) {
    await prisma.skin.update({
      where: { id: r.id },
      data: { name: r.newName },
    });
    renamedCount++;
  }

  console.log(`\n[dedupe-skins] DONE. Merged: ${mergedCount}, FK updates: ${fkUpdates}, Deleted: ${deletedCount}, Renamed: ${renamedCount}`);

  // Verify
  const after = await prisma.skin.findMany({ select: { name: true } });
  const dupAfter = new Map();
  for (const s of after) dupAfter.set(s.name, (dupAfter.get(s.name) ?? 0) + 1);
  const remainingDups = [...dupAfter.entries()].filter(([, c]) => c > 1);
  console.log(`[dedupe-skins] Verify: ${remainingDups.length} duplicate-name groups remain (should be 0).`);
  if (remainingDups.length > 0) {
    for (const [n, c] of remainingDups.slice(0, 5)) console.log(`  ${n} × ${c}`);
  }
}

main()
  .catch((err) => {
    console.error('[dedupe-skins] FATAL:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
