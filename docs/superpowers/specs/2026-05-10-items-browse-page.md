# `/items` Browse Page for Non-Skin, Non-Case Categories

**Date:** 2026-05-10
**Status:** Spec — approved
**Owner:** Arthur

---

## 1. Goal

Expose the ~12,600 newly-indexed `MarketItem` rows (stickers, agents, patches, graffiti, music kits, collectibles, keys) through a clean, searchable, filterable browse page. Skins and Cases keep their dedicated pages (`/skins`, `/cases`) — this page is purely for the long-tail categories.

This unlocks the value of the comprehensive-coverage data layer without the cost of building 7 separate category pages.

---

## 2. Approach (decided)

**Option C — Hybrid.** Skins and Cases remain on dedicated pages (high traffic, SEO-anchored). Everything else goes into one unified `/items` browse page with a category filter.

This matches Pricempire's structure and keeps engineering investment proportional to traffic potential.

---

## 3. URL Structure

| URL | Purpose |
|-----|---------|
| `/items` | Browse all MarketItem rows. Default: no filter. |
| `/items?category=sticker` | Filter to one category. URL is shareable + bookmarkable. |
| `/items?category=sticker&q=krakow` | Combine category + free-text search. |
| `/items/[id]` | Detail page for a single MarketItem. |

Categories valid for the filter (matching `MarketItem.category` values):
`sticker`, `agent`, `patch`, `graffiti`, `music_kit`, `collectible`, `key`.

---

## 4. Backend

### New endpoints

| Method | Path | Auth | Behaviour |
|--------|------|------|----------|
| `GET` | `/api/v1/market-items` | none | List with filters. Query params: `category`, `q`, `page` (1-indexed), `pageSize` (default 24, max 60), `sort` (`name` \| `price` \| `volume`, default `name`), `order` (`asc` \| `desc`, default `asc`). Returns `{ items, pagination: { page, pageSize, total, totalPages } }`. |
| `GET` | `/api/v1/market-items/:id` | none | Single item detail. Returns the full MarketItem row. 404 if not found. |

### Implementation notes

- DB query uses Prisma `findMany` with `where: { isActive: true, AND: [...filters] }` to exclude items the deadItemTracker has flagged.
- Free-text search: case-insensitive `contains` on `name`. Postgres `ILIKE`. Acceptable performance for 12k rows.
- Pagination: `skip + take`, plus a `count()` for total. Both queries run in parallel via `Promise.all`.
- Response stays small — no relations included on list endpoint. Detail endpoint can include `snapshots` (last 30) optionally.

---

## 5. Frontend

### `/items` page

`frontend/src/app/items/page.tsx` — Suspense wrapper around a client component that reads URL search params.

`frontend/src/app/items/_components/ItemsBrowse.tsx` — main client component:

- **Header**: title "Browse Items" + result count + sort dropdown
- **Filter sidebar** (left, sticky on desktop, collapsible drawer on mobile):
  - Category pills: `All / Stickers / Agents / Patches / Graffiti / Music Kits / Collectibles / Keys`
  - Search input (free text, debounced 300ms, syncs to URL `?q=`)
  - "Clear filters" link
- **Grid** (4 cols desktop, 2 mobile): item cards with image + name + category badge + price (when available)
- **Pagination** at bottom: Previous / page numbers / Next

State + URL sync via `useRouter` + `useSearchParams` (Next.js). Loading state via skeletons.

### `/items/[id]` detail page

`frontend/src/app/items/[id]/page.tsx` — server component fetches initial data.

Layout:
- Large image (placeholder if `imageUrl` null)
- Name + category badge
- Current price (priceLatest), median, 24h volume
- Rarity + collection (if present)
- 30-day price history chart (reuse `SkinPriceHistoryChart` adapted to MarketItem)
- Back to `/items?category=X` (preserves filter context)

---

## 6. Components

| File | Responsibility |
|------|----------------|
| `frontend/src/app/items/page.tsx` | Suspense + metadata wrapper |
| `frontend/src/app/items/_components/ItemsBrowse.tsx` | Filter + grid + pagination orchestration |
| `frontend/src/app/items/_components/ItemCard.tsx` | Single grid cell |
| `frontend/src/app/items/_components/CategoryFilter.tsx` | Category pills |
| `frontend/src/app/items/[id]/page.tsx` | Detail page |
| `frontend/src/hooks/useMarketItems.ts` | SWR-like hook for list endpoint |
| `backend/src/controllers/marketItemController.js` | Two endpoints (list + detail) |
| `backend/src/routes/marketItemRoutes.js` | Route wiring |

Each file < 200 LOC. Reuse existing UI primitives (`Card`, `Badge`, `Skeleton`, `Input`, `Select`).

---

## 7. Performance & Scale

- 12,600 rows total. Pagination keeps page payload bounded (24 items × ~200 bytes JSON ≈ 5 KB).
- Free-text search via `ILIKE` is fine at this scale. Beyond 50k items, consider Postgres full-text or a search index.
- Add a `MarketItem(name)` index in a small migration if query plan shows seq scan (verify after first prod run, not pre-emptively).

---

## 8. Tests

- Unit tests for the controller (list filtering, pagination math, sort options) using Prisma mock
- Integration test: hit `/api/v1/market-items?category=sticker&q=foo&page=1` against a seeded test DB, verify shape
- No frontend E2E in this iteration (matches project pattern — Playwright tests are deferred elsewhere)

---

## 9. NOT Goals (YAGNI)

- ❌ Separate `/stickers`, `/agents`, `/patches` pages — Option C explicitly rejects this
- ❌ Add-to-portfolio from MarketItem (portfolio still skin-only for now)
- ❌ Watchlist for MarketItem (watchlist skin-only for now)
- ❌ Faceted filtering by rarity, collection — single category + text search is enough for v1
- ❌ Sorting by 7d/30d change — only `name`, `price`, `volume` in v1
- ❌ Server-side rendering of cards (client component is fine, fast enough)

---

## 10. Future Iterations

When traffic or feedback warrants:
- Promote a high-traffic category (likely Stickers) to its own `/stickers` page with richer UX (tournament filter, holo/foil flags)
- Add MarketItem to portfolio + watchlist (requires extending the existing Portfolio model to support non-skin items)
- Add tournament metadata filter for stickers using the `metadata.tournament` field
- Add price history chart on list cards (sparkline)

---

## 11. Success Criteria

- All 7 categories browseable through one URL
- Search returns results in <500ms for any query
- Filter persists in URL (shareable + back-button friendly)
- Detail page renders for any active MarketItem id, including those with no current price
- Mobile responsive: filter accessible via drawer, grid stacks to 2 columns
