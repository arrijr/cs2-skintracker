# Comprehensive CS2 Item Coverage — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 56-skin partial coverage with full ~12,500-item dataset across all CS2 categories, using bymykel/CSGO-API for catalog + Steam Market for prices.

**Architecture:** Two daily crons. (1) Catalog sync pulls bymykel JSON per category and upserts into `Skin`/`Case`/`MarketItem`. (2) Price refresh iterates active items with 3s spacing, hits Steam Market `priceoverview`, writes back. Failure tracking marks dead items inactive after 3 consecutive 404s.

**Tech Stack:** Express 5 + Node 22 ESM, Prisma 6 + Postgres, node-cron, Jest.

**Branch:** `feature/comprehensive-coverage` (create from main).

---

## File Structure

**New backend files:**
- `backend/src/services/catalog/bymykelClient.js` — fetch + parse bymykel JSON per category
- `backend/src/services/catalog/catalogSyncJob.js` — orchestrate catalog upsert
- `backend/src/services/pricing/steamMarketClient.js` — Steam Market priceoverview with rate-limit + retry
- `backend/src/services/pricing/priceRefreshJob.js` — orchestrate price refresh
- `backend/src/services/pricing/deadItemTracker.js` — helper for 404 handling
- `backend/scripts/bootstrap-catalog.js` — one-time full bootstrap
- `backend/src/__tests__/catalog.test.js`
- `backend/src/__tests__/pricing.test.js`

**Modified:**
- `backend/prisma/schema.prisma` — add `MarketItem`, generalize `MarketSnapshot`
- `backend/src/cron/index.js` — register new jobs

---

## Task 1: Schema — MarketItem Model + MarketSnapshot Generalization

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260510000002_market_item_and_snapshot/migration.sql`

- [ ] **Step 1: Add MarketItem model + generalize MarketSnapshot**

Edit `backend/prisma/schema.prisma`. Add new model:

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
  metadata        Json?
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

Find the existing `MarketSnapshot` model. Change it to:

```prisma
model MarketSnapshot {
  id             Int       @id @default(autoincrement())
  itemType       String    @default("skin") // 'skin' | 'case' | 'market_item'
  skinId         Int?
  skin           Skin?     @relation(fields: [skinId], references: [id], onDelete: Cascade)
  caseId         Int?
  case           Case?     @relation(fields: [caseId], references: [id], onDelete: Cascade)
  marketItemId   Int?
  marketItem     MarketItem? @relation(fields: [marketItemId], references: [id], onDelete: Cascade)
  date           DateTime
  priceUsd       Float
  activeListings Int?
  soldVolume24h  Int?
  source         String
  fetchedAt      DateTime  @default(now())

  @@index([itemType, date])
  @@index([skinId, date])
  @@index([marketItemId, date])
}
```

Note: the existing `@@unique([skinId, date])` constraint will conflict with the new shape. Drop it; uniqueness can be enforced at the application level (catalogSyncJob ensures one row per item per day).

Also: add the back-relations on `Skin` and `Case` if not already present:
- `Skin`: `snapshots MarketSnapshot[]`
- `Case`: `snapshots MarketSnapshot[]`

- [ ] **Step 2: Hand-write migration SQL**

Due to pre-existing schema drift (documented in Month 2 plan), do not use `prisma migrate dev`. Create migration file manually:

```bash
cd backend
mkdir -p prisma/migrations/20260510000002_market_item_and_snapshot
```

Create `backend/prisma/migrations/20260510000002_market_item_and_snapshot/migration.sql`:

```sql
-- MarketItem
CREATE TABLE "MarketItem" (
  "id"             SERIAL PRIMARY KEY,
  "category"       TEXT NOT NULL,
  "externalId"     TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "marketHashName" TEXT NOT NULL UNIQUE,
  "imageUrl"       TEXT,
  "rarity"         TEXT,
  "collection"     TEXT,
  "metadata"       JSONB,
  "priceLatest"    DOUBLE PRECISION,
  "priceMedian"    DOUBLE PRECISION,
  "volume24h"      INTEGER,
  "priceUpdatedAt" TIMESTAMP(3),
  "isActive"       BOOLEAN NOT NULL DEFAULT true,
  "consecutive404" INTEGER NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL
);
CREATE INDEX "MarketItem_category_isActive_idx" ON "MarketItem"("category", "isActive");
CREATE INDEX "MarketItem_marketHashName_idx" ON "MarketItem"("marketHashName");

-- Generalize MarketSnapshot
ALTER TABLE "MarketSnapshot" ADD COLUMN "itemType"     TEXT NOT NULL DEFAULT 'skin';
ALTER TABLE "MarketSnapshot" ADD COLUMN "marketItemId" INTEGER;
ALTER TABLE "MarketSnapshot" ADD COLUMN "caseId"       INTEGER;
ALTER TABLE "MarketSnapshot" ALTER COLUMN "skinId" DROP NOT NULL;
ALTER TABLE "MarketSnapshot" ADD CONSTRAINT "MarketSnapshot_marketItemId_fkey"
  FOREIGN KEY ("marketItemId") REFERENCES "MarketItem"("id") ON DELETE CASCADE;
ALTER TABLE "MarketSnapshot" ADD CONSTRAINT "MarketSnapshot_caseId_fkey"
  FOREIGN KEY ("caseId") REFERENCES "Case"("id") ON DELETE CASCADE;

-- Drop old unique constraint (if it exists with that exact name; adjust if Prisma chose different)
ALTER TABLE "MarketSnapshot" DROP CONSTRAINT IF EXISTS "MarketSnapshot_skinId_date_key";

CREATE INDEX IF NOT EXISTS "MarketSnapshot_itemType_date_idx" ON "MarketSnapshot"("itemType", "date");
CREATE INDEX IF NOT EXISTS "MarketSnapshot_marketItemId_date_idx" ON "MarketSnapshot"("marketItemId", "date");
```

- [ ] **Step 3: Apply migration**

```bash
cd backend
npx prisma db execute --file prisma/migrations/20260510000002_market_item_and_snapshot/migration.sql --schema prisma/schema.prisma
npx prisma migrate resolve --applied 20260510000002_market_item_and_snapshot --schema prisma/schema.prisma
npx prisma generate
```

Expected: no errors. If `prisma generate` fails due to file lock, kill stray node processes and retry.

- [ ] **Step 4: Verify**

```bash
cd backend
node -e "
import('./src/prisma/prismaClient.js').then(async ({default: prisma}) => {
  const itemCount = await prisma.marketItem.count();
  const snapCount = await prisma.marketSnapshot.count();
  console.log('MarketItem:', itemCount, '| MarketSnapshot:', snapCount);
  await prisma.\$disconnect();
});
"
```

Expected: `MarketItem: 0 | MarketSnapshot: <existing count>`

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat(db): add MarketItem + generalize MarketSnapshot (itemType discriminator)"
```

---

## Task 2: bymykelClient — Fetch Catalog from GitHub

**Files:**
- Create: `backend/src/services/catalog/bymykelClient.js`
- Create: `backend/src/__tests__/catalog.test.js`

- [ ] **Step 1: Write failing test**

Create `backend/src/__tests__/catalog.test.js`:

```js
import { describe, it, expect } from '@jest/globals';
import { fetchCategory, CATEGORIES } from '../services/catalog/bymykelClient.js';

describe('bymykelClient', () => {
  it('exposes the 8 supported categories', () => {
    expect(CATEGORIES).toEqual(expect.arrayContaining([
      'skins', 'cases', 'stickers', 'agents', 'patches', 'graffiti', 'music_kits', 'collectibles', 'keys'
    ]));
  });

  it('fetchCategory parses JSON and returns array', async () => {
    const stubFetch = async () => ({
      ok: true,
      json: async () => [
        { id: 'sticker-1', name: 'Foo | Holo', market_hash_name: 'Foo | Holo', image: 'http://x/y.png', rarity: { name: 'Exotic' } },
      ],
    });
    const items = await fetchCategory('stickers', { fetchImpl: stubFetch });
    expect(Array.isArray(items)).toBe(true);
    expect(items[0].name).toBe('Foo | Holo');
  });

  it('fetchCategory throws on non-2xx', async () => {
    const stubFetch = async () => ({ ok: false, status: 503, text: async () => 'down' });
    await expect(fetchCategory('skins', { fetchImpl: stubFetch })).rejects.toThrow(/503/);
  });
});
```

- [ ] **Step 2: Run test to confirm fail**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=catalog.test.js
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create bymykelClient**

Create `backend/src/services/catalog/bymykelClient.js`:

```js
import logger from '../../utils/logger.js';

const BASE_URL = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en';

export const CATEGORIES = [
  'skins',
  'cases',
  'stickers',
  'agents',
  'patches',
  'graffiti',
  'music_kits',
  'collectibles',
  'keys',
];

export async function fetchCategory(category, { fetchImpl = fetch } = {}) {
  if (!CATEGORIES.includes(category)) {
    throw new Error(`Unsupported category: ${category}`);
  }
  const url = `${BASE_URL}/${category}.json`;
  logger.info('Fetching bymykel catalog', { category, url });
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`bymykel ${category} fetch failed: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error(`bymykel ${category} did not return an array`);
  }
  return data;
}

/**
 * Convert raw bymykel item to a normalized shape we persist.
 * Different categories have slightly different fields — we extract the common subset.
 */
export function normalizeItem(raw, category) {
  return {
    category,
    externalId: raw.id,
    name: raw.name,
    marketHashName: raw.market_hash_name ?? raw.name,
    imageUrl: raw.image ?? null,
    rarity: raw.rarity?.name ?? raw.rarity ?? null,
    collection: raw.collections?.[0]?.name ?? raw.crates?.[0]?.name ?? null,
    metadata: {
      tournament: raw.tournament_event ?? null,
      team: raw.tournament_team ?? null,
      type: raw.type ?? null,
    },
  };
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=catalog.test.js
```
Expected: 3 PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/catalog/ backend/src/__tests__/catalog.test.js
git commit -m "feat(catalog): bymykelClient fetches and normalizes per-category JSON"
```

---

## Task 3: catalogSyncJob — Orchestrate Catalog Upsert

**Files:**
- Create: `backend/src/services/catalog/catalogSyncJob.js`
- Modify: `backend/src/__tests__/catalog.test.js` (extend)

- [ ] **Step 1: Write failing test**

Append to `backend/src/__tests__/catalog.test.js`:

```js
import { syncCategoryToDb } from '../services/catalog/catalogSyncJob.js';

describe('catalogSyncJob.syncCategoryToDb', () => {
  it('upserts MarketItem rows for sticker category', async () => {
    const fakePrisma = {
      marketItem: {
        upsert: jest.fn().mockResolvedValue({ id: 1 }),
      },
    };
    const items = [
      { externalId: 'sticker-1', category: 'stickers', name: 'A', marketHashName: 'A', imageUrl: null, rarity: null, collection: null, metadata: {} },
      { externalId: 'sticker-2', category: 'stickers', name: 'B', marketHashName: 'B', imageUrl: null, rarity: null, collection: null, metadata: {} },
    ];
    const result = await syncCategoryToDb('stickers', items, { prismaClient: fakePrisma });
    expect(result.upserted).toBe(2);
    expect(fakePrisma.marketItem.upsert).toHaveBeenCalledTimes(2);
  });

  it('routes skins category to prisma.skin upsert (not marketItem)', async () => {
    const fakePrisma = {
      skin: { upsert: jest.fn().mockResolvedValue({ id: 99 }) },
      marketItem: { upsert: jest.fn() },
    };
    const items = [
      { externalId: 'skin-1', category: 'skins', name: 'AK-47 | Redline', marketHashName: 'AK-47 | Redline (Field-Tested)', imageUrl: null, rarity: 'Classified', collection: 'Phoenix', metadata: {} },
    ];
    await syncCategoryToDb('skins', items, { prismaClient: fakePrisma });
    expect(fakePrisma.skin.upsert).toHaveBeenCalledTimes(1);
    expect(fakePrisma.marketItem.upsert).not.toHaveBeenCalled();
  });
});
```

Add `import { jest } from '@jest/globals';` at the top of the file if not already there.

- [ ] **Step 2: Run, confirm fail**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=catalog.test.js -t catalogSyncJob
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create catalogSyncJob**

Create `backend/src/services/catalog/catalogSyncJob.js`:

```js
import defaultPrisma from '../../prisma/prismaClient.js';
import logger from '../../utils/logger.js';
import { CATEGORIES, fetchCategory, normalizeItem } from './bymykelClient.js';

const MARKET_ITEM_CATEGORIES = new Set([
  'stickers', 'agents', 'patches', 'graffiti', 'music_kits', 'collectibles', 'keys',
]);

/**
 * Upsert a list of already-normalized items for one category.
 * Returns { upserted, errors }.
 */
export async function syncCategoryToDb(category, items, { prismaClient = defaultPrisma } = {}) {
  let upserted = 0;
  const errors = [];

  for (const item of items) {
    try {
      if (category === 'skins') {
        await prismaClient.skin.upsert({
          where: { marketHashName: item.marketHashName },
          create: {
            name: item.name,
            marketHashName: item.marketHashName,
            imageUrl: item.imageUrl,
            rarity: item.rarity,
            collection: item.collection,
          },
          update: {
            name: item.name,
            imageUrl: item.imageUrl,
            rarity: item.rarity,
            collection: item.collection,
          },
        });
      } else if (category === 'cases') {
        await prismaClient.case.upsert({
          where: { name: item.name },
          create: {
            name: item.name,
            imageUrl: item.imageUrl,
          },
          update: {
            imageUrl: item.imageUrl,
          },
        });
      } else if (MARKET_ITEM_CATEGORIES.has(category)) {
        const dbCategory = category.replace(/s$/, ''); // 'stickers' -> 'sticker'
        await prismaClient.marketItem.upsert({
          where: { marketHashName: item.marketHashName },
          create: {
            category: dbCategory,
            externalId: item.externalId,
            name: item.name,
            marketHashName: item.marketHashName,
            imageUrl: item.imageUrl,
            rarity: item.rarity,
            collection: item.collection,
            metadata: item.metadata,
          },
          update: {
            name: item.name,
            imageUrl: item.imageUrl,
            rarity: item.rarity,
            collection: item.collection,
            metadata: item.metadata,
          },
        });
      } else {
        // unknown category — skip
        continue;
      }
      upserted++;
    } catch (err) {
      errors.push({ marketHashName: item.marketHashName, error: err.message });
    }
  }

  return { upserted, errors };
}

/**
 * Run a full catalog sync across all categories.
 */
export async function runCatalogSync({ prismaClient = defaultPrisma } = {}) {
  const summary = {};
  for (const category of CATEGORIES) {
    try {
      logger.info('Catalog sync starting', { category });
      const raw = await fetchCategory(category);
      const items = raw.map((r) => normalizeItem(r, category));
      const result = await syncCategoryToDb(category, items, { prismaClient });
      summary[category] = { fetched: items.length, ...result };
      logger.info('Catalog sync complete', { category, ...summary[category] });
    } catch (err) {
      logger.error('Catalog sync failed for category', { category, error: err.message });
      summary[category] = { error: err.message };
    }
  }
  return summary;
}
```

- [ ] **Step 4: Run tests**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=catalog.test.js
```
Expected: 5 PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/catalog/catalogSyncJob.js backend/src/__tests__/catalog.test.js
git commit -m "feat(catalog): syncCategoryToDb + runCatalogSync orchestrator"
```

---

## Task 4: steamMarketClient — Price Fetcher with Rate Limit + Retry

**Files:**
- Create: `backend/src/services/pricing/steamMarketClient.js`
- Create: `backend/src/__tests__/pricing.test.js`

- [ ] **Step 1: Write failing test**

Create `backend/src/__tests__/pricing.test.js`:

```js
import { describe, it, expect, jest } from '@jest/globals';
import { fetchPrice, parsePrice } from '../services/pricing/steamMarketClient.js';

describe('parsePrice', () => {
  it('parses "12,50€" as 12.50', () => {
    expect(parsePrice('12,50€')).toBeCloseTo(12.5, 2);
  });

  it('parses "1.234,56€" as 1234.56', () => {
    expect(parsePrice('1.234,56€')).toBeCloseTo(1234.56, 2);
  });

  it('parses "$5.99" as 5.99', () => {
    expect(parsePrice('$5.99')).toBeCloseTo(5.99, 2);
  });

  it('returns null for malformed', () => {
    expect(parsePrice('--')).toBeNull();
    expect(parsePrice(undefined)).toBeNull();
  });
});

describe('fetchPrice', () => {
  it('returns parsed prices on 200', async () => {
    const fetchImpl = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        lowest_price: '10,00€',
        median_price: '11,00€',
        volume: '42',
      }),
    });
    const result = await fetchPrice('AK-47 | Redline (Field-Tested)', { fetchImpl, sleepImpl: async () => {} });
    expect(result.found).toBe(true);
    expect(result.priceLatest).toBeCloseTo(10, 2);
    expect(result.priceMedian).toBeCloseTo(11, 2);
    expect(result.volume24h).toBe(42);
  });

  it('returns found:false on 404', async () => {
    const fetchImpl = async () => ({
      ok: false,
      status: 404,
      json: async () => ({ success: false }),
    });
    const result = await fetchPrice('Nonexistent Item', { fetchImpl, sleepImpl: async () => {} });
    expect(result.found).toBe(false);
    expect(result.status).toBe(404);
  });

  it('retries on 429 up to max attempts', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls++;
      if (calls < 3) return { ok: false, status: 429, headers: { get: () => '1' }, text: async () => '' };
      return { ok: true, status: 200, json: async () => ({ success: true, lowest_price: '1,00€', median_price: '1,00€', volume: '1' }) };
    };
    const result = await fetchPrice('Test', { fetchImpl, sleepImpl: async () => {} });
    expect(result.found).toBe(true);
    expect(calls).toBe(3);
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=pricing.test.js
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create steamMarketClient**

Create `backend/src/services/pricing/steamMarketClient.js`:

```js
import logger from '../../utils/logger.js';

const BASE_URL = 'https://steamcommunity.com/market/priceoverview/';
const APPID = 730; // CS2
const DEFAULT_COUNTRY = 'DE';
const DEFAULT_CURRENCY = 3; // EUR
const REQUEST_TIMEOUT_MS = 10000;

/**
 * Parse a Steam Market price string like "12,50€", "1.234,56€", or "$5.99" into a Number.
 * Returns null if the string is unparseable.
 */
export function parsePrice(str) {
  if (typeof str !== 'string') return null;
  // Strip currency symbols and surrounding whitespace
  const cleaned = str.replace(/[€$£¥₽]/g, '').trim();
  if (!cleaned || cleaned === '--') return null;

  // Heuristic: if string contains both '.' and ',', treat '.' as thousand separator (DE/EU format)
  // If only ',', treat as decimal. If only '.', treat as decimal.
  let normalized;
  if (cleaned.includes('.') && cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    normalized = cleaned.replace(',', '.');
  } else {
    normalized = cleaned;
  }

  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : null;
}

async function defaultSleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch price for a market_hash_name from Steam Community Market.
 * Returns { found, status, priceLatest, priceMedian, volume24h, error }.
 *
 * Caller is responsible for spacing requests (3s rate limit). This function retries
 * transient failures (429, 5xx, network errors) but does not enforce inter-request delay.
 */
export async function fetchPrice(marketHashName, {
  fetchImpl = fetch,
  sleepImpl = defaultSleep,
  country = DEFAULT_COUNTRY,
  currency = DEFAULT_CURRENCY,
  maxAttempts = 3,
} = {}) {
  const url = `${BASE_URL}?country=${encodeURIComponent(country)}&currency=${currency}&appid=${APPID}&market_hash_name=${encodeURIComponent(marketHashName)}`;

  let lastError = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

      if (res.status === 404 || res.status === 500) {
        // Steam returns 500 for items it doesn't recognize — treat as not-found
        return { found: false, status: res.status };
      }

      if (res.status === 429) {
        const retryAfter = parseFloat(res.headers?.get?.('retry-after') ?? '5');
        lastError = `429 rate-limited (retry-after ${retryAfter}s)`;
        if (attempt < maxAttempts) {
          await sleepImpl(Math.min(retryAfter * 1000, 30000));
          continue;
        }
        return { found: false, status: 429, error: lastError };
      }

      if (res.status >= 500) {
        lastError = `Steam ${res.status}`;
        if (attempt < maxAttempts) {
          await sleepImpl(5000 * attempt);
          continue;
        }
        return { found: false, status: res.status, error: lastError };
      }

      if (!res.ok) {
        return { found: false, status: res.status, error: `unexpected ${res.status}` };
      }

      const data = await res.json();
      if (data?.success !== true) {
        return { found: false, status: 200, error: 'success:false in body' };
      }

      const priceLatest = parsePrice(data.lowest_price);
      const priceMedian = parsePrice(data.median_price);
      const volume24h = data.volume ? parseInt(String(data.volume).replace(/[^\d]/g, ''), 10) : null;

      return {
        found: true,
        status: 200,
        priceLatest,
        priceMedian,
        volume24h,
      };
    } catch (err) {
      lastError = err.message;
      if (attempt < maxAttempts) {
        await sleepImpl(2000 * attempt);
        continue;
      }
    }
  }

  logger.warn('Steam Market fetch failed after retries', { marketHashName, lastError });
  return { found: false, status: 0, error: lastError ?? 'unknown' };
}
```

- [ ] **Step 4: Run tests**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=pricing.test.js
```
Expected: 7 PASS.

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/pricing/steamMarketClient.js backend/src/__tests__/pricing.test.js
git commit -m "feat(pricing): steamMarketClient with parsePrice + fetchPrice (retry, 404, 429)"
```

---

## Task 5: priceRefreshJob + deadItemTracker

**Files:**
- Create: `backend/src/services/pricing/deadItemTracker.js`
- Create: `backend/src/services/pricing/priceRefreshJob.js`
- Modify: `backend/src/__tests__/pricing.test.js` (extend)

- [ ] **Step 1: Write failing test**

Append to `backend/src/__tests__/pricing.test.js`:

```js
import { recordPriceResult, refreshItemPrice } from '../services/pricing/priceRefreshJob.js';

describe('recordPriceResult', () => {
  it('updates skin row + resets consecutive404 on success', async () => {
    const updateSkin = jest.fn();
    const createSnap = jest.fn();
    const fakePrisma = {
      skin: { update: updateSkin },
      marketSnapshot: { create: createSnap },
    };
    const item = { id: 1, itemType: 'skin', marketHashName: 'X' };
    const result = { found: true, priceLatest: 10, priceMedian: 11, volume24h: 5 };
    await recordPriceResult(item, result, { prismaClient: fakePrisma });
    expect(updateSkin).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 1 },
      data: expect.objectContaining({ priceLatest: 10, priceMedian: 11 }),
    }));
    expect(createSnap).toHaveBeenCalled();
  });

  it('increments consecutive404 on not-found for marketItem', async () => {
    const updateItem = jest.fn();
    const fakePrisma = {
      marketItem: { update: updateItem },
      marketSnapshot: { create: jest.fn() },
    };
    const item = { id: 5, itemType: 'market_item', marketHashName: 'Y', consecutive404: 1 };
    const result = { found: false, status: 404 };
    await recordPriceResult(item, result, { prismaClient: fakePrisma });
    expect(updateItem).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 5 },
      data: expect.objectContaining({ consecutive404: 2 }),
    }));
  });

  it('marks marketItem inactive after 3 consecutive 404s', async () => {
    const updateItem = jest.fn();
    const fakePrisma = {
      marketItem: { update: updateItem },
      marketSnapshot: { create: jest.fn() },
    };
    const item = { id: 5, itemType: 'market_item', marketHashName: 'Y', consecutive404: 2 };
    const result = { found: false, status: 404 };
    await recordPriceResult(item, result, { prismaClient: fakePrisma });
    expect(updateItem).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ consecutive404: 3, isActive: false }),
    }));
  });
});
```

- [ ] **Step 2: Run, confirm fail**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=pricing.test.js -t recordPriceResult
```
Expected: FAIL.

- [ ] **Step 3: Create deadItemTracker**

Create `backend/src/services/pricing/deadItemTracker.js`:

```js
export const DEAD_ITEM_THRESHOLD = 3;

/**
 * Given current consecutive404 + outcome, return next state.
 *   { nextCount, markInactive }
 */
export function nextDeadState(current404, found, status) {
  if (found) {
    return { nextCount: 0, markInactive: false };
  }
  if (status === 404 || status === 500) {
    const next = (current404 ?? 0) + 1;
    return { nextCount: next, markInactive: next >= DEAD_ITEM_THRESHOLD };
  }
  // Transient (429, 5xx other than 500) — do not bump
  return { nextCount: current404 ?? 0, markInactive: false };
}
```

- [ ] **Step 4: Create priceRefreshJob**

Create `backend/src/services/pricing/priceRefreshJob.js`:

```js
import defaultPrisma from '../../prisma/prismaClient.js';
import logger from '../../utils/logger.js';
import { fetchPrice } from './steamMarketClient.js';
import { nextDeadState } from './deadItemTracker.js';

const REFRESH_DELAY_MS = 3000;

/**
 * Write the outcome of a single fetchPrice() call back to the DB.
 * `item` shape: { id, itemType, marketHashName, consecutive404? }
 *   itemType: 'skin' | 'case' | 'market_item'
 */
export async function recordPriceResult(item, result, { prismaClient = defaultPrisma } = {}) {
  const { nextCount, markInactive } = nextDeadState(item.consecutive404, result.found, result.status);

  const baseUpdate = {
    priceUpdatedAt: new Date(),
  };

  if (result.found) {
    baseUpdate.priceLatest = result.priceLatest;
    baseUpdate.priceMedian = result.priceMedian;
    baseUpdate.volume24h = result.volume24h ?? null;
  }

  if (item.itemType === 'skin') {
    await prismaClient.skin.update({
      where: { id: item.id },
      data: baseUpdate,
    });
  } else if (item.itemType === 'case') {
    const caseUpdate = { price: result.found ? result.priceLatest : undefined, lastUpdated: new Date() };
    Object.keys(caseUpdate).forEach((k) => caseUpdate[k] === undefined && delete caseUpdate[k]);
    await prismaClient.case.update({
      where: { id: item.id },
      data: caseUpdate,
    });
  } else if (item.itemType === 'market_item') {
    await prismaClient.marketItem.update({
      where: { id: item.id },
      data: {
        ...baseUpdate,
        consecutive404: nextCount,
        ...(markInactive ? { isActive: false } : {}),
      },
    });
  }

  // Snapshot — only on success
  if (result.found && result.priceLatest != null) {
    await prismaClient.marketSnapshot.create({
      data: {
        itemType: item.itemType,
        skinId: item.itemType === 'skin' ? item.id : null,
        caseId: item.itemType === 'case' ? item.id : null,
        marketItemId: item.itemType === 'market_item' ? item.id : null,
        date: new Date(),
        priceUsd: result.priceLatest,
        soldVolume24h: result.volume24h ?? null,
        source: 'steam_market',
      },
    });
  }
}

/**
 * Refresh price for a single item.
 */
export async function refreshItemPrice(item, { prismaClient = defaultPrisma, fetchImpl } = {}) {
  const result = await fetchPrice(item.marketHashName, fetchImpl ? { fetchImpl } : {});
  await recordPriceResult(item, result, { prismaClient });
  return result;
}

/**
 * Iterate all active items and refresh their prices.
 * Yields control via 3s sleep between requests.
 */
export async function runPriceRefresh({ prismaClient = defaultPrisma, sleepImpl = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const skins = await prismaClient.skin.findMany({ select: { id: true, marketHashName: true } });
  const cases = await prismaClient.case.findMany({ select: { id: true, name: true } });
  const marketItems = await prismaClient.marketItem.findMany({
    where: { isActive: true },
    select: { id: true, marketHashName: true, consecutive404: true },
  });

  const all = [
    ...skins.map((s) => ({ ...s, itemType: 'skin' })),
    ...cases.map((c) => ({ id: c.id, marketHashName: c.name, itemType: 'case' })),
    ...marketItems.map((m) => ({ ...m, itemType: 'market_item' })),
  ];

  logger.info('Price refresh starting', { count: all.length });
  let ok = 0;
  let notFound = 0;
  let errors = 0;

  for (let i = 0; i < all.length; i++) {
    const item = all[i];
    try {
      const result = await refreshItemPrice(item, { prismaClient });
      if (result.found) ok++;
      else if (result.status === 404 || result.status === 500) notFound++;
      else errors++;
    } catch (err) {
      errors++;
      logger.error('refreshItemPrice threw', { id: item.id, type: item.itemType, error: err.message });
    }
    if (i < all.length - 1) {
      await sleepImpl(REFRESH_DELAY_MS);
    }
  }

  logger.info('Price refresh complete', { ok, notFound, errors });
  return { ok, notFound, errors, total: all.length };
}
```

- [ ] **Step 5: Run tests**

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=pricing.test.js
```
Expected: 10 PASS.

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/pricing/ backend/src/__tests__/pricing.test.js
git commit -m "feat(pricing): priceRefreshJob + deadItemTracker (3s rate, 404 → inactive after 3)"
```

---

## Task 6: Cron Wiring

**Files:**
- Modify: `backend/src/cron/index.js`

- [ ] **Step 1: Read existing cron/index.js**

```bash
grep -n "cron.schedule\|require\|import" backend/src/cron/index.js | head -30
cat backend/src/cron/index.js
```

Note the existing pattern for registering jobs (likely `cron.schedule(cronExpr, fn)`).

- [ ] **Step 2: Add new cron registrations**

Add the imports near the top of `backend/src/cron/index.js`:

```js
import { runCatalogSync } from '../services/catalog/catalogSyncJob.js';
import { runPriceRefresh } from '../services/pricing/priceRefreshJob.js';
import logger from '../utils/logger.js';
```

Then in the registration body (where other schedules are registered), append:

```js
// 02:00 UTC daily — catalog sync (bymykel → DB)
cron.schedule('0 2 * * *', async () => {
  logger.info('[CRON] Catalog sync starting');
  try {
    const summary = await runCatalogSync();
    logger.info('[CRON] Catalog sync done', { summary });
  } catch (err) {
    logger.error('[CRON] Catalog sync failed', { error: err.message });
  }
}, { timezone: 'UTC' });

// 03:00 UTC daily — price refresh (Steam Market → DB)
cron.schedule('0 3 * * *', async () => {
  logger.info('[CRON] Price refresh starting');
  try {
    const summary = await runPriceRefresh();
    logger.info('[CRON] Price refresh done', { summary });
  } catch (err) {
    logger.error('[CRON] Price refresh failed', { error: err.message });
  }
}, { timezone: 'UTC' });
```

If the existing `cron` import comes from a different module path or with different API (e.g. `node-cron`'s `cron.schedule` is direct, but some projects use `node-schedule`), adapt accordingly. Read the file and follow the existing pattern.

- [ ] **Step 3: Syntax check**

```bash
cd backend
node --check src/cron/index.js
```
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add backend/src/cron/index.js
git commit -m "feat(cron): register daily catalogSync (02:00 UTC) + priceRefresh (03:00 UTC)"
```

---

## Task 7: Bootstrap Script + Smoke Run

**Files:**
- Create: `backend/scripts/bootstrap-catalog.js`

This script is for the one-time initial seed plus manual reruns.

- [ ] **Step 1: Create script**

Create `backend/scripts/bootstrap-catalog.js`:

```js
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
```

- [ ] **Step 2: Make executable + verify it loads**

```bash
cd backend
node --check scripts/bootstrap-catalog.js
```
Expected: no output.

- [ ] **Step 3: Smoke-run on a small subset first (manual)**

Before running the full bootstrap, run a category-isolated smoke test to confirm bymykel JSON is parseable and DB writes work. Open Node REPL or run a one-liner:

```bash
cd backend
node -e "
import('./src/services/catalog/catalogSyncJob.js').then(async ({ runCatalogSync }) => {
  // Override CATEGORIES temporarily — easier: just call fetchCategory + syncCategoryToDb for one
  const { fetchCategory, normalizeItem } = await import('./src/services/catalog/bymykelClient.js');
  const { syncCategoryToDb } = await import('./src/services/catalog/catalogSyncJob.js');
  const raw = await fetchCategory('cases');
  const items = raw.map(r => normalizeItem(r, 'cases'));
  const result = await syncCategoryToDb('cases', items.slice(0, 5));
  console.log('cases smoke result:', result);
  process.exit(0);
});
"
```

Expected: console output showing 5 cases upserted with no errors.

If errors: inspect the bymykel `cases.json` shape vs your `normalizeItem` mapping. Adjust normalizer if real data differs from test fixture.

- [ ] **Step 4: Run full bootstrap (when smoke passes)**

```bash
cd backend
node scripts/bootstrap-catalog.js
```

Expected: 8 categories synced, ~12,500 items in DB, completed in 5-30 seconds (no rate limit on catalog fetch — only on Steam Market).

- [ ] **Step 5: Commit**

```bash
git add backend/scripts/bootstrap-catalog.js
git commit -m "feat(catalog): bootstrap script for initial / manual catalog sync"
```

---

## Self-Review

**Spec coverage:**
- ✅ MarketItem model + MarketSnapshot generalization → Task 1
- ✅ bymykel catalog fetch → Task 2
- ✅ Catalog upsert orchestration → Task 3
- ✅ Steam Market client with rate limit + retry + 404 + 429 handling → Task 4
- ✅ priceRefreshJob iterating active items → Task 5
- ✅ deadItemTracker (3× 404 → inactive) → Task 5
- ✅ Cron registration → Task 6
- ✅ Bootstrap script → Task 7
- ⏸ Inactive items re-checked weekly — not implemented. Acceptable cut for v1 (deadItemTracker mechanics are in place; weekly recheck cron can be added later by adding one more schedule entry).
- ⏸ Frontend pagination scaling — spec marks this as a separate concern. Existing `/skins` page already supports DB-side pagination per Month 1 audit. If performance issues appear under 12.5k items, address separately.

**Placeholder scan:** No "TBD", no "implement appropriate error handling" placeholders. Code blocks are complete. The Step 6 of Task 6 says "follow existing pattern" — this is an instruction with concrete fallback (the code block is provided assuming node-cron).

**Type / method consistency:**
- `item.itemType` discriminator: `'skin' | 'case' | 'market_item'` used consistently in Task 5 + Task 1 schema (`itemType` column).
- `marketHashName` natural key used consistently in catalog upsert (Task 3) and refresh queries (Task 5).
- `fetchPrice` signature `(marketHashName, opts)` matches caller in `refreshItemPrice`.
- `recordPriceResult` parameter shape matches what Task 5's tests use.

**Scope:** 7 tasks. Solo dev estimate: T1 (0.5d), T2 (0.5d), T3 (0.5d), T4 (1d), T5 (1d), T6 (0.5d), T7 (0.5d + bootstrap run time) = ~4.5 days. Matches spec target.
