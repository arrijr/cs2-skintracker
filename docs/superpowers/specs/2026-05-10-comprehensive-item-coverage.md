# Comprehensive CS2 Item Coverage & Pricing

**Date:** 2026-05-10
**Status:** Spec — awaiting user review
**Owner:** Arthur

---

## 1. Goal

Replace the current incomplete data foundation (56 skins, stale prices, mixed sources) with **full coverage of all tradable CS2 items** (~12,500) using exclusively **free data sources**: bymykel/CSGO-API for the catalog and Steam Community Market for live prices.

This is the foundation for everything else — accurate, comprehensive data is what differentiates a "Robinhood for CS2 skins" from a toy.

---

## 2. Item Categories in Scope

All categories exposed by bymykel/CSGO-API:

| Category | Approx. count | Notes |
|----------|---------------|-------|
| Skins (weapons) | ~1,500 | Core trading category |
| Cases | ~50 | Already partly modelled (`Case`) |
| Stickers | ~10,000 | High variance in price; Holo/Foil Krakow 2017 can be 1,000€+ |
| Agents | ~50 | Tradable, mid-price |
| Patches | ~100 | Niche |
| Graffiti | ~500 | Very low volume |
| Music Kits | ~80 | Niche |
| Collectibles (pins, cards) | ~200 | Very low volume |
| Keys | ~50 | High volume |

**Total: ~12,500 items**

---

## 3. Data Sources

### Catalog: `bymykel/CSGO-API` (GitHub)

- Repo: <https://github.com/ByMykel/CSGO-API>
- Distribution: raw JSON files per category, daily community update
- Endpoint pattern: `https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/<category>.json`
- License: MIT
- Used by: many CS2 trackers; community-trusted

We pull all relevant category JSON files daily, merge into our `MarketItem` table.

### Prices: Steam Community Market

- Endpoint: `https://steamcommunity.com/market/priceoverview/?country=DE&currency=3&appid=730&market_hash_name=<encoded>`
- Returns: `lowest_price`, `median_price`, `volume`
- Rate limit: undocumented but anecdotally ~20 req/min sustained. Heavier load triggers IP bans of varying duration.

Free for our use. Daily refresh respecting the rate limit.

---

## 4. Architecture

```
┌──────────────────────────────────────────────┐
│ Daily Cron 02:00 UTC — Catalog Sync          │
│ ─ Fetch bymykel JSON per category            │
│ ─ Upsert into Skin / Case / MarketItem       │
│ ─ Mark removed items inactive                │
└──────────────────────────────────────────────┘
                  ↓
┌──────────────────────────────────────────────┐
│ Daily Cron 03:00 UTC — Price Refresh         │
│ ─ Iterate all active items                   │
│ ─ Steam Market priceoverview                 │
│   (3s delay between calls)                   │
│ ─ Update item.price* fields                  │
│ ─ Append row to MarketSnapshot history       │
│ ─ Backoff on 429/5xx, skip on 3× 404         │
└──────────────────────────────────────────────┘
```

Full refresh runs in ~10h (12,500 × 3s).

---

## 5. Schema Strategy

**Decision:** Add a new `MarketItem` model for non-weapon categories. Keep existing `Skin` and `Case` models as-is.

Rationale:
- `Skin` has weapon-specific fields (`wear`, `weaponType`, `isStattrak`) that don't apply to stickers/agents/patches.
- `Skin` is referenced from many places (Watchlist, Portfolio, PriceHistory). Refactoring it to a generic `Item` would break a lot of code.
- New categories share a small common subset (name, image, price, market_hash_name). Modelling them as `MarketItem` is cleaner than overloading `Skin`.

### New model

```prisma
model MarketItem {
  id              Int       @id @default(autoincrement())
  category        String    // 'sticker' | 'agent' | 'patch' | 'graffiti' | 'music_kit' | 'collectible' | 'key'
  externalId      String    // bymykel id
  name            String
  marketHashName  String    @unique
  imageUrl        String?
  rarity          String?
  collection      String?
  metadata        Json?     // category-specific (tournament for stickers, etc.)
  priceLatest     Float?
  priceMedian     Float?
  volume24h       Int?
  priceUpdatedAt  DateTime?
  isActive        Boolean   @default(true)
  consecutive404  Int       @default(0)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  snapshots       MarketSnapshot[]

  @@index([category, isActive])
  @@index([marketHashName])
}
```

### Extension to `MarketSnapshot` (existing)

Currently keyed on `skinId`. Generalize:

```prisma
model MarketSnapshot {
  id            Int       @id @default(autoincrement())
  itemType      String    // 'skin' | 'case' | 'market_item'
  skinId        Int?      // nullable, set when itemType='skin'
  caseId        Int?      // nullable
  marketItemId  Int?      // nullable
  date          DateTime
  priceUsd      Float
  activeListings Int?
  soldVolume24h Int?
  source        String
  fetchedAt     DateTime  @default(now())

  @@unique([itemType, skinId, caseId, marketItemId, date])
  @@index([itemType, date])
}
```

Existing `MarketSnapshot.skinId` rows stay valid; new categories use `marketItemId`.

---

## 6. Components

| File | Responsibility |
|------|----------------|
| `backend/src/services/catalog/bymykelClient.js` | Fetch + parse bymykel JSON for each category |
| `backend/src/services/catalog/catalogSyncJob.js` | Cron job: orchestrate catalog upsert across categories |
| `backend/src/services/pricing/steamMarketClient.js` | Steam priceoverview with rate-limit + retry |
| `backend/src/services/pricing/priceRefreshJob.js` | Cron job: iterate items, dispatch to steamMarketClient, write back |
| `backend/src/services/pricing/deadItemTracker.js` | Track items with repeated 404; mark inactive after threshold |

Each file ≤ 200 LOC. Clear single responsibility.

---

## 7. Rate-Limit Strategy (Steam Market)

- **Steady rate:** sleep 3,000 ms between calls
- **Retry on transient (429, 5xx):** exponential backoff — 5s, 15s, 60s. Then skip.
- **Permanent 404:** Steam doesn't list this item. Increment `consecutive404`.
  - After 3 consecutive 404s → set `isActive = false`
  - Inactive items re-checked weekly (Sunday 04:00 UTC, separate cron)
- **Estimated full refresh time:** ~10h for ~12,500 active items

---

## 8. Initial Migration

One-time bootstrap script:

1. Pull bymykel JSON for all categories
2. Upsert into respective tables (`Skin`, `Case`, `MarketItem`) using `marketHashName` as natural key
3. Existing 56 skins get updated metadata (image URLs, rarity) but keep their `id` and price history
4. New items start with no prices — first price refresh cron populates them

Estimated bootstrap: 5 min for catalog write + 10h for first full price pass.

---

## 9. Frontend Impact

### Existing pages affected

- `/skins` — must scale beyond ~50 items. Use DB-side pagination (already does) + full-text search. May need an index on `Skin.name`.
- `/skins/[id]` — works for any skin id; no change.
- `/cases` and `/cases/[id]` — work as-is.

### New pages (later, NOT in this spec)

- `/items` — unified browser with `?category=` filter
- `/stickers`, `/agents`, etc. — could route into `/items?category=sticker` etc.

This spec is data-layer only. Frontend additions for new categories are a separate plan.

---

## 10. Failure Handling

- Catalog sync fails (bymykel down): log error, retry next day, do NOT clear existing data
- Price refresh hits IP ban: pause cron for 1h, alert via existing logger.error path
- Single item fails: log, move on, increment failure counter
- Partial refresh interruption: cron is idempotent — picks up from `priceUpdatedAt < today` items on next run

---

## 11. Testing

- Unit tests for `bymykelClient` (mock fetch, verify parsing per category)
- Unit tests for `steamMarketClient` (mock fetch, verify rate-limit timing, retry logic, 404 handling)
- Integration test: run catalogSync against bymykel test JSON fixtures, verify DB state
- Live smoke test: run price refresh on 5 known items, verify DB updates

No load tests — production cron is naturally rate-limited.

---

## 12. Success Criteria

- ~12,500 items in DB across categories
- ≥ 95% of items have a price within the last 36h (allowing for one missed cron)
- Failure rate < 2% per refresh pass
- No IP bans from Steam
- All existing skins retain price history and DB IDs

---

## 13. NOT Goals (YAGNI)

- ❌ Other marketplaces (Skinport, BUFF163, DMarket, CS.MONEY) — separate "multi-source pricing" feature, later
- ❌ Realtime / websocket prices — daily snapshot is enough for investor use case
- ❌ Steam Inventory sync (importing a user's actual inventory) — Phase 2
- ❌ Float Database (literal float values per listing) — large separate feature
- ❌ Frontend UI for browsing stickers/agents/etc. — separate plan once data is in
- ❌ Multi-currency support (we store EUR only) — Phase 3

---

## 14. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Steam IP ban | Medium | High | 3s rate limit, exponential backoff, monitor for 429 frequency |
| bymykel/CSGO-API stops being maintained | Low | Medium | Fork the repo, snapshot known-good state, fall back to Steam search scrape |
| Schema migration on production DB | Low | High | Test on staging branch first; migrations are additive (no destructive changes) |
| Full refresh exceeds 24h | Medium | Medium | Drop very-low-volume categories (graffiti, collectibles) from daily refresh, weekly instead |
| Disk usage from MarketSnapshot grows fast | Low | Low | 12,500 items × 365 days × ~80 bytes ≈ 350 MB/year — acceptable |

---

## 15. Next Steps

1. User reviews this spec
2. On approval: `writing-plans` skill produces a task-by-task implementation plan
3. Subagent-driven execution on a new branch (`feature/comprehensive-coverage`)
