# ADR-001: Deduplicate legacy Skin records

**Status:** Accepted
**Date:** 2026-05-11
**Deciders:** Arthur (sole engineer)

## Context

The `Skin` table has **53 duplicate groups** containing 109 rows total — pairs (50 groups) or triples (3 groups, including `StatTrak™` variants). Root cause: two seed sources collided. The original ad-hoc seed inserted rows like `marketHashName="AK-47 | Redline (Field-Tested)"` (wear suffix in mhn); the later bymykel/CSGO-API sync inserted clean rows `marketHashName="AK-47 | Redline"`. Both share the same `name` field, so Prisma's `@unique([marketHashName])` doesn't catch them.

Downstream effects:

- **Frontend renders the same skin twice** under different IDs on `/skins` browse → handled with frontend dedup via `Set<number>` in `useInfiniteSkins`, but masks the real issue.
- **Portfolio fragmentation risk:** a user adding "AK-47 | Redline" via the catalog list (id=164) and via the legacy detail page (id=16) ends up with two `Portfolio` rows for what they perceive as the same skin. Aggregate-by-skin queries don't merge them.
- **Image migration band-aid:** `scripts/fix-bogus-image-urls.js` had to copy real Steam URLs from canonical row to legacy row — this works but keeps the duplicate alive.
- **Confused analytics:** market-pulse / top-mover queries can list the "same" skin twice.

Counts of FK refs that point to dup-skin rows (May 11):
- `Portfolio.skinId`: 4 rows
- `Watchlist.skinId`: 1 row
- `Alert.skinId`: 0 rows
- `Transaction.skinId`: 0 rows
- `PriceHistory.skinId`: unknown (5,131 total rows — small subset likely)
- `MarketSnapshot.skinId`: ≤52
- `SkinQuantityHistory.skinId`: 0
- `CaseSkin.skinId`: 0
- `PortfolioHistory.skinId`: 4 total rows

Low blast radius → safe time to migrate.

## Decision

**Merge duplicates into a canonical record per `name`. Rewrite all FKs to point at the canonical. Delete the redundant rows. Add a `UNIQUE(name)` constraint to prevent recurrence.**

Canonical-pick rules (in order):
1. Prefer the row whose `marketHashName` does NOT contain `(...)` (wear suffix). bymykel seeds clean mhns.
2. Prefer the row that does NOT start with `StatTrak™` (StatTrak is a quality, not a skin identity).
3. Tie-break: lower id (the older record).

Special case: rows with `marketHashName` like `"StatTrak™ X | Y (Wear)"` are not duplicates of `"X | Y"` — they're a different skin variant that the legacy seed mis-named. Those rows are RENAMED so their `name` includes the `StatTrak™` prefix (`name = marketHashName` minus the `(Wear)` suffix). They survive as distinct records.

## Options Considered

### Option A: Status quo — leave duplicates, frontend dedupes (rejected)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Low |
| Migration risk | None |
| Long-term cost | High — duplicate skinId in Portfolio aggregates, confusing UX, every new query needs to dedupe |
| Data integrity | Degrades over time as more FKs accumulate |

Rejected: doesn't scale. Every analytic & aggregate query becomes complicated.

### Option B: Soft delete via `isCanonical` flag (rejected)

Add `Skin.isCanonical Boolean` and filter `WHERE isCanonical = true` everywhere.

Rejected: requires touching every query in the codebase, easy to forget, FKs still distributed.

### Option C: Hard merge with FK rewrite (CHOSEN)

| Dimension | Assessment |
|-----------|------------|
| Complexity | Medium — script + transaction handling |
| Migration risk | Medium — destructive on shared production data |
| Long-term cost | None — schema becomes correct |
| Reversibility | None (backup recommended) |

## Trade-off Analysis

The dedupe migration is destructive but **the blast radius is currently tiny** (5 user-data FKs total at time of migration). Waiting compounds risk. Doing it now means:

- Single one-shot script, well-tested via dry-run
- Production has effectively zero users (early stage), so user-visible impact is near-zero
- Cleanup unlocks `UNIQUE(name)` constraint going forward → bymykel sync errors out loudly if data drift recurs

## Consequences

- **Easier:** every aggregate query (`SUM(amount * marketPrice) GROUP BY skinId`) yields correct totals. Portfolio dedup logic in frontend can be removed. Image-URL band-aid script becomes obsolete.
- **Harder:** future bulk imports must respect the `UNIQUE(name)` constraint. Adding StatTrak/Souvenir variants requires unique `name` (e.g. `"StatTrak™ AWP | Asiimov"`).
- **Revisit when:** we add Souvenir variants in v2 — need to extend naming convention.

## Action Items

1. [x] Build `scripts/dedupe-skins.js` with `--dry-run` flag
2. [x] Dry-run + manual review
3. [x] Backup (Supabase auto-snapshots are sufficient — ≤200 rows touched)
4. [x] Apply migration
5. [ ] Add `UNIQUE(name)` Prisma constraint + migration SQL
6. [ ] Remove frontend `Set<number>` dedup in `useInfiniteSkins` (cleanup, low priority)
7. [ ] Delete `scripts/fix-bogus-image-urls.js` (now redundant)
