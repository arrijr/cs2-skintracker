# Steam Inventory Import — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Steam OpenID 2.0 account linking on top of existing Clerk auth and a one-click inventory import that populates the user's Portfolio with their public Steam CS2 inventory.

**Architecture:** Stateless Steam OpenID 2.0 (no passport, no sessions) with HMAC-signed JWT state for Clerk-user binding. Inventory fetch reuses retry/timeout patterns from `steamMarketClient.js` and TTL cache patterns from `steamService.js`. Imported `Portfolio` rows are tagged with `importedFromSteamAt` so manual entries stay sacred and re-sync only touches what import created.

**Tech Stack:** Express 5 + Node 22 ESM, Prisma 6 + Postgres (Supabase), Next.js 15 + React 19 + Tailwind + shadcn UI, Clerk for primary auth, `jsonwebtoken` for state HMAC (already installed).

**Branch:** `feature/steam-inventory-import` (already checked out).

**Servers required during work:**
- Backend: `cd backend && npm run dev` → http://localhost:5000
- Frontend: `cd frontend && npm run dev` → http://localhost:3000

---

## File Structure

**New backend files:**
- `backend/src/services/steam/steamOpenId.js` — Build Steam OpenID URL, verify callback signature, HMAC-sign/verify state.
- `backend/src/services/steam/steamInventoryClient.js` — Fetch + parse `/inventory/{steamId}/730/2`. Retry/timeout/cache.
- `backend/src/services/steam/inventoryMatcher.js` — Match Steam items against `Skin`/`Case`/`MarketItem` catalog.
- `backend/src/services/steam/portfolioImporter.js` — Persist matched skin items as `Portfolio` rows with cost-basis modes.
- `backend/src/controllers/steamController.js` — 6 HTTP handlers.
- `backend/src/routes/steamRoutes.js` — Route wiring.
- `backend/src/__tests__/steam.test.js` — Unit tests for matcher, importer, OpenID URL/state.

**New frontend files:**
- `frontend/src/hooks/useSteamConnection.ts` — Connection status + actions (preview, import, resync, disconnect).
- `frontend/src/app/account/_components/SteamConnectSection.tsx` — Connect button + connected state UI.
- `frontend/src/app/account/_components/ImportPreviewModal.tsx` — Modal with cost-basis options.
- `frontend/src/app/account/_components/BulkEditCostBasis.tsx` — Editable table for cost basis.

**Modified:**
- `backend/prisma/schema.prisma` — Add `User.steamId`, `User.steamConnectedAt`, `Portfolio.importedFromSteamAt`, `Portfolio.removedFromSteamAt`.
- `backend/prisma/migrations/<ts>_steam_account_link/migration.sql` — Hand-written migration.
- `backend/src/app.js` — Mount `/api/v1/steam` route.
- `backend/src/controllers/userController.js` — Add `steam-status` endpoint returning connection + last-sync state.
- `backend/src/routes/userRoutes.js` — Wire new endpoint.
- `frontend/src/app/account/page.tsx` — Replace redirect with real settings page hosting SteamConnectSection.
- `backend/.env.example` — Add `STEAM_OPENID_RETURN_BASE_URL`, `STEAM_OPENID_STATE_SECRET`, `FRONTEND_URL` (if not already present).

Each file ≤ 200 LOC. Clear single responsibility.

---

## Task 1: Schema — User.steamId + Portfolio.importedFromSteamAt

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260511000001_steam_account_link/migration.sql`

### Step 1: Add fields to schema.prisma

Open `backend/prisma/schema.prisma`. Find the `User` model. After `discordWebhook  String?` add:

```prisma
  steamId           String?   @unique
  steamConnectedAt  DateTime?
```

Find the `Portfolio` model. After `buyDate    DateTime` add:

```prisma
  importedFromSteamAt DateTime?
  removedFromSteamAt  DateTime?

  @@index([userId, importedFromSteamAt])
```

### Step 2: Hand-write migration SQL

```bash
cd backend
mkdir -p prisma/migrations/20260511000001_steam_account_link
```

Create `backend/prisma/migrations/20260511000001_steam_account_link/migration.sql`:

```sql
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "steamId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "steamConnectedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX IF NOT EXISTS "User_steamId_key" ON "User"("steamId");

ALTER TABLE "Portfolio" ADD COLUMN IF NOT EXISTS "importedFromSteamAt" TIMESTAMP(3);
ALTER TABLE "Portfolio" ADD COLUMN IF NOT EXISTS "removedFromSteamAt"  TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "Portfolio_userId_importedFromSteamAt_idx" ON "Portfolio"("userId", "importedFromSteamAt");
```

### Step 3: Apply via Supabase MCP (or db execute)

Preferred: use the Supabase MCP `execute_sql` against project `veolulnlaouyrlvfdwrh` with the body of the SQL file. As a fallback for local: `npx prisma db execute --file prisma/migrations/20260511000001_steam_account_link/migration.sql --schema prisma/schema.prisma`.

Then mark applied:
```bash
cd backend
npx prisma migrate resolve --applied 20260511000001_steam_account_link --schema prisma/schema.prisma
npx prisma generate
```

### Step 4: Verify

```bash
cd backend
node -e "
import('./src/prisma/prismaClient.js').then(async ({default: prisma}) => {
  const u = await prisma.user.findFirst({ select: { id: true, steamId: true, steamConnectedAt: true } });
  console.log('User shape:', u);
  await prisma.\$disconnect();
});
"
```

Expected: object with `steamId: null` and `steamConnectedAt: null` (column reachable).

### Step 5: Commit

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/20260511000001_steam_account_link/
git commit -m "feat(db): add User.steamId + Portfolio.importedFromSteamAt for Steam import"
```

---

## Task 2: steamOpenId.js — URL Builder + Callback Verification + State HMAC

**Files:**
- Create: `backend/src/services/steam/steamOpenId.js`
- Create: `backend/src/__tests__/steam.test.js`

### Step 1: Write failing tests

Create `backend/src/__tests__/steam.test.js`:

```js
import { describe, it, expect, jest } from '@jest/globals';
import {
  buildAuthRedirectUrl,
  signState,
  verifyState,
  parseSteamIdFromClaimedId,
  STEAM_OPENID_NS,
} from '../services/steam/steamOpenId.js';

describe('steamOpenId — state HMAC', () => {
  it('signs and verifies a payload roundtrip', () => {
    const secret = 'unit-test-secret';
    const payload = { userId: 42, nonce: 'abc' };
    const state = signState(payload, secret);
    expect(typeof state).toBe('string');
    const verified = verifyState(state, secret);
    expect(verified.userId).toBe(42);
    expect(verified.nonce).toBe('abc');
  });

  it('rejects state signed with a different secret', () => {
    const state = signState({ userId: 1 }, 'secret-a');
    expect(() => verifyState(state, 'secret-b')).toThrow();
  });

  it('rejects tampered state', () => {
    const state = signState({ userId: 1 }, 'secret');
    const tampered = state.slice(0, -2) + 'xx';
    expect(() => verifyState(tampered, 'secret')).toThrow();
  });
});

describe('steamOpenId — buildAuthRedirectUrl', () => {
  it('produces a valid Steam OpenID 2.0 URL with required params', () => {
    const url = buildAuthRedirectUrl({
      returnTo: 'https://api.example.com/steam/connect/callback?state=abc',
      realm: 'https://api.example.com/',
    });
    expect(url).toMatch(/^https:\/\/steamcommunity\.com\/openid\/login\?/);
    expect(url).toContain('openid.ns=' + encodeURIComponent(STEAM_OPENID_NS));
    expect(url).toContain('openid.mode=checkid_setup');
    expect(url).toContain('openid.return_to=' + encodeURIComponent('https://api.example.com/steam/connect/callback?state=abc'));
    expect(url).toContain('openid.realm=' + encodeURIComponent('https://api.example.com/'));
    expect(url).toContain('openid.identity=' + encodeURIComponent('http://specs.openid.net/auth/2.0/identifier_select'));
    expect(url).toContain('openid.claimed_id=' + encodeURIComponent('http://specs.openid.net/auth/2.0/identifier_select'));
  });
});

describe('steamOpenId — parseSteamIdFromClaimedId', () => {
  it('extracts a 17-digit steamId from a valid claimed_id', () => {
    const id = parseSteamIdFromClaimedId('https://steamcommunity.com/openid/id/76561198000000001');
    expect(id).toBe('76561198000000001');
  });

  it('returns null for a non-Steam claimed_id', () => {
    expect(parseSteamIdFromClaimedId('https://example.com/openid/id/123')).toBeNull();
  });

  it('returns null for a malformed steamId', () => {
    expect(parseSteamIdFromClaimedId('https://steamcommunity.com/openid/id/notanumber')).toBeNull();
  });
});
```

### Step 2: Run test, confirm fail

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=steam.test.js
```

Expected: all FAIL — module not found.

### Step 3: Implement steamOpenId.js

Create `backend/src/services/steam/steamOpenId.js`:

```js
import crypto from 'node:crypto';
import logger from '../../utils/logger.js';

export const STEAM_OPENID_NS = 'http://specs.openid.net/auth/2.0';
export const STEAM_OPENID_ENDPOINT = 'https://steamcommunity.com/openid/login';
const IDENTIFIER_SELECT = 'http://specs.openid.net/auth/2.0/identifier_select';

/**
 * Build the Steam OpenID 2.0 redirect URL.
 * The browser is sent here to log in on Steam.
 */
export function buildAuthRedirectUrl({ returnTo, realm }) {
  const params = new URLSearchParams({
    'openid.ns': STEAM_OPENID_NS,
    'openid.mode': 'checkid_setup',
    'openid.return_to': returnTo,
    'openid.realm': realm,
    'openid.identity': IDENTIFIER_SELECT,
    'openid.claimed_id': IDENTIFIER_SELECT,
  });
  return `${STEAM_OPENID_ENDPOINT}?${params.toString()}`;
}

/**
 * Verify a Steam OpenID 2.0 callback by re-posting params to Steam with mode=check_authentication.
 * Returns the steamId on success, throws on failure.
 *
 * `params` is a plain object built from the callback querystring.
 * `fetchImpl` is injectable for tests.
 */
export async function verifyAuthCallback(params, { fetchImpl = fetch } = {}) {
  // Steam requires us to POST the exact same params back, but with mode=check_authentication
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    body.set(key, value);
  }
  body.set('openid.mode', 'check_authentication');

  const res = await fetchImpl(STEAM_OPENID_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Steam check_authentication HTTP ${res.status}`);
  }

  const text = await res.text();
  // Response is key:value pairs separated by newlines
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const map = Object.fromEntries(lines.map(l => {
    const idx = l.indexOf(':');
    return [l.slice(0, idx), l.slice(idx + 1)];
  }));

  if (map.is_valid !== 'true') {
    throw new Error('Steam reports OpenID assertion invalid');
  }

  const steamId = parseSteamIdFromClaimedId(params['openid.claimed_id']);
  if (!steamId) {
    throw new Error('Could not parse steamId from claimed_id');
  }
  return steamId;
}

/** Extract the 17-digit steamId64 from a Steam claimed_id URL. Returns null on failure. */
export function parseSteamIdFromClaimedId(claimedId) {
  if (typeof claimedId !== 'string') return null;
  const m = claimedId.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d{17})$/);
  return m ? m[1] : null;
}

/** HMAC-sign a JSON-serializable payload. Returns `<base64-payload>.<base64-sig>`. */
export function signState(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/** Verify and decode a state string. Throws on tampering or bad signature. */
export function verifyState(state, secret) {
  if (typeof state !== 'string' || !state.includes('.')) {
    throw new Error('Invalid state format');
  }
  const [data, sig] = state.split('.');
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  // constant-time compare
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('State signature mismatch');
  }
  return JSON.parse(Buffer.from(data, 'base64url').toString('utf8'));
}
```

### Step 4: Run tests, expect pass

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=steam.test.js
```

Expected: 8 PASS (3 state, 1 URL, 3 parseSteamId, plus describe blocks).

### Step 5: Commit

```bash
git add backend/src/services/steam/steamOpenId.js backend/src/__tests__/steam.test.js
git commit -m "feat(steam): OpenID 2.0 URL builder, callback verifier, HMAC state"
```

---

## Task 3: steamInventoryClient.js — Fetch + Parse + Cache

**Files:**
- Create: `backend/src/services/steam/steamInventoryClient.js`
- Modify: `backend/src/__tests__/steam.test.js`

### Step 1: Write failing tests

Append to `backend/src/__tests__/steam.test.js`:

```js
import {
  fetchInventory,
  parseInventory,
  clearInventoryCache,
} from '../services/steam/steamInventoryClient.js';

describe('parseInventory', () => {
  it('joins assets with descriptions by classid+instanceid', () => {
    const raw = {
      success: 1,
      assets: [
        { classid: '100', instanceid: '0', assetid: 'A1' },
        { classid: '100', instanceid: '0', assetid: 'A2' },
        { classid: '200', instanceid: '0', assetid: 'B1' },
      ],
      descriptions: [
        { classid: '100', instanceid: '0', market_hash_name: 'AK-47 | Redline (Field-Tested)', tradable: 1, marketable: 1 },
        { classid: '200', instanceid: '0', market_hash_name: 'AWP | Asiimov (Battle-Scarred)', tradable: 1, marketable: 1 },
      ],
    };
    const parsed = parseInventory(raw);
    expect(parsed).toEqual([
      { marketHashName: 'AK-47 | Redline (Field-Tested)', amount: 2, tradable: true, marketable: true },
      { marketHashName: 'AWP | Asiimov (Battle-Scarred)', amount: 1, tradable: true, marketable: true },
    ]);
  });

  it('groups duplicate market_hash_names across different classids', () => {
    const raw = {
      success: 1,
      assets: [
        { classid: '1', instanceid: '0', assetid: 'A' },
        { classid: '2', instanceid: '0', assetid: 'B' },
      ],
      descriptions: [
        { classid: '1', instanceid: '0', market_hash_name: 'Same Skin', tradable: 1, marketable: 1 },
        { classid: '2', instanceid: '0', market_hash_name: 'Same Skin', tradable: 0, marketable: 1 },
      ],
    };
    const parsed = parseInventory(raw);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toEqual({ marketHashName: 'Same Skin', amount: 2, tradable: false, marketable: true });
  });

  it('returns empty array on success=0 or missing fields', () => {
    expect(parseInventory({ success: 0 })).toEqual([]);
    expect(parseInventory({})).toEqual([]);
    expect(parseInventory(null)).toEqual([]);
  });
});

describe('fetchInventory', () => {
  it('returns parsed inventory on 200', async () => {
    clearInventoryCache();
    const fetchImpl = async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        success: 1,
        assets: [{ classid: '1', instanceid: '0', assetid: 'X' }],
        descriptions: [{ classid: '1', instanceid: '0', market_hash_name: 'Test', tradable: 1, marketable: 1 }],
      }),
    });
    const items = await fetchInventory('76561198000000001', { fetchImpl, sleepImpl: async () => {} });
    expect(items).toEqual([{ marketHashName: 'Test', amount: 1, tradable: true, marketable: true }]);
  });

  it('throws on 403 (private inventory)', async () => {
    clearInventoryCache();
    const fetchImpl = async () => ({ ok: false, status: 403, text: async () => '' });
    await expect(
      fetchInventory('76561198000000002', { fetchImpl, sleepImpl: async () => {} })
    ).rejects.toThrow(/private/i);
  });

  it('retries 429 then succeeds', async () => {
    clearInventoryCache();
    let n = 0;
    const fetchImpl = async () => {
      n++;
      if (n === 1) return { ok: false, status: 429, headers: { get: () => '1' }, text: async () => '' };
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: 1, assets: [], descriptions: [] }),
      };
    };
    const items = await fetchInventory('76561198000000003', { fetchImpl, sleepImpl: async () => {} });
    expect(items).toEqual([]);
    expect(n).toBe(2);
  });

  it('caches results for 5 min per steamId', async () => {
    clearInventoryCache();
    let n = 0;
    const fetchImpl = async () => {
      n++;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          success: 1,
          assets: [{ classid: '1', instanceid: '0', assetid: 'A' }],
          descriptions: [{ classid: '1', instanceid: '0', market_hash_name: 'Cached', tradable: 1, marketable: 1 }],
        }),
      };
    };
    await fetchInventory('76561198000000004', { fetchImpl, sleepImpl: async () => {} });
    await fetchInventory('76561198000000004', { fetchImpl, sleepImpl: async () => {} });
    expect(n).toBe(1);
  });
});
```

### Step 2: Run, confirm fail

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=steam.test.js
```

Expected: FAIL — module not found.

### Step 3: Implement steamInventoryClient.js

Create `backend/src/services/steam/steamInventoryClient.js`:

```js
import logger from '../../utils/logger.js';

const BASE_URL = 'https://steamcommunity.com/inventory';
const APPID = 730;
const CONTEXT_ID = 2;
const REQUEST_TIMEOUT_MS = 10000;
const MAX_ATTEMPTS = 3;
const CACHE_TTL_MS = 5 * 60 * 1000;

const cache = new Map(); // steamId -> { items, expiresAt }

export function clearInventoryCache() {
  cache.clear();
}

async function defaultSleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * Parse Steam inventory JSON into our normalized shape.
 * Returns array of { marketHashName, amount, tradable, marketable }.
 */
export function parseInventory(raw) {
  if (!raw || raw.success !== 1) return [];
  const assets = Array.isArray(raw.assets) ? raw.assets : [];
  const descriptions = Array.isArray(raw.descriptions) ? raw.descriptions : [];
  if (!assets.length || !descriptions.length) return [];

  // Build a description lookup by classid+instanceid
  const descByKey = new Map();
  for (const d of descriptions) {
    descByKey.set(`${d.classid}:${d.instanceid}`, d);
  }

  // Count items per market_hash_name, AND track tradable/marketable (AND across instances)
  const grouped = new Map();
  for (const a of assets) {
    const desc = descByKey.get(`${a.classid}:${a.instanceid}`);
    if (!desc?.market_hash_name) continue;
    const name = desc.market_hash_name;
    const existing = grouped.get(name);
    const itemTradable = !!desc.tradable;
    const itemMarketable = !!desc.marketable;
    if (existing) {
      existing.amount += 1;
      // tradable / marketable AND across instances (one untradable = group untradable)
      existing.tradable = existing.tradable && itemTradable;
      existing.marketable = existing.marketable && itemMarketable;
    } else {
      grouped.set(name, {
        marketHashName: name,
        amount: 1,
        tradable: itemTradable,
        marketable: itemMarketable,
      });
    }
  }

  return Array.from(grouped.values());
}

/**
 * Fetch the public inventory of a Steam user (CS2 = appid 730, context 2).
 * Returns array of normalized items.
 * Throws on private (403), retries 429/5xx, caches 5min.
 */
export async function fetchInventory(steamId, {
  fetchImpl = fetch,
  sleepImpl = defaultSleep,
} = {}) {
  // Cache check
  const cached = cache.get(steamId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.items;
  }

  const url = `${BASE_URL}/${encodeURIComponent(steamId)}/${APPID}/${CONTEXT_ID}?l=english&count=5000`;

  let lastError = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetchImpl(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

      if (res.status === 403) {
        throw new Error('Steam inventory is private. Set inventory privacy to Public temporarily and retry.');
      }

      if (res.status === 429) {
        const retryAfter = parseFloat(res.headers?.get?.('retry-after') ?? '5');
        lastError = `429 (retry-after ${retryAfter}s)`;
        if (attempt < MAX_ATTEMPTS) {
          await sleepImpl(Math.min(retryAfter * 1000, 30000));
          continue;
        }
        throw new Error(`Steam rate-limited after ${MAX_ATTEMPTS} attempts`);
      }

      if (res.status >= 500) {
        lastError = `Steam ${res.status}`;
        if (attempt < MAX_ATTEMPTS) {
          await sleepImpl(2000 * attempt);
          continue;
        }
        throw new Error(`Steam ${res.status} after ${MAX_ATTEMPTS} attempts`);
      }

      if (!res.ok) {
        throw new Error(`Steam inventory HTTP ${res.status}`);
      }

      const data = await res.json();
      const items = parseInventory(data);
      cache.set(steamId, { items, expiresAt: Date.now() + CACHE_TTL_MS });
      return items;
    } catch (err) {
      // Privacy or unexpected: don't retry
      if (/private/i.test(err.message) || err.message?.startsWith('Steam inventory HTTP')) {
        throw err;
      }
      lastError = err.message;
      if (attempt < MAX_ATTEMPTS) {
        await sleepImpl(2000 * attempt);
      }
    }
  }
  logger.warn('Steam inventory fetch failed', { steamId, lastError });
  throw new Error(lastError ?? 'unknown error fetching Steam inventory');
}
```

### Step 4: Run tests, expect pass

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=steam.test.js
```

Expected: 13 PASS (8 from Task 2 + 5 new).

### Step 5: Commit

```bash
git add backend/src/services/steam/steamInventoryClient.js backend/src/__tests__/steam.test.js
git commit -m "feat(steam): inventory client (fetch + parse + 5min cache + retry)"
```

---

## Task 4: inventoryMatcher.js — Match Items Against Catalog

**Files:**
- Create: `backend/src/services/steam/inventoryMatcher.js`
- Modify: `backend/src/__tests__/steam.test.js`

### Step 1: Write failing tests

Append to `backend/src/__tests__/steam.test.js`:

```js
import { matchInventory } from '../services/steam/inventoryMatcher.js';

describe('matchInventory', () => {
  it('matches a Skin by marketHashName', async () => {
    const fakePrisma = {
      skin:       { findMany: jest.fn().mockResolvedValue([{ id: 5, name: 'AK-47 | Redline', marketHashName: 'AK-47 | Redline (Field-Tested)', priceLatest: 12.5 }]) },
      case:       { findMany: jest.fn().mockResolvedValue([]) },
      marketItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const items = [{ marketHashName: 'AK-47 | Redline (Field-Tested)', amount: 2, tradable: true, marketable: true }];
    const result = await matchInventory(items, { prismaClient: fakePrisma });
    expect(result.matched).toEqual([{
      kind: 'skin',
      skinId: 5,
      caseId: null,
      marketItemId: null,
      marketHashName: 'AK-47 | Redline (Field-Tested)',
      name: 'AK-47 | Redline',
      amount: 2,
      tradable: true,
      marketable: true,
      currentPrice: 12.5,
    }]);
    expect(result.skipped).toHaveLength(0);
  });

  it('matches a Case by name (not marketHashName)', async () => {
    const fakePrisma = {
      skin:       { findMany: jest.fn().mockResolvedValue([]) },
      case:       { findMany: jest.fn().mockResolvedValue([{ id: 9, name: 'Operation Bravo Case', price: 80 }]) },
      marketItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const items = [{ marketHashName: 'Operation Bravo Case', amount: 1, tradable: true, marketable: true }];
    const result = await matchInventory(items, { prismaClient: fakePrisma });
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].kind).toBe('case');
    expect(result.matched[0].caseId).toBe(9);
  });

  it('matches a MarketItem (sticker) by marketHashName', async () => {
    const fakePrisma = {
      skin:       { findMany: jest.fn().mockResolvedValue([]) },
      case:       { findMany: jest.fn().mockResolvedValue([]) },
      marketItem: { findMany: jest.fn().mockResolvedValue([{ id: 77, name: 'Sticker | Foo (Holo)', marketHashName: 'Sticker | Foo (Holo)', category: 'sticker', priceLatest: 5 }]) },
    };
    const items = [{ marketHashName: 'Sticker | Foo (Holo)', amount: 3, tradable: false, marketable: true }];
    const result = await matchInventory(items, { prismaClient: fakePrisma });
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].kind).toBe('market_item');
    expect(result.matched[0].marketItemId).toBe(77);
  });

  it('lists unmatched items in skipped with reason', async () => {
    const fakePrisma = {
      skin:       { findMany: jest.fn().mockResolvedValue([]) },
      case:       { findMany: jest.fn().mockResolvedValue([]) },
      marketItem: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const items = [{ marketHashName: 'Unknown New Item', amount: 1, tradable: true, marketable: true }];
    const result = await matchInventory(items, { prismaClient: fakePrisma });
    expect(result.matched).toHaveLength(0);
    expect(result.skipped).toEqual([{ marketHashName: 'Unknown New Item', amount: 1, reason: 'not_in_catalog' }]);
  });

  it('prefers Skin match over MarketItem match for same name', async () => {
    const fakePrisma = {
      skin:       { findMany: jest.fn().mockResolvedValue([{ id: 5, name: 'X', marketHashName: 'X', priceLatest: 10 }]) },
      case:       { findMany: jest.fn().mockResolvedValue([]) },
      marketItem: { findMany: jest.fn().mockResolvedValue([{ id: 99, name: 'X', marketHashName: 'X', priceLatest: 10 }]) },
    };
    const items = [{ marketHashName: 'X', amount: 1, tradable: true, marketable: true }];
    const result = await matchInventory(items, { prismaClient: fakePrisma });
    expect(result.matched).toHaveLength(1);
    expect(result.matched[0].kind).toBe('skin');
  });
});
```

### Step 2: Run, confirm fail

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=steam.test.js -t matchInventory
```

Expected: FAIL — module not found.

### Step 3: Implement inventoryMatcher.js

Create `backend/src/services/steam/inventoryMatcher.js`:

```js
import defaultPrisma from '../../prisma/prismaClient.js';

/**
 * Match parsed Steam inventory items against our Skin/Case/MarketItem catalog.
 * Returns { matched: [...], skipped: [...] }.
 *
 * Match precedence: Skin > Case > MarketItem.
 * Skin and MarketItem match by marketHashName. Case matches by name.
 */
export async function matchInventory(items, { prismaClient = defaultPrisma } = {}) {
  const names = items.map(i => i.marketHashName);
  if (names.length === 0) return { matched: [], skipped: [] };

  const [skins, cases, marketItems] = await Promise.all([
    prismaClient.skin.findMany({
      where: { marketHashName: { in: names } },
      select: { id: true, name: true, marketHashName: true, priceLatest: true },
    }),
    prismaClient.case.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true, price: true },
    }),
    prismaClient.marketItem.findMany({
      where: { marketHashName: { in: names } },
      select: { id: true, name: true, marketHashName: true, category: true, priceLatest: true },
    }),
  ]);

  const skinByName       = new Map(skins.map(s => [s.marketHashName, s]));
  const caseByName       = new Map(cases.map(c => [c.name, c]));
  const marketItemByName = new Map(marketItems.map(m => [m.marketHashName, m]));

  const matched = [];
  const skipped = [];

  for (const item of items) {
    const name = item.marketHashName;

    const skin = skinByName.get(name);
    if (skin) {
      matched.push({
        kind: 'skin',
        skinId: skin.id,
        caseId: null,
        marketItemId: null,
        marketHashName: name,
        name: skin.name,
        amount: item.amount,
        tradable: item.tradable,
        marketable: item.marketable,
        currentPrice: skin.priceLatest ?? null,
      });
      continue;
    }

    const c = caseByName.get(name);
    if (c) {
      matched.push({
        kind: 'case',
        skinId: null,
        caseId: c.id,
        marketItemId: null,
        marketHashName: name,
        name: c.name,
        amount: item.amount,
        tradable: item.tradable,
        marketable: item.marketable,
        currentPrice: c.price ?? null,
      });
      continue;
    }

    const mi = marketItemByName.get(name);
    if (mi) {
      matched.push({
        kind: 'market_item',
        skinId: null,
        caseId: null,
        marketItemId: mi.id,
        marketHashName: name,
        name: mi.name,
        amount: item.amount,
        tradable: item.tradable,
        marketable: item.marketable,
        currentPrice: mi.priceLatest ?? null,
      });
      continue;
    }

    skipped.push({ marketHashName: name, amount: item.amount, reason: 'not_in_catalog' });
  }

  return { matched, skipped };
}
```

### Step 4: Run tests, expect pass

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=steam.test.js
```

Expected: 18 PASS (5 new).

### Step 5: Commit

```bash
git add backend/src/services/steam/inventoryMatcher.js backend/src/__tests__/steam.test.js
git commit -m "feat(steam): inventoryMatcher (Skin > Case > MarketItem precedence)"
```

---

## Task 5: portfolioImporter.js — Persist Skin Matches to Portfolio

**Files:**
- Create: `backend/src/services/steam/portfolioImporter.js`
- Modify: `backend/src/__tests__/steam.test.js`

### Step 1: Write failing tests

Append to `backend/src/__tests__/steam.test.js`:

```js
import { importSkinMatches } from '../services/steam/portfolioImporter.js';

describe('importSkinMatches', () => {
  function makeMatch(over) {
    return {
      kind: 'skin', skinId: 5, caseId: null, marketItemId: null,
      marketHashName: 'AK-47 | Redline (FT)', name: 'AK-47 | Redline',
      amount: 2, tradable: true, marketable: true, currentPrice: 12.5,
      ...over,
    };
  }

  it('creates a Portfolio row per skin match with buyPrice=null when mode=empty', async () => {
    const created = [];
    const fakePrisma = {
      portfolio: { create: jest.fn(async (args) => { created.push(args.data); return { id: created.length, ...args.data }; }) },
      skin: { findMany: jest.fn().mockResolvedValue([]) }, // not used in empty mode
    };
    const matches = [makeMatch(), makeMatch({ skinId: 6, currentPrice: 99 })];
    const result = await importSkinMatches({ userId: 7, matches, costBasisMode: 'empty' }, { prismaClient: fakePrisma });
    expect(result.created).toBe(2);
    expect(created[0]).toEqual(expect.objectContaining({ userId: 7, skinId: 5, amount: 2, buyPrice: null }));
    expect(created[0].importedFromSteamAt).toBeInstanceOf(Date);
    expect(created[1].skinId).toBe(6);
    expect(created[1].buyPrice).toBeNull();
  });

  it('uses currentPrice as buyPrice when mode=current_market', async () => {
    const fakePrisma = {
      portfolio: { create: jest.fn(async (args) => ({ id: 1, ...args.data })) },
      skin: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const matches = [makeMatch({ currentPrice: 12.5 })];
    const result = await importSkinMatches({ userId: 1, matches, costBasisMode: 'current_market' }, { prismaClient: fakePrisma });
    expect(result.created).toBe(1);
    expect(fakePrisma.portfolio.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ buyPrice: 12.5 }),
    }));
  });

  it('uses custom map (skinId -> buyPrice/buyDate) when mode=custom', async () => {
    const fakePrisma = {
      portfolio: { create: jest.fn(async (args) => ({ id: 1, ...args.data })) },
      skin: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const matches = [makeMatch({ skinId: 5 }), makeMatch({ skinId: 6 })];
    const custom = [
      { skinId: 5, buyPrice: 8.0, buyDate: new Date('2025-01-15') },
      { skinId: 6, buyPrice: null, buyDate: null },
    ];
    await importSkinMatches({ userId: 1, matches, costBasisMode: 'custom', custom }, { prismaClient: fakePrisma });
    expect(fakePrisma.portfolio.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      data: expect.objectContaining({ skinId: 5, buyPrice: 8.0, buyDate: new Date('2025-01-15') }),
    }));
    expect(fakePrisma.portfolio.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      data: expect.objectContaining({ skinId: 6, buyPrice: null }),
    }));
  });

  it('skips non-skin matches (case, market_item)', async () => {
    const fakePrisma = {
      portfolio: { create: jest.fn() },
      skin: { findMany: jest.fn().mockResolvedValue([]) },
    };
    const matches = [
      { kind: 'case', amount: 1, caseId: 9 },
      { kind: 'market_item', amount: 1, marketItemId: 77 },
    ];
    const result = await importSkinMatches({ userId: 1, matches, costBasisMode: 'empty' }, { prismaClient: fakePrisma });
    expect(result.created).toBe(0);
    expect(fakePrisma.portfolio.create).not.toHaveBeenCalled();
  });

  it('rejects unknown costBasisMode', async () => {
    const fakePrisma = { portfolio: { create: jest.fn() }, skin: { findMany: jest.fn().mockResolvedValue([]) } };
    await expect(
      importSkinMatches({ userId: 1, matches: [makeMatch()], costBasisMode: 'bogus' }, { prismaClient: fakePrisma })
    ).rejects.toThrow(/invalid costBasisMode/i);
  });
});
```

### Step 2: Run, confirm fail

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=steam.test.js -t importSkinMatches
```

Expected: FAIL — module not found.

### Step 3: Implement portfolioImporter.js

Create `backend/src/services/steam/portfolioImporter.js`:

```js
import defaultPrisma from '../../prisma/prismaClient.js';
import logger from '../../utils/logger.js';

const VALID_MODES = new Set(['empty', 'current_market', 'custom']);

/**
 * Persist matched skin items as Portfolio rows.
 * - kind=skin matches are persisted; kind=case and kind=market_item are skipped (Phase 2).
 * - Each match becomes ONE Portfolio row with amount = stack size.
 * - All created rows are marked importedFromSteamAt = now() so resync can identify them.
 *
 * costBasisMode:
 *   - 'empty':         buyPrice = null
 *   - 'current_market': buyPrice = match.currentPrice (Skin.priceLatest at import time)
 *   - 'custom':        use `custom[]` lookup by skinId
 */
export async function importSkinMatches({ userId, matches, costBasisMode, custom = [] }, { prismaClient = defaultPrisma } = {}) {
  if (!VALID_MODES.has(costBasisMode)) {
    throw new Error(`invalid costBasisMode: ${costBasisMode}`);
  }
  if (!userId) {
    throw new Error('userId required');
  }

  const customBySkinId = new Map((custom || []).map(c => [c.skinId, c]));
  const now = new Date();
  let created = 0;

  for (const m of matches) {
    if (m.kind !== 'skin') continue; // skip case + market_item for v1

    let buyPrice = null;
    let buyDate = now;

    if (costBasisMode === 'current_market') {
      buyPrice = m.currentPrice ?? null;
    } else if (costBasisMode === 'custom') {
      const c = customBySkinId.get(m.skinId);
      if (c) {
        buyPrice = (typeof c.buyPrice === 'number') ? c.buyPrice : null;
        if (c.buyDate) buyDate = new Date(c.buyDate);
      }
    }

    await prismaClient.portfolio.create({
      data: {
        userId,
        skinId: m.skinId,
        amount: m.amount,
        buyPrice,
        buyDate,
        importedFromSteamAt: now,
      },
    });
    created++;
  }

  logger.info('Steam Portfolio import complete', { userId, created, mode: costBasisMode });
  return { created };
}
```

### Step 4: Run tests

```bash
cd backend
NODE_OPTIONS=--experimental-vm-modules npx jest --testPathPatterns=steam.test.js
```

Expected: 23 PASS (5 new).

### Step 5: Commit

```bash
git add backend/src/services/steam/portfolioImporter.js backend/src/__tests__/steam.test.js
git commit -m "feat(steam): portfolioImporter (empty/current_market/custom cost basis)"
```

---

## Task 6: steamController.js + steamRoutes.js — HTTP Endpoints

**Files:**
- Create: `backend/src/controllers/steamController.js`
- Create: `backend/src/routes/steamRoutes.js`
- Modify: `backend/src/app.js` (mount route)

This task wires the 6 HTTP handlers. We do NOT add new unit tests for the controller layer (already covered by service tests). Integration is via Step 6.

### Step 1: Create steamController.js

Create `backend/src/controllers/steamController.js`:

```js
import defaultPrisma from '../prisma/prismaClient.js';
import logger from '../utils/logger.js';
import {
  buildAuthRedirectUrl,
  verifyAuthCallback,
  signState,
  verifyState,
} from '../services/steam/steamOpenId.js';
import { fetchInventory } from '../services/steam/steamInventoryClient.js';
import { matchInventory } from '../services/steam/inventoryMatcher.js';
import { importSkinMatches } from '../services/steam/portfolioImporter.js';

const BACKEND_BASE = process.env.STEAM_OPENID_RETURN_BASE_URL || 'http://localhost:5000';
const FRONTEND_BASE = process.env.FRONTEND_URL || 'http://localhost:3000';
const STATE_SECRET = process.env.STEAM_OPENID_STATE_SECRET || 'dev-state-secret-replace-in-prod';

export async function connectRedirect(req, res, { prismaClient = defaultPrisma } = {}) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });

  const state = signState({ userId, ts: Date.now() }, STATE_SECRET);
  const returnTo = `${BACKEND_BASE}/api/v1/steam/connect/callback?state=${encodeURIComponent(state)}`;
  const realm = BACKEND_BASE.endsWith('/') ? BACKEND_BASE : `${BACKEND_BASE}/`;
  const url = buildAuthRedirectUrl({ returnTo, realm });
  return res.redirect(302, url);
}

export async function connectCallback(req, res, { prismaClient = defaultPrisma, openIdVerify = verifyAuthCallback } = {}) {
  try {
    const state = req.query.state;
    if (!state) throw new Error('missing state');
    const { userId } = verifyState(String(state), STATE_SECRET);

    // Re-collect openid.* params from query (Steam appends many)
    const openidParams = {};
    for (const [k, v] of Object.entries(req.query)) {
      if (k.startsWith('openid.')) openidParams[k] = String(v);
    }

    const steamId = await openIdVerify(openidParams);
    await prismaClient.user.update({
      where: { id: userId },
      data: { steamId, steamConnectedAt: new Date() },
    });

    return res.redirect(302, `${FRONTEND_BASE}/account?steam=connected`);
  } catch (err) {
    logger.error('Steam connect callback failed', { error: err.message });
    return res.redirect(302, `${FRONTEND_BASE}/account?steam=error&reason=${encodeURIComponent(err.message)}`);
  }
}

export async function disconnect(req, res, { prismaClient = defaultPrisma } = {}) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  await prismaClient.user.update({
    where: { id: userId },
    data: { steamId: null, steamConnectedAt: null },
  });
  return res.json({ disconnected: true });
}

export async function status(req, res, { prismaClient = defaultPrisma } = {}) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const user = await prismaClient.user.findUnique({
    where: { id: userId },
    select: { steamId: true, steamConnectedAt: true },
  });
  if (!user) return res.status(404).json({ error: 'user not found' });

  let lastImportedAt = null;
  if (user.steamId) {
    const last = await prismaClient.portfolio.findFirst({
      where: { userId, importedFromSteamAt: { not: null } },
      orderBy: { importedFromSteamAt: 'desc' },
      select: { importedFromSteamAt: true },
    });
    lastImportedAt = last?.importedFromSteamAt ?? null;
  }

  return res.json({
    connected: !!user.steamId,
    steamId: user.steamId,
    steamConnectedAt: user.steamConnectedAt,
    lastImportedAt,
  });
}

export async function preview(req, res, { prismaClient = defaultPrisma } = {}) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const user = await prismaClient.user.findUnique({ where: { id: userId }, select: { steamId: true } });
  if (!user?.steamId) return res.status(400).json({ error: 'Steam account not connected' });
  try {
    const items = await fetchInventory(user.steamId);
    const result = await matchInventory(items, { prismaClient });
    return res.json({
      totals: {
        fetched: items.length,
        matched: result.matched.length,
        skipped: result.skipped.length,
      },
      matched: result.matched,
      skipped: result.skipped,
    });
  } catch (err) {
    logger.error('Steam preview failed', { userId, error: err.message });
    return res.status(502).json({ error: err.message });
  }
}

export async function importInventory(req, res, { prismaClient = defaultPrisma } = {}) {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: 'auth required' });
  const user = await prismaClient.user.findUnique({ where: { id: userId }, select: { steamId: true } });
  if (!user?.steamId) return res.status(400).json({ error: 'Steam account not connected' });

  const { costBasisMode, custom } = req.body || {};
  try {
    const items = await fetchInventory(user.steamId);
    const matchResult = await matchInventory(items, { prismaClient });
    const importResult = await importSkinMatches(
      { userId, matches: matchResult.matched, costBasisMode, custom },
      { prismaClient }
    );
    return res.status(201).json({
      created: importResult.created,
      matched: matchResult.matched.length,
      skipped: matchResult.skipped.length,
    });
  } catch (err) {
    logger.error('Steam import failed', { userId, error: err.message });
    return res.status(500).json({ error: err.message });
  }
}
```

### Step 2: Create steamRoutes.js

Create `backend/src/routes/steamRoutes.js`:

```js
import { Router } from 'express';
import { verifyClerkJwt } from '../middleware/verifyClerkJwt.js';
import {
  connectRedirect,
  connectCallback,
  disconnect,
  status,
  preview,
  importInventory,
} from '../controllers/steamController.js';

const router = Router();

// /connect/redirect requires Clerk auth (user must be logged in)
router.get('/connect/redirect', verifyClerkJwt, (req, res) => connectRedirect(req, res));

// /connect/callback is PUBLIC — Steam redirects browser here; identity comes from signed state
router.get('/connect/callback', (req, res) => connectCallback(req, res));

// All others require Clerk auth
router.use(verifyClerkJwt);
router.delete('/disconnect',       (req, res) => disconnect(req, res));
router.get('/status',              (req, res) => status(req, res));
router.post('/inventory/preview',  (req, res) => preview(req, res));
router.post('/inventory/import',   (req, res) => importInventory(req, res));

export default router;
```

### Step 3: Mount in app.js

Read `backend/src/app.js`. Add import near other route imports:
```js
import steamRoutes from './routes/steamRoutes.js';
```

Add mount near other `/api/v1/*` mounts:
```js
app.use('/api/v1/steam', steamRoutes);
```

### Step 4: Add env vars to .env.example

In `backend/.env.example`, add:
```
STEAM_OPENID_RETURN_BASE_URL=http://localhost:5000
STEAM_OPENID_STATE_SECRET=replace-me-with-a-random-32+-char-string
FRONTEND_URL=http://localhost:3000
```

(`FRONTEND_URL` may already exist — only add if missing.)

### Step 5: Syntax-check files

```bash
cd backend
node --check src/controllers/steamController.js
node --check src/routes/steamRoutes.js
node --check src/app.js
```

Expected: no output.

### Step 6: Smoke-test endpoints

Start backend in another terminal. Then:

```bash
# Should return 401 (no auth)
curl -s -w "\nHTTP %{http_code}\n" http://localhost:5000/api/v1/steam/status

# Should return JSON with connected:false (auth via mock fallback when CLERK_JWKS_URL unset)
curl -s -H "Authorization: Bearer test" http://localhost:5000/api/v1/steam/status
```

Expected first: `HTTP 401`. Second: `{"connected":false,"steamId":null,...}`.

### Step 7: Commit

```bash
git add backend/src/controllers/steamController.js backend/src/routes/steamRoutes.js backend/src/app.js backend/.env.example
git commit -m "feat(steam): REST endpoints (connect/callback/disconnect/status/preview/import)"
```

---

## Task 7: Frontend Hook + Steam Connect Section

**Files:**
- Create: `frontend/src/hooks/useSteamConnection.ts`
- Create: `frontend/src/app/account/_components/SteamConnectSection.tsx`
- Modify: `frontend/src/app/account/page.tsx`

### Step 1: Replace account redirect with real page

Read `frontend/src/app/account/page.tsx` first (likely just a redirect to `/profile`).

Replace its contents with:
```tsx
"use client";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SteamConnectSection } from "./_components/SteamConnectSection";

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  if (!isLoaded) return null;
  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-300">Please sign in to access account settings.</p>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-slate-950 text-white py-8">
      <div className="container mx-auto px-4 max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold">Account</h1>

        <Card className="bg-slate-900/60 backdrop-blur border border-slate-700/50">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-slate-300">
            <p><span className="text-slate-500">Email:</span> {user.primaryEmailAddress?.emailAddress}</p>
            <p><span className="text-slate-500">Member since:</span> {new Date(user.createdAt!).toLocaleDateString()}</p>
          </CardContent>
        </Card>

        <SteamConnectSection />
      </div>
    </div>
  );
}
```

### Step 2: Create useSteamConnection hook

Create `frontend/src/hooks/useSteamConnection.ts`:

```ts
"use client";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export interface SteamStatus {
  connected: boolean;
  steamId: string | null;
  steamConnectedAt: string | null;
  lastImportedAt: string | null;
}

export interface MatchedItem {
  kind: 'skin' | 'case' | 'market_item';
  skinId: number | null;
  caseId: number | null;
  marketItemId: number | null;
  marketHashName: string;
  name: string;
  amount: number;
  tradable: boolean;
  marketable: boolean;
  currentPrice: number | null;
}

export interface SkippedItem {
  marketHashName: string;
  amount: number;
  reason: string;
}

export interface PreviewResult {
  totals: { fetched: number; matched: number; skipped: number };
  matched: MatchedItem[];
  skipped: SkippedItem[];
}

export type CostBasisMode = 'empty' | 'current_market' | 'custom';
export interface CustomCostBasis { skinId: number; buyPrice: number | null; buyDate: Date | null; }

export function useSteamConnection() {
  const { getToken } = useAuth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const [status, setStatus] = useState<SteamStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${apiUrl}/api/v1/steam/status`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus(await res.json());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Steam status");
    } finally {
      setLoading(false);
    }
  }, [apiUrl, getToken]);

  useEffect(() => { refresh(); }, [refresh]);

  const connect = useCallback(async () => {
    const token = await getToken();
    // Open backend connect/redirect; the backend will set state and redirect to Steam
    // We can't send Bearer through a browser redirect, so we open in same tab with token in URL via short-lived param
    // Simpler: open backend endpoint in same tab — backend reads Clerk session-cookie? We use a fetch with redirect: 'manual' instead.
    // Easiest UX: backend supports ?token=<jwt> query param fallback for the initial redirect.
    window.location.href = `${apiUrl}/api/v1/steam/connect/redirect?token=${encodeURIComponent(token ?? '')}`;
  }, [apiUrl, getToken]);

  const disconnect = useCallback(async () => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/steam/disconnect`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await refresh();
  }, [apiUrl, getToken, refresh]);

  const preview = useCallback(async (): Promise<PreviewResult> => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/steam/inventory/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    return await res.json();
  }, [apiUrl, getToken]);

  const importNow = useCallback(async (mode: CostBasisMode, custom?: CustomCostBasis[]) => {
    const token = await getToken();
    const res = await fetch(`${apiUrl}/api/v1/steam/inventory/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ costBasisMode: mode, custom }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `HTTP ${res.status}`);
    }
    const data = await res.json();
    await refresh();
    return data as { created: number; matched: number; skipped: number };
  }, [apiUrl, getToken, refresh]);

  return { status, loading, error, refresh, connect, disconnect, preview, importNow };
}
```

**Backend side-effect of this hook:** the `connect()` function uses `?token=<jwt>` to authenticate the initial redirect (since browsers can't set Authorization headers on 302). Update `verifyClerkJwt` to ALSO accept a `?token=` query param as fallback. Add at top of `backend/src/middleware/verifyClerkJwt.js` `verifyClerkJwt` function, after extracting auth header:

```js
let token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
if (!token && typeof req.query.token === 'string' && req.query.token) {
  token = req.query.token;
}
```

(Locate the existing `const token = auth.startsWith(...)` line and replace it with the two lines above.)

### Step 3: Create SteamConnectSection

Create `frontend/src/app/account/_components/SteamConnectSection.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link2, Link2Off, RefreshCw } from "lucide-react";
import { useSteamConnection } from "@/hooks/useSteamConnection";
import { ImportPreviewModal } from "./ImportPreviewModal";

export function SteamConnectSection() {
  const { status, loading, error, connect, disconnect, refresh } = useSteamConnection();
  const searchParams = useSearchParams();
  const [showImport, setShowImport] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  // Surface ?steam=connected / ?steam=error from callback
  useEffect(() => {
    const s = searchParams.get('steam');
    if (s === 'connected') setNotice({ kind: 'success', text: 'Steam account connected.' });
    if (s === 'error') setNotice({ kind: 'error', text: searchParams.get('reason') || 'Connection failed.' });
    if (s) refresh();
  }, [searchParams, refresh]);

  if (loading) return null;

  return (
    <>
      <Card className="bg-slate-900/60 backdrop-blur border border-slate-700/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Steam Account
            {status?.connected ? (
              <Badge className="bg-green-500/20 text-green-300 border border-green-500/30">Connected</Badge>
            ) : (
              <Badge variant="outline" className="border-slate-700/50 text-slate-400">Not connected</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notice && (
            <div className={`text-sm p-3 rounded border ${
              notice.kind === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}>{notice.text}</div>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}

          {!status?.connected && (
            <>
              <p className="text-slate-300">Connect your Steam account to one-click import your CS2 inventory.</p>
              <Button onClick={connect} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2">
                <Link2 className="h-4 w-4" /> Connect Steam Account
              </Button>
            </>
          )}

          {status?.connected && (
            <>
              <div className="text-sm text-slate-300 space-y-1">
                <p><span className="text-slate-500">Steam ID:</span> <code className="bg-slate-900/60 px-2 py-1 rounded">{status.steamId}</code></p>
                <p><span className="text-slate-500">Connected:</span> {status.steamConnectedAt && new Date(status.steamConnectedAt).toLocaleString()}</p>
                <p><span className="text-slate-500">Last import:</span> {status.lastImportedAt ? new Date(status.lastImportedAt).toLocaleString() : '—'}</p>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={() => setShowImport(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> Import Inventory
                </Button>
                <Button variant="outline" onClick={disconnect} className="border-slate-700/50 text-slate-300 hover:text-red-300 gap-2">
                  <Link2Off className="h-4 w-4" /> Disconnect
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {showImport && <ImportPreviewModal onClose={() => setShowImport(false)} />}
    </>
  );
}
```

(`ImportPreviewModal` is created in Task 8.)

### Step 4: TS check

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep -E "useSteamConnection|SteamConnectSection|account/" | head -5
```

Expected: only errors related to the not-yet-created `ImportPreviewModal` import. Those resolve in Task 8.

### Step 5: Commit

```bash
git add frontend/src/hooks/useSteamConnection.ts frontend/src/app/account/ backend/src/middleware/verifyClerkJwt.js
git commit -m "feat(steam): /account page + SteamConnectSection + useSteamConnection hook"
```

---

## Task 8: ImportPreviewModal + BulkEditCostBasis

**Files:**
- Create: `frontend/src/app/account/_components/ImportPreviewModal.tsx`
- Create: `frontend/src/app/account/_components/BulkEditCostBasis.tsx`

### Step 1: Create ImportPreviewModal

Create `frontend/src/app/account/_components/ImportPreviewModal.tsx`:

```tsx
"use client";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSteamConnection, type PreviewResult, type CostBasisMode, type CustomCostBasis } from "@/hooks/useSteamConnection";
import { BulkEditCostBasis } from "./BulkEditCostBasis";

interface Props {
  onClose: () => void;
}

export function ImportPreviewModal({ onClose }: Props) {
  const { preview, importNow } = useSteamConnection();
  const [data, setData] = useState<PreviewResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<CostBasisMode>('empty');
  const [bulk, setBulk] = useState<CustomCostBasis[]>([]);
  const [showBulk, setShowBulk] = useState(false);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ created: number; matched: number; skipped: number } | null>(null);

  useEffect(() => {
    (async () => {
      try { setData(await preview()); }
      catch (e) { setError(e instanceof Error ? e.message : 'Preview failed'); }
      finally { setLoading(false); }
    })();
  }, [preview]);

  async function handleImport() {
    setImporting(true);
    setError(null);
    try {
      const customPayload = mode === 'custom' ? bulk.map(b => ({
        skinId: b.skinId,
        buyPrice: b.buyPrice,
        buyDate: b.buyDate ? b.buyDate.toISOString() : null,
      })) : undefined;
      const result = await importNow(mode, customPayload as any);
      setDone(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Inventory</DialogTitle>
        </DialogHeader>

        {loading && <div className="space-y-2">{[0,1,2].map(i => <Skeleton key={i} className="h-12 rounded" />)}</div>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {done && (
          <div className="space-y-3">
            <p className="text-green-300">✓ Created <strong>{done.created}</strong> Portfolio entries.</p>
            <p className="text-slate-300 text-sm">{done.matched} matched · {done.skipped} skipped</p>
            <Button onClick={onClose} className="bg-gradient-to-r from-purple-500 to-pink-500">Done</Button>
          </div>
        )}

        {!done && data && !showBulk && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <Badge className="bg-slate-800/60 border border-slate-700/50">Fetched: {data.totals.fetched}</Badge>
              <Badge className="bg-green-500/10 text-green-300 border border-green-500/30">Matched: {data.totals.matched}</Badge>
              <Badge className="bg-amber-500/10 text-amber-300 border border-amber-500/30">Skipped: {data.totals.skipped}</Badge>
            </div>

            <div className="space-y-2">
              <p className="font-medium">How do you want to set cost basis?</p>
              {([
                { v: 'empty', label: 'Leave empty — I will fill in later' },
                { v: 'current_market', label: 'Use current market price (reset point)' },
                { v: 'custom', label: 'Let me set it now (Bulk edit)' },
              ] as Array<{v: CostBasisMode; label: string}>).map(opt => (
                <label key={opt.v} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="cb"
                    value={opt.v}
                    checked={mode === opt.v}
                    onChange={() => setMode(opt.v)}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={onClose} className="border-slate-700/50">Cancel</Button>
              {mode === 'custom' ? (
                <Button onClick={() => setShowBulk(true)} className="bg-gradient-to-r from-purple-500 to-pink-500">Continue to bulk edit</Button>
              ) : (
                <Button onClick={handleImport} disabled={importing} className="bg-gradient-to-r from-purple-500 to-pink-500">
                  {importing ? 'Importing…' : 'Import'}
                </Button>
              )}
            </div>
          </div>
        )}

        {!done && data && showBulk && (
          <BulkEditCostBasis
            matchedSkinItems={data.matched.filter(m => m.kind === 'skin')}
            value={bulk}
            onChange={setBulk}
            onBack={() => setShowBulk(false)}
            onSubmit={handleImport}
            importing={importing}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
```

### Step 2: Create BulkEditCostBasis

Create `frontend/src/app/account/_components/BulkEditCostBasis.tsx`:

```tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MatchedItem, CustomCostBasis } from "@/hooks/useSteamConnection";

interface Props {
  matchedSkinItems: MatchedItem[];
  value: CustomCostBasis[];
  onChange: (next: CustomCostBasis[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  importing: boolean;
}

export function BulkEditCostBasis({ matchedSkinItems, value, onChange, onBack, onSubmit, importing }: Props) {
  // Initialize one row per matched skin
  const initialized = useMemo(() => {
    return matchedSkinItems.map(m => {
      const existing = value.find(v => v.skinId === m.skinId);
      return existing ?? { skinId: m.skinId!, buyPrice: null, buyDate: null };
    });
  }, [matchedSkinItems, value]);

  useEffect(() => { onChange(initialized); /* one-time init */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(skinId: number, patch: Partial<CustomCostBasis>) {
    onChange(value.map(row => row.skinId === skinId ? { ...row, ...patch } : row));
  }

  async function autofillFromHistory() {
    // For each row with a buyDate, hit /api/v1/skins/:id/history-near?date=YYYY-MM-DD
    // Implementation note: this endpoint is not in v1 of the plan; the button is a placeholder
    // hooked up when historical-lookup endpoint lands. For now it's a no-op with a hint.
    alert("Historical lookup will be added once we have older PriceHistory data. For now please enter manually.");
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <p className="font-medium">Set cost basis ({matchedSkinItems.length} items)</p>
        <Button variant="outline" size="sm" onClick={autofillFromHistory} className="border-slate-700/50 text-slate-300">
          Auto-fill from history
        </Button>
      </div>

      <div className="max-h-[50vh] overflow-y-auto border border-slate-700/50 rounded">
        <table className="w-full text-sm">
          <thead className="bg-slate-800/60 sticky top-0">
            <tr className="text-left text-slate-400">
              <th className="p-2">Skin</th>
              <th className="p-2 w-20">Qty</th>
              <th className="p-2 w-32">Buy Price (€)</th>
              <th className="p-2 w-40">Buy Date</th>
            </tr>
          </thead>
          <tbody>
            {matchedSkinItems.map(m => {
              const row = value.find(v => v.skinId === m.skinId);
              return (
                <tr key={m.skinId} className="border-t border-slate-700/50">
                  <td className="p-2 text-white">{m.name}</td>
                  <td className="p-2 text-slate-300">{m.amount}</td>
                  <td className="p-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={row?.buyPrice ?? ''}
                      onChange={e => update(m.skinId!, { buyPrice: e.target.value ? parseFloat(e.target.value) : null })}
                      className="bg-slate-800 border-slate-700 h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Input
                      type="date"
                      value={row?.buyDate ? row.buyDate.toISOString().slice(0,10) : ''}
                      onChange={e => update(m.skinId!, { buyDate: e.target.value ? new Date(e.target.value) : null })}
                      className="bg-slate-800 border-slate-700 h-8"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onBack} className="border-slate-700/50">Back</Button>
        <Button onClick={onSubmit} disabled={importing} className="bg-gradient-to-r from-purple-500 to-pink-500">
          {importing ? 'Importing…' : 'Import'}
        </Button>
      </div>
    </div>
  );
}
```

### Step 3: TS check

```bash
cd frontend
npx tsc --noEmit 2>&1 | grep -E "ImportPreviewModal|BulkEditCostBasis" | head -10
```

Expected: no errors in these files (pre-existing errors elsewhere ignored).

### Step 4: Manual smoke test (if servers running)

1. Open `http://localhost:3000/account` — see Profile + Steam section (Not connected)
2. Click "Connect Steam Account" → redirects to Steam → log in → returns to `/account?steam=connected`
3. Click "Import Inventory" → modal opens, shows preview counts
4. Choose "Leave empty" → click Import → see "Created N entries" success message
5. Navigate to `/portfolio` → verify skins from your Steam inventory show up

If servers not running, skip — TypeScript pass is enough verification.

### Step 5: Commit

```bash
git add frontend/src/app/account/_components/
git commit -m "feat(steam): ImportPreviewModal + BulkEditCostBasis"
```

---

## Self-Review

**Spec coverage:**
- ✅ User.steamId + User.steamConnectedAt → Task 1
- ✅ Portfolio.importedFromSteamAt + Portfolio.removedFromSteamAt → Task 1
- ✅ Stateless Steam OpenID 2.0 (no passport, no sessions) → Task 2
- ✅ Inventory fetch (5min cache + retry) → Task 3
- ✅ Match against Skin/Case/MarketItem → Task 4
- ✅ Cost basis modes (empty / current_market / custom) → Task 5
- ✅ All 6 HTTP endpoints → Task 6
- ✅ /account page + Connect/Disconnect UI → Task 7
- ✅ Preview modal + bulk edit table → Task 8
- ⏸ Re-sync endpoint (resync) — spec listed it; NOT in this plan. The schema fields (`importedFromSteamAt`, `removedFromSteamAt`) are in place for it, but the controller + UI button are deferred. Reason: 4.5-day budget is tight; resync can be a follow-up task once import is shipped and used.
- ⏸ "Auto-fill from history" actually wired — spec mentioned it; v1 is a button with an alert explaining it lands later. Schema/PriceHistory exists but historical depth is shallow (snapshots only since bootstrap).

**Placeholder scan:**
- No "TBD" or "fill in details" in code blocks.
- The "Auto-fill from history" button is intentionally a stub with a user-facing alert — documented in the comment + spec deferred-list. Acceptable per YAGNI.
- All code blocks complete with imports + signatures.

**Type consistency:**
- `MatchedItem.kind: 'skin' | 'case' | 'market_item'` consistent across matcher, importer, hook, and components.
- `CostBasisMode: 'empty' | 'current_market' | 'custom'` consistent.
- `signState`/`verifyState` JSON payload shape `{userId, ts}` used in controller exactly as defined in service.
- `parseSteamIdFromClaimedId` returns `string | null` consistently.
- Portfolio.create payload uses fields that match the schema (`importedFromSteamAt` added in Task 1).

**Scope:** 8 tasks, solo-dev estimate: T1 (0.5d), T2 (0.5d), T3 (0.5d), T4 (0.5d), T5 (0.5d), T6 (1d), T7 (0.5d), T8 (1d) = ~5 working days. Spec target was 4.5 — close enough; T6 + T8 are larger because they integrate many pieces.
