#!/usr/bin/env node
/* Unified job entry point for GitHub Actions cron.
 * Usage: node scripts/run-job.js <jobName> [options]
 *
 * Job names:
 *   catalog-sync         — sync catalog from bymykel
 *   price-refresh        — refresh prices for all items
 *   price-refresh-chunk  — refresh a slice of items (env: CHUNK_OFFSET, CHUNK_SIZE)
 */
import process from 'node:process';

async function main() {
  const jobName = process.argv[2];
  if (!jobName) {
    console.error('Usage: node run-job.js <jobName>');
    console.error('Valid jobs: catalog-sync, price-refresh, price-refresh-chunk');
    process.exit(1);
  }

  const start = Date.now();
  console.log(`[run-job] Starting job=${jobName} at ${new Date().toISOString()}`);

  try {
    if (jobName === 'catalog-sync') {
      const { runCatalogSync } = await import('../src/services/catalog/catalogSyncJob.js');
      const summary = await runCatalogSync();
      console.log('[run-job] Result:', JSON.stringify(summary, null, 2));
    } else if (jobName === 'price-refresh') {
      const { runPriceRefresh } = await import('../src/services/pricing/priceRefreshJob.js');
      const summary = await runPriceRefresh();
      console.log('[run-job] Result:', JSON.stringify(summary, null, 2));
    } else if (jobName === 'price-refresh-chunk') {
      const offset = parseInt(process.env.CHUNK_OFFSET ?? '0', 10);
      const size = parseInt(process.env.CHUNK_SIZE ?? '4000', 10);
      console.log(`[run-job] Chunk: offset=${offset} size=${size}`);
      const { runPriceRefresh } = await import('../src/services/pricing/priceRefreshJob.js');
      const summary = await runPriceRefresh({ offset, maxItems: size });
      console.log('[run-job] Result:', JSON.stringify(summary, null, 2));
    } else {
      console.error(`[run-job] Unknown job: ${jobName}`);
      process.exit(1);
    }
  } catch (err) {
    console.error('[run-job] FAILED:', err);
    process.exit(1);
  }

  const seconds = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[run-job] Finished in ${seconds}s`);

  // Disconnect Prisma client cleanly
  try {
    const { default: prisma } = await import('../src/prisma/prismaClient.js');
    await prisma.$disconnect();
  } catch {
    // ignore
  }
  process.exit(0);
}

main().catch((err) => {
  console.error('[run-job] UNHANDLED:', err);
  process.exit(1);
});
