// backend/scripts/backfillPriceUpdatedAt.js
//
// One-shot migration: stamp Skin.priceUpdatedAt = 2024-01-01 (epoch sentinel)
// for every row that has a non-null priceLatest but NULL priceUpdatedAt.
//
// Why: priceRefreshJob now orders by `[priceUpdatedAt ASC NULLS FIRST, sold30d DESC]`
// and caps each run at MAX_SKINS_PER_RUN. Legacy rows imported before
// priceUpdatedAt was wired (most of the 16,829 skins) sit at NULL and would
// flood every daily run forever. By stamping them with a sentinel timestamp
// in the past, they still appear before any genuinely-refreshed row, but
// the ordering becomes deterministic (no NULL-tie ambiguity), and once a
// row is refreshed for real the timestamp updates to "now".
//
// Run manually:
//   cd backend && npm run script:backfill-priceupdatedat
// or:
//   node scripts/backfillPriceUpdatedAt.js
//
// Idempotent: re-running is a no-op (the WHERE clause excludes rows that
// already have a non-null priceUpdatedAt).

import prisma from '../src/prisma/prismaClient.js';

const SENTINEL = new Date('2024-01-01T00:00:00.000Z');

async function main() {
  const result = await prisma.skin.updateMany({
    where: {
      priceUpdatedAt: null,
      priceLatest: { not: null },
    },
    data: {
      priceUpdatedAt: SENTINEL,
    },
  });

  console.log(`[backfill-priceupdatedat] updated ${result.count} rows to ${SENTINEL.toISOString()}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[backfill-priceupdatedat] failed:', err);
  process.exit(1);
});
