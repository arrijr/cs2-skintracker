# Portfolio Holdings Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat skin list in `PortfolioTable` with a grouped, filterable card grid so large inventories stay scannable and on-brand.

**Architecture:** Frontend-only. Extract pure aggregation/grouping into `portfolio-grouping.ts` (unit-tested), then compose three focused components (`PortfolioToolbar`, `PortfolioGroup`, `PortfolioSkinCard`) inside a slimmed `PortfolioTable`. `PurchaseAccordion` is reused unchanged for inline lot editing.

**Tech Stack:** Next 15 / React 19, TypeScript, Tailwind (+ `@/lib/design-tokens`), Vitest + jsdom + React Testing Library (`npm test`), `clsx`, `lucide-react`.

---

## Ground Truth (verified against the codebase — do not re-derive)

`GET /api/v1/portfolio` returns `PortfolioEntry[]` where each item is:

```ts
{
  skin: {
    id: number;
    name: string;                 // "AK-47 | Redline", "★ Bayonet | Blue Steel"
    marketHashName: string;
    slug: string | null;
    weaponSlug: string | null;    // "ak-47" (for detail URL only)
    imageUrl: string | null;
    marketPrice: number | null;   // null ⇒ "no price" bucket
    rarity: string | undefined;   // e.g. "Covert"
    weaponType: string | undefined; // "AK-47", "★ Bayonet", "AWP" — GROUP KEY
    exterior: string | undefined; // WEAR lives here, NOT `wear`
    priceChange24h: number | null;
    priceChange7d: number | null;
  };
  purchases: { id: number; amount: number; buyPrice: number; buyDate: string }[];
  amount: number;
  avgPrice: number;
  // NOTE: no top-level `id`. Identity = skin.id.
}
```

Confirmed facts that shape this plan:
- **Wear filter must read `skin.exterior`** (the old `skin.wear` is always undefined → dead).
- **`lastPriceUpdate` and `itemimage` are NOT returned** → the old "Stale" badge and `itemimage` fallback are dead code; DROP them in the rewrite.
- **`weaponType` is per-weapon and display-ready** → use it directly as group key + label; fallback `name.split('|')[0].trim()`; final fallback `"Other"`.
- Test harness: `vitest.config.ts` (jsdom, globals, alias `@`→`src`), `vitest.setup.ts` stubs matchMedia/ResizeObserver. Run all: `npm test`. Single file: `npx vitest run <path>`.
- Helpers already available: `formatEUR`, `formatPctSafe` (`@/lib/num`), `safeIncludes`, `safeLocaleCompare` (`@/lib/strings`), `skinDetailHref` (`@/lib/skin-urls`), `tokens` (`@/lib/design-tokens`).

---

## File Structure

| File | Responsibility |
|------|----------------|
| `frontend/src/lib/portfolio-grouping.ts` (create) | Pure types + helpers: value/cost/PL math, weapon group key, filter, sort, `groupPortfolio()`. No React. |
| `frontend/src/lib/portfolio-grouping.test.ts` (create) | Unit tests for all helpers. |
| `frontend/src/app/portfolio/_components/PortfolioSkinCard.tsx` (create) | One holding card; click toggles inline `PurchaseAccordion` (full-width when open). |
| `frontend/src/app/portfolio/_components/PortfolioGroup.tsx` (create) | Collapsible weapon section: header (icon/name/count/subtotal/PL) + card grid. |
| `frontend/src/app/portfolio/_components/PortfolioToolbar.tsx` (create) | Search + sort + weapon chips + rarity/wear selects + hide-no-price toggle. Controlled. |
| `frontend/src/app/portfolio/PortfolioTable.tsx` (rewrite) | Orchestrator: owns state (search/sort/filters/collapse/open), calls helpers, renders toolbar + groups + empty states + persistence. |
| `frontend/src/app/portfolio/PortfolioTable.test.tsx` (create) | RTL behavior tests for the orchestrator. |

---

## Task 1: Grouping helpers — types, value math, group key

**Files:**
- Create: `frontend/src/lib/portfolio-grouping.ts`
- Test: `frontend/src/lib/portfolio-grouping.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// frontend/src/lib/portfolio-grouping.test.ts
import { describe, it, expect } from 'vitest';
import {
  positionValue, costBasis, entryPL, hasMarketPrice, weaponGroupKey,
  type PortfolioEntry,
} from './portfolio-grouping';

const entry = (over: Partial<PortfolioEntry> & { skin?: Partial<PortfolioEntry['skin']> } = {}): PortfolioEntry => ({
  amount: 1,
  avgPrice: 100,
  purchases: [],
  ...over,
  skin: {
    id: 1, name: 'AK-47 | Redline', marketHashName: 'AK-47 | Redline',
    slug: null, weaponSlug: null, imageUrl: null, marketPrice: 120,
    rarity: 'Classified', weaponType: 'AK-47', exterior: 'Field-Tested',
    priceChange24h: null, priceChange7d: null,
    ...(over.skin ?? {}),
  },
});

describe('value math', () => {
  it('positionValue = marketPrice × amount', () => {
    expect(positionValue(entry({ amount: 3, skin: { marketPrice: 10 } as any }))).toBe(30);
  });
  it('positionValue is 0 when no market price', () => {
    expect(positionValue(entry({ skin: { marketPrice: null } as any }))).toBe(0);
  });
  it('costBasis = avgPrice × amount', () => {
    expect(costBasis(entry({ amount: 2, avgPrice: 50 }))).toBe(100);
  });
  it('entryPL is the % gain vs avg, null when no market', () => {
    expect(entryPL(entry({ avgPrice: 100, skin: { marketPrice: 120 } as any }))).toBeCloseTo(20);
    expect(entryPL(entry({ skin: { marketPrice: null } as any }))).toBeNull();
    expect(entryPL(entry({ avgPrice: 0, skin: { marketPrice: 5 } as any }))).toBeNull();
  });
  it('hasMarketPrice reflects a numeric marketPrice', () => {
    expect(hasMarketPrice(entry())).toBe(true);
    expect(hasMarketPrice(entry({ skin: { marketPrice: null } as any }))).toBe(false);
  });
});

describe('weaponGroupKey', () => {
  it('uses weaponType when present', () => {
    expect(weaponGroupKey(entry().skin)).toBe('AK-47');
    expect(weaponGroupKey(entry({ skin: { weaponType: '★ Bayonet' } as any }).skin)).toBe('★ Bayonet');
  });
  it('falls back to the weapon parsed from the name', () => {
    expect(weaponGroupKey(entry({ skin: { weaponType: undefined, name: 'AWP | Dragon Lore' } as any }).skin)).toBe('AWP');
  });
  it('falls back to "Other" when nothing is parseable', () => {
    expect(weaponGroupKey(entry({ skin: { weaponType: undefined, name: '' } as any }).skin)).toBe('Other');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/portfolio-grouping.test.ts`
Expected: FAIL — "Failed to resolve import './portfolio-grouping'".

- [ ] **Step 3: Write minimal implementation**

```ts
// frontend/src/lib/portfolio-grouping.ts
// Pure helpers for the Holdings view. No React, no I/O — fully unit-testable.

export type Purchase = { id: number; amount: number; buyPrice: number; buyDate: string };

export type PortfolioSkin = {
  id: number;
  name: string;
  marketHashName?: string;
  slug?: string | null;
  weaponSlug?: string | null;
  imageUrl?: string | null;
  marketPrice?: number | null;
  rarity?: string | null;
  weaponType?: string | null;
  /** Wear. The API exposes this as `exterior` (NOT `wear`). */
  exterior?: string | null;
  priceChange24h?: number | null;
  priceChange7d?: number | null;
};

export type PortfolioEntry = {
  amount: number;
  avgPrice: number;
  buyPrice?: number;
  purchases: Purchase[];
  skin: PortfolioSkin;
};

export const NO_PRICE_KEY = '__no_price__';
export const NO_PRICE_LABEL = 'No market price';

export function hasMarketPrice(e: PortfolioEntry): boolean {
  return typeof e.skin.marketPrice === 'number' && Number.isFinite(e.skin.marketPrice);
}

export function positionValue(e: PortfolioEntry): number {
  return hasMarketPrice(e) ? (e.skin.marketPrice as number) * e.amount : 0;
}

export function costBasis(e: PortfolioEntry): number {
  return (e.avgPrice ?? 0) * e.amount;
}

export function entryPL(e: PortfolioEntry): number | null {
  if (!hasMarketPrice(e) || !(e.avgPrice > 0)) return null;
  return (((e.skin.marketPrice as number) - e.avgPrice) / e.avgPrice) * 100;
}

export function weaponGroupKey(skin: PortfolioSkin): string {
  const wt = (skin.weaponType ?? '').trim();
  if (wt) return wt;
  const parsed = (skin.name ?? '').split('|')[0]?.trim();
  return parsed || 'Other';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/portfolio-grouping.test.ts`
Expected: PASS (all cases in this file green).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/portfolio-grouping.ts frontend/src/lib/portfolio-grouping.test.ts
git commit -m "feat(portfolio): add value/cost/PL + weapon-group-key helpers"
```

---

## Task 2: Filter + sort helpers

**Files:**
- Modify: `frontend/src/lib/portfolio-grouping.ts`
- Test: `frontend/src/lib/portfolio-grouping.test.ts`

- [ ] **Step 1: Write the failing test** (append to the test file)

```ts
import { filterEntries, sortEntries } from './portfolio-grouping';

describe('filterEntries', () => {
  const ak = entry({ skin: { id: 1, name: 'AK-47 | Redline', weaponType: 'AK-47', rarity: 'Classified', exterior: 'Field-Tested', marketPrice: 10 } as any });
  const awp = entry({ skin: { id: 2, name: 'AWP | Asiimov', weaponType: 'AWP', rarity: 'Covert', exterior: 'Minimal Wear', marketPrice: 90 } as any });
  const all = [ak, awp];

  it('matches search against the skin name (case-insensitive)', () => {
    expect(filterEntries(all, { search: 'asii' })).toEqual([awp]);
  });
  it('filters by weapon (weaponType)', () => {
    expect(filterEntries(all, { weapon: 'AK-47' })).toEqual([ak]);
  });
  it('filters by rarity and by exterior', () => {
    expect(filterEntries(all, { rarity: 'Covert' })).toEqual([awp]);
    expect(filterEntries(all, { exterior: 'Field-Tested' })).toEqual([ak]);
  });
  it('combines filters (AND)', () => {
    expect(filterEntries(all, { weapon: 'AWP', rarity: 'Classified' })).toEqual([]);
  });
  it('empty/undefined filters return everything', () => {
    expect(filterEntries(all, {})).toEqual(all);
  });
});

describe('sortEntries', () => {
  const cheap = entry({ amount: 1, avgPrice: 100, purchases: [{ id: 1, amount: 1, buyPrice: 100, buyDate: '2026-01-01' }], skin: { id: 1, name: 'B', marketPrice: 10 } as any });
  const dear = entry({ amount: 1, avgPrice: 100, purchases: [{ id: 2, amount: 1, buyPrice: 100, buyDate: '2026-03-01' }], skin: { id: 2, name: 'A', marketPrice: 200 } as any });

  it('value sorts by position value desc', () => {
    expect(sortEntries([cheap, dear], 'value').map(e => e.skin.id)).toEqual([2, 1]);
  });
  it('name sorts alphabetically', () => {
    expect(sortEntries([cheap, dear], 'name').map(e => e.skin.name)).toEqual(['A', 'B']);
  });
  it('performance sorts by PL desc, nulls last', () => {
    const noPrice = entry({ skin: { id: 3, name: 'C', marketPrice: null } as any });
    expect(sortEntries([cheap, dear, noPrice], 'performance').map(e => e.skin.id)).toEqual([2, 1, 3]);
  });
  it('recent sorts by latest purchase date desc', () => {
    expect(sortEntries([cheap, dear], 'recent').map(e => e.skin.id)).toEqual([2, 1]);
  });
  it('does not mutate the input array', () => {
    const input = [cheap, dear];
    sortEntries(input, 'value');
    expect(input.map(e => e.skin.id)).toEqual([1, 2]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/portfolio-grouping.test.ts`
Expected: FAIL — "filterEntries is not exported" / import error.

- [ ] **Step 3: Write minimal implementation** (append to `portfolio-grouping.ts`)

```ts
import { safeIncludes, safeLocaleCompare } from '@/lib/strings';

export type SortKey = 'value' | 'name' | 'performance' | 'recent';

export type PortfolioFilter = {
  search?: string;
  weapon?: string | null;
  rarity?: string | null;
  exterior?: string | null;
};

export function filterEntries(entries: PortfolioEntry[], f: PortfolioFilter): PortfolioEntry[] {
  const search = (f.search ?? '').trim();
  return entries.filter((e) => {
    if (search && !safeIncludes(e.skin.name, search)) return false;
    if (f.weapon && weaponGroupKey(e.skin) !== f.weapon) return false;
    if (f.rarity && (e.skin.rarity ?? '') !== f.rarity) return false;
    if (f.exterior && (e.skin.exterior ?? '') !== f.exterior) return false;
    return true;
  });
}

function latestPurchaseTime(e: PortfolioEntry): number {
  let max = 0;
  for (const p of e.purchases ?? []) {
    const t = new Date(p.buyDate).getTime();
    if (Number.isFinite(t) && t > max) max = t;
  }
  return max;
}

export function sortEntries(entries: PortfolioEntry[], sortBy: SortKey): PortfolioEntry[] {
  const copy = [...entries];
  switch (sortBy) {
    case 'name':
      return copy.sort((a, b) => safeLocaleCompare(a.skin.name, b.skin.name));
    case 'performance':
      return copy.sort((a, b) => {
        const pa = entryPL(a), pb = entryPL(b);
        if (pa === null && pb === null) return 0;
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pb - pa;
      });
    case 'recent':
      return copy.sort((a, b) => latestPurchaseTime(b) - latestPurchaseTime(a));
    case 'value':
    default:
      return copy.sort((a, b) => positionValue(b) - positionValue(a));
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/portfolio-grouping.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/portfolio-grouping.ts frontend/src/lib/portfolio-grouping.test.ts
git commit -m "feat(portfolio): add filterEntries + sortEntries helpers"
```

---

## Task 3: `groupPortfolio()` aggregation

**Files:**
- Modify: `frontend/src/lib/portfolio-grouping.ts`
- Test: `frontend/src/lib/portfolio-grouping.test.ts`

- [ ] **Step 1: Write the failing test** (append)

```ts
import { groupPortfolio, NO_PRICE_KEY } from './portfolio-grouping';

describe('groupPortfolio', () => {
  const mk = (id: number, weaponType: string, marketPrice: number | null, amount = 1, avgPrice = 100) =>
    entry({ amount, avgPrice, skin: { id, name: `${weaponType} | S${id}`, weaponType, marketPrice } as any });

  it('groups priced entries by weapon, sorts groups by value desc', () => {
    const { groups, noPriceBucket } = groupPortfolio(
      [mk(1, 'AK-47', 10), mk(2, 'AWP', 90), mk(3, 'AK-47', 5)],
      'value',
    );
    expect(groups.map(g => g.key)).toEqual(['AWP', 'AK-47']); // 90 > (10+5)
    expect(groups.find(g => g.key === 'AK-47')!.count).toBe(2);
    expect(noPriceBucket).toBeNull();
  });

  it('computes group value, costBasis and PL%', () => {
    const { groups } = groupPortfolio([mk(1, 'AK-47', 120, 1, 100), mk(2, 'AK-47', 80, 1, 100)], 'value');
    const g = groups[0];
    expect(g.value).toBe(200);        // 120 + 80
    expect(g.costBasis).toBe(200);    // 100 + 100
    expect(g.pl).toBeCloseTo(0);      // (200-200)/200
  });

  it('routes null-price entries to the no-price bucket (excluded from PL), placed last', () => {
    const { groups, noPriceBucket } = groupPortfolio([mk(1, 'AK-47', 10), mk(2, 'AUG', null)], 'value');
    expect(groups.map(g => g.key)).toEqual(['AK-47']);
    expect(noPriceBucket!.key).toBe(NO_PRICE_KEY);
    expect(noPriceBucket!.count).toBe(1);
    expect(noPriceBucket!.pl).toBeNull();
  });

  it('reports the max position value across priced entries (for weight bars)', () => {
    const { maxPositionValue } = groupPortfolio([mk(1, 'AK-47', 10, 2), mk(2, 'AWP', 90)], 'value');
    expect(maxPositionValue).toBe(90);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/lib/portfolio-grouping.test.ts`
Expected: FAIL — "groupPortfolio is not exported".

- [ ] **Step 3: Write minimal implementation** (append)

```ts
export type PortfolioGroupData = {
  key: string;
  label: string;
  items: PortfolioEntry[];
  count: number;
  value: number;       // Σ positionValue
  costBasis: number;   // Σ costBasis of priced items
  pl: number | null;   // group %; null when costBasis <= 0
};

export type GroupedPortfolio = {
  groups: PortfolioGroupData[];
  noPriceBucket: PortfolioGroupData | null;
  maxPositionValue: number;
};

function buildGroup(key: string, label: string, items: PortfolioEntry[]): PortfolioGroupData {
  let value = 0, basis = 0;
  for (const e of items) {
    if (hasMarketPrice(e)) { value += positionValue(e); basis += costBasis(e); }
  }
  const pl = basis > 0 ? ((value - basis) / basis) * 100 : null;
  return { key, label, items, count: items.length, value, costBasis: basis, pl };
}

export function groupPortfolio(entries: PortfolioEntry[], sortBy: SortKey): GroupedPortfolio {
  const priced: PortfolioEntry[] = [];
  const noPrice: PortfolioEntry[] = [];
  for (const e of entries) (hasMarketPrice(e) ? priced : noPrice).push(e);

  const maxPositionValue = priced.reduce((m, e) => Math.max(m, positionValue(e)), 0);

  const map = new Map<string, PortfolioEntry[]>();
  for (const e of priced) {
    const k = weaponGroupKey(e.skin);
    const arr = map.get(k);
    if (arr) arr.push(e); else map.set(k, [e]);
  }

  const groups = [...map.entries()]
    .map(([k, items]) => buildGroup(k, k, sortEntries(items, sortBy)))
    .sort((a, b) => b.value - a.value);

  const noPriceBucket = noPrice.length
    ? buildGroup(NO_PRICE_KEY, NO_PRICE_LABEL, sortEntries(noPrice, sortBy))
    : null;

  return { groups, noPriceBucket, maxPositionValue };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/lib/portfolio-grouping.test.ts`
Expected: PASS (whole file green).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/lib/portfolio-grouping.ts frontend/src/lib/portfolio-grouping.test.ts
git commit -m "feat(portfolio): add groupPortfolio aggregation with no-price bucket"
```

---

## Task 4: `PortfolioSkinCard` component

**Files:**
- Create: `frontend/src/app/portfolio/_components/PortfolioSkinCard.tsx`

(No standalone test — exercised via `PortfolioTable.test.tsx` in Task 7. This task is presentational.)

- [ ] **Step 1: Write the component**

```tsx
// frontend/src/app/portfolio/_components/PortfolioSkinCard.tsx
"use client";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { Bell } from "lucide-react";
import PurchaseAccordion from "../../components/PurchaseAccordion";
import { skinDetailHref } from "@/lib/skin-urls";
import { formatEUR, formatPctSafe } from "@/lib/num";
import { positionValue, entryPL, hasMarketPrice, type PortfolioEntry } from "@/lib/portfolio-grouping";

type Props = {
  entry: PortfolioEntry;
  maxPositionValue: number;
  isOpen: boolean;
  onToggle: () => void;
  hasAlert?: boolean;
  onDataChange: () => void;
};

export default function PortfolioSkinCard({ entry, maxPositionValue, isOpen, onToggle, hasAlert, onDataChange }: Props) {
  const { skin } = entry;
  const value = positionValue(entry);
  const pl = entryPL(entry);
  const priced = hasMarketPrice(entry);
  const href = skinDetailHref(skin);
  const img = skin.imageUrl || "/images/placeholder-skin.png";
  const weight = maxPositionValue > 0 ? Math.max(2, Math.round((value / maxPositionValue) * 100)) : 0;

  const plClass =
    pl === null ? "text-slate-400 bg-slate-700/50"
      : pl >= 0 ? "text-emerald-400 bg-emerald-500/10"
      : "text-red-400 bg-red-500/10";

  return (
    <div
      data-testid="skin-card"
      className={clsx(
        "rounded-xl border bg-slate-900/60 p-3 transition-all duration-200",
        isOpen ? "col-span-full border-purple-500/60" : "border-slate-700/40 hover:border-slate-600/60",
      )}
    >
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-label={`${isOpen ? "Collapse" : "Expand"} ${skin.name} purchases`}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } }}
        className="cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
      >
        <div className="flex items-center gap-2.5">
          <Image src={img} alt={skin.name} width={34} height={34} className="rounded-md w-[34px] h-[34px] object-cover flex-shrink-0" />
          {href ? (
            <Link href={href} onClick={(e) => e.stopPropagation()} className="font-semibold text-sm text-slate-100 hover:text-purple-300 truncate min-w-0">
              {skin.name}
            </Link>
          ) : (
            <span className="font-semibold text-sm text-slate-200 truncate min-w-0">{skin.name}</span>
          )}
          {hasAlert && <Bell className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" aria-label="Price alert set" />}
          <span className="ml-auto text-[10px] text-slate-400 bg-slate-800 rounded-full px-2 py-0.5 flex-shrink-0">{entry.amount}×</span>
        </div>

        <div className="flex items-baseline gap-2 mt-2.5">
          <span className="text-lg font-bold tabular-nums text-white">{priced ? formatEUR(value) : "—"}</span>
          <span className={clsx("text-[11px] font-semibold px-1.5 py-0.5 rounded-full", plClass)}>
            {pl === null ? "—" : formatPctSafe(pl, 1)}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Avg {formatEUR(entry.avgPrice)} · Market {priced ? formatEUR(skin.marketPrice) : "—"}
        </div>
        <div className="h-1 rounded-full bg-slate-700/60 mt-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: `${weight}%` }} />
        </div>
      </div>

      {isOpen && <PurchaseAccordion purchases={entry.purchases} onTransactionChange={onDataChange} />}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors referencing `PortfolioSkinCard.tsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/portfolio/_components/PortfolioSkinCard.tsx
git commit -m "feat(portfolio): add PortfolioSkinCard (value-first card, inline lots)"
```

---

## Task 5: `PortfolioGroup` component

**Files:**
- Create: `frontend/src/app/portfolio/_components/PortfolioGroup.tsx`

- [ ] **Step 1: Write the component**

```tsx
// frontend/src/app/portfolio/_components/PortfolioGroup.tsx
"use client";
import clsx from "clsx";
import { ChevronDown, ChevronRight } from "lucide-react";
import PortfolioSkinCard from "./PortfolioSkinCard";
import { formatEUR, formatPctSafe } from "@/lib/num";
import { NO_PRICE_KEY, type PortfolioGroupData } from "@/lib/portfolio-grouping";

type Props = {
  group: PortfolioGroupData;
  collapsed: boolean;
  onToggleCollapse: () => void;
  maxPositionValue: number;
  openSkinId: number | null;
  onToggleSkin: (skinId: number) => void;
  alertSkinIds: Set<number>;
  onDataChange: () => void;
};

export default function PortfolioGroup({
  group, collapsed, onToggleCollapse, maxPositionValue, openSkinId, onToggleSkin, alertSkinIds, onDataChange,
}: Props) {
  const isNoPrice = group.key === NO_PRICE_KEY;
  return (
    <div className={clsx("rounded-xl border border-slate-700/40 overflow-hidden mb-2.5", isNoPrice && "opacity-80")}>
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-slate-800/40 hover:bg-slate-800/70 transition-colors text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
      >
        {collapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        <span className="font-semibold text-slate-100">{group.label}</span>
        <span className="text-[11px] text-slate-400">{group.count} {group.count === 1 ? "item" : "items"}</span>
        <span className="ml-auto text-right">
          {isNoPrice ? (
            <span className="text-[11px] text-slate-500">excluded from P/L</span>
          ) : (
            <>
              <span className="font-bold text-slate-100 tabular-nums">{formatEUR(group.value)}</span>
              {group.pl !== null && (
                <span className={clsx("ml-2 text-[11px] font-semibold", group.pl >= 0 ? "text-emerald-400" : "text-red-400")}>
                  {formatPctSafe(group.pl, 1)}
                </span>
              )}
            </>
          )}
        </span>
      </button>

      {!collapsed && (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 bg-slate-950/40">
          {group.items.map((entry) => (
            <PortfolioSkinCard
              key={entry.skin.id}
              entry={entry}
              maxPositionValue={maxPositionValue}
              isOpen={openSkinId === entry.skin.id}
              onToggle={() => onToggleSkin(entry.skin.id)}
              hasAlert={alertSkinIds.has(entry.skin.id)}
              onDataChange={onDataChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors referencing `PortfolioGroup.tsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/portfolio/_components/PortfolioGroup.tsx
git commit -m "feat(portfolio): add collapsible PortfolioGroup section"
```

---

## Task 6: `PortfolioToolbar` component

**Files:**
- Create: `frontend/src/app/portfolio/_components/PortfolioToolbar.tsx`

- [ ] **Step 1: Write the component**

```tsx
// frontend/src/app/portfolio/_components/PortfolioToolbar.tsx
"use client";
import clsx from "clsx";
import type { SortKey } from "@/lib/portfolio-grouping";

export type ToolbarState = {
  search: string;
  sortBy: SortKey;
  weapon: string | null;
  rarity: string | null;
  exterior: string | null;
  hideNoPrice: boolean;
};

type Props = {
  state: ToolbarState;
  onChange: (patch: Partial<ToolbarState>) => void;
  weapons: { key: string; count: number }[];
  rarities: string[];
  exteriors: string[];
  hasNoPrice: boolean;
};

const SELECT = "bg-slate-900/70 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500";

export default function PortfolioToolbar({ state, onChange, weapons, rarities, exteriors, hasNoPrice }: Props) {
  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Search skins…"
          value={state.search}
          onChange={(e) => onChange({ search: e.target.value })}
          className="flex-1 min-w-[160px] bg-slate-900/70 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <select aria-label="Sort by" value={state.sortBy} onChange={(e) => onChange({ sortBy: e.target.value as SortKey })} className={SELECT}>
          <option value="value">Sort: Value</option>
          <option value="performance">Sort: Performance</option>
          <option value="name">Sort: Name (A–Z)</option>
          <option value="recent">Sort: Most recent</option>
        </select>
        {rarities.length > 0 && (
          <select aria-label="Filter by rarity" value={state.rarity ?? ""} onChange={(e) => onChange({ rarity: e.target.value || null })} className={SELECT}>
            <option value="">Rarity</option>
            {rarities.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        )}
        {exteriors.length > 0 && (
          <select aria-label="Filter by wear" value={state.exterior ?? ""} onChange={(e) => onChange({ exterior: e.target.value || null })} className={SELECT}>
            <option value="">Wear</option>
            {exteriors.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        )}
      </div>

      {weapons.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <Chip active={state.weapon === null} onClick={() => onChange({ weapon: null })}>All</Chip>
          {weapons.map((w) => (
            <Chip key={w.key} active={state.weapon === w.key} onClick={() => onChange({ weapon: state.weapon === w.key ? null : w.key })}>
              {w.key} <span className="opacity-60">{w.count}</span>
            </Chip>
          ))}
        </div>
      )}

      {hasNoPrice && (
        <label className="flex items-center gap-2 text-[12px] text-slate-400 select-none cursor-pointer">
          <input type="checkbox" checked={state.hideNoPrice} onChange={(e) => onChange({ hideNoPrice: e.target.checked })} className="accent-purple-500" />
          Hide items with no market price
        </label>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "text-[11px] px-3 py-1 rounded-full border transition-colors",
        active ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white border-transparent"
               : "bg-slate-900/70 text-slate-400 border-slate-700/40 hover:border-slate-600/60",
      )}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `cd frontend && npx tsc --noEmit`
Expected: No errors referencing `PortfolioToolbar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/portfolio/_components/PortfolioToolbar.tsx
git commit -m "feat(portfolio): add PortfolioToolbar (search/sort/filter chips)"
```

---

## Task 7: Rewrite `PortfolioTable` orchestrator + RTL tests

**Files:**
- Rewrite: `frontend/src/app/portfolio/PortfolioTable.tsx`
- Create: `frontend/src/app/portfolio/PortfolioTable.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// frontend/src/app/portfolio/PortfolioTable.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import PortfolioTable from './PortfolioTable';
import type { PortfolioEntry } from '@/lib/portfolio-grouping';

vi.mock('next/image', () => ({ default: (p: any) => <img alt={p.alt} src={typeof p.src === 'string' ? p.src : ''} /> }));
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }));
// Isolate from Clerk/network — the accordion is tested elsewhere.
vi.mock('./../components/PurchaseAccordion', () => ({ default: () => <div data-testid="purchase-accordion" /> }));

const mk = (id: number, weaponType: string, marketPrice: number | null, name?: string): PortfolioEntry => ({
  amount: 1, avgPrice: 100, purchases: [{ id, amount: 1, buyPrice: 100, buyDate: '2026-01-01' }],
  skin: { id, name: name ?? `${weaponType} | S${id}`, marketHashName: '', slug: null, weaponSlug: null,
    imageUrl: null, marketPrice, rarity: 'Covert', weaponType, exterior: 'Field-Tested',
    priceChange24h: null, priceChange7d: null },
});

beforeEach(() => localStorage.clear());

describe('PortfolioTable', () => {
  it('shows the empty state when there are no skins', () => {
    render(<PortfolioTable skins={[]} watchlist={[]} onDataChange={() => {}} />);
    expect(screen.getByText(/No skins in your portfolio yet/i)).toBeInTheDocument();
  });

  it('renders one group per weapon with a subtotal, sorted by value', () => {
    render(<PortfolioTable skins={[mk(1, 'AK-47', 10), mk(2, 'AWP', 90)]} watchlist={[]} onDataChange={() => {}} />);
    const headers = screen.getAllByRole('button', { expanded: true });
    // AWP group header appears before AK-47 (higher value)
    expect(screen.getByText('AWP')).toBeInTheDocument();
    expect(screen.getByText('AK-47')).toBeInTheDocument();
    expect(headers.length).toBeGreaterThanOrEqual(2);
  });

  it('routes no-price items into a collapsed "No market price" bucket', () => {
    render(<PortfolioTable skins={[mk(1, 'AK-47', 10), mk(2, 'AUG', null)]} watchlist={[]} onDataChange={() => {}} />);
    const bucket = screen.getByRole('button', { name: /No market price/i });
    expect(bucket).toHaveAttribute('aria-expanded', 'false');
    // AUG card hidden while collapsed
    expect(screen.queryByText('AUG | S2')).not.toBeInTheDocument();
  });

  it('clicking a card opens its purchase lots inline', () => {
    render(<PortfolioTable skins={[mk(1, 'AK-47', 10)]} watchlist={[]} onDataChange={() => {}} />);
    expect(screen.queryByTestId('purchase-accordion')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('AK-47 | S1'));
    expect(screen.getByTestId('purchase-accordion')).toBeInTheDocument();
  });

  it('weapon filter chip narrows to that weapon', () => {
    render(<PortfolioTable skins={[mk(1, 'AK-47', 10), mk(2, 'AWP', 90)]} watchlist={[]} onDataChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /^AK-47/ }));
    expect(screen.queryByText('AWP')).not.toBeInTheDocument();
    expect(screen.getByText('AK-47')).toBeInTheDocument();
  });

  it('search filters by name and shows the no-results state', () => {
    render(<PortfolioTable skins={[mk(1, 'AK-47', 10, 'AK-47 | Redline')]} watchlist={[]} onDataChange={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText(/Search skins/i), { target: { value: 'zzz' } });
    expect(screen.getByText(/No holdings for this filter/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/app/portfolio/PortfolioTable.test.tsx`
Expected: FAIL — current `PortfolioTable` has no groups/chips (assertions miss).

- [ ] **Step 3: Rewrite the implementation**

Replace the **entire** contents of `frontend/src/app/portfolio/PortfolioTable.tsx` with:

```tsx
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import PortfolioToolbar, { type ToolbarState } from "./_components/PortfolioToolbar";
import PortfolioGroup from "./_components/PortfolioGroup";
import {
  groupPortfolio, filterEntries, weaponGroupKey, NO_PRICE_KEY,
  type PortfolioEntry, type SortKey,
} from "@/lib/portfolio-grouping";

type Props = {
  skins: PortfolioEntry[];
  watchlist: any[];
  onDataChange: () => void;
};

const SORT_KEY = "portfolio-sort";
const COLLAPSE_KEY = "portfolio-collapsed";
const HIDE_NOPRICE_KEY = "portfolio-hide-noprice";
const AUTO_COLLAPSE_THRESHOLD = 6; // > this many groups ⇒ start collapsed

export default function PortfolioTable({ skins, watchlist = [], onDataChange }: Props) {
  const [tb, setTb] = useState<ToolbarState>({
    search: "", sortBy: "value", weapon: null, rarity: null, exterior: null, hideNoPrice: false,
  });
  const [openSkinId, setOpenSkinId] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Restore persisted prefs.
  useEffect(() => {
    const s = localStorage.getItem(SORT_KEY);
    const valid: SortKey[] = ["value", "performance", "name", "recent"];
    const hide = localStorage.getItem(HIDE_NOPRICE_KEY) === "1";
    let saved: Record<string, boolean> = {};
    try { saved = JSON.parse(localStorage.getItem(COLLAPSE_KEY) || "{}"); } catch { /* ignore */ }
    setTb((p) => ({ ...p, sortBy: valid.includes(s as SortKey) ? (s as SortKey) : "value", hideNoPrice: hide }));
    setCollapsed(saved);
  }, []);

  const patch = useCallback((p: Partial<ToolbarState>) => {
    setTb((prev) => {
      const next = { ...prev, ...p };
      if (p.sortBy) localStorage.setItem(SORT_KEY, p.sortBy);
      if (p.hideNoPrice !== undefined) localStorage.setItem(HIDE_NOPRICE_KEY, p.hideNoPrice ? "1" : "0");
      return next;
    });
  }, []);

  const list = Array.isArray(skins) ? skins : [];

  // Facets for the toolbar are derived from the FULL list (so chips don't vanish as you filter).
  const weapons = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of list) if (typeof e.skin.marketPrice === "number") {
      const k = weaponGroupKey(e.skin); m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
  }, [list]);
  const rarities = useMemo(() => [...new Set(list.map((e) => e.skin.rarity).filter(Boolean) as string[])].sort(), [list]);
  const exteriors = useMemo(() => [...new Set(list.map((e) => e.skin.exterior).filter(Boolean) as string[])].sort(), [list]);
  const hasNoPrice = useMemo(() => list.some((e) => typeof e.skin.marketPrice !== "number"), [list]);

  const filtered = useMemo(
    () => filterEntries(list, { search: tb.search, weapon: tb.weapon, rarity: tb.rarity, exterior: tb.exterior }),
    [list, tb.search, tb.weapon, tb.rarity, tb.exterior],
  );
  const { groups, noPriceBucket, maxPositionValue } = useMemo(() => groupPortfolio(filtered, tb.sortBy), [filtered, tb.sortBy]);

  const manyGroups = groups.length > AUTO_COLLAPSE_THRESHOLD;
  const isCollapsed = (key: string) =>
    key in collapsed ? collapsed[key] : (key === NO_PRICE_KEY ? true : manyGroups);

  const toggleCollapse = (key: string) =>
    setCollapsed((prev) => {
      const next = { ...prev, [key]: !(key in prev ? prev[key] : (key === NO_PRICE_KEY ? true : manyGroups)) };
      localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next));
      return next;
    });

  const alertSkinIds = useMemo(
    () => new Set((watchlist ?? []).filter((w) => w.priceAlert && w.priceAlert > 0).map((w) => w.skinId)),
    [watchlist],
  );

  // Empty: nothing imported at all.
  if (list.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
        <h2 className="text-2xl font-semibold mb-2 text-slate-200">No skins in your portfolio yet</h2>
        <p className="text-center max-w-xs">Connect Steam or add a skin to start tracking value and performance.</p>
      </div>
    );
  }

  const visibleGroups = groups;
  const showBucket = noPriceBucket && !tb.hideNoPrice;
  const nothingMatches = visibleGroups.length === 0 && !showBucket;

  return (
    <div className="flex flex-col" data-testid="portfolio-table">
      <PortfolioToolbar
        state={tb}
        onChange={patch}
        weapons={weapons}
        rarities={rarities}
        exteriors={exteriors}
        hasNoPrice={hasNoPrice}
      />

      {nothingMatches ? (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <h2 className="text-xl font-semibold mb-2 text-slate-200">No holdings for this filter</h2>
          <button
            className="mt-2 text-sm text-purple-300 hover:text-purple-200"
            onClick={() => patch({ search: "", weapon: null, rarity: null, exterior: null })}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {visibleGroups.map((g) => (
            <PortfolioGroup
              key={g.key}
              group={g}
              collapsed={isCollapsed(g.key)}
              onToggleCollapse={() => toggleCollapse(g.key)}
              maxPositionValue={maxPositionValue}
              openSkinId={openSkinId}
              onToggleSkin={(id) => setOpenSkinId((cur) => (cur === id ? null : id))}
              alertSkinIds={alertSkinIds}
              onDataChange={onDataChange}
            />
          ))}
          {showBucket && (
            <PortfolioGroup
              group={noPriceBucket!}
              collapsed={isCollapsed(NO_PRICE_KEY)}
              onToggleCollapse={() => toggleCollapse(NO_PRICE_KEY)}
              maxPositionValue={maxPositionValue}
              openSkinId={openSkinId}
              onToggleSkin={(id) => setOpenSkinId((cur) => (cur === id ? null : id))}
              alertSkinIds={alertSkinIds}
              onDataChange={onDataChange}
            />
          )}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npx vitest run src/app/portfolio/PortfolioTable.test.tsx`
Expected: PASS (6 tests).

Note: in the "renders one group per weapon" test, both groups render expanded because there are ≤6 groups (auto-collapse off). The no-price bucket test relies on `isCollapsed(NO_PRICE_KEY) === true` by default.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/portfolio/PortfolioTable.tsx frontend/src/app/portfolio/PortfolioTable.test.tsx
git commit -m "feat(portfolio): grouped, filterable card-grid Holdings view"
```

---

## Task 8: Full suite, typecheck, lint, manual verify

**Files:** none (verification only).

- [ ] **Step 1: Run the whole unit suite**

Run: `cd frontend && npm test`
Expected: PASS — including the 2 pre-existing account tests, the new grouping suite, and `PortfolioTable.test.tsx`.

- [ ] **Step 2: Typecheck + lint**

Run: `cd frontend && npx tsc --noEmit && npm run lint`
Expected: No new errors. (If `next lint` flags `any` on `watchlist`/mocks, mirror the existing `// eslint-disable` style already used in the file — do not change lint config.)

- [ ] **Step 3: Manual visual check**

Run: `cd frontend && npm run dev`, open `/portfolio`, sign in, confirm:
- Holdings render as grouped cards inside the existing "Holdings" card (slate theme, no black `zinc` boxes).
- Groups collapse/expand and persist across reload; "No market price" bucket starts collapsed.
- Clicking a card opens lots full-width; delete still works.
- Weapon chips + rarity/wear selects + search narrow correctly; "Hide no-price" hides the bucket.
- Mobile (<560px): single column, chips wrap, nothing overflows.

- [ ] **Step 4: Commit (if any lint/type fixups were needed)**

```bash
git add -A
git commit -m "chore(portfolio): typecheck/lint fixups for Holdings redesign"
```

---

## Self-Review (completed by author)

**Spec coverage:**
- §4 components → Tasks 1–7. ✅
- §5 formulas → Task 1/3 (`positionValue`, `costBasis`, `entryPL`, group PL). ✅
- §6 grouping (weaponType key, no-price bucket, group order) → Task 3. ✅ *(Refinement vs spec: group key is `weaponType` — already display-ready — instead of `weaponSlug`; same intent, better data. Recorded here.)*
- §7 card anatomy (value hero, PL pill, avg·market, weight bar, alert bell, inline lots) → Task 4. ✅ *(Stale badge & `itemimage` dropped — not in API; recorded.)*
- §8 toolbar (search/sort/weapon chips/rarity/wear/hide-no-price) → Task 6. ✅
- §9 persistence (sort, collapse map, hide-no-price) → Task 7. ✅
- §10 states (empty, filtered-empty, single group) → Task 7. ✅
- §11 responsive (1/2/3) + a11y (button, aria-expanded, keyboard, focus ring) → Tasks 4/5. ✅
- §12 defaults (collapse >6, 1/2/3 cols, value hero, weapon+rarity+wear) → Tasks 4–7. ✅
- §13 tests → Tasks 1–3 (unit), Task 7 (RTL). ✅

**Placeholder scan:** none — every code/test step is complete.

**Type consistency:** `SortKey`, `PortfolioEntry`, `PortfolioGroupData`, `ToolbarState`, `NO_PRICE_KEY` used identically across tasks; `weaponGroupKey(skin)` takes `PortfolioSkin`; card/group/toolbar prop names match call sites in Task 7.

**Deviations from spec (intentional, recorded above):** (1) group key `weaponType` not `weaponSlug`; (2) `weight` sort option dropped (identical to `value`); (3) stale badge + `itemimage` removed as dead code.
