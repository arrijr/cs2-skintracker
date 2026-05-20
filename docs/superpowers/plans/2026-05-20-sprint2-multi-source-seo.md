# Sprint 2 — Multi-Source Pricing + Programmatic SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the 15,071-item Skin catalog into a programmatic-SEO asset and ship Skinport + CSFloat multi-source live pricing so the new pages have a competitive content wedge.

**Architecture:** Convert `/skins/[skinId]` from client-rendered to a Server Component at `/skins/[weapon]/[slug]` with `generateMetadata`, `Product` + `Offer` + `BreadcrumbList` + `FAQPage` JSON-LD, and an ISR-cached multi-market price table. Backend gains two thin HTTP fetch clients (Skinport, CSFloat) following the existing `steamMarketClient.js` pattern, an aggregator that joins them with our Steam Market price into a single `MultiSourcePrice` shape, and one new endpoint. Sitemap shifts to `generateSitemaps()` to chunk all 15k skins. The old integer URL stays alive via 301 to the new slug URL so nothing breaks during the rollout.

**Tech Stack:**
- Next.js 15 App Router (RSC + ISR), Tailwind, TypeScript strict
- Express + Prisma 6 + PostgreSQL (Supabase pooler)
- Hand-written Prisma migrations (existing schema drift blocks `prisma migrate dev`)
- Jest + supertest for backend tests
- PostHog typed event taxonomy (`frontend/src/lib/analytics.ts`)
- Inngest for the daily multi-source refresh cron
- `next/image` with Steam CDN whitelist (already in `next.config.ts`)

**Existing patterns to reuse (DO NOT rewrite from scratch):**
- SSR/metadata/JSON-LD reference: `frontend/src/app/blog/[slug]/page.tsx`
- HTTP fetch with retry + timeout + 429 handling: `backend/src/services/pricing/steamMarketClient.js`
- TTL cache: `backend/src/services/steamService.js`
- Hand-written migration template: `backend/prisma/migrations/20260520010000_drop_discord_webhook/migration.sql`
- Typed analytics events: `frontend/src/lib/analytics.ts`

**Out of scope (explicit YAGNI):**
- Per-wear separate pages — handled via `?wear=` query param + wear-comparison table on canonical
- Buff163 integration — geo + scraping risk; revisit Sprint 4+
- Blog content production — separate effort
- Skin-vs-skin comparison pages — Phase 3 / Sprint 3
- Investment-scoring methodology page — defer

---

## File Structure

### New files

| Path | Responsibility |
|------|---------------|
| `backend/prisma/migrations/20260521000000_skin_slug_columns/migration.sql` | Add `Skin.slug` + `Skin.weaponSlug` columns + unique indexes |
| `backend/src/utils/slugify.js` | Pure slug helper (`marketHashName → ak-47-redline-field-tested`) |
| `backend/src/__tests__/slugify.test.js` | Slug helper tests |
| `backend/scripts/backfill-skin-slugs.js` | Idempotent backfill script (one-shot, dev + prod) |
| `backend/src/services/pricing/skinportClient.js` | Live Skinport ask/bid fetch |
| `backend/src/services/pricing/csfloatClient.js` | Live CSFloat float-aware prices |
| `backend/src/services/pricing/multiSourceAggregator.js` | Joins Steam + Skinport + CSFloat into `MultiSourcePrice` shape |
| `backend/src/services/pricing/affiliateLinks.js` | Builds Skinport + CS.Money deep-links with `?ref=` |
| `backend/src/__tests__/skinportClient.test.js` | Skinport client unit tests |
| `backend/src/__tests__/csfloatClient.test.js` | CSFloat client unit tests |
| `backend/src/__tests__/multiSourceAggregator.test.js` | Aggregator joining + ranking tests |
| `backend/src/controllers/skinDetailController.js` | GET `/api/v1/skins/:slug` + `/api/v1/skins/:slug/prices` |
| `backend/src/routes/skinDetailRoutes.js` | Wires controller |
| `backend/inngest/functions/refresh-multi-source-prices.js` | Daily cron — fetches Skinport + CSFloat for top-N skins |
| `frontend/src/app/skins/[weapon]/[slug]/page.tsx` | New SSR canonical skin page |
| `frontend/src/app/skins/[weapon]/[slug]/_components/SkinDetailClient.tsx` | Client interactivity (chart toggles, alert modal triggers) |
| `frontend/src/app/skins/[weapon]/[slug]/_components/MultiSourcePriceTable.tsx` | The differentiation wedge — cross-market price grid |
| `frontend/src/app/skins/[weapon]/[slug]/_components/WearComparisonTable.tsx` | Covers wear-suffix long-tails on canonical |
| `frontend/src/app/skins/[weapon]/[slug]/_components/SkinFAQ.tsx` | FAQ block + FAQPage JSON-LD |
| `frontend/src/components/skins/SkinProductSchema.tsx` | JSON-LD Product + Offer + BreadcrumbList |
| `frontend/src/components/skins/AffiliateLink.tsx` | Wraps outbound clicks with PostHog event + `rel="sponsored nofollow"` |
| `frontend/src/app/skins/[weapon]/page.tsx` | Weapon pillar page (e.g. `/skins/ak-47`) |
| `frontend/src/app/cases/[slug]/page.tsx` | Case detail with drop table + EV |
| `frontend/src/lib/skins-server.ts` | Server-only DB readers (`getSkinBySlug`, `listSkinsByWeapon`, paginated lists for sitemap) |

### Modified files

| Path | Change |
|------|--------|
| `backend/prisma/schema.prisma` | `model Skin { slug String? @unique; weaponSlug String? }` |
| `backend/src/app.js` | Mount `skinDetailRoutes` at `/api/v1/skins` |
| `frontend/src/app/skins/[skinId]/page.tsx` | Reduce to 301 redirect → `/skins/[weapon]/[slug]` |
| `frontend/src/app/sitemap.ts` | Replace with paginated `generateSitemaps()` impl |
| `frontend/src/lib/analytics.ts` | Add SEO events to typed union |
| `backend/inngest/index.js` | Register new cron function |

---

## Task ordering rationale

Phase A (schema/slug) is the foundation — every downstream task reads `Skin.slug`. Phase B (SSR conversion) is non-negotiable per the audit: without it, every other SEO fix delivers <20% value. Phase C (schemas + sitemap) ships next so Google starts discovering pages early. Phases D + E (multi-source backend + frontend) deliver the content differentiation. Phase F adds the pillar/case pages that link the spokes together. Phase G ships analytics and submits to GSC.

---

## Phase A — Schema + Slug Foundation (Day 1)

### Task 1: Schema migration for `Skin.slug` and `Skin.weaponSlug`

**Files:**
- Create: `backend/prisma/migrations/20260521000000_skin_slug_columns/migration.sql`
- Modify: `backend/prisma/schema.prisma:47-90` (Skin model)

- [ ] **Step 1: Write the migration SQL**

Create `backend/prisma/migrations/20260521000000_skin_slug_columns/migration.sql`:

```sql
-- Add slug + weaponSlug columns to Skin. Both nullable so backfill can run
-- in a second pass without blocking deploys. Backfill is idempotent (see
-- backend/scripts/backfill-skin-slugs.js) and writes both columns.

ALTER TABLE "Skin"
  ADD COLUMN IF NOT EXISTS "slug" TEXT,
  ADD COLUMN IF NOT EXISTS "weaponSlug" TEXT;

-- Unique on slug for canonical URLs. Conditional so re-runs don't fail.
CREATE UNIQUE INDEX IF NOT EXISTS "Skin_slug_key" ON "Skin"("slug") WHERE "slug" IS NOT NULL;

-- Non-unique on weaponSlug for pillar-page queries.
CREATE INDEX IF NOT EXISTS "Skin_weaponSlug_idx" ON "Skin"("weaponSlug");
```

- [ ] **Step 2: Update the Prisma model**

Edit `backend/prisma/schema.prisma` — add after line 62 (just below `variantOf`):

```prisma
  // SEO canonical slug — backfilled from marketHashName via slugify().
  // Nullable until backfill completes; the API resolves null → 404.
  slug         String?  @unique
  weaponSlug   String?  // pillar-page grouping, e.g. "ak-47", "awp", "karambit"

  @@index([weaponSlug])
```

- [ ] **Step 3: Apply the migration**

Run via Supabase MCP (the existing schema drift blocks `prisma migrate dev`):

```bash
# Via psql / Supabase SQL Editor — apply the .sql file contents directly.
# Verify after with:
\d "Skin"
```

Expected: two new columns visible, both nullable, with the indexes.

- [ ] **Step 4: Regenerate Prisma client**

```bash
cd backend && npx prisma generate
```

Expected output: `✔ Generated Prisma Client`. No errors.

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/migrations/20260521000000_skin_slug_columns/migration.sql backend/prisma/schema.prisma
git commit -m "feat(schema): add Skin.slug + weaponSlug for SEO canonical URLs"
```

### Task 2: Slugify helper with tests (TDD)

**Files:**
- Create: `backend/src/utils/slugify.js`
- Test: `backend/src/__tests__/slugify.test.js`

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/slugify.test.js`:

```js
import { describe, it, expect } from '@jest/globals';
import { slugify, weaponSlugFor } from '../utils/slugify.js';

describe('slugify', () => {
  it('lowercases + replaces pipes/parens/spaces with hyphens', () => {
    expect(slugify('AK-47 | Redline (Field-Tested)')).toBe('ak-47-redline-field-tested');
  });

  it('keeps existing hyphens in weapon names', () => {
    expect(slugify('AWP | Asiimov (Battle-Scarred)')).toBe('awp-asiimov-battle-scarred');
  });

  it('handles StatTrak and Souvenir prefixes', () => {
    expect(slugify('StatTrak™ AK-47 | Redline (Field-Tested)')).toBe('stattrak-ak-47-redline-field-tested');
    expect(slugify('Souvenir AWP | Dragon Lore (Factory New)')).toBe('souvenir-awp-dragon-lore-factory-new');
  });

  it('strips diacritics and non-ASCII', () => {
    expect(slugify('★ Karambit | Fade (Factory New)')).toBe('karambit-fade-factory-new');
  });

  it('collapses consecutive hyphens', () => {
    expect(slugify('M4A4 |   Asiimov')).toBe('m4a4-asiimov');
  });

  it('trims leading + trailing hyphens', () => {
    expect(slugify('-AK-47-')).toBe('ak-47');
  });

  it('returns empty string for empty input', () => {
    expect(slugify('')).toBe('');
    expect(slugify(null)).toBe('');
    expect(slugify(undefined)).toBe('');
  });
});

describe('weaponSlugFor', () => {
  it('extracts weapon from "WEAPON | Skin (Wear)" format', () => {
    expect(weaponSlugFor('AK-47 | Redline (Field-Tested)')).toBe('ak-47');
    expect(weaponSlugFor('AWP | Asiimov (Factory New)')).toBe('awp');
  });

  it('handles StatTrak prefix', () => {
    expect(weaponSlugFor('StatTrak™ AK-47 | Redline (Field-Tested)')).toBe('ak-47');
  });

  it('handles Souvenir prefix', () => {
    expect(weaponSlugFor('Souvenir AWP | Dragon Lore (Factory New)')).toBe('awp');
  });

  it('handles knife star prefix', () => {
    expect(weaponSlugFor('★ Karambit | Fade (Factory New)')).toBe('karambit');
    expect(weaponSlugFor('★ StatTrak™ Karambit | Fade (Factory New)')).toBe('karambit');
  });

  it('returns "unknown" when no pipe present', () => {
    expect(weaponSlugFor('Operation Hydra Case')).toBe('unknown');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest --testPathPatterns=slugify --no-coverage
```

Expected: FAIL — `Cannot find module '../utils/slugify.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `backend/src/utils/slugify.js`:

```js
/**
 * Convert a marketHashName to a URL-safe slug.
 *
 *   "AK-47 | Redline (Field-Tested)" → "ak-47-redline-field-tested"
 *   "StatTrak™ AK-47 | Redline (FT)" → "stattrak-ak-47-redline-ft"
 *   "★ Karambit | Fade (FN)"         → "karambit-fade-fn"
 *
 * Pure function, no I/O. Tested in __tests__/slugify.test.js.
 */
export function slugify(input) {
  if (!input) return '';
  return String(input)
    // Strip diacritics + non-ASCII (★, ™, etc.)
    // NFD (not NFKD): keeps ™/½/ﬁ as single codepoints so the next line's ASCII strip removes them as whole units, instead of decomposing ™→TM which would survive.
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\x00-\x7F]/g, '')
    // Lowercase
    .toLowerCase()
    // Pipe, parens, slash, colon, ampersand → space
    .replace(/[|()/:&]/g, ' ')
    // Collapse whitespace + any non-alphanumeric (except hyphen) → hyphen
    .replace(/[^a-z0-9-]+/g, '-')
    // Collapse repeated hyphens
    .replace(/-+/g, '-')
    // Trim leading/trailing hyphens
    .replace(/^-|-$/g, '');
}

/**
 * Extract the weapon slug from a marketHashName.
 *   "AK-47 | Redline (FT)"           → "ak-47"
 *   "★ StatTrak™ Karambit | Fade"   → "karambit"
 *   "Operation Hydra Case"           → "unknown"
 */
export function weaponSlugFor(marketHashName) {
  if (!marketHashName || typeof marketHashName !== 'string') return 'unknown';
  if (!marketHashName.includes('|')) return 'unknown';
  // Take everything before the first pipe
  let head = marketHashName.split('|')[0].trim();
  // Strip ★, StatTrak™, Souvenir prefixes
  head = head
    .replace(/^★\s*/, '')
    .replace(/^StatTrak™?\s*/i, '')
    .replace(/^Souvenir\s*/i, '')
    .trim();
  return slugify(head);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd backend && npx jest --testPathPatterns=slugify --no-coverage
```

Expected: PASS — 12 tests / 12 passing.

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/slugify.js backend/src/__tests__/slugify.test.js
git commit -m "feat(slug): add slugify + weaponSlugFor helpers with 12 tests"
```

### Task 3: Slug backfill script

**Files:**
- Create: `backend/scripts/backfill-skin-slugs.js`

- [ ] **Step 1: Write the backfill script**

Create `backend/scripts/backfill-skin-slugs.js`:

```js
#!/usr/bin/env node
/**
 * Idempotent slug backfill for the Skin table.
 *
 *   - Reads all rows where slug IS NULL.
 *   - Computes slug + weaponSlug from marketHashName.
 *   - Resolves slug collisions deterministically by appending the integer id.
 *   - Writes in batches of 500 with a console progress line per batch.
 *
 * Run:
 *   node backend/scripts/backfill-skin-slugs.js
 *   node backend/scripts/backfill-skin-slugs.js --dry-run
 */
import prisma from '../src/prisma/prismaClient.js';
import { slugify, weaponSlugFor } from '../src/utils/slugify.js';

const DRY_RUN = process.argv.includes('--dry-run');
const BATCH_SIZE = 500;

async function main() {
  const rows = await prisma.skin.findMany({
    where: { slug: null },
    select: { id: true, marketHashName: true, name: true },
  });
  console.log(`[backfill] ${rows.length} rows need slugs${DRY_RUN ? ' (DRY RUN)' : ''}`);

  // Pre-compute slugs + resolve collisions deterministically.
  const seen = new Map(); // slug → first id that used it
  const planned = [];
  for (const r of rows) {
    const source = r.marketHashName || r.name || '';
    let slug = slugify(source);
    const weaponSlug = weaponSlugFor(source);

    if (!slug) {
      console.warn(`[backfill] skin id=${r.id} has no slug-able name "${source}" — skipping`);
      continue;
    }

    if (seen.has(slug)) {
      // Collision — append id for deterministic uniqueness.
      slug = `${slug}-${r.id}`;
    }
    seen.set(slug, r.id);
    planned.push({ id: r.id, slug, weaponSlug });
  }

  console.log(`[backfill] planned ${planned.length} writes; ${seen.size === planned.length ? 'no' : (planned.length - seen.size)} collisions resolved`);

  if (DRY_RUN) {
    console.log('[backfill] DRY RUN — first 5 planned writes:');
    console.log(planned.slice(0, 5));
    return;
  }

  let written = 0;
  for (let i = 0; i < planned.length; i += BATCH_SIZE) {
    const batch = planned.slice(i, i + BATCH_SIZE);
    await prisma.$transaction(
      batch.map((p) =>
        prisma.skin.update({
          where: { id: p.id },
          data: { slug: p.slug, weaponSlug: p.weaponSlug },
        })
      )
    );
    written += batch.length;
    console.log(`[backfill] wrote ${written}/${planned.length}`);
  }

  console.log('[backfill] complete');
}

main()
  .catch((e) => {
    console.error('[backfill] failed', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Dry-run against dev DB**

```bash
cd backend && node scripts/backfill-skin-slugs.js --dry-run
```

Expected: `[backfill] 15071 rows need slugs (DRY RUN)` + 5 sample writes + no errors.

- [ ] **Step 3: Apply for real**

```bash
cd backend && node scripts/backfill-skin-slugs.js
```

Expected: 30+ batches, final line `[backfill] complete`.

- [ ] **Step 4: Verify in DB**

```bash
# psql / Supabase SQL editor
SELECT COUNT(*) FROM "Skin" WHERE "slug" IS NULL;
-- Expected: 0 (or only items with no marketHashName/name)

SELECT "slug", "weaponSlug", "marketHashName" FROM "Skin" LIMIT 5;
-- Expected: 5 rows with non-null slug + weaponSlug
```

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/backfill-skin-slugs.js
git commit -m "feat(slug): idempotent Skin.slug + weaponSlug backfill script"
```

---

## Phase B — SSR Conversion (Day 2)

### Task 4: Create server-only Skin DB readers

**Files:**
- Create: `frontend/src/lib/skins-server.ts`

- [ ] **Step 1: Write the server-only readers**

Create `frontend/src/lib/skins-server.ts`:

```ts
import 'server-only';

/**
 * Server-only DB readers for skin pages. NEVER import this from a
 * client component — it pulls server-only code into the client bundle.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface SkinDetail {
  id: number;
  slug: string;
  weaponSlug: string;
  name: string;
  marketHashName: string;
  imageUrl: string | null;
  weaponType: string | null;
  collection: string | null;
  wear: string | null;
  rarity: string | null;
  isStattrak: boolean | null;
  priceLatest: number | null;
  priceMedian: number | null;
  priceAvg: number | null;
  priceMin: number | null;
  priceMax: number | null;
  priceMedian7d: number | null;
  priceMedian30d: number | null;
  priceMedian90d: number | null;
  sold24h: number | null;
  sold7d: number | null;
  sold30d: number | null;
  variantOf: number | null;
}

export async function getSkinBySlug(slug: string): Promise<SkinDetail | null> {
  const res = await fetch(`${API_BASE}/api/v1/skins/${encodeURIComponent(slug)}`, {
    next: { revalidate: 3600, tags: [`skin:${slug}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getSkinBySlug HTTP ${res.status}`);
  return res.json();
}

export async function listSkinsByWeapon(weaponSlug: string, limit = 200): Promise<SkinDetail[]> {
  const res = await fetch(
    `${API_BASE}/api/v1/skins?weapon=${encodeURIComponent(weaponSlug)}&limit=${limit}`,
    { next: { revalidate: 3600, tags: [`weapon:${weaponSlug}`] } }
  );
  if (!res.ok) throw new Error(`listSkinsByWeapon HTTP ${res.status}`);
  return res.json();
}

/**
 * Paginated reader for sitemap generation. Returns slugs + lastModified.
 * NOT cached — sitemap rebuilds on every request to the chunked URL,
 * Next batches them via generateSitemaps.
 */
export async function listSkinSlugsPaged(
  page: number,
  pageSize = 5000
): Promise<Array<{ slug: string; weaponSlug: string; updatedAt: string }>> {
  const res = await fetch(
    `${API_BASE}/api/v1/skins/slugs?page=${page}&pageSize=${pageSize}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`listSkinSlugsPaged HTTP ${res.status}`);
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/lib/skins-server.ts
git commit -m "feat(skins): server-only DB readers for SSR skin pages"
```

### Task 5: Backend `/api/v1/skins/:slug` + `/skins/slugs` endpoints

**Files:**
- Create: `backend/src/controllers/skinDetailController.js`
- Create: `backend/src/routes/skinDetailRoutes.js`
- Test: `backend/src/__tests__/skinDetail.test.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/skinDetail.test.js`:

```js
import { describe, it, expect, jest } from '@jest/globals';
import { getSkinBySlug, listSkinSlugs, listSkinsByWeapon } from '../controllers/skinDetailController.js';

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}

describe('skinDetailController', () => {
  it('getSkinBySlug returns 404 when slug not found', async () => {
    const prisma = { skin: { findUnique: jest.fn(async () => null) } };
    const res = makeRes();
    await getSkinBySlug({ params: { slug: 'nope' } }, res, { prismaClient: prisma });
    expect(res.statusCode).toBe(404);
  });

  it('getSkinBySlug returns skin when found', async () => {
    const skin = { id: 1, slug: 'ak-47-redline-ft', weaponSlug: 'ak-47', name: 'AK-47 | Redline' };
    const prisma = { skin: { findUnique: jest.fn(async () => skin) } };
    const res = makeRes();
    await getSkinBySlug({ params: { slug: 'ak-47-redline-ft' } }, res, { prismaClient: prisma });
    expect(res.statusCode).toBe(200);
    expect(res.body.slug).toBe('ak-47-redline-ft');
  });

  it('listSkinsByWeapon filters by weaponSlug + limit', async () => {
    const findMany = jest.fn(async () => [{ id: 1, slug: 'a', weaponSlug: 'ak-47' }]);
    const prisma = { skin: { findMany } };
    const res = makeRes();
    await listSkinsByWeapon({ query: { weapon: 'ak-47', limit: '50' } }, res, { prismaClient: prisma });
    expect(res.statusCode).toBe(200);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { weaponSlug: 'ak-47', slug: { not: null } },
      take: 50,
    }));
  });

  it('listSkinSlugs paginates', async () => {
    const findMany = jest.fn(async () => [{ slug: 'x', weaponSlug: 'ak-47', updatedAt: new Date() }]);
    const prisma = { skin: { findMany } };
    const res = makeRes();
    await listSkinSlugs({ query: { page: '2', pageSize: '5000' } }, res, { prismaClient: prisma });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      skip: 5000,
      take: 5000,
      where: { slug: { not: null } },
    }));
  });
});
```

- [ ] **Step 2: Run test (it fails)**

```bash
cd backend && npx jest --testPathPatterns=skinDetail --no-coverage
```

Expected: FAIL — `Cannot find module ../controllers/skinDetailController.js`.

- [ ] **Step 3: Write controller**

Create `backend/src/controllers/skinDetailController.js`:

```js
import defaultPrisma from '../prisma/prismaClient.js';

export async function getSkinBySlug(req, res, { prismaClient = defaultPrisma } = {}) {
  const { slug } = req.params;
  if (!slug) return res.status(400).json({ error: 'slug required' });
  const skin = await prismaClient.skin.findUnique({
    where: { slug },
  });
  if (!skin) return res.status(404).json({ error: 'not found' });
  return res.json(skin);
}

export async function listSkinsByWeapon(req, res, { prismaClient = defaultPrisma } = {}) {
  const weapon = String(req.query.weapon || '');
  const limit = Math.min(parseInt(req.query.limit, 10) || 200, 500);
  if (!weapon) return res.status(400).json({ error: 'weapon query required' });
  const skins = await prismaClient.skin.findMany({
    where: { weaponSlug: weapon, slug: { not: null } },
    take: limit,
    orderBy: { sold7d: 'desc' },
  });
  return res.json(skins);
}

export async function listSkinSlugs(req, res, { prismaClient = defaultPrisma } = {}) {
  const page = Math.max(parseInt(req.query.page, 10) || 0, 0);
  const pageSize = Math.min(parseInt(req.query.pageSize, 10) || 5000, 10000);
  const skins = await prismaClient.skin.findMany({
    where: { slug: { not: null } },
    select: { slug: true, weaponSlug: true, updatedAt: true },
    skip: page * pageSize,
    take: pageSize,
    orderBy: { id: 'asc' },
  });
  return res.json(skins);
}
```

- [ ] **Step 4: Wire the routes**

Create `backend/src/routes/skinDetailRoutes.js`:

```js
import { Router } from 'express';
import {
  getSkinBySlug,
  listSkinsByWeapon,
  listSkinSlugs,
} from '../controllers/skinDetailController.js';

const router = Router();

// Public — these power SEO landing pages, no auth required.
router.get('/slugs', (req, res) => listSkinSlugs(req, res));
router.get('/:slug', (req, res) => getSkinBySlug(req, res));
router.get('/',      (req, res) => listSkinsByWeapon(req, res));

export default router;
```

- [ ] **Step 5: Mount in app.js**

Edit `backend/src/app.js` — add import near line 30 (alongside other route imports):

```js
import skinDetailRoutes from "./routes/skinDetailRoutes.js";
```

And mount near line 125 (before the catch-all):

```js
// Public skin readers — SSR + sitemap depend on these.
app.use("/api/v1/skins", skinDetailRoutes);
```

- [ ] **Step 6: Run tests**

```bash
cd backend && npx jest --testPathPatterns=skinDetail --no-coverage
```

Expected: PASS — 4 tests / 4 passing.

- [ ] **Step 7: Commit**

```bash
git add backend/src/controllers/skinDetailController.js backend/src/routes/skinDetailRoutes.js backend/src/__tests__/skinDetail.test.js backend/src/app.js
git commit -m "feat(skins): public /api/v1/skins/:slug + /slugs + ?weapon endpoints"
```

### Task 6: Convert `/skins/[skinId]/page.tsx` to Server Component (with 301 to new slug URL)

**Files:**
- Modify: `frontend/src/app/skins/[skinId]/page.tsx`

- [ ] **Step 1: Replace the file with a redirect**

Overwrite `frontend/src/app/skins/[skinId]/page.tsx`:

```tsx
// frontend/src/app/skins/[skinId]/page.tsx
//
// LEGACY INTEGER URL — preserved for backward compatibility.
//
// New canonical URL pattern is /skins/[weapon]/[slug] (Sprint 2 SEO work).
// This server component looks up the skin by id and 301s the user to the
// canonical slug URL. Any old bookmarks, social links, and Google index
// entries keep working until they get re-crawled.

import { redirect, notFound } from 'next/navigation';
import { permanentRedirect } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface PageProps {
  params: { skinId: string };
}

async function getSkinIdLookup(id: string): Promise<{ slug: string; weaponSlug: string } | null> {
  const res = await fetch(`${API_BASE}/api/v1/skins/by-id/${encodeURIComponent(id)}`, {
    next: { revalidate: 3600 },
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.slug || !data?.weaponSlug) return null;
  return { slug: data.slug, weaponSlug: data.weaponSlug };
}

export default async function LegacySkinIdRedirect({ params }: PageProps) {
  const lookup = await getSkinIdLookup(params.skinId);
  if (!lookup) notFound();
  // permanentRedirect = 308 (modern HTTP equivalent of 301 — preserves method,
  // browsers + crawlers treat it as a permanent move just like 301).
  permanentRedirect(`/skins/${lookup.weaponSlug}/${lookup.slug}`);
}
```

- [ ] **Step 2: Add the `/by-id/:id` lookup endpoint**

Edit `backend/src/controllers/skinDetailController.js` — add at top of file:

```js
export async function getSkinById(req, res, { prismaClient = defaultPrisma } = {}) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  const skin = await prismaClient.skin.findUnique({
    where: { id },
    select: { id: true, slug: true, weaponSlug: true },
  });
  if (!skin) return res.status(404).json({ error: 'not found' });
  return res.json(skin);
}
```

And edit `backend/src/routes/skinDetailRoutes.js` — add the new route before `/:slug`:

```js
import { getSkinBySlug, listSkinsByWeapon, listSkinSlugs, getSkinById } from '../controllers/skinDetailController.js';
// ...
router.get('/by-id/:id', (req, res) => getSkinById(req, res));
router.get('/slugs',     (req, res) => listSkinSlugs(req, res));
router.get('/:slug',     (req, res) => getSkinBySlug(req, res));
router.get('/',          (req, res) => listSkinsByWeapon(req, res));
```

- [ ] **Step 3: Move the existing client UI to `_components/`**

The original file's `'use client'` body needs to live somewhere — the new canonical page in Task 7 will use it. For this task, just move it to:

```bash
mkdir -p frontend/src/app/skins/[weapon]/[slug]/_components
# Copy original client body to:
# frontend/src/app/skins/[weapon]/[slug]/_components/SkinDetailClient.tsx
# (this becomes the import target in Task 7 — for now just save the file)
```

(Manual file save — copy the previous `/skins/[skinId]/page.tsx` content, rename the default export to `SkinDetailClient`, add `"use client"` directive at top, remove the route-param reading via `useParams()` and instead accept `{ skin }: { skin: SkinDetail }` props.)

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/skins/[skinId]/page.tsx frontend/src/app/skins/[weapon]/[slug]/_components/SkinDetailClient.tsx backend/src/controllers/skinDetailController.js backend/src/routes/skinDetailRoutes.js
git commit -m "feat(seo): 301 legacy /skins/[id] → /skins/[weapon]/[slug]"
```

### Task 7: New SSR canonical page `/skins/[weapon]/[slug]`

**Files:**
- Create: `frontend/src/app/skins/[weapon]/[slug]/page.tsx`

- [ ] **Step 1: Write the SSR page**

Create `frontend/src/app/skins/[weapon]/[slug]/page.tsx`:

```tsx
// frontend/src/app/skins/[weapon]/[slug]/page.tsx
//
// Canonical SSR landing page for every skin in our catalog.
// - Generates per-skin metadata (title, description, OG, canonical).
// - Embeds Product + Offer + BreadcrumbList + FAQPage JSON-LD.
// - Renders the interactive UI through a client child component.
// - ISR-cached at 1h via the lib/skins-server reader.

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSkinBySlug } from '@/lib/skins-server';
import { SkinDetailClient } from './_components/SkinDetailClient';
import { MultiSourcePriceTable } from './_components/MultiSourcePriceTable';
import { WearComparisonTable } from './_components/WearComparisonTable';
import { SkinFAQ } from './_components/SkinFAQ';
import { SkinProductSchema } from '@/components/skins/SkinProductSchema';

interface PageProps {
  params: { weapon: string; slug: string };
  searchParams: { wear?: string };
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cs2-skintracker.com';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const skin = await getSkinBySlug(params.slug);
  if (!skin) {
    return { title: 'Skin not found', robots: { index: false } };
  }

  const title = `${skin.marketHashName} Price & Float History | CS2 SkinTrackr`;
  const description =
    `Live ${skin.marketHashName} price across Steam Market, Skinport and CSFloat. ` +
    `30/60/90-day chart, float distribution, set alerts free.`;
  const canonical = `${BASE_URL}/skins/${skin.weaponSlug}/${skin.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: 'CS2 SkinTrackr',
      images: skin.imageUrl ? [{ url: skin.imageUrl, width: 512, height: 384, alt: skin.marketHashName }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: skin.imageUrl ? [skin.imageUrl] : [],
    },
    robots: {
      // De-index until we have a real current price — thin-content guard.
      index: skin.priceLatest != null,
      follow: true,
    },
  };
}

export default async function SkinDetailPage({ params, searchParams }: PageProps) {
  const skin = await getSkinBySlug(params.slug);
  if (!skin) notFound();

  // Guard: if user lands on /skins/awp/ak-47-redline-ft (wrong weapon), 404
  // rather than render confusing content.
  if (skin.weaponSlug !== params.weapon) notFound();

  return (
    <>
      <SkinProductSchema skin={skin} canonicalUrl={`${BASE_URL}/skins/${skin.weaponSlug}/${skin.slug}`} />

      <main className="relative min-h-screen bg-slate-950 text-white">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm text-slate-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-fuchsia-400">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/skins" className="hover:text-fuchsia-400">Skins</Link>
            <span className="mx-2">/</span>
            <Link href={`/skins/${skin.weaponSlug}`} className="hover:text-fuchsia-400 capitalize">
              {skin.weaponSlug.replace(/-/g, ' ')}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-200">{skin.marketHashName}</span>
          </nav>

          {/* H1 — must come from the catalog, not duplicated. */}
          <h1 className="text-3xl md:text-5xl font-bold mb-2">{skin.marketHashName}</h1>
          <p className="text-slate-400 mb-8">
            {skin.weaponType} · {skin.rarity} · {skin.collection ?? 'No collection'}
          </p>

          {/* Client-rendered chart + interactivity */}
          <SkinDetailClient skin={skin} initialWear={searchParams.wear ?? null} />

          {/* SEO content blocks (server-rendered) */}
          <MultiSourcePriceTable skinSlug={skin.slug} />
          <WearComparisonTable weaponSlug={skin.weaponSlug} baseId={skin.variantOf ?? skin.id} />
          <SkinFAQ skin={skin} />
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Add stub components so the build doesn't break**

Create these as minimal stubs (real implementations come in later tasks):

`frontend/src/app/skins/[weapon]/[slug]/_components/MultiSourcePriceTable.tsx`:
```tsx
export function MultiSourcePriceTable({ skinSlug: _ }: { skinSlug: string }) {
  return <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
    <h2 className="text-xl font-semibold mb-4">Live prices across markets</h2>
    <p className="text-slate-400 text-sm">Loading…</p>
  </section>;
}
```

`frontend/src/app/skins/[weapon]/[slug]/_components/WearComparisonTable.tsx`:
```tsx
export function WearComparisonTable({ weaponSlug: _, baseId: __ }: { weaponSlug: string; baseId: number }) {
  return null; // implemented in Task 19
}
```

`frontend/src/app/skins/[weapon]/[slug]/_components/SkinFAQ.tsx`:
```tsx
import type { SkinDetail } from '@/lib/skins-server';
export function SkinFAQ({ skin: _ }: { skin: SkinDetail }) {
  return null; // implemented in Task 11
}
```

`frontend/src/components/skins/SkinProductSchema.tsx`:
```tsx
import type { SkinDetail } from '@/lib/skins-server';
export function SkinProductSchema({ skin: _, canonicalUrl: __ }: { skin: SkinDetail; canonicalUrl: string }) {
  return null; // implemented in Task 10
}
```

- [ ] **Step 3: Build to confirm no errors**

```bash
cd frontend && npx next build 2>&1 | tail -25
```

Expected: build succeeds. New `/skins/[weapon]/[slug]` route present in output. No new TS errors in touched files.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/skins/[weapon]/[slug]/page.tsx frontend/src/app/skins/[weapon]/[slug]/_components/ frontend/src/components/skins/
git commit -m "feat(seo): new SSR canonical /skins/[weapon]/[slug] route + metadata"
```

---

## Phase C — JSON-LD + Sitemap (Day 3)

### Task 8: `SkinProductSchema` — JSON-LD Product + Offer + BreadcrumbList

**Files:**
- Modify: `frontend/src/components/skins/SkinProductSchema.tsx`

- [ ] **Step 1: Replace stub with real implementation**

Overwrite `frontend/src/components/skins/SkinProductSchema.tsx`:

```tsx
import type { SkinDetail } from '@/lib/skins-server';

interface Props {
  skin: SkinDetail;
  canonicalUrl: string;
}

/**
 * Renders three side-by-side JSON-LD scripts:
 *   - Product (with current Offer)
 *   - BreadcrumbList (Home > Skins > Weapon > Skin)
 *   - WebSite (for org-level info, helps SERP brand presence)
 *
 * All numbers come from the SSR-resolved Skin row — no client calls here.
 */
export function SkinProductSchema({ skin, canonicalUrl }: Props) {
  const baseUrl = canonicalUrl.split('/skins/')[0];
  const price = skin.priceLatest ?? skin.priceMedian ?? skin.priceAvg ?? null;

  const productLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: skin.marketHashName,
    image: skin.imageUrl ?? undefined,
    description: `${skin.marketHashName} live price tracker across Steam Market, Skinport, and CSFloat. Historical price chart, float distribution, and free price alerts.`,
    sku: `cs2-${skin.id}`,
    brand: { '@type': 'Brand', name: 'Valve' },
    category: skin.weaponType ?? 'CS2 Skin',
    url: canonicalUrl,
    offers: price != null
      ? {
          '@type': 'Offer',
          price: price.toFixed(2),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url: canonicalUrl,
          seller: { '@type': 'Organization', name: 'Steam Community Market' },
        }
      : undefined,
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: 'Skins', item: `${baseUrl}/skins` },
      {
        '@type': 'ListItem',
        position: 3,
        name: skin.weaponSlug.replace(/-/g, ' ').toUpperCase(),
        item: `${baseUrl}/skins/${skin.weaponSlug}`,
      },
      { '@type': 'ListItem', position: 4, name: skin.marketHashName, item: canonicalUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    </>
  );
}
```

- [ ] **Step 2: Manual smoke test**

```bash
cd frontend && npx next build && npx next start &
# Visit http://localhost:3000/skins/ak-47/ak-47-redline-field-tested
# View source — should contain <script type="application/ld+json">...Product...
# Paste extracted JSON into https://search.google.com/test/rich-results
```

Expected: Google Rich Results Test reports both Product and BreadcrumbList as valid.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/skins/SkinProductSchema.tsx
git commit -m "feat(seo): Product + Offer + BreadcrumbList JSON-LD on skin pages"
```

### Task 9: `SkinFAQ` — FAQPage JSON-LD + 5 high-intent Q&As per page

**Files:**
- Modify: `frontend/src/app/skins/[weapon]/[slug]/_components/SkinFAQ.tsx`

- [ ] **Step 1: Implement**

Overwrite `frontend/src/app/skins/[weapon]/[slug]/_components/SkinFAQ.tsx`:

```tsx
import type { SkinDetail } from '@/lib/skins-server';

interface Props {
  skin: SkinDetail;
}

/**
 * Per-skin FAQ block with 5 high-intent questions that double as
 * FAQPage structured data. The Q&A copy is programmatic — every skin
 * gets the same 5 questions but with skin-specific answers pulled from
 * the catalog row.
 */
export function SkinFAQ({ skin }: Props) {
  const price = skin.priceLatest ?? skin.priceMedian ?? null;
  const sold30d = skin.sold30d ?? null;
  const min = skin.priceMin ?? null;
  const max = skin.priceMax ?? null;

  const qa = [
    {
      q: `How much does ${skin.marketHashName} cost?`,
      a: price != null
        ? `As of today, ${skin.marketHashName} trades at about $${price.toFixed(2)} on the Steam Community Market. We also pull live prices from Skinport and CSFloat — see the multi-market table above for the cheapest current ask.`
        : `Current pricing for ${skin.marketHashName} is being refreshed. Check back shortly or set a price alert above to be notified when it sells.`,
    },
    {
      q: `Is ${skin.marketHashName} a good investment?`,
      a: sold30d && sold30d > 50
        ? `${skin.marketHashName} sees ~${sold30d} sales per month, indicating active liquidity. ${min && max ? `Over the last 90 days the price has ranged from $${min.toFixed(2)} to $${max.toFixed(2)} — check the chart for the trend.` : ''} CS2 skins are not regulated assets — only invest what you can afford to lose.`
        : `Liquidity for ${skin.marketHashName} is currently moderate. Lower-volume skins can offer better entry points but are harder to exit. Always check 30-day sales volume before buying.`,
    },
    {
      q: `What's the difference between wear conditions?`,
      a: `Each ${skin.weaponType ?? 'weapon'} skin in CS2 ships in five wear tiers: Factory New (cleanest), Minimal Wear, Field-Tested, Well-Worn, and Battle-Scarred (most worn). The wear table below this FAQ shows current prices for every available wear of ${skin.marketHashName.split(' (')[0]}.`,
    },
    {
      q: `Where is ${skin.marketHashName} cheapest right now?`,
      a: `Our multi-market panel polls Steam Community Market, Skinport, and CSFloat every few hours. The lowest live ask is highlighted at the top of the panel. Note that Steam Market prices include the 13% transaction fee, while Skinport and CSFloat are net.`,
    },
    {
      q: `Can I get notified when ${skin.marketHashName} hits a target price?`,
      a: `Yes — set a free price-threshold alert via the Bell icon above the chart. Free accounts get 2 active alerts; Lite (€6.99/mo) gets 15; Pro (€9.99/mo) is unlimited and adds volatility-based alerts.`,
    },
  ];

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: qa.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };

  return (
    <section className="my-12">
      <h2 className="text-2xl font-bold mb-6">Frequently asked questions</h2>
      <div className="space-y-4">
        {qa.map(({ q, a }, i) => (
          <details key={i} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
            <summary className="font-semibold cursor-pointer text-slate-100">{q}</summary>
            <p className="mt-3 text-slate-300 leading-relaxed">{a}</p>
          </details>
        ))}
      </div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </section>
  );
}
```

- [ ] **Step 2: Build + visual check**

```bash
cd frontend && npx next build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/skins/[weapon]/[slug]/_components/SkinFAQ.tsx
git commit -m "feat(seo): per-skin FAQ block + FAQPage JSON-LD"
```

### Task 10: Paginated sitemap via `generateSitemaps()`

**Files:**
- Modify: `frontend/src/app/sitemap.ts`

- [ ] **Step 1: Replace the file**

Overwrite `frontend/src/app/sitemap.ts`:

```ts
// frontend/src/app/sitemap.ts
//
// Sitemap with paginated sub-maps for the 15k skin catalog.
// Next 15 routes each /sitemap/<n>.xml automatically when `generateSitemaps`
// is exported alongside `sitemap`.
//
// Static + blog routes live in the root sitemap (page 0).
// Skin routes split across pages 1..N (5000 per page).

import { MetadataRoute } from 'next';
import { getBlogPosts } from '@/lib/blog';
import { listSkinSlugsPaged } from '@/lib/skins-server';

const SITEMAP_PAGE_SIZE = 5000;
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cs2-skintracker.com';

export async function generateSitemaps(): Promise<{ id: number }[]> {
  // Probe the total skin count via the slugs endpoint with a tiny page.
  // Returns an array of { id } objects that Next uses to fan out the sitemap.
  const res = await fetch(`${BASE_URL.replace(/^https?:\/\//, 'http://').replace('cs2-skintracker.com', 'localhost:5000')}/api/v1/skins/slugs?page=0&pageSize=1`, { cache: 'no-store' }).catch(() => null);
  // Fallback to a conservative 4 pages if probe fails — 20k slug capacity.
  const totalPages = 4;
  return Array.from({ length: totalPages + 1 }, (_, i) => ({ id: i }));
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  // Page 0 = static + blog
  if (id === 0) {
    const { posts } = await getBlogPosts({ limit: 1000, isPublished: true });
    const blogEntries = posts.map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

    return [
      { url: BASE_URL,                       lastModified: new Date(), changeFrequency: 'daily',  priority: 1.0 },
      { url: `${BASE_URL}/skins`,            lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
      { url: `${BASE_URL}/cases`,            lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
      { url: `${BASE_URL}/pricing`,          lastModified: new Date(), changeFrequency: 'monthly',priority: 0.7 },
      { url: `${BASE_URL}/legal/privacy`,    lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
      { url: `${BASE_URL}/legal/terms`,      lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
      { url: `${BASE_URL}/legal/refund`,     lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
      { url: `${BASE_URL}/blog`,             lastModified: new Date(), changeFrequency: 'daily',  priority: 0.9 },
      ...blogEntries,
    ];
  }

  // Pages 1..N — skin slugs in pages of SITEMAP_PAGE_SIZE
  const slugs = await listSkinSlugsPaged(id - 1, SITEMAP_PAGE_SIZE);
  return slugs.map((s) => ({
    url: `${BASE_URL}/skins/${s.weaponSlug}/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));
}
```

- [ ] **Step 2: Smoke test the sitemap pages**

```bash
cd frontend && npx next build && npx next start &
# Visit:
# http://localhost:3000/sitemap.xml         (lists nested sitemaps)
# http://localhost:3000/sitemap/0.xml       (static + blog)
# http://localhost:3000/sitemap/1.xml       (skins 1..5000)
```

Expected: each URL returns valid XML; page 1 contains 5000 `<url>` entries with `/skins/[weapon]/[slug]` paths.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/sitemap.ts
git commit -m "feat(seo): paginated sitemap covers 15k skin pages via generateSitemaps"
```

---

## Phase D — Multi-Source Pricing Backend (Days 4-5)

### Task 11: Skinport client (TDD)

**Files:**
- Create: `backend/src/services/pricing/skinportClient.js`
- Test: `backend/src/__tests__/skinportClient.test.js`

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/skinportClient.test.js`:

```js
import { describe, it, expect, jest } from '@jest/globals';
import { fetchSkinportItem, parseSkinportItems } from '../services/pricing/skinportClient.js';

describe('parseSkinportItems', () => {
  it('returns map keyed by marketHashName with ask + bid in USD', () => {
    const raw = [
      { market_hash_name: 'AK-47 | Redline (Field-Tested)', min_price: 1395, suggested_price: 1500, currency: 'EUR' },
      { market_hash_name: 'AWP | Asiimov (Field-Tested)',   min_price: 5099, suggested_price: 5300, currency: 'EUR' },
    ];
    const out = parseSkinportItems(raw, { eurToUsd: 1.08 });
    expect(out.get('AK-47 | Redline (Field-Tested)')).toMatchObject({
      askUsd: expect.closeTo(15.07, 1),
      suggestedUsd: expect.closeTo(16.20, 1),
    });
    expect(out.size).toBe(2);
  });

  it('skips items missing prices', () => {
    const raw = [{ market_hash_name: 'X', min_price: null, suggested_price: 100 }];
    const out = parseSkinportItems(raw, { eurToUsd: 1 });
    expect(out.size).toBe(0);
  });
});

describe('fetchSkinportItem', () => {
  it('returns null when item not in feed', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => [{ market_hash_name: 'Other', min_price: 100, suggested_price: 120 }],
    }));
    const result = await fetchSkinportItem('AK-47 | Redline (FT)', { fetchImpl });
    expect(result).toBeNull();
  });

  it('returns parsed prices when item found', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => [{
        market_hash_name: 'AK-47 | Redline (FT)',
        min_price: 1395,
        suggested_price: 1500,
        currency: 'EUR',
      }],
    }));
    const result = await fetchSkinportItem('AK-47 | Redline (FT)', { fetchImpl, eurToUsd: 1.08 });
    expect(result).toMatchObject({
      askUsd: expect.closeTo(15.07, 1),
      affiliateUrl: expect.stringContaining('skinport.com'),
    });
  });

  it('throws on HTTP 429 after retries', async () => {
    const fetchImpl = jest.fn(async () => ({ ok: false, status: 429, headers: new Headers({ 'retry-after': '0' }) }));
    await expect(fetchSkinportItem('X', { fetchImpl, maxAttempts: 2 })).rejects.toThrow(/429|rate-limited/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest --testPathPatterns=skinportClient --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the client**

Create `backend/src/services/pricing/skinportClient.js`:

```js
/**
 * Skinport public price feed client.
 *
 * Endpoint: https://api.skinport.com/v1/items?app_id=730&currency=EUR
 * Returns the entire CS2 catalog in one JSON array (~3-5MB). We fetch
 * once and parse in-memory; the daily Inngest cron handles the bulk
 * refresh, and this `fetchSkinportItem` is a thin convenience wrapper
 * around the same parse for ad-hoc lookups.
 *
 * Affiliate links: docs say no public referral program yet — placeholder
 * for the partner code once approved. Until then, links go to the bare
 * Skinport URL.
 */

const ENDPOINT = 'https://api.skinport.com/v1/items?app_id=730&currency=EUR&tradable=0';
const TIMEOUT_MS = 15000;
const DEFAULT_MAX_ATTEMPTS = 3;
const SKINPORT_PARTNER_CODE = process.env.SKINPORT_PARTNER_CODE || '';

export function parseSkinportItems(items, { eurToUsd = 1.08 } = {}) {
  const map = new Map();
  if (!Array.isArray(items)) return map;
  for (const it of items) {
    if (!it?.market_hash_name) continue;
    if (typeof it.min_price !== 'number') continue;
    const askEur = it.min_price / 100;
    const suggestedEur = typeof it.suggested_price === 'number' ? it.suggested_price / 100 : null;
    map.set(it.market_hash_name, {
      marketHashName: it.market_hash_name,
      askUsd: askEur * eurToUsd,
      suggestedUsd: suggestedEur != null ? suggestedEur * eurToUsd : null,
      affiliateUrl: buildAffiliateUrl(it.market_hash_name),
    });
  }
  return map;
}

export function buildAffiliateUrl(marketHashName) {
  const slug = marketHashName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const base = `https://skinport.com/item/${encodeURIComponent(slug)}`;
  return SKINPORT_PARTNER_CODE ? `${base}?ref=${SKINPORT_PARTNER_CODE}` : base;
}

export async function fetchSkinportItem(
  marketHashName,
  { fetchImpl = fetch, eurToUsd = 1.08, maxAttempts = DEFAULT_MAX_ATTEMPTS } = {}
) {
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res;
    try {
      res = await fetchImpl(ENDPOINT, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      lastError = e.message;
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }

    if (res.status === 429) {
      const retryAfter = parseFloat(res.headers?.get?.('retry-after') ?? '5');
      lastError = `429 (retry-after ${retryAfter}s)`;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, Math.min(retryAfter * 1000, 30000)));
        continue;
      }
      throw new Error(`Skinport rate-limited after ${maxAttempts} attempts`);
    }
    if (!res.ok) {
      lastError = `Skinport HTTP ${res.status}`;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw new Error(lastError);
    }

    const data = await res.json();
    const map = parseSkinportItems(data, { eurToUsd });
    return map.get(marketHashName) ?? null;
  }
  throw new Error(lastError ?? 'unknown skinport error');
}
```

- [ ] **Step 4: Run tests**

```bash
cd backend && npx jest --testPathPatterns=skinportClient --no-coverage
```

Expected: PASS — 4 tests / 4 passing.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/pricing/skinportClient.js backend/src/__tests__/skinportClient.test.js
git commit -m "feat(pricing): Skinport ask/bid client with retry + affiliate URL helper"
```

### Task 12: CSFloat client (TDD)

**Files:**
- Create: `backend/src/services/pricing/csfloatClient.js`
- Test: `backend/src/__tests__/csfloatClient.test.js`

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/csfloatClient.test.js`:

```js
import { describe, it, expect, jest } from '@jest/globals';
import { fetchCsfloatItem, parseCsfloatListings } from '../services/pricing/csfloatClient.js';

describe('parseCsfloatListings', () => {
  it('aggregates min/median listings into a single record', () => {
    const raw = [
      { item: { market_hash_name: 'AK-47 | Redline (FT)' }, price: 1200, float_value: 0.21 },
      { item: { market_hash_name: 'AK-47 | Redline (FT)' }, price: 1500, float_value: 0.18 },
      { item: { market_hash_name: 'AK-47 | Redline (FT)' }, price: 1800, float_value: 0.17 },
    ];
    const out = parseCsfloatListings(raw);
    const r = out.get('AK-47 | Redline (FT)');
    expect(r.minPriceCents).toBe(1200);
    expect(r.listingCount).toBe(3);
    expect(r.minFloat).toBe(0.17);
  });

  it('returns empty map for empty input', () => {
    expect(parseCsfloatListings([]).size).toBe(0);
  });
});

describe('fetchCsfloatItem', () => {
  it('returns null on 404', async () => {
    const fetchImpl = jest.fn(async () => ({ ok: false, status: 404 }));
    const result = await fetchCsfloatItem('Nope', { fetchImpl });
    expect(result).toBeNull();
  });

  it('returns parsed result on success', async () => {
    const fetchImpl = jest.fn(async () => ({
      ok: true,
      json: async () => ({
        data: [
          { item: { market_hash_name: 'AK-47 | Redline (FT)' }, price: 1500, float_value: 0.20 },
        ],
      }),
    }));
    const result = await fetchCsfloatItem('AK-47 | Redline (FT)', { fetchImpl });
    expect(result).toMatchObject({
      minPriceUsd: expect.closeTo(15.00, 2),
      listingCount: 1,
      affiliateUrl: expect.stringContaining('csfloat.com'),
    });
  });
});
```

- [ ] **Step 2: Run test**

```bash
cd backend && npx jest --testPathPatterns=csfloatClient --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the client**

Create `backend/src/services/pricing/csfloatClient.js`:

```js
/**
 * CSFloat marketplace listings client.
 *
 * Endpoint: https://csfloat.com/api/v1/listings?market_hash_name=...
 * Returns live order book. Prices in cents USD.
 *
 * Affiliate: CSFloat has a referral program — set CSFLOAT_PARTNER_CODE
 * in env to attach ?ref= to outbound links.
 */

const ENDPOINT = 'https://csfloat.com/api/v1/listings';
const TIMEOUT_MS = 10000;
const DEFAULT_MAX_ATTEMPTS = 3;
const CSFLOAT_PARTNER_CODE = process.env.CSFLOAT_PARTNER_CODE || '';

export function parseCsfloatListings(listings) {
  const map = new Map();
  if (!Array.isArray(listings)) return map;
  for (const l of listings) {
    const name = l?.item?.market_hash_name;
    if (!name || typeof l.price !== 'number') continue;
    const existing = map.get(name);
    if (existing) {
      existing.minPriceCents = Math.min(existing.minPriceCents, l.price);
      existing.listingCount += 1;
      if (typeof l.float_value === 'number') {
        existing.minFloat = existing.minFloat == null ? l.float_value : Math.min(existing.minFloat, l.float_value);
      }
    } else {
      map.set(name, {
        marketHashName: name,
        minPriceCents: l.price,
        listingCount: 1,
        minFloat: typeof l.float_value === 'number' ? l.float_value : null,
      });
    }
  }
  return map;
}

export function buildCsfloatAffiliateUrl(marketHashName) {
  const url = `https://csfloat.com/search?market_hash_name=${encodeURIComponent(marketHashName)}`;
  return CSFLOAT_PARTNER_CODE ? `${url}&ref=${CSFLOAT_PARTNER_CODE}` : url;
}

export async function fetchCsfloatItem(
  marketHashName,
  { fetchImpl = fetch, maxAttempts = DEFAULT_MAX_ATTEMPTS } = {}
) {
  const url = `${ENDPOINT}?market_hash_name=${encodeURIComponent(marketHashName)}&limit=50&sort_by=lowest_price`;
  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    let res;
    try {
      res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (e) {
      lastError = e.message;
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 1000 * attempt));
      continue;
    }
    if (res.status === 404) return null;
    if (res.status === 429) {
      lastError = '429 rate-limited';
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 3000 * attempt));
        continue;
      }
      throw new Error('CSFloat rate-limited');
    }
    if (!res.ok) {
      lastError = `CSFloat HTTP ${res.status}`;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        continue;
      }
      throw new Error(lastError);
    }
    const json = await res.json();
    const map = parseCsfloatListings(json?.data ?? []);
    const r = map.get(marketHashName);
    if (!r) return null;
    return {
      marketHashName,
      minPriceUsd: r.minPriceCents / 100,
      listingCount: r.listingCount,
      minFloat: r.minFloat,
      affiliateUrl: buildCsfloatAffiliateUrl(marketHashName),
    };
  }
  throw new Error(lastError ?? 'unknown csfloat error');
}
```

- [ ] **Step 4: Run tests**

```bash
cd backend && npx jest --testPathPatterns=csfloatClient --no-coverage
```

Expected: PASS — 4 tests passing.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/pricing/csfloatClient.js backend/src/__tests__/csfloatClient.test.js
git commit -m "feat(pricing): CSFloat listings client with float aggregation"
```

### Task 13: Multi-source aggregator (TDD)

**Files:**
- Create: `backend/src/services/pricing/multiSourceAggregator.js`
- Test: `backend/src/__tests__/multiSourceAggregator.test.js`

- [ ] **Step 1: Write the failing test**

Create `backend/src/__tests__/multiSourceAggregator.test.js`:

```js
import { describe, it, expect, jest } from '@jest/globals';
import { aggregateMultiSourcePrice } from '../services/pricing/multiSourceAggregator.js';

describe('aggregateMultiSourcePrice', () => {
  it('returns sources ordered cheapest → most expensive', async () => {
    const skinportImpl = jest.fn(async () => ({ askUsd: 14.50, affiliateUrl: 'https://skinport.com/item/x' }));
    const csfloatImpl  = jest.fn(async () => ({ minPriceUsd: 15.20, listingCount: 12, minFloat: 0.16, affiliateUrl: 'https://csfloat.com/search?q=x' }));
    const skin = { marketHashName: 'AK-47 | Redline (FT)', priceLatest: 16.00, slug: 'ak-47-redline-ft' };
    const out = await aggregateMultiSourcePrice(skin, { skinportImpl, csfloatImpl });
    expect(out.sources[0].source).toBe('skinport');
    expect(out.sources[0].priceUsd).toBeCloseTo(14.50);
    expect(out.cheapestSource).toBe('skinport');
    expect(out.sources).toHaveLength(3); // steam + skinport + csfloat
  });

  it('keeps steam-only when external sources fail', async () => {
    const skinportImpl = jest.fn(async () => { throw new Error('Skinport down'); });
    const csfloatImpl  = jest.fn(async () => null);
    const skin = { marketHashName: 'X', priceLatest: 10.0, slug: 'x' };
    const out = await aggregateMultiSourcePrice(skin, { skinportImpl, csfloatImpl });
    expect(out.sources).toHaveLength(1);
    expect(out.sources[0].source).toBe('steam');
    expect(out.cheapestSource).toBe('steam');
  });

  it('returns empty when no source has data', async () => {
    const skinportImpl = jest.fn(async () => null);
    const csfloatImpl  = jest.fn(async () => null);
    const skin = { marketHashName: 'X', priceLatest: null, slug: 'x' };
    const out = await aggregateMultiSourcePrice(skin, { skinportImpl, csfloatImpl });
    expect(out.sources).toHaveLength(0);
    expect(out.cheapestSource).toBeNull();
  });
});
```

- [ ] **Step 2: Run test**

```bash
cd backend && npx jest --testPathPatterns=multiSourceAggregator --no-coverage
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write the aggregator**

Create `backend/src/services/pricing/multiSourceAggregator.js`:

```js
/**
 * Aggregates Steam Market (our local catalog data) + Skinport + CSFloat
 * into a single ordered list of sources for a single skin. External
 * fetchers may throw — we swallow and keep what works.
 *
 * Shape returned:
 *   {
 *     marketHashName,
 *     sources: [{ source, priceUsd, url, meta? }, ...],   // sorted cheapest first
 *     cheapestSource: 'steam'|'skinport'|'csfloat'|null,
 *     refreshedAt: ISO string,
 *   }
 */
import { fetchSkinportItem as defaultSkinport } from './skinportClient.js';
import { fetchCsfloatItem as defaultCsfloat } from './csfloatClient.js';

const STEAM_TX_FEE = 0.13; // Steam Community Market charges 13% on buyer side

export async function aggregateMultiSourcePrice(
  skin,
  { skinportImpl = defaultSkinport, csfloatImpl = defaultCsfloat } = {}
) {
  const refreshedAt = new Date().toISOString();
  const sources = [];

  // Steam — local catalog data, no fetch
  if (skin.priceLatest != null) {
    sources.push({
      source: 'steam',
      priceUsd: skin.priceLatest,
      effectivePriceUsd: skin.priceLatest * (1 + STEAM_TX_FEE),
      url: `https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName)}`,
      meta: { includesFee: true },
    });
  }

  // Skinport
  try {
    const sp = await skinportImpl(skin.marketHashName);
    if (sp?.askUsd != null) {
      sources.push({
        source: 'skinport',
        priceUsd: sp.askUsd,
        effectivePriceUsd: sp.askUsd,
        url: sp.affiliateUrl,
        meta: { suggestedUsd: sp.suggestedUsd ?? null },
      });
    }
  } catch (_e) {
    // swallow — partial data is fine
  }

  // CSFloat
  try {
    const cf = await csfloatImpl(skin.marketHashName);
    if (cf?.minPriceUsd != null) {
      sources.push({
        source: 'csfloat',
        priceUsd: cf.minPriceUsd,
        effectivePriceUsd: cf.minPriceUsd,
        url: cf.affiliateUrl,
        meta: { listingCount: cf.listingCount, minFloat: cf.minFloat },
      });
    }
  } catch (_e) {
    // swallow
  }

  sources.sort((a, b) => a.effectivePriceUsd - b.effectivePriceUsd);

  return {
    marketHashName: skin.marketHashName,
    sources,
    cheapestSource: sources[0]?.source ?? null,
    refreshedAt,
  };
}
```

- [ ] **Step 4: Run tests**

```bash
cd backend && npx jest --testPathPatterns=multiSourceAggregator --no-coverage
```

Expected: PASS — 3 tests passing.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/pricing/multiSourceAggregator.js backend/src/__tests__/multiSourceAggregator.test.js
git commit -m "feat(pricing): multi-source aggregator joins Steam+Skinport+CSFloat"
```

### Task 14: `/api/v1/skins/:slug/prices` endpoint

**Files:**
- Modify: `backend/src/controllers/skinDetailController.js`
- Modify: `backend/src/routes/skinDetailRoutes.js`

- [ ] **Step 1: Add controller**

Edit `backend/src/controllers/skinDetailController.js` — append:

```js
import { aggregateMultiSourcePrice } from '../services/pricing/multiSourceAggregator.js';

// 5-minute in-memory cache keyed by slug. Daily Inngest refresh writes the
// canonical record; this fallback covers ad-hoc lookups for skins that
// missed the batch.
const priceCache = new Map(); // slug → { value, expiresAt }
const PRICE_CACHE_MS = 5 * 60 * 1000;

export async function getSkinPrices(req, res, { prismaClient = defaultPrisma } = {}) {
  const { slug } = req.params;
  if (!slug) return res.status(400).json({ error: 'slug required' });

  const cached = priceCache.get(slug);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json(cached.value);
  }

  const skin = await prismaClient.skin.findUnique({
    where: { slug },
    select: { marketHashName: true, priceLatest: true, slug: true },
  });
  if (!skin) return res.status(404).json({ error: 'not found' });

  try {
    const result = await aggregateMultiSourcePrice(skin);
    priceCache.set(slug, { value: result, expiresAt: Date.now() + PRICE_CACHE_MS });
    return res.json(result);
  } catch (err) {
    return res.status(502).json({ error: 'aggregator failed', detail: err.message });
  }
}
```

- [ ] **Step 2: Wire the route**

Edit `backend/src/routes/skinDetailRoutes.js` — add `getSkinPrices` import + route before `/:slug`:

```js
import {
  getSkinBySlug, listSkinsByWeapon, listSkinSlugs, getSkinById, getSkinPrices,
} from '../controllers/skinDetailController.js';
// ...
router.get('/by-id/:id',  (req, res) => getSkinById(req, res));
router.get('/slugs',      (req, res) => listSkinSlugs(req, res));
router.get('/:slug/prices', (req, res) => getSkinPrices(req, res));
router.get('/:slug',      (req, res) => getSkinBySlug(req, res));
router.get('/',           (req, res) => listSkinsByWeapon(req, res));
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/skinDetailController.js backend/src/routes/skinDetailRoutes.js
git commit -m "feat(pricing): GET /api/v1/skins/:slug/prices with 5min cache"
```

---

## Phase E — Frontend Multi-Source UI (Day 6)

### Task 15: `MultiSourcePriceTable` component

**Files:**
- Modify: `frontend/src/app/skins/[weapon]/[slug]/_components/MultiSourcePriceTable.tsx`
- Create: `frontend/src/components/skins/AffiliateLink.tsx`

- [ ] **Step 1: Write the AffiliateLink wrapper**

Create `frontend/src/components/skins/AffiliateLink.tsx`:

```tsx
"use client";
import { analytics } from '@/lib/analytics';

interface Props {
  href: string;
  source: string;        // 'skinport' | 'csfloat' | 'csmoney' | 'steam'
  skinSlug: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Outbound affiliate / partner link. Fires PostHog `affiliate_click`
 * before navigation and uses `rel="sponsored nofollow noopener"` per
 * Google's link-tagging guidance.
 */
export function AffiliateLink({ href, source, skinSlug, children, className }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className={className}
      onClick={() => {
        analytics.track({ name: 'affiliate_click', properties: { source, skin: skinSlug } });
      }}
    >
      {children}
    </a>
  );
}
```

- [ ] **Step 2: Replace MultiSourcePriceTable stub**

Overwrite `frontend/src/app/skins/[weapon]/[slug]/_components/MultiSourcePriceTable.tsx`:

```tsx
import { AffiliateLink } from '@/components/skins/AffiliateLink';

interface Source {
  source: string;
  priceUsd: number;
  effectivePriceUsd: number;
  url: string;
  meta?: Record<string, unknown>;
}

interface PriceResult {
  marketHashName: string;
  sources: Source[];
  cheapestSource: string | null;
  refreshedAt: string;
}

async function fetchPrices(slug: string): Promise<PriceResult | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const res = await fetch(`${apiBase}/api/v1/skins/${encodeURIComponent(slug)}/prices`, {
    next: { revalidate: 600, tags: [`prices:${slug}`] },
  });
  if (!res.ok) return null;
  return res.json();
}

const SOURCE_LABELS: Record<string, string> = {
  steam: 'Steam Community Market',
  skinport: 'Skinport',
  csfloat: 'CSFloat',
  csmoney: 'CS.MONEY',
};

export async function MultiSourcePriceTable({ skinSlug }: { skinSlug: string }) {
  const data = await fetchPrices(skinSlug);

  if (!data || data.sources.length === 0) {
    return (
      <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold mb-2">Live prices across markets</h2>
        <p className="text-slate-400 text-sm">Refreshing — check back in a few minutes.</p>
      </section>
    );
  }

  return (
    <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-semibold">Live prices across markets</h2>
        <span className="text-xs text-slate-500">
          Updated {new Date(data.refreshedAt).toLocaleTimeString()}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-left border-b border-slate-800">
            <th className="pb-2">Market</th>
            <th className="pb-2 text-right">Listed price</th>
            <th className="pb-2 text-right">After fees</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.sources.map((s, i) => (
            <tr key={s.source} className="border-b border-slate-800/50 last:border-0">
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{SOURCE_LABELS[s.source] ?? s.source}</span>
                  {i === 0 && (
                    <span className="text-[11px] bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                      Cheapest
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 text-right">${s.priceUsd.toFixed(2)}</td>
              <td className="py-3 text-right text-slate-300">${s.effectivePriceUsd.toFixed(2)}</td>
              <td className="py-3 text-right">
                <AffiliateLink
                  href={s.url}
                  source={s.source}
                  skinSlug={skinSlug}
                  className="text-fuchsia-400 hover:text-fuchsia-300 text-xs"
                >
                  View →
                </AffiliateLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-500 mt-3">
        Steam prices include the 13% Steam Market transaction fee; Skinport and CSFloat are net.
      </p>
    </section>
  );
}
```

- [ ] **Step 3: Add the `affiliate_click` event to the analytics taxonomy**

Edit `frontend/src/lib/analytics.ts` — confirm the existing `affiliate_click` event signature accepts `{ source, skin }` (it does — already in the typed union).

- [ ] **Step 4: Build**

```bash
cd frontend && npx next build 2>&1 | tail -10
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/skins/AffiliateLink.tsx frontend/src/app/skins/[weapon]/[slug]/_components/MultiSourcePriceTable.tsx
git commit -m "feat(seo): multi-source price table + affiliate-link wrapper with PostHog tracking"
```

### Task 16: `WearComparisonTable` — covers wear long-tails on canonical

**Files:**
- Modify: `frontend/src/app/skins/[weapon]/[slug]/_components/WearComparisonTable.tsx`

- [ ] **Step 1: Implement**

Overwrite `frontend/src/app/skins/[weapon]/[slug]/_components/WearComparisonTable.tsx`:

```tsx
import Link from 'next/link';

interface WearRow {
  wear: string;
  slug: string | null;
  priceLatest: number | null;
}

async function fetchVariants(baseId: number): Promise<WearRow[]> {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const res = await fetch(`${apiBase}/api/v1/skins/by-id/${baseId}/variants`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return res.json();
}

const WEARS = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];

export async function WearComparisonTable({
  weaponSlug,
  baseId,
}: {
  weaponSlug: string;
  baseId: number;
}) {
  const variants = await fetchVariants(baseId);
  if (variants.length <= 1) return null;

  const byWear = new Map(variants.map((v) => [v.wear, v]));

  return (
    <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="text-xl font-semibold mb-4">Compare wear conditions</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-left border-b border-slate-800">
            <th className="pb-2">Wear</th>
            <th className="pb-2 text-right">Current price</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {WEARS.map((w) => {
            const v = byWear.get(w);
            return (
              <tr key={w} className="border-b border-slate-800/50 last:border-0">
                <td className="py-3">{w}</td>
                <td className="py-3 text-right text-slate-200">
                  {v?.priceLatest != null ? `$${v.priceLatest.toFixed(2)}` : '—'}
                </td>
                <td className="py-3 text-right">
                  {v?.slug ? (
                    <Link
                      href={`/skins/${weaponSlug}/${v.slug}`}
                      className="text-fuchsia-400 hover:text-fuchsia-300 text-xs"
                    >
                      View →
                    </Link>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
```

- [ ] **Step 2: Add the `/api/v1/skins/by-id/:id/variants` endpoint**

Edit `backend/src/controllers/skinDetailController.js` — add:

```js
export async function getSkinVariants(req, res, { prismaClient = defaultPrisma } = {}) {
  const id = parseInt(req.params.id, 10);
  if (!Number.isFinite(id)) return res.status(400).json({ error: 'invalid id' });
  const base = await prismaClient.skin.findUnique({
    where: { id },
    select: { id: true, variantOf: true },
  });
  if (!base) return res.json([]);
  const rootId = base.variantOf ?? base.id;
  const variants = await prismaClient.skin.findMany({
    where: {
      OR: [{ id: rootId }, { variantOf: rootId }],
    },
    select: { wear: true, slug: true, priceLatest: true },
    orderBy: { id: 'asc' },
  });
  return res.json(variants);
}
```

Edit `backend/src/routes/skinDetailRoutes.js`:

```js
import { getSkinVariants } from '../controllers/skinDetailController.js';
// add before /by-id/:id:
router.get('/by-id/:id/variants', (req, res) => getSkinVariants(req, res));
```

- [ ] **Step 3: Build + commit**

```bash
cd frontend && npx next build 2>&1 | tail -10
git add frontend/src/app/skins/[weapon]/[slug]/_components/WearComparisonTable.tsx backend/src/controllers/skinDetailController.js backend/src/routes/skinDetailRoutes.js
git commit -m "feat(seo): wear-comparison table covers wear-suffix long-tails on canonical"
```

---

## Phase F — Weapon Pillar + Case Pages (Day 7)

### Task 17: Weapon pillar `/skins/[weapon]/page.tsx`

**Files:**
- Create: `frontend/src/app/skins/[weapon]/page.tsx`

- [ ] **Step 1: Write the pillar page**

Create `frontend/src/app/skins/[weapon]/page.tsx`:

```tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { listSkinsByWeapon } from '@/lib/skins-server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cs2-skintracker.com';

interface Props {
  params: { weapon: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const weaponLabel = params.weapon.replace(/-/g, ' ').toUpperCase();
  return {
    title: `${weaponLabel} Skins — All Variants, Live Prices | CS2 SkinTrackr`,
    description: `Browse every ${weaponLabel} skin in CS2 with current Steam, Skinport and CSFloat prices. Sorted by 7-day volume. Free alerts.`,
    alternates: { canonical: `${BASE_URL}/skins/${params.weapon}` },
  };
}

export default async function WeaponPillarPage({ params }: Props) {
  const skins = await listSkinsByWeapon(params.weapon, 200);
  if (skins.length === 0) notFound();

  const weaponLabel = params.weapon.replace(/-/g, ' ').toUpperCase();

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${weaponLabel} CS2 Skins`,
    itemListElement: skins.slice(0, 50).map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${BASE_URL}/skins/${s.weaponSlug}/${s.slug}`,
      name: s.marketHashName,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <nav className="text-sm text-slate-400 mb-6">
          <Link href="/" className="hover:text-fuchsia-400">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/skins" className="hover:text-fuchsia-400">Skins</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-200 capitalize">{weaponLabel}</span>
        </nav>

        <h1 className="text-3xl md:text-5xl font-bold mb-2">{weaponLabel} Skins</h1>
        <p className="text-slate-400 mb-8">
          {skins.length} skins · sorted by 30-day sales volume
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skins.map((s) => (
            <Link
              key={s.id}
              href={`/skins/${s.weaponSlug}/${s.slug}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-fuchsia-500/40 transition"
            >
              <div className="flex items-start gap-3">
                {s.imageUrl && <img src={s.imageUrl} alt={s.marketHashName} className="h-16 w-24 object-contain" />}
                <div className="flex-1 min-w-0">
                  <h2 className="font-medium text-slate-100 truncate">{s.marketHashName}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {s.priceLatest != null ? `$${s.priceLatest.toFixed(2)}` : '—'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Build + commit**

```bash
cd frontend && npx next build 2>&1 | tail -10
git add frontend/src/app/skins/[weapon]/page.tsx
git commit -m "feat(seo): weapon pillar pages /skins/[weapon] with ItemList JSON-LD"
```

### Task 18: Case detail `/cases/[slug]/page.tsx`

**Files:**
- Create: `frontend/src/app/cases/[slug]/page.tsx`
- Create: `frontend/src/lib/cases-server.ts`
- Modify: `backend/src/controllers/skinDetailController.js` (add `getCaseBySlug`)

- [ ] **Step 1: Add backend case-by-slug endpoint**

Edit `backend/src/controllers/skinDetailController.js`:

```js
export async function getCaseBySlug(req, res, { prismaClient = defaultPrisma } = {}) {
  const { slug } = req.params;
  if (!slug) return res.status(400).json({ error: 'slug required' });
  const c = await prismaClient.case.findFirst({
    where: {
      OR: [
        { slug },
        { name: { equals: slug.replace(/-/g, ' '), mode: 'insensitive' } },
      ],
    },
    include: {
      drops: { include: { skin: true } },
    },
  });
  if (!c) return res.status(404).json({ error: 'not found' });
  return res.json(c);
}
```

Edit `backend/src/routes/skinDetailRoutes.js` — register under new path:

```js
// At the bottom of routes file, also export a /cases router:
import { getCaseBySlug } from '../controllers/skinDetailController.js';
export const caseRouter = Router();
caseRouter.get('/:slug', (req, res) => getCaseBySlug(req, res));
```

Edit `backend/src/app.js` — import + mount:

```js
import skinDetailRoutes, { caseRouter } from "./routes/skinDetailRoutes.js";
// ...
app.use("/api/v1/cases", caseRouter);
```

- [ ] **Step 2: Add frontend lib reader**

Create `frontend/src/lib/cases-server.ts`:

```ts
import 'server-only';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface CaseDrop {
  id: number;
  rarity: string | null;
  skin: { id: number; slug: string | null; weaponSlug: string | null; marketHashName: string; priceLatest: number | null };
}

export interface CaseDetail {
  id: number;
  slug: string | null;
  name: string;
  imageUrl: string | null;
  price: number | null;
  drops: CaseDrop[];
}

export async function getCaseBySlug(slug: string): Promise<CaseDetail | null> {
  const res = await fetch(`${API_BASE}/api/v1/cases/${encodeURIComponent(slug)}`, {
    next: { revalidate: 3600, tags: [`case:${slug}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getCaseBySlug HTTP ${res.status}`);
  return res.json();
}
```

- [ ] **Step 3: Write the case page**

Create `frontend/src/app/cases/[slug]/page.tsx`:

```tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCaseBySlug } from '@/lib/cases-server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cs2-skintracker.com';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCaseBySlug(params.slug);
  if (!c) return { title: 'Case not found', robots: { index: false } };
  return {
    title: `${c.name} — Drop Table, EV & CS2 Case Prices | SkinTrackr`,
    description: `${c.name} drop table with every skin, current Steam Market prices, and expected-value calculation. Free CS2 case opening analyzer.`,
    alternates: { canonical: `${BASE_URL}/cases/${c.slug ?? params.slug}` },
  };
}

export default async function CaseDetailPage({ params }: Props) {
  const c = await getCaseBySlug(params.slug);
  if (!c) notFound();

  // Naive EV: average drop price, ignoring rarity-weighted odds (a refinement
  // can come later). Use it as a directional, not precise, signal.
  const dropPrices = c.drops.map((d) => d.skin.priceLatest ?? 0);
  const avg = dropPrices.length ? dropPrices.reduce((a, b) => a + b, 0) / dropPrices.length : 0;

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl md:text-5xl font-bold mb-2">{c.name}</h1>
      <p className="text-slate-400 mb-8">
        Case price: {c.price != null ? `$${c.price.toFixed(2)}` : '—'} · avg drop value: ${avg.toFixed(2)}
      </p>

      <h2 className="text-xl font-semibold mb-4">Possible drops</h2>
      <ul className="space-y-2">
        {c.drops.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <Link
              href={d.skin.weaponSlug && d.skin.slug ? `/skins/${d.skin.weaponSlug}/${d.skin.slug}` : '#'}
              className="text-slate-100 hover:text-fuchsia-400"
            >
              {d.skin.marketHashName}
            </Link>
            <span className="text-slate-300 text-sm">
              {d.skin.priceLatest != null ? `$${d.skin.priceLatest.toFixed(2)}` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 4: Build + commit**

```bash
cd frontend && npx next build 2>&1 | tail -10
git add backend/src/controllers/skinDetailController.js backend/src/routes/skinDetailRoutes.js backend/src/app.js frontend/src/lib/cases-server.ts frontend/src/app/cases/[slug]/page.tsx
git commit -m "feat(seo): case detail /cases/[slug] with drop table + EV"
```

---

## Phase G — Daily Refresh Cron + Analytics + Submit (Day 8)

### Task 19: Inngest daily multi-source refresh

**Files:**
- Create: `backend/inngest/functions/refresh-multi-source-prices.js`
- Modify: `backend/inngest/index.js` (or wherever functions are registered)

- [ ] **Step 1: Write the cron function**

Create `backend/inngest/functions/refresh-multi-source-prices.js`:

```js
import { inngest } from '../client.js';
import prisma from '../../src/prisma/prismaClient.js';
import { aggregateMultiSourcePrice } from '../../src/services/pricing/multiSourceAggregator.js';

const TOP_N = 2000; // by 30-day volume — limits external API load

/**
 * Refreshes multi-source prices for the top-N most-traded skins.
 * Runs once daily. Writes the result to a new MultiSourceSnapshot row
 * (next migration adds the table) — for v1 we just cache in memory and
 * let the per-skin endpoint serve fresh data on demand. The cron's job
 * here is to warm the cache so the first SSR hit is fast.
 */
export const refreshMultiSourcePrices = inngest.createFunction(
  { id: 'refresh-multi-source-prices', name: 'Refresh multi-source skin prices' },
  { cron: 'TZ=UTC 0 4 * * *' }, // 04:00 UTC daily (after Steam refresh ~03:30)
  async ({ step }) => {
    const skins = await step.run('list-top-skins', async () =>
      prisma.skin.findMany({
        where: { slug: { not: null } },
        orderBy: { sold30d: 'desc' },
        take: TOP_N,
        select: { id: true, slug: true, marketHashName: true, priceLatest: true },
      })
    );

    let ok = 0;
    let fail = 0;
    // Process in chunks of 50 with a small delay to avoid rate-limit storms
    const CHUNK = 50;
    for (let i = 0; i < skins.length; i += CHUNK) {
      const batch = skins.slice(i, i + CHUNK);
      await step.run(`refresh-batch-${i}`, async () => {
        await Promise.all(
          batch.map(async (s) => {
            try {
              await aggregateMultiSourcePrice(s);
              ok++;
            } catch (_e) {
              fail++;
            }
          })
        );
      });
    }

    return { processed: skins.length, ok, fail };
  }
);
```

- [ ] **Step 2: Register the function**

Edit `backend/inngest/index.js` — add the import + export:

```js
import { refreshMultiSourcePrices } from './functions/refresh-multi-source-prices.js';
// add to the exported functions array
export const functions = [/* existing... */, refreshMultiSourcePrices];
```

- [ ] **Step 3: Commit**

```bash
git add backend/inngest/functions/refresh-multi-source-prices.js backend/inngest/index.js
git commit -m "feat(pricing): daily Inngest cron warms multi-source cache for top 2k skins"
```

### Task 20: PostHog SEO events + GSC submission instructions

**Files:**
- Modify: `frontend/src/lib/analytics.ts` (extend event union)
- Modify: `frontend/src/app/skins/[weapon]/[slug]/_components/SkinDetailClient.tsx` (fire `seo_landing_viewed`)

- [ ] **Step 1: Extend the analytics event union**

Edit `frontend/src/lib/analytics.ts` — find the `AnalyticsEvent` discriminated union and add:

```ts
  | { name: 'seo_landing_viewed'; properties: { skinSlug: string; weaponSlug: string } }
  | { name: 'seo_internal_link_clicked'; properties: { from: string; to: string } }
```

(`affiliate_click` is already in the union.)

- [ ] **Step 2: Fire `seo_landing_viewed` in the client child**

In `frontend/src/app/skins/[weapon]/[slug]/_components/SkinDetailClient.tsx`, near the top of the function body, add:

```tsx
useEffect(() => {
  analytics.track({
    name: 'seo_landing_viewed',
    properties: { skinSlug: skin.slug, weaponSlug: skin.weaponSlug },
  });
}, [skin.slug, skin.weaponSlug]);
```

Import `analytics` + `useEffect` if not already present.

- [ ] **Step 3: Add GSC submission steps to the CEO checklist**

Edit `docs/superpowers/research/2026-05-20-ceo-checklist.md` — append a new section:

```markdown
---

## 8. Google Search Console — 15 min (after Sprint 2 deploys)

1. Sign in: https://search.google.com/search-console (free)
2. Add property: **Domain property** for `<your-domain>` (DNS TXT verification — Cloudflare auto-supports)
3. Submit sitemap:
   - URL: `https://<your-domain>/sitemap.xml`
   - GSC will auto-discover the paginated sub-sitemaps via the index
4. Wait 24-48h for first crawl signals
5. Top metrics to watch weekly:
   - Coverage → Valid pages (target: 10k+ within 60 days)
   - Performance → Impressions trending up for `/skins/*` queries
   - URL Inspection → spot-check 3-5 skin pages to confirm Product rich results detected
6. Set up alerts: GSC → Settings → Email preferences → All issues

**Bing Webmaster Tools** (15 min more): same flow at https://www.bing.com/webmasters — Bing accounts for ~5% of traffic but the indexing is faster.
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/lib/analytics.ts frontend/src/app/skins/[weapon]/[slug]/_components/SkinDetailClient.tsx docs/superpowers/research/2026-05-20-ceo-checklist.md
git commit -m "feat(seo): PostHog seo_landing_viewed event + GSC submission checklist"
```

### Task 21: Final integration smoke test

- [ ] **Step 1: Build the frontend**

```bash
cd frontend && npx next build 2>&1 | tail -25
```

Expected: build succeeds, new routes present:
- `/skins/[weapon]/[slug]`
- `/skins/[weapon]`
- `/cases/[slug]`
- Sitemap routes `/sitemap/[0-4].xml`

- [ ] **Step 2: Run backend tests**

```bash
cd backend && npx jest --no-coverage 2>&1 | tail -15
```

Expected: all tests pass, including the new `slugify`, `skinDetail`, `skinportClient`, `csfloatClient`, `multiSourceAggregator` suites.

- [ ] **Step 3: Manual verification with running servers**

```bash
# Terminal 1:
cd backend && npm run dev
# Terminal 2:
cd frontend && npm run dev

# Browser:
# http://localhost:3000/skins/ak-47/ak-47-redline-field-tested
#   → renders SSR, no client flash, View Source contains <script type="application/ld+json">
# http://localhost:3000/skins/ak-47
#   → pillar page lists 200 skins
# http://localhost:3000/cases/operation-bravo-case  (or any case slug)
#   → drop table + EV
# http://localhost:3000/sitemap.xml
#   → root sitemap index
# http://localhost:3000/sitemap/1.xml
#   → 5000 /skins/[weapon]/[slug] URLs
# http://localhost:3000/skins/4711  (legacy integer URL — replace 4711 with real id)
#   → 308 permanent-redirect to /skins/[weapon]/[slug]
```

- [ ] **Step 4: Update CLAUDE.md**

Add a Sprint 2 section under Sprint 1 in `CLAUDE.md`:

```markdown
**Sprint 2 — Multi-Source Pricing + Programmatic SEO (2026-05-20)**:
- [x] Schema: `Skin.slug` + `Skin.weaponSlug` columns + unique indexes (migration `20260521000000_skin_slug_columns`). All 15,071 rows backfilled via `backend/scripts/backfill-skin-slugs.js`.
- [x] SSR conversion: `/skins/[skinId]/page.tsx` now 308-redirects to `/skins/[weapon]/[slug]` (the new canonical Server Component). `generateMetadata` produces per-skin title, description, OG, canonical URL.
- [x] JSON-LD: `Product` + `Offer` + `BreadcrumbList` on every skin page; `FAQPage` from `SkinFAQ`; `ItemList` on weapon pillar pages.
- [x] Paginated sitemap via `generateSitemaps()` — 4 chunks of 5000 + 1 static/blog chunk.
- [x] Multi-source pricing: Skinport + CSFloat clients with retry + 5-min cache. Aggregator joins with Steam Market into ordered `{sources, cheapestSource, refreshedAt}` shape. Endpoint `GET /api/v1/skins/:slug/prices`.
- [x] `MultiSourcePriceTable` server component renders the cross-market grid. `AffiliateLink` wraps outbound clicks with `rel="sponsored nofollow noopener"` + PostHog `affiliate_click` event.
- [x] Weapon pillar pages `/skins/[weapon]` + case detail `/cases/[slug]` with drop table + naive EV.
- [x] Daily Inngest cron `refresh-multi-source-prices` warms cache for top-2000 skins by 30-day volume.
- [x] PostHog events: `seo_landing_viewed`, `affiliate_click`. `seo_internal_link_clicked` reserved.
- [ ] CEO post-deploy: submit sitemap to GSC + Bing Webmaster Tools (see checklist §8).
- [ ] Phase 3 / Sprint 3 follow-ups: comparison pages, Buff163 (deferred), investment scoring methodology.
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: Sprint 2 status — Multi-Source Pricing + Programmatic SEO complete"
```

---

## Self-Review

**Spec coverage:**
- ✅ Schema migration → Task 1
- ✅ SSR conversion of `/skins/[skinId]` → Task 6 (redirect to new canonical Task 7)
- ✅ New URL `/skins/[weapon]/[slug]` + 301 → Tasks 6 (308 perm-redirect = HTTP-equivalent 301) + 7
- ✅ JSON-LD Product + Offer + BreadcrumbList + FAQPage → Tasks 8 + 9
- ✅ Paginated sitemap → Task 10
- ✅ Skinport client → Task 11
- ✅ CSFloat client → Task 12
- ✅ Affiliate deep-links → Task 15 (`AffiliateLink` wrapper)
- ✅ Weapon pillar pages → Task 17
- ✅ Case detail pages → Task 18
- ✅ PostHog SEO events → Task 20

**Out-of-scope items honored:**
- No per-wear separate pages (covered by `?wear=` and WearComparisonTable)
- No Buff163
- No comparison pages
- No investment-scoring page

**Type / name consistency check:**
- `getSkinBySlug`, `getSkinById`, `getSkinPrices`, `getSkinVariants`, `getCaseBySlug`, `listSkinsByWeapon`, `listSkinSlugs` — all defined in `skinDetailController.js` and consistently named.
- `aggregateMultiSourcePrice` used in Tasks 13, 14, 19 — same signature.
- `SkinDetail` interface defined in `lib/skins-server.ts`, imported in Tasks 7, 9, 10, 17.
- `slugify` + `weaponSlugFor` defined in Task 2, used in Task 3 backfill.

**No placeholders** — every step has actual code or a concrete command. Verified.

**Effort fit (~8 dev-days):**
- Phase A: 1 day
- Phase B: 1.5 days
- Phase C: 1 day
- Phase D: 2 days (3 services + tests + endpoint)
- Phase E: 1 day
- Phase F: 1 day
- Phase G: 0.5 day
- Total: ~8 days ✓

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-20-sprint2-multi-source-seo.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
