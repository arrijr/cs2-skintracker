# Price Tracking Pipeline Fix

**Date**: 2026-05-18
**Author**: Claude (recon agent)
**Status**: Plan — no code touched yet

---

## Problem

Most skin detail pages show no price + no price-history chart. DB confirms:

- 16,829 Skin rows
- Only **428 (2.5%)** have `priceLatest`
- PriceHistory: 5,131 rows but only **56 distinct skinIds** (99.7% of skins have NO chartable history)
- Last `priceUpdatedAt`: 2026-05-18 03:55 UTC (latest cron stalled then failed)
- Inngest `Steam Market Price Refresh` cron at `30 3,9,15,21 * * *` keeps failing

---

## Investigation Summary

### A) Catalog generation — NOT the problem

Original hypothesis was wrong. SQL on Skin table:

```
total_rows: 16,829
with_wear (variants): 13,763
with_wear AND name LIKE '% | %': 13,763  ← 100%
with_wear AND no pipe pattern: 0
```

`makeWearVariants` in `backend/src/services/catalog/bymykelClient.js:103` only iterates `raw.wears`. bymykel only populates `wears` for items that actually trade per-wear (skins with patterns). Base knives/gloves like `"★ Bayonet"` have no `wears` array → skipped naturally. **No bogus variants exist.** Catalog is clean.

### B) Price refresh logic

`priceRefreshJob.js`:
- `refreshItemPrice`: skin with wear suffix → single fetch. Good. Skin without wear → 5-wear probe with 1.5s spacing + 429 abort. Good.
- `recordPriceResult`: writes Skin row update + MarketSnapshot insert. **Does NOT write PriceHistory.**
- Snapshot data quality is fine: in last 24h, 293 snapshots inserted, **293/293 have non-null price** (100% hit rate, not 99% miss as originally reported).

**Bug #1 (data plumbing)**: `recordPriceResult` writes to `MarketSnapshot` but the chart endpoint reads from `PriceHistory`. There is a *separate* daily cron `dailySkinPriceHistory.js` that's supposed to bridge them, but:
  - It's not registered as an Inngest function (see `backend/src/inngest/functions.js` — only catalogSync, priceRefresh, priceAlertsCheck, portfolioHistorySnapshot are exported).
  - It only writes today's row from `priceLatest`, so backfill from MarketSnapshots is missing.
  - Result: PriceHistory rows only exist for skins seeded long ago (the 56 distinct skinIds match the original seed batch from Sprint 1 docs).

### C) Price history endpoint

`backend/src/controllers/skinController.js:5` `getPriceHistory`:
- Queries `PriceHistory` filtered by `skinId` + date range.
- If empty AND skin has any priceLatest/Median/Avg → **generates synthetic sample history** (lines 60–135) with random ±2% daily variation. Returns `source: 'generated'`.
- If empty AND no price at all → returns `data: []`, `source: 'none'`.

The skin detail route (`skinRoutes.js:266`) reads price history INLINE (lines 327–347) — **bypasses the controller's sample-data fallback**. It returns real history only. So the chart on the detail page is empty for the 99.7% of skins with no `PriceHistory` rows, even though `priceLatest` may exist.

Frontend `frontend/src/app/skins/[skinId]/page.tsx:170` reads `skin.history` from the `/skins/:id` response, filters by range, passes to `<SkinPriceChart data=...>`. Empty array → empty chart (no "not tracked yet" copy).

### D) Inngest failure root cause

Inngest event log at **2026-05-18T03:33:43.906Z** (correlation id `01KRWJ49P0CZJHGTZAENJPZPJW`):
```json
{
  "function_id": "cs2-skin-tracker-price-refresh",
  "status": "Failed",
  "error": { "name": "Error", "message": "invalid status code: 500" },
  "event": { "cron": "30 3,9,15,21 * * *", "fireAt": "2026-05-18T03:30:00Z" }
}
```

Backend webhook (`/api/inngest` on `cs2-skintracker.onrender.com`) returned HTTP 500. Render service is on the **free plan in Frankfurt with 1 instance** — Render free-plan request timeout is ~100s, but each chunk step runs `15 items × (3s spacing + 1–3s fetch + retries on 429)`. A single 429 with `Retry-After: 5` adds up to 30s extra inside a step. Step time > 100s → upstream proxy returns 500.

Render logs around 03:30–03:34 show **no application-level error** — confirms Render killed the request at the proxy, never gave Express a chance to log it. Inngest retried 2x; logs show Prisma writes continued until 03:55:33 (retries kept running and partially succeeded — 388 items updated, 297 with price, before being killed again).

Cron has not run successfully since 2026-05-16 09:00 UTC. Two failure modes:
1. **Step-level timeout** on Render free plan (primary).
2. **Volume**: even if every step succeeded, full pass = 16,829 ÷ 15 = 1,122 steps × 45s = ~14h. Inngest doesn't have a 14h budget per run.

---

## Root Causes (ranked by impact)

1. **PriceHistory table is never written to by the live refresh pipeline.** Chart endpoint reads from PriceHistory → 99.7% of skins show empty chart. (`recordPriceResult` writes MarketSnapshot only.)
2. **Inngest cron fails at step level** because steps exceed Render free-plan ~100s request timeout. Cron has not completed a full pass since the variant expansion to 16,829 rows.
3. **Catalog is too large for current refresh cadence**: 16,829 items × 3s = 14h minimum per pass; cron interval is 6h. Even if Inngest worked, pipeline is overcommitted by 2x.
4. **Frontend shows empty chart** with no explanatory copy when history is empty — UX problem, not a data bug.

---

## Surgical Fixes

### Fix 1 — Bridge MarketSnapshot → PriceHistory (highest leverage)

**File**: `backend/src/services/pricing/priceRefreshJob.js:52–65`

Make `recordPriceResult` also `upsert` a PriceHistory row for today on every successful hit. One extra `prisma.priceHistory.upsert` per hit:

```js
if (result.found && result.priceLatest != null) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (item.itemType === 'skin') {
    await prismaClient.priceHistory.upsert({
      where: { skinId_date: { skinId: item.id, date: today } },
      update: { price: result.priceLatest },
      create: { skinId: item.id, date: today, price: result.priceLatest },
    });
  }
  // existing MarketSnapshot insert here
}
```

Effect: chart endpoint immediately gets coverage for every skin with a successful refresh.

### Fix 2 — Make Inngest steps survive Render free plan

**File**: `backend/src/inngest/functions.js:44`

- Drop `PRICE_ITEMS_PER_STEP` from `15` to `8`. New worst-case step time: ~8 × 5s = 40s, well under 100s.
- Wrap `refreshItemPrice` in per-item `try/catch` (already partially there at line 95–102 — verify it catches 429 retries that throw).
- Skip recently-refreshed items inside the step to avoid re-doing work on retries:
  ```js
  const items = await step.run('load-item-list', async () => {
    const skins = await prisma.skin.findMany({
      where: { OR: [
        { priceUpdatedAt: null },
        { priceUpdatedAt: { lt: new Date(Date.now() - 4*60*60*1000) } },
      ]},
      select: { id: true, marketHashName: true },
    });
    // ...
  });
  ```
  Effect: a retry of a partially-finished run skips items already done in last 4h. Also lets the 6h cron eventually cover all items over multiple runs without redoing fresh ones.

### Fix 3 — Stop refresh from exceeding daily budget

Add `maxItems` default to `priceRefresh` so each cron run handles a manageable slice (e.g. 2,000 items = ~2h via Inngest sleep). Combined with the "skip recent" filter from Fix 2, full catalog gets covered across ~7 cron runs (~42h), and stale items get re-prioritized naturally.

**File**: `backend/src/inngest/functions.js:59-60`

```js
const maxItems = event?.data?.maxItems ?? 2000;
```

### Fix 4 — Frontend "not tracked yet" state

**File**: `frontend/src/app/skins/[skinId]/page.tsx:577–579`

Replace `<SkinPriceChart data={...}/>` with:

```jsx
{filteredHistory.length > 0 ? (
  <SkinPriceChart data={...} />
) : (
  <div className="py-12 text-center text-slate-500">
    <p className="text-sm">Price not yet tracked</p>
    <p className="text-xs mt-1">First refresh expected within 24h</p>
  </div>
)}
```

Also surface `priceUpdatedAt` on the meta panel so users see "Updated 3h ago" or "Never updated".

---

## Migration Steps

1. Land Fix 1 + Fix 2 + Fix 3 in one PR.
2. Manually trigger `inngest.send('price-refresh/manual', { skinsOnly: true, maxItems: 2000 })` to seed PriceHistory.
3. Watch Inngest dashboard for green run.
4. After 24h, query: `SELECT COUNT(DISTINCT "skinId") FROM "PriceHistory"` — expect > 2,000.
5. Land Fix 4 (frontend) after backend coverage hits ~30% of catalog.

**No DB migrations required** — PriceHistory table + unique constraint `skinId_date` already exist.

**Cleanup**: no rows to delete — catalog is clean (Investigation A).

---

## Verification Commands

### After Fix 1 deployed:

```sql
-- PriceHistory should grow by ~250-300/day (matching successful snapshot rate)
SELECT date_trunc('day', "date") AS d, COUNT(*) AS rows, COUNT(DISTINCT "skinId") AS skins
FROM "PriceHistory"
WHERE "date" > NOW() - INTERVAL '7 days'
GROUP BY 1 ORDER BY 1 DESC;
```

### After Fix 2+3 deployed:

```bash
# Trigger a manual run
curl -X POST https://cs2-skintracker.onrender.com/api/inngest \
  -H "Content-Type: application/json" \
  -d '{"name":"price-refresh/manual","data":{"maxItems":500}}'
```

```sql
-- Should see attempted_24h climb steadily across 4 daily crons
SELECT
  COUNT(*) FILTER (WHERE "priceUpdatedAt" > NOW() - INTERVAL '24 hours') AS attempted_24h,
  COUNT(*) FILTER (WHERE "priceLatest" IS NOT NULL) AS with_price_total
FROM "Skin";
```

### Inngest:
```
GET https://api.inngest.com/v1/events?name=inngest/function.failed&received_after=<deploy_time>
```
Should be empty for `cs2-skin-tracker-price-refresh`.

### Frontend smoke:
- Visit `/skins/<id>` for a skin that has snapshots — chart populated.
- Visit `/skins/<id>` for a never-refreshed skin — "Price not yet tracked" message.

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Extra Prisma write per refresh (Fix 1) doubles DB load on the pooled `connection_limit=1` connection | Low | Upsert is cheap; we're at ~300 writes/day, not 30k/sec. |
| Reducing items-per-step from 15 → 8 lengthens total wall-clock | Medium | Acceptable — current pipeline doesn't complete a full pass anyway. Net throughput goes UP because failures drop. |
| `maxItems=2000` per run means 4 runs × 2000 = 8,000/day, full catalog needs ~2 days | Medium | Acceptable for chart history; price freshness on cold skins degrades from "ideally 6h" to "every 1–2 days". |
| Skipping recently-updated items could starve "always-stale" items if retries hammer the same first 2,000 | Low | Skin ordering is by id — deterministic. Worst case fix is to ORDER BY priceUpdatedAt ASC NULLS FIRST. |
| Frontend "not tracked yet" copy could confuse paying users | Low | Mitigation: link to "request refresh" CTA for Pro tier (separate task, not in this plan). |

---

## Out of Scope

- Migrating off Render free plan (would solve step timeout permanently). Defer until traffic justifies cost.
- Backfilling PriceHistory from MarketSnapshot history (5,131 rows already cover 56 skins, not worth a migration; new writes will catch up within a week).
- Float/buy-order/recent-activity data on detail page (already TODO'd in the component).
