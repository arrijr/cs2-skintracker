// One-shot backfill: refresh prices for every Case whose lastUpdated has
// fallen behind. Targets cases with `lastUpdated` older than 24h (or any
// case with `price` null/0). Idempotent — re-runs simply re-fetch.
//
// Background: the daily priceRefresh cron used to put cases between skins
// and marketItems in its iteration order. With 2000 skins ahead of them
// (~50min wall-clock), if Render killed the run mid-loop, cases never got
// processed. Fix shipped 2026-05-22 (cases-first ordering), but the 87
// cases already stuck at lastUpdated=seed-date need a one-time backfill.
//
// Run: `cd backend && node scripts/backfillCasePrices.js`
// Or: `cd backend && node scripts/backfillCasePrices.js --all` to refresh
// every case regardless of lastUpdated freshness.

import prisma from '../src/prisma/prismaClient.js';
import { refreshItemPrice } from '../src/services/pricing/priceRefreshJob.js';
import logger from '../src/utils/logger.js';

const REFRESH_DELAY_MS = 1500; // polite spacing for Steam Market

async function main() {
  const all = process.argv.includes('--all');
  console.log(`[backfill-cases] mode: ${all ? 'ALL cases' : 'stale (>24h) + unpriced'}`);

  const where = all
    ? {}
    : {
        OR: [
          { price: null },
          { price: 0 },
          { lastUpdated: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
        ],
      };

  const cases = await prisma.case.findMany({
    where,
    select: { id: true, name: true, price: true, lastUpdated: true },
    orderBy: [{ lastUpdated: { sort: 'asc', nulls: 'first' } }],
  });

  console.log(`[backfill-cases] ${cases.length} cases to process`);
  if (cases.length === 0) {
    console.log('[backfill-cases] nothing to do.');
    process.exit(0);
  }

  let ok = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < cases.length; i++) {
    const c = cases[i];
    const item = { id: c.id, marketHashName: c.name, itemType: 'case' };
    try {
      const result = await refreshItemPrice(item);
      if (result.found) {
        ok++;
        console.log(`  ✅ [${i + 1}/${cases.length}] ${c.name}: $${result.priceLatest?.toFixed(2)}`);
      } else if (result.status === 404 || result.status === 500) {
        notFound++;
        console.log(`  ⚠️  [${i + 1}/${cases.length}] ${c.name}: not found on Steam Market`);
      } else {
        errors++;
        console.log(`  ❌ [${i + 1}/${cases.length}] ${c.name}: ${result.error ?? `status ${result.status}`}`);
      }
    } catch (err) {
      errors++;
      console.error(`  ❌ [${i + 1}/${cases.length}] ${c.name}: throw —`, err.message);
    }

    if (i < cases.length - 1) {
      await new Promise((r) => setTimeout(r, REFRESH_DELAY_MS));
    }
  }

  console.log('');
  console.log('========== backfillCasePrices summary ==========');
  console.log(`  total processed: ${cases.length}`);
  console.log(`  ✅ priced:        ${ok}`);
  console.log(`  ⚠️  not found:    ${notFound}`);
  console.log(`  ❌ errors:        ${errors}`);
  console.log('================================================');
  process.exit(0);
}

main().catch((err) => {
  logger.error('[backfill-cases] FATAL', { error: err.message, stack: err.stack });
  console.error('[backfill-cases] FATAL', err);
  process.exit(1);
});
