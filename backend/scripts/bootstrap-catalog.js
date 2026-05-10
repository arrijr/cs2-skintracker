#!/usr/bin/env node
import { runCatalogSync } from '../src/services/catalog/catalogSyncJob.js';
import prisma from '../src/prisma/prismaClient.js';

async function main() {
  console.log('[bootstrap] Starting catalog sync from bymykel/CSGO-API...');
  const start = Date.now();
  const summary = await runCatalogSync();
  const seconds = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`[bootstrap] Done in ${seconds}s`);
  console.log(JSON.stringify(summary, null, 2));

  const counts = {
    skin: await prisma.skin.count(),
    case: await prisma.case.count(),
    marketItem: await prisma.marketItem.count(),
  };
  console.log('[bootstrap] DB counts:', counts);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('[bootstrap] FAILED:', err);
  process.exit(1);
});
