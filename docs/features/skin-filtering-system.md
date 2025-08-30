Skin Filtering System
=====================

Overview
--------

Comprehensive filtering and sorting for CS2 skins (categories, price ranges, wear, rarity, quality, special attributes).  
The system supports URL synchronization and infinite scrolling.

Backend API: `/api/v1/skins`
----------------------------

**Query Parameters**

* `q` – text search (name, marketHashName, itemName)
* `min` / `max` – price range (USD)
* `rarity` – Consumer Grade, Industrial Grade, Mil-Spec, …
* `wear` – fn, mw, ft, ww, bs
* `quality` – Normal, StatTrak, Souvenir
* `stattrak` – true/false
* `special` – true/false
* `category` – weapon/asset category
* `sort` – sorting option
* `page` – default 1
* `pageSize` – default 24, max 60

Category System (fallback levels)
---------------------------------

1. Pattern Matching (most specific)
2. Weapon Type Matching
3. Name Matching (least specific, with exclusions)

**Examples**  
`knives`, `gloves`, `pistols`, `smgs`, `rifles`, `shotguns`, `machineGuns`, `stickers`, `agents`, `cases`, `charms`

Sorting Options
---------------

* `name_asc` / `name_desc`
* `price_asc` / `price_desc` (nulls last)
* `newest`
* `popularity_desc` (sold24h + offerVolume)
* `wear_asc` / `wear_desc` (fn→bs or bs→fn)

Response
--------

    {
      "items": [...],
      "total": 1234,
      "page": 1,
      "pageSize": 24
    }

Frontend Implementation
-----------------------

**URL Synchronization**

* Parameters via `useSearchParams` + `useRouter`
* Bookmarkable, shareable views
* Proper back/forward navigation

**Infinite Scroll**

* IntersectionObserver
* 24 items per page
* Skeleton loaders during fetch

**Filter Components**

* Left sidebar with all controls
* Category tabs (quick selection)
* Quick sort bar
* Search input (debounced)
* Price range (min/max)
* Dropdowns (wear, rarity, quality)
* Checkboxes (StatTrak, special)

Troubleshooting
---------------

**Common Issues**

1. *CORS*: ensure backend CORS (`ALLOWED_ORIGINS`) and `ALLOW_VERCEL_PREVIEWS=true`
2. *Category not working*: verify parameter; check backend logs
3. *Sorting oddities*: validate sort param, handle nulls, check Prisma `orderBy`
4. *Filters not updating*: check React state & URL param updates

**Debug Logging**

* `🔄` state/filter changes
* `🚀` API calls/responses
* `💥` errors/failures

**Performance**

* DB indexes on `rarity`, `wear`, `priceAvg`
* Price history indexes on `skinId`, `date`
* Pagination cap = 60
* IntersectionObserver for smooth scroll

Development Notes
-----------------

**Backend**

* Do not modify critical cron/scripts unless planned
* Centralize limits/flags in config
* Add new env keys to docs & README

**Frontend**

* Use Suspense & error boundaries
* TypeScript everywhere
* Respect existing naming

**Testing**

* Category matrix, URL persistence, infinite scroll perf
* Edge cases: empty results, large datasets

Commit Examples
---------------

* `feat(frontend): add comprehensive skin filtering system`
* `fix(backend): improve category filtering accuracy`
* `docs(readme): add skin filtering system documentation`
* `perf(backend): add DB indexes for filtering`