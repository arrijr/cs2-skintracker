// Persist matched skin items as Portfolio rows.
// Lazy-loads Prisma to keep this module Jest-friendly (matches the pattern in inventoryMatcher.js).

const VALID_MODES = new Set(['empty', 'current_market', 'custom']);

/**
 * Persist matched skin items as Portfolio rows.
 * - kind=skin matches are persisted; kind=case and kind=market_item are skipped (Phase 2).
 * - Each match becomes ONE Portfolio row with amount = stack size.
 * - All created rows are marked importedFromSteamAt = now() so resync can identify them.
 *
 * costBasisMode:
 *   - 'empty':         buyPrice = 0 (placeholder for "unknown / fill in later")
 *   - 'current_market': buyPrice = match.currentPrice (Skin.priceLatest at import time)
 *   - 'custom':        use `custom[]` lookup by skinId
 */
export async function importSkinMatches({ userId, matches, costBasisMode, custom = [] }, { prismaClient } = {}) {
  if (!VALID_MODES.has(costBasisMode)) {
    throw new Error(`invalid costBasisMode: ${costBasisMode}`);
  }
  if (!userId) {
    throw new Error('userId required');
  }

  let db = prismaClient;
  if (!db) {
    const mod = await import('../../prisma/prismaClient.js');
    db = mod.default;
  }

  const customBySkinId = new Map((custom || []).map(c => [c.skinId, c]));
  const now = new Date();
  let created = 0;

  for (const m of matches) {
    if (m.kind !== 'skin') continue;

    // buyPrice is NOT NULL in the schema, but the import UI offers an
    // "unknown / fill in later" path. Use 0 as the "cost basis not set"
    // sentinel: the portfolio summary already treats 0 invested as 0% P&L
    // (the `totalInvested > 0` guards), and users can backfill real values via
    // bulk edit. This avoids a nullable-column migration + having to null-guard
    // every `amount * buyPrice` sum across the portfolio/CSV/history code.
    let buyPrice = 0;
    let buyDate = now;

    if (costBasisMode === 'current_market') {
      buyPrice = (typeof m.currentPrice === 'number') ? m.currentPrice : 0;
    } else if (costBasisMode === 'custom') {
      const c = customBySkinId.get(m.skinId);
      if (c) {
        buyPrice = (typeof c.buyPrice === 'number') ? c.buyPrice : 0;
        if (c.buyDate) buyDate = new Date(c.buyDate);
      }
    }

    await db.portfolio.create({
      data: {
        userId,
        skinId: m.skinId,
        amount: m.amount,
        buyPrice,
        buyDate,
        importedFromSteamAt: now,
      },
    });
    created++;
  }

  console.info('[portfolioImporter] complete', { userId, created, mode: costBasisMode });
  return { created };
}
