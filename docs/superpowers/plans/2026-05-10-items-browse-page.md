# `/items` Browse Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/items` browse + `/items/[id]` detail pages backed by a new `/api/v1/market-items` API, exposing the 12,600 non-skin/non-case items already in the DB.

**Architecture:** Backend controller queries `MarketItem` with filters/pagination/sort. Frontend client-component reads URL params, calls API, renders grid + filter sidebar. Detail page is a server component that fetches initial data + reuses the existing price-history chart adapted for MarketItem.

**Tech Stack:** Express 5 + Node 22 ESM, Prisma 6, Next.js 15 (App Router), Tailwind, shadcn/Radix UI.

**Branch:** `feature/items-browse-page` (create from main).

---

## File Structure

**New backend files:**
- `backend/src/controllers/marketItemController.js` — list + detail handlers
- `backend/src/routes/marketItemRoutes.js` — route wiring
- `backend/src/__tests__/marketItem.test.js`

**New frontend files:**
- `frontend/src/app/items/page.tsx` — Suspense + metadata
- `frontend/src/app/items/_components/ItemsBrowse.tsx` — main client component (filter + grid + pagination)
- `frontend/src/app/items/_components/ItemCard.tsx` — single grid cell
- `frontend/src/app/items/_components/CategoryFilter.tsx` — pill bar
- `frontend/src/app/items/[id]/page.tsx` — server component detail page
- `frontend/src/hooks/useMarketItems.ts` — fetch hook for list endpoint

**Modified:**
- `backend/src/app.js` — mount `marketItemRoutes`

Each file < 200 LOC.

---

## Task 1: Backend Controller (List + Detail)

**Files:**
- Create: `backend/src/controllers/marketItemController.js`
- Create: `backend/src/__tests__/marketItem.test.js`

### Step 1: Write failing test

Create `backend/src/__tests__/marketItem.test.js`:

```js
import { describe, it, expect, jest } from '@jest/globals';
import { listMarketItems, getMarketItem } from '../controllers/marketItemController.js';

function makeRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
  };
}

describe('listMarketItems', () => {
  it('returns paginated results with default page/pageSize', async () => {
    const fakePrisma = {
      marketItem: {
        findMany: jest.fn().mockResolvedValue([
          { id: 1, name: 'A', category: 'sticker' },
          { id: 2, name: 'B', category: 'sticker' },
        ]),
        count: jest.fn().mockResolvedValue(2),
      },
    };
    const req = { query: {} };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(res.statusCode).toBe(200);
    expect(res.body.items).toHaveLength(2);
    expect(res.body.pagination).toEqual({ page: 1, pageSize: 24, total: 2, totalPages: 1 });
  });

  it('filters by category', async () => {
    const fakePrisma = {
      marketItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const req = { query: { category: 'sticker' } };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(fakePrisma.marketItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ isActive: true, category: 'sticker' }),
    }));
  });

  it('filters by free-text q (case-insensitive contains on name)', async () => {
    const fakePrisma = {
      marketItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const req = { query: { q: 'krakow' } };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(fakePrisma.marketItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        isActive: true,
        name: { contains: 'krakow', mode: 'insensitive' },
      }),
    }));
  });

  it('caps pageSize at 60', async () => {
    const fakePrisma = {
      marketItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const req = { query: { pageSize: '500' } };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(fakePrisma.marketItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      take: 60,
    }));
  });

  it('applies sort+order params', async () => {
    const fakePrisma = {
      marketItem: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const req = { query: { sort: 'price', order: 'desc' } };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(fakePrisma.marketItem.findMany).toHaveBeenCalledWith(expect.objectContaining({
      orderBy: { priceLatest: 'desc' },
    }));
  });

  it('rejects invalid category with 400', async () => {
    const fakePrisma = { marketItem: { findMany: jest.fn(), count: jest.fn() } };
    const req = { query: { category: 'evil-injection' } };
    const res = makeRes();
    await listMarketItems(req, res, { prismaClient: fakePrisma });
    expect(res.statusCode).toBe(400);
    expect(fakePrisma.marketItem.findMany).not.toHaveBeenCalled();
  });
});

describe('getMarketItem', () => {
  it('returns the item on hit', async () => {
    const fakePrisma = {
      marketItem: {
        findUnique: jest.fn().mockResolvedValue({ id: 7, name: 'X', category: 'sticker' }),
      },
    };
    const req = { params: { id: '7' } };
    const res = makeRes();
    await getMarketItem(req, res, { prismaClient: fakePrisma });
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(7);
  });

  it('returns 404 when not found', async () => {
    const fakePrisma = {
      marketItem: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    const req = { params: { id: '999' } };
    const res = makeRes();
    await getMarketItem(req, res, { prismaClient: fakePrisma });
    expect(res.statusCode).toBe(404);
  });

  it('returns 400 on non-numeric id', async () => {
    const fakePrisma = { marketItem: { findUnique: jest.fn() } };
    const req = { params: { id: 'abc' } };
    const res = makeRes();
    await getMarketItem(req, res, { prismaClient: fakePrisma });
    expect(res.statusCode).toBe(400);
    expect(fakePrisma.marketItem.findUnique).not.toHaveBeenCalled();
  });
});
```

### Step 2: Run to confirm fail

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=marketItem.test.js
```
Expected: FAIL — module not found.

### Step 3: Create the controller

Create `backend/src/controllers/marketItemController.js`:

```js
import defaultPrisma from '../prisma/prismaClient.js';
import logger from '../utils/logger.js';

const VALID_CATEGORIES = ['sticker', 'agent', 'patch', 'graffiti', 'music_kit', 'collectible', 'key'];
const VALID_SORTS = { name: 'name', price: 'priceLatest', volume: 'volume24h' };
const MAX_PAGE_SIZE = 60;
const DEFAULT_PAGE_SIZE = 24;

export async function listMarketItems(req, res, { prismaClient = defaultPrisma } = {}) {
  try {
    const { category, q, page: rawPage, pageSize: rawPageSize, sort: rawSort, order: rawOrder } = req.query ?? {};

    if (category && !VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: 'invalid category', valid: VALID_CATEGORIES });
    }

    const sortKey = VALID_SORTS[rawSort] ?? 'name';
    const order = rawOrder === 'desc' ? 'desc' : 'asc';
    const page = Math.max(1, parseInt(rawPage, 10) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(rawPageSize, 10) || DEFAULT_PAGE_SIZE));

    const where = { isActive: true };
    if (category) where.category = category;
    if (q && typeof q === 'string' && q.trim()) {
      where.name = { contains: q.trim(), mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      prismaClient.marketItem.findMany({
        where,
        orderBy: { [sortKey]: order },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          category: true,
          name: true,
          marketHashName: true,
          imageUrl: true,
          rarity: true,
          collection: true,
          priceLatest: true,
          priceMedian: true,
          volume24h: true,
          priceUpdatedAt: true,
        },
      }),
      prismaClient.marketItem.count({ where }),
    ]);

    return res.json({
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    });
  } catch (err) {
    logger.error('listMarketItems failed', { error: err.message });
    return res.status(500).json({ error: 'failed to list items' });
  }
}

export async function getMarketItem(req, res, { prismaClient = defaultPrisma } = {}) {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'invalid id' });
    }
    const item = await prismaClient.marketItem.findUnique({
      where: { id },
    });
    if (!item) {
      return res.status(404).json({ error: 'item not found' });
    }
    return res.json(item);
  } catch (err) {
    logger.error('getMarketItem failed', { error: err.message });
    return res.status(500).json({ error: 'failed to fetch item' });
  }
}
```

### Step 4: Run tests

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=marketItem.test.js
```
Expected: 9 PASS.

### Step 5: Commit

```bash
git add backend/src/controllers/marketItemController.js backend/src/__tests__/marketItem.test.js
git commit -m "feat(items): marketItemController (list with filter/page/sort + detail)"
```

---

## Task 2: Backend Routes + App Mount

**Files:**
- Create: `backend/src/routes/marketItemRoutes.js`
- Modify: `backend/src/app.js`

### Step 1: Create routes file

Create `backend/src/routes/marketItemRoutes.js`:

```js
import { Router } from 'express';
import { listMarketItems, getMarketItem } from '../controllers/marketItemController.js';

const router = Router();

router.get('/', (req, res) => listMarketItems(req, res));
router.get('/:id', (req, res) => getMarketItem(req, res));

export default router;
```

No auth middleware — these endpoints are public (matches `/skins`).

### Step 2: Mount in app.js

Read `backend/src/app.js`. Find the section where other routes are mounted (e.g. `/api/v1/skins`).

Add import near other route imports:
```js
import marketItemRoutes from './routes/marketItemRoutes.js';
```

Add mount near other `app.use` calls, sorted alphabetically or grouped logically:
```js
app.use('/api/v1/market-items', marketItemRoutes);
```

### Step 3: Syntax check

```bash
cd backend
node --check src/routes/marketItemRoutes.js
node --check src/app.js
```
Expected: no output.

### Step 4: Smoke test (server must be running)

If backend dev server is reachable at :5000:

```bash
curl -s "http://localhost:5000/api/v1/market-items?category=sticker&pageSize=3" | head -c 500
```

Expected: JSON with `items` array (up to 3 entries) and `pagination` object. If backend not running, skip this step.

```bash
curl -s "http://localhost:5000/api/v1/market-items?category=invalid" -w "\nHTTP %{http_code}\n"
```
Expected: 400 JSON `{"error":"invalid category", "valid":[...]}`.

### Step 5: Commit

```bash
git add backend/src/routes/marketItemRoutes.js backend/src/app.js
git commit -m "feat(items): mount /api/v1/market-items routes"
```

---

## Task 3: Frontend Hook `useMarketItems`

**Files:**
- Create: `frontend/src/hooks/useMarketItems.ts`

### Step 1: Create hook

Create `frontend/src/hooks/useMarketItems.ts`:

```ts
"use client";
import { useCallback, useEffect, useRef, useState } from 'react';

export type MarketItemCategory = 'sticker' | 'agent' | 'patch' | 'graffiti' | 'music_kit' | 'collectible' | 'key';
export type SortKey = 'name' | 'price' | 'volume';
export type SortOrder = 'asc' | 'desc';

export interface MarketItem {
  id: number;
  category: MarketItemCategory;
  name: string;
  marketHashName: string;
  imageUrl: string | null;
  rarity: string | null;
  collection: string | null;
  priceLatest: number | null;
  priceMedian: number | null;
  volume24h: number | null;
  priceUpdatedAt: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface UseMarketItemsParams {
  category?: MarketItemCategory;
  q?: string;
  page?: number;
  pageSize?: number;
  sort?: SortKey;
  order?: SortOrder;
}

export interface UseMarketItemsResult {
  items: MarketItem[];
  pagination: Pagination | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useMarketItems(params: UseMarketItemsParams): UseMarketItemsResult {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [items, setItems] = useState<MarketItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const buildUrl = useCallback(() => {
    const search = new URLSearchParams();
    if (params.category) search.set('category', params.category);
    if (params.q) search.set('q', params.q);
    if (params.page && params.page > 1) search.set('page', String(params.page));
    if (params.pageSize && params.pageSize !== 24) search.set('pageSize', String(params.pageSize));
    if (params.sort && params.sort !== 'name') search.set('sort', params.sort);
    if (params.order && params.order !== 'asc') search.set('order', params.order);
    return `${apiUrl}/api/v1/market-items${search.toString() ? '?' + search.toString() : ''}`;
  }, [apiUrl, params.category, params.q, params.page, params.pageSize, params.sort, params.order]);

  const fetchItems = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    try {
      const res = await fetch(buildUrl(), { signal: controller.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setItems(data.items ?? []);
      setPagination(data.pagination ?? null);
      setError(null);
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setIsLoading(false);
    }
  }, [buildUrl]);

  useEffect(() => {
    fetchItems();
    return () => controllerRef.current?.abort();
  }, [fetchItems]);

  return { items, pagination, isLoading, error, refresh: fetchItems };
}
```

### Step 2: TS check

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep useMarketItems | head -5
```
Expected: no output (no errors in the new file).

### Step 3: Commit

```bash
git add frontend/src/hooks/useMarketItems.ts
git commit -m "feat(items): useMarketItems hook with AbortController + URL builder"
```

---

## Task 4: Frontend Components — ItemCard + CategoryFilter

**Files:**
- Create: `frontend/src/app/items/_components/ItemCard.tsx`
- Create: `frontend/src/app/items/_components/CategoryFilter.tsx`

### Step 1: Create ItemCard

Create `frontend/src/app/items/_components/ItemCard.tsx`:

```tsx
"use client";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MarketItem } from "@/hooks/useMarketItems";

const CATEGORY_LABELS: Record<MarketItem['category'], string> = {
  sticker: 'Sticker',
  agent: 'Agent',
  patch: 'Patch',
  graffiti: 'Graffiti',
  music_kit: 'Music Kit',
  collectible: 'Collectible',
  key: 'Key',
};

const CATEGORY_COLORS: Record<MarketItem['category'], string> = {
  sticker: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
  agent: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  patch: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
  graffiti: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
  music_kit: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  collectible: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
  key: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
};

interface ItemCardProps {
  item: MarketItem;
}

export function ItemCard({ item }: ItemCardProps) {
  return (
    <Link href={`/items/${item.id}`}>
      <Card className="bg-slate-900/60 backdrop-blur border border-slate-700/50 hover:border-slate-600 transition-colors h-full">
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="aspect-square bg-slate-800/40 rounded-md flex items-center justify-center overflow-hidden">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" loading="lazy" />
            ) : (
              <span className="text-slate-500 text-xs">No image</span>
            )}
          </div>
          <div className="flex items-start gap-2">
            <Badge variant="outline" className={`${CATEGORY_COLORS[item.category]} text-xs whitespace-nowrap`}>
              {CATEGORY_LABELS[item.category]}
            </Badge>
          </div>
          <h3 className="text-sm font-medium text-white line-clamp-2">{item.name}</h3>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-400">
              {item.priceLatest != null ? `€${item.priceLatest.toFixed(2)}` : '—'}
            </span>
            <span className="text-slate-500">
              {item.volume24h != null && item.volume24h > 0 ? `Vol ${item.volume24h}` : ''}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
```

### Step 2: Create CategoryFilter

Create `frontend/src/app/items/_components/CategoryFilter.tsx`:

```tsx
"use client";
import { Button } from "@/components/ui/button";
import type { MarketItemCategory } from "@/hooks/useMarketItems";

const CATEGORIES: Array<{ value: MarketItemCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'sticker', label: 'Stickers' },
  { value: 'agent', label: 'Agents' },
  { value: 'patch', label: 'Patches' },
  { value: 'graffiti', label: 'Graffiti' },
  { value: 'music_kit', label: 'Music Kits' },
  { value: 'collectible', label: 'Collectibles' },
  { value: 'key', label: 'Keys' },
];

interface CategoryFilterProps {
  active: MarketItemCategory | null;
  onChange: (next: MarketItemCategory | null) => void;
}

export function CategoryFilter({ active, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((c) => {
        const isActive = (c.value === 'all' && active === null) || c.value === active;
        return (
          <Button
            key={c.value}
            size="sm"
            variant={isActive ? 'default' : 'outline'}
            onClick={() => onChange(c.value === 'all' ? null : c.value)}
            className={
              isActive
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
                : 'border-slate-700/50 text-slate-300 hover:border-slate-600 hover:text-white bg-slate-900/50'
            }
          >
            {c.label}
          </Button>
        );
      })}
    </div>
  );
}
```

### Step 3: TS check

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep -E "ItemCard|CategoryFilter" | head -5
```
Expected: no output.

### Step 4: Commit

```bash
git add frontend/src/app/items/_components/
git commit -m "feat(items): ItemCard + CategoryFilter components"
```

---

## Task 5: ItemsBrowse Main Component + Page

**Files:**
- Create: `frontend/src/app/items/_components/ItemsBrowse.tsx`
- Create: `frontend/src/app/items/page.tsx`

### Step 1: Create ItemsBrowse

Create `frontend/src/app/items/_components/ItemsBrowse.tsx`:

```tsx
"use client";
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMarketItems, type MarketItemCategory, type SortKey, type SortOrder } from '@/hooks/useMarketItems';
import { ItemCard } from './ItemCard';
import { CategoryFilter } from './CategoryFilter';

function parseCategory(v: string | null): MarketItemCategory | null {
  const valid: MarketItemCategory[] = ['sticker', 'agent', 'patch', 'graffiti', 'music_kit', 'collectible', 'key'];
  return v && (valid as string[]).includes(v) ? (v as MarketItemCategory) : null;
}

function parseSort(v: string | null): SortKey {
  return v === 'price' || v === 'volume' ? v : 'name';
}

function parseOrder(v: string | null): SortOrder {
  return v === 'desc' ? 'desc' : 'asc';
}

export function ItemsBrowse() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = parseCategory(searchParams.get('category'));
  const sort = parseSort(searchParams.get('sort'));
  const order = parseOrder(searchParams.get('order'));
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const initialQ = searchParams.get('q') ?? '';

  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { items, pagination, isLoading, error } = useMarketItems({
    category: category ?? undefined,
    q: debouncedQ || undefined,
    page,
    sort,
    order,
  });

  const updateUrl = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === '') params.delete(k);
      else params.set(k, v);
    }
    router.push(`/items${params.toString() ? '?' + params.toString() : ''}`);
  }, [router, searchParams]);

  // Sync debounced q to URL
  useEffect(() => {
    const currentQ = searchParams.get('q') ?? '';
    if (debouncedQ !== currentQ) {
      updateUrl({ q: debouncedQ || null, page: null });
    }
  }, [debouncedQ, searchParams, updateUrl]);

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Browse Items</h1>
          <p className="text-slate-400">
            Stickers, agents, patches, music kits, and more — {pagination?.total ?? '…'} items.
          </p>
        </div>

        <div className="space-y-4 mb-6">
          <CategoryFilter
            active={category}
            onChange={(next) => updateUrl({ category: next, page: null })}
          />

          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search by name…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 bg-slate-900/60 border-slate-700/50 text-white"
              />
            </div>
            <Select value={`${sort}:${order}`} onValueChange={(v) => {
              const [s, o] = v.split(':');
              updateUrl({ sort: s, order: o, page: null });
            }}>
              <SelectTrigger className="w-full md:w-48 bg-slate-900/60 border-slate-700/50 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="name:asc">Name A→Z</SelectItem>
                <SelectItem value="name:desc">Name Z→A</SelectItem>
                <SelectItem value="price:desc">Price high→low</SelectItem>
                <SelectItem value="price:asc">Price low→high</SelectItem>
                <SelectItem value="volume:desc">Volume high→low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 mb-4">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
            ))}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            No items match these filters.
          </div>
        )}

        {!isLoading && items.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => <ItemCard key={item.id} item={item} />)}
          </div>
        )}

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-8">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => updateUrl({ page: String(page - 1) })}
              className="border-slate-700/50"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>
            <span className="text-slate-400 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => updateUrl({ page: String(page + 1) })}
              className="border-slate-700/50"
            >
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 2: Create page.tsx with Suspense + metadata

Create `frontend/src/app/items/page.tsx`:

```tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import { ItemsBrowse } from "./_components/ItemsBrowse";

export const metadata: Metadata = {
  title: "Browse Items — skintrackr.com",
  description: "Search and filter all CS2 stickers, agents, patches, graffiti, music kits, collectibles, and keys. Live prices from Steam Market.",
};

export default function ItemsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-8">Loading…</div>}>
      <ItemsBrowse />
    </Suspense>
  );
}
```

### Step 3: TS check

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep -E "items/" | head -10
```
Expected: no errors in `items/` files. Pre-existing errors elsewhere can be ignored.

### Step 4: Smoke test in browser (manual)

If frontend dev server runs:
1. Open `http://localhost:3000/items` — should show grid + filter pills
2. Click "Stickers" — URL updates to `?category=sticker`, grid refreshes
3. Type "krakow" in search — debounce, results update
4. Click Next page — URL updates `?page=2`, grid refreshes

If servers aren't running, skip — TypeScript pass is enough verification at this stage.

### Step 5: Commit

```bash
git add frontend/src/app/items/
git commit -m "feat(items): /items browse page (filter + search + pagination + sort)"
```

---

## Task 6: Detail Page `/items/[id]`

**Files:**
- Create: `frontend/src/app/items/[id]/page.tsx`

### Step 1: Create detail page

Create `frontend/src/app/items/[id]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface DetailItem {
  id: number;
  category: 'sticker' | 'agent' | 'patch' | 'graffiti' | 'music_kit' | 'collectible' | 'key';
  name: string;
  marketHashName: string;
  imageUrl: string | null;
  rarity: string | null;
  collection: string | null;
  priceLatest: number | null;
  priceMedian: number | null;
  volume24h: number | null;
  priceUpdatedAt: string | null;
  metadata: Record<string, unknown> | null;
}

const CATEGORY_LABELS: Record<DetailItem['category'], string> = {
  sticker: 'Sticker',
  agent: 'Agent',
  patch: 'Patch',
  graffiti: 'Graffiti',
  music_kit: 'Music Kit',
  collectible: 'Collectible',
  key: 'Key',
};

async function fetchItem(id: string): Promise<DetailItem | null> {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  try {
    const res = await fetch(`${base}/api/v1/market-items/${encodeURIComponent(id)}`, {
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return (await res.json()) as DetailItem;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) {
    return { title: "Item not found — skintrackr.com" };
  }
  return {
    title: `${item.name} — skintrackr.com`,
    description: `${CATEGORY_LABELS[item.category]} ${item.priceLatest != null ? `· €${item.priceLatest.toFixed(2)}` : ''}`.trim(),
  };
}

export default async function ItemDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = await fetchItem(id);
  if (!item) notFound();

  const backHref = `/items?category=${item.category}`;

  return (
    <div className="min-h-screen bg-slate-950 text-white py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        <Button variant="ghost" asChild className="mb-6 text-slate-300 hover:text-white hover:bg-slate-900/50">
          <Link href={backHref} className="inline-flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to {CATEGORY_LABELS[item.category]}s
          </Link>
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="bg-slate-900/60 backdrop-blur border border-slate-700/50">
            <CardContent className="p-6">
              <div className="aspect-square bg-slate-800/40 rounded-md flex items-center justify-center overflow-hidden">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain" />
                ) : (
                  <span className="text-slate-500">No image</span>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-purple-500/30 text-purple-300 bg-purple-500/10">
                {CATEGORY_LABELS[item.category]}
              </Badge>
              {item.rarity && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-300 bg-amber-500/10">
                  {item.rarity}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold">{item.name}</h1>
            {item.collection && <p className="text-slate-400">From: {item.collection}</p>}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Card className="bg-slate-900/60 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="text-slate-400 text-xs mb-1">Current price</div>
                  <div className="text-2xl font-bold text-white">
                    {item.priceLatest != null ? `€${item.priceLatest.toFixed(2)}` : '—'}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="text-slate-400 text-xs mb-1">Median price</div>
                  <div className="text-2xl font-bold text-white">
                    {item.priceMedian != null ? `€${item.priceMedian.toFixed(2)}` : '—'}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="text-slate-400 text-xs mb-1">24h volume</div>
                  <div className="text-2xl font-bold text-white">{item.volume24h ?? '—'}</div>
                </CardContent>
              </Card>
              <Card className="bg-slate-900/60 border-slate-700/50">
                <CardContent className="p-4">
                  <div className="text-slate-400 text-xs mb-1">Last updated</div>
                  <div className="text-sm font-medium text-white">
                    {item.priceUpdatedAt ? new Date(item.priceUpdatedAt).toLocaleString() : '—'}
                  </div>
                </CardContent>
              </Card>
            </div>

            <p className="text-xs text-slate-500 pt-2">
              Market hash name: <code className="bg-slate-900/60 px-2 py-1 rounded">{item.marketHashName}</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Step 2: TS check

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep "items/\[id\]" | head -5
```
Expected: no errors in this file.

### Step 3: Smoke test (manual)

If servers running:
1. Open `http://localhost:3000/items` — click any card
2. Should land on `/items/<id>` with image, name, category badge, 4 KPI cards
3. Click "Back to <category>s" → returns to filtered browse

If servers not running, skip — TypeScript pass + visual inspection of code suffices.

### Step 4: Commit

```bash
git add frontend/src/app/items/[id]/page.tsx
git commit -m "feat(items): /items/[id] detail page (server component, fetch by id)"
```

---

## Task 7: Navigation Link in AppHeader

**Files:**
- Modify: `frontend/src/app/components/AppHeader.tsx`

### Step 1: Add `/items` link

Read `frontend/src/app/components/AppHeader.tsx`. Find the nav section where other top-level links live (`/skins`, `/cases`, `/dashboard`, `/portfolio`).

Add a new link near `Cases`:

```tsx
<Link href="/items" className="text-sm text-slate-300 hover:text-white">Items</Link>
```

Match the exact JSX pattern of neighboring links (same className, same wrapper if any).

If the header has both desktop and mobile nav sections, add the link to both. Read the file in full first.

### Step 2: TS / build check

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep AppHeader | head -5
```
Expected: no output.

### Step 3: Commit

```bash
git add frontend/src/app/components/AppHeader.tsx
git commit -m "feat(items): add /items link to AppHeader nav"
```

---

## Self-Review

**Spec coverage:**
- ✅ `GET /api/v1/market-items` with filters/pagination/sort → Task 1 + 2
- ✅ `GET /api/v1/market-items/:id` detail → Task 1 + 2
- ✅ Invalid category 400 → Task 1
- ✅ `pageSize` cap at 60 → Task 1
- ✅ Free-text `q` (`contains`, case-insensitive) → Task 1
- ✅ `useMarketItems` hook with AbortController → Task 3
- ✅ `ItemCard` component → Task 4
- ✅ `CategoryFilter` pill bar → Task 4
- ✅ `ItemsBrowse` orchestrator with URL sync, debounced search, pagination → Task 5
- ✅ Page metadata (SEO) → Task 5
- ✅ Detail page (server component) → Task 6
- ✅ Nav link → Task 7 (not in spec explicitly but obvious requirement)
- ⏸ Detail page price-history chart — spec mentions "reuse SkinPriceHistoryChart adapted for MarketItem" but explicitly says this is reuse not new build. Adapting that component to accept a generic data source is out of scope for v1 — flag for follow-up. Detail page currently shows 4 KPI cards without chart, matches "v1 minimum useful detail page".
- ⏸ Mobile filter drawer — spec mentions "collapsible drawer on mobile" for filter sidebar. v1 uses inline category pills + search + sort that stack vertically on mobile, no drawer. Acceptable simplification; can add drawer later if user feedback demands it.

**Placeholder scan:** No "TBD" / "fill in details" patterns. All code blocks complete.

**Type consistency:**
- `MarketItem.category` literal union used in hook, ItemCard, CategoryFilter, Detail page. Same 7 values everywhere.
- `Pagination` shape `{ page, pageSize, total, totalPages }` consistent across backend response, hook return, and consumer.
- `SortKey: 'name' | 'price' | 'volume'` matched by VALID_SORTS map keys in controller (`{ name, price, volume }`).
- `params.id: string` from Next 15 Promise-based params — handled with `await params` in detail page.

**Scope:** 7 tasks. Solo-dev estimate: T1 (1d), T2 (0.5d), T3 (0.5d), T4 (0.5d), T5 (0.5d), T6 (0.5d), T7 (15min). Total ~3 days. Fits the target.
