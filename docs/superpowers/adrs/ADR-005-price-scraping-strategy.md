# ADR-005: Steam Market price scraping strategy

**Status:** Accepted
**Date:** 2026-05-12
**Deciders:** Arthur (sole engineer)

## Context

We scrape Steam Market `priceoverview` endpoint to populate `Skin.priceLatest`, `Skin.priceMedian`, `Skin.sold24h`. After the bymykel catalog sync (per ADR-001) every skin row has a clean `marketHashName` without wear suffix (e.g. `"AK-47 | Redline"`).

Empirical test (May 12):

```
GET /priceoverview/?market_hash_name=AK-47%20%7C%20Redline
→ {"success": true}   // empty body, no price/median/volume

GET /priceoverview/?market_hash_name=AK-47%20%7C%20Redline%20(Field-Tested)
→ {"success": true, "lowest_price": "36,40€", "volume": "102", "median_price": "36,93€"}
```

Steam Market has no aggregated listing per skin — every listing is wear-specific. The bare-name query returns `{success: true}` with no data, which our scraper was interpreting as "valid empty result" and **writing `null` to `priceLatest`** on every refresh. Result: 1,940 of 1,943 skins had `priceLatest = null` despite `priceUpdatedAt` updating on every cron run.

## Decision

**Two changes in `services/pricing/priceRefreshJob.js` + `services/pricing/steamMarketClient.js`:**

1. **Empty-body guard.** In `fetchPrice`, if Steam returns `{success: true}` but `lowest_price` AND `median_price` are both null, return `{found: false}`. Do not overwrite stored prices with null.

2. **Wear-fallback probe.** For skins without a wear suffix in `marketHashName`, probe wear variants in liquidity order (`Field-Tested → Minimal Wear → Factory New → Well-Worn → Battle-Scarred`). First variant that returns price data wins. 1.5s spacing between intra-skin probes (Steam tolerates back-to-back same-family probes).

The stored price reflects whichever wear was found — not labeled in the row, but is consistently the most liquid wear available for that skin (FT is the most common for ~90% of skins).

## Options Considered

### Option A: Status quo — query bare marketHashName (rejected — current bug)

| Dimension | Assessment |
|-----------|------------|
| Coverage | 0% — every skin returns empty |
| Cost | Wasted API calls + null-writes corrupted prior data |
| Verdict | Broken-by-design |

### Option B: Force FT-only suffix (rejected)

Always append ` (Field-Tested)`. Simple, ~80% coverage.

Rejected: knives + gloves only exist in FN/MW — would miss the entire knife catalog. Also any skin with low-float restriction.

### Option C: Multi-wear probe with FT-first (CHOSEN)

| Dimension | Assessment |
|-----------|------------|
| Coverage | ~95%+ (FT covers most; falls through for FN-only knives) |
| API cost | 1 call/skin on hit, up to 5 on miss |
| Worst-case time | 5 × 1.5s + base 3s = ~10s per orphan skin |
| Schema change | None |

### Option D: Scrape all 5 wears per skin, store separately (deferred to v2)

Schema: `Skin.priceByWear Json` or a separate `SkinWearPrice` table.

Trade-off: 5× the API calls (10h+ for full refresh), bigger schema. Right move for a wear-sensitive Pro feature ("show me the cheapest wear right now"), but YAGNI for v1.

## Trade-off Analysis

Option C wins on coverage/effort ratio. The stored `priceLatest` is "the most liquid wear's price" rather than "all wears summarized" — close enough for portfolio aggregation, dashboard charts, and alerts (which fire on percentage moves, not absolute price).

When we add Pro-tier "wear-specific pricing" (e.g. PriceEmpire-style comparator), we'll need Option D. The current code is forward-compatible: extend `refreshItemPrice` to optionally write to a new `SkinWearPrice` table on the same probe path.

## Consequences

- **Easier:** every refresh now actually populates prices. Dashboard, top-movers, allocation, KPI cards all show real data.
- **Harder:** worst-case API call count grows 5× for skins without active listings (rare). Steam rate-limit budget tightens — currently 3s spacing handles ~28k req/day, well within Steam's tolerance.
- **Revisit when:** we add wear-specific Pro features → migrate to Option D.

## Action Items

1. [x] Empty-body guard in `fetchPrice` (`steamMarketClient.js`)
2. [x] Wear-fallback loop in `refreshItemPrice` (`priceRefreshJob.js`)
3. [x] Verified with 5-skin test run — 5/5 prices fetched
4. [x] Run 300-skin backfill on production DB
5. [x] Smart 429 handling: abort probe loop on rate-limit instead of burning 5× budget
6. [x] StatTrak™ derivative rows generated from bymykel `stattrak: true` flag (1126 new rows)
7. [ ] Let nightly GHA cron complete the full ~3,066-skin refresh (across 4× chunks)
8. [ ] (Optional) Surface "wear used" in admin debug view so we can monitor probe accuracy
9. [ ] (Future) When user signs up for Pro: model `SkinWearPrice` table for per-wear browsing

## Addendum (2026-05-12): Rate-limit handling

Empirical observations after running a 300-skin backfill at 3s spacing (~20 req/min):

- Steam Market starts returning **429 Too Many Requests** after ~150 successful requests from a single IP within ~15 minutes
- 429 is per-IP, not per-account, and cools down over ~10–30 min
- Our previous wear-fallback loop made this WORSE: a single missed skin probed 5 wears × 1 request = 5 × 429 → amplified the rate-limit

**Mitigation applied (May 12):**
- `refreshItemPrice` now exits the wear-loop immediately on 429 (returns `found: false, status: 429`)
- 5× backoff prevented; outer scrape loop's 3s spacing is preserved
- Steam-side rate-limit budget is now respected — full sync still takes ~3h but stays under the throttle ceiling

**Production strategy:**
- GHA runners use varied IPs across runs → rate-limit pool effectively 4× larger across the 4 daily chunks
- If we ever observe `>10%` 429 rate in production logs, raise spacing to 5s
