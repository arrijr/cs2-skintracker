# Admin-Panel Phase 1 (Reparieren) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verwaisten `adminController` verdrahten + Bugs fixen, sodass `/admin` Overview/Jobs/Logs/Coverage/Controls mit echten Daten laufen.

**Architecture:** Fokussierte Route-Module unter `backend/src/routes/admin/`, alle unter `/api/v1/admin/*` hinter `clerkAdminAuth` + `adminLimiter`. Controller bleibt monolithisch (nur Bugfix). Raw-SQL → Prisma-Aggregate. Echte Datenquellen: `JobRun`, `AlertEvent`, `Skin`-Aggregate.

**Tech Stack:** Express 5, Prisma, Jest (ESM via `cross-env NODE_OPTIONS=--experimental-vm-modules`), `jest.unstable_mockModule`.

**Spec:** [[docs/superpowers/specs/2026-06-01-admin-panel-modernization-design|Design-Spec]]

---

## File Structure

| Datei | Verantwortung | Aktion |
|-------|---------------|--------|
| `backend/src/services/jobService.js` | Job-Status-Vokabular (`completed`), Feldname `priceUpdatedAt` | Modify |
| `backend/src/controllers/adminController.js` | Audit-Log-Feld/Relation, `req.user.id`, `getOverview` aggregate + alerts24h, `getJobs` real, neue `clearSteamCache` | Modify |
| `backend/src/utils/adminFormat.js` | `formatDuration`, `toUiStatus`, `jobHealth` Helper (rein, testbar) | Create |
| `backend/src/routes/admin/systemRoutes.js` | `/overview`, `/logs`, `/metrics-definitions`, `/cache/steam/clear` | Create |
| `backend/src/routes/admin/jobsRoutes.js` | `/jobs`, `/jobs/status`, `/jobs/:jobRunId`, `POST /jobs/{skin-prices,portfolio-snapshots,alert-check}` | Create |
| `backend/src/routes/admin/coverageRoutes.js` | `/coverage/{overview,segments,missing-skins,segment-skins}` | Create |
| `backend/src/app.js` | Mounts der 3 Module | Modify |
| `backend/src/__tests__/adminFormat.test.js` | Unit-Tests Helper | Create |
| `backend/src/__tests__/adminController.test.js` | Unit-Tests Bugfixes (userId, getJobs, getOverview, clearSteamCache) | Create |
| `backend/src/__tests__/adminRoutes.test.js` | supertest: 401/403-Gate + 200-Shape | Create |

---

## Task 1: Helper-Modul `adminFormat.js` (rein, TDD)

**Files:**
- Create: `backend/src/utils/adminFormat.js`
- Test: `backend/src/__tests__/adminFormat.test.js`

- [ ] **Step 1: Failing test**

```javascript
// backend/src/__tests__/adminFormat.test.js
import { describe, it, expect } from '@jest/globals';
import { formatDuration, toUiStatus, jobHealth } from '../utils/adminFormat.js';

describe('formatDuration', () => {
  it('formats sub-minute as seconds', () => {
    expect(formatDuration(45_000)).toBe('45s');
  });
  it('formats minutes + seconds', () => {
    expect(formatDuration(15 * 60_000 + 32_000)).toBe('15m 32s');
  });
  it('returns "—" for null', () => {
    expect(formatDuration(null)).toBe('—');
  });
});

describe('toUiStatus', () => {
  it('maps completed/done → success', () => {
    expect(toUiStatus('completed')).toBe('success');
    expect(toUiStatus('done')).toBe('success');
  });
  it('maps failed → error', () => {
    expect(toUiStatus('failed')).toBe('error');
  });
  it('passes through running/queued', () => {
    expect(toUiStatus('running')).toBe('running');
    expect(toUiStatus('queued')).toBe('queued');
  });
});

describe('jobHealth (staleness thresholds)', () => {
  const now = new Date('2026-06-01T12:00:00Z');
  it('healthy when fresh', () => {
    expect(jobHealth('updateSkinPrices', new Date('2026-06-01T11:00:00Z'), now)).toBe('healthy');
  });
  it('warning when stale past warn threshold', () => {
    expect(jobHealth('updateSkinPrices', new Date('2026-05-31T09:00:00Z'), now)).toBe('warning');
  });
  it('error when stale past error threshold', () => {
    expect(jobHealth('updateSkinPrices', new Date('2026-05-29T09:00:00Z'), now)).toBe('error');
  });
  it('error when never run (null)', () => {
    expect(jobHealth('updateSkinPrices', null, now)).toBe('error');
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`Cannot find module '../utils/adminFormat.js'`)

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest adminFormat -i`

- [ ] **Step 3: Implement**

```javascript
// backend/src/utils/adminFormat.js
// Pure formatting + health helpers for the admin panel. No prisma import → fast unit tests.

export function formatDuration(ms) {
  if (ms == null) return '—';
  const totalSec = Math.round(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

// JobRun.status vocabulary is mixed ('done' legacy from jobService, 'completed'
// from schema). The Jobs-tab badge only styles 'success'/'error' specially.
export function toUiStatus(status) {
  if (status === 'completed' || status === 'done') return 'success';
  if (status === 'failed') return 'error';
  return status; // 'running' | 'queued'
}

// Per-job staleness thresholds in HOURS → { warn, error }.
// TODO(user, learning): tune these numbers to your real cron cadence.
// Defaults assume: price update daily (~03:30 UTC), alert check ~hourly,
// portfolio snapshot daily.
const STALENESS_HOURS = {
  updateSkinPrices:   { warn: 26, error: 50 },
  rebuildSnapshots:   { warn: 30, error: 54 },
  alertCheck:         { warn: 3,  error: 12 },
  steam_skin_import:  { warn: Infinity, error: Infinity }, // user-triggered, never "stale"
  _default:           { warn: 26, error: 50 },
};

export function jobHealth(jobName, lastRun, now = new Date()) {
  if (!lastRun) return 'error';
  const { warn, error } = STALENESS_HOURS[jobName] ?? STALENESS_HOURS._default;
  const ageH = (now.getTime() - new Date(lastRun).getTime()) / 3_600_000;
  if (ageH >= error) return 'error';
  if (ageH >= warn) return 'warning';
  return 'healthy';
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest adminFormat -i`

- [ ] **Step 5: Commit**

```bash
git add backend/src/utils/adminFormat.js backend/src/__tests__/adminFormat.test.js
git commit -m "feat(admin): add pure format/health helpers for admin panel"
```

---

## Task 2: Safely disable real job-execute (keep dry-run)

**Files:**
- Modify: `backend/src/controllers/adminController.js` (`runSkinPriceUpdate`, `runPortfolioSnapshot`, `runAlertCheck`)

**Context (revised after pre-flight):** The three `*Job.execute` paths in `jobService.js` are mocks — `SkinPriceUpdateJob.execute` writes a non-existent `Skin.lastPriceUpdate`, and a real run would stamp `priceUpdatedAt` without real prices (pollutes coverage). Real price/alert work now runs via cron/Inngest. We do NOT touch `jobService` status vocabulary (`'done'`) because `apiHealthService.js:36,108,217` reads `'done'` as success — changing it would regress API-health counting (Phase 2 territory). `getJobs` already maps both `'done'` and `'completed'` → success via `toUiStatus`.

**Decision:** dry-run stays fully functional (real impact counts). Real-execute (`dryRun:false`) returns 501 with an honest message instead of running a data-polluting mock. Prod-write gate stays.

- [ ] **Step 1: In each of `runSkinPriceUpdate`, `runPortfolioSnapshot`, `runAlertCheck`** — after the existing production-safety gate and before the `if (dryRun)` block, insert:

```javascript
    // Manual real-execute is intentionally not wired to the live pipeline.
    // Price/alert/snapshot work runs via cron + Inngest. The admin button is a
    // dry-run impact estimator; a real run here would invoke a mock that writes
    // placeholder data. Refuse non-dry runs honestly. (Plan 2026-06-01 Task 2)
    if (!dryRun) {
      return res.status(501).json({
        error: 'Manual execution is not wired to the live pipeline. These jobs run via cron/Inngest. Use dry-run for an impact estimate.',
      });
    }
```

Note: `runSkinPriceUpdate` destructures `dryRun = true` from `req.body`; the other two also default `dryRun = true`. The guard is identical in all three.

- [ ] **Step 2: Tech-debt note** — add a `// TODO(tech-debt):` one-liner above `JobService` in `jobService.js` recording the `'done'`/`'completed'` status split-brain (jobService+marketSnapshotJob write `'done'`; apiHealthService reads `'done'`; adminMetricsRoutes reads `'completed'`) to be harmonised in Phase 2 when the API-health UI is built.

```javascript
// TODO(tech-debt, Phase 2): job-status vocabulary split-brain — this file +
// cron/marketSnapshotJob.js write 'done'; services/apiHealthService.js reads
// 'done'; routes/adminMetricsRoutes.js reads 'completed'. Harmonise to the
// schema's 'completed' across all readers+writers when the API-health UI lands.
```

- [ ] **Step 3: Run full backend suite to confirm no regression**

Run: `cd backend && npm test`
Expected: existing suites still pass.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/adminController.js backend/src/services/jobService.js
git commit -m "fix(admin): disable mock job-execute (501), keep dry-run; note status tech-debt"
```

---

## Task 3: `adminController` — audit-log + auth-field bugfixes (TDD)

**Files:**
- Modify: `backend/src/controllers/adminController.js`
- Test: `backend/src/__tests__/adminController.test.js`

**Context:** `AuditLog` has `userId`/`user`, NOT `adminId`/`admin`. `clerkAdminAuth` sets `req.user.id` (not `.userId`).

- [ ] **Step 1: Failing test — audit log uses `userId`, logs include `user`**

```javascript
// backend/src/__tests__/adminController.test.js
import { jest } from '@jest/globals';

const prismaMock = {
  auditLog: {
    create: jest.fn(() => Promise.resolve({})),
    findMany: jest.fn(() => Promise.resolve([
      { id: 1, action: 'view', resource: 'x', details: null, createdAt: new Date(), user: { email: 'a@b.c' } },
    ])),
    count: jest.fn(() => Promise.resolve(1)),
  },
  skin: {
    aggregate: jest.fn(() => Promise.resolve({ _max: { priceUpdatedAt: new Date('2026-06-01T00:00:00Z') } })),
    count: jest.fn(({ where } = {}) => Promise.resolve(where ? 10 : 100)),
  },
  portfolioHistory: { findFirst: jest.fn(() => Promise.resolve({ date: new Date('2026-05-31') })) },
  alert: { count: jest.fn(() => Promise.resolve(7)) },
  alertEvent: { findMany: jest.fn(() => Promise.resolve([
    { delivered: ['email'], failed: [] },
    { delivered: [], failed: ['email'] },
  ])) },
  jobRun: { findMany: jest.fn(() => Promise.resolve([
    { jobName: 'updateSkinPrices', status: 'completed', startedAt: new Date('2026-06-01T10:00:00Z'),
      completedAt: new Date('2026-06-01T10:15:32Z'), updatedCount: 1250, failedCount: 3, insertedCount: null, actualCount: null },
  ])) },
};

await jest.unstable_mockModule('../prisma/prismaClient.js', () => ({ default: prismaMock }));
// Services are imported by the controller module but not exercised by these handlers.
await jest.unstable_mockModule('../services/jobService.js', () => ({
  JobService: {}, SkinPriceUpdateJob: {}, PortfolioSnapshotJob: {}, AlertCheckJob: {},
}));
await jest.unstable_mockModule('../services/coverageService.js', () => ({ CoverageService: {} }));
await jest.unstable_mockModule('../services/apiHealthService.js', () => ({ APIHealthService: {} }));
await jest.unstable_mockModule('../services/dataQualityService.js', () => ({ DataQualityService: {} }));
await jest.unstable_mockModule('../services/userManagementService.js', () => ({ UserManagementService: {} }));
await jest.unstable_mockModule('../services/featureFlagsService.js', () => ({ FeatureFlagsService: {} }));
await jest.unstable_mockModule('../services/backfillService.js', () => ({ BackfillService: {} }));

const { getOverview, getJobs, getLogs } = await import('../controllers/adminController.js');

function mockRes() {
  return { statusCode: 200, body: null, status(c) { this.statusCode = c; return this; }, json(b) { this.body = b; return this; } };
}
const req = { user: { id: 42, email: 'admin@x.io', role: 'admin' }, query: {} };

describe('adminController audit-log + auth-field fixes', () => {
  it('getLogs requests the `user` relation (not `admin`)', async () => {
    const res = mockRes();
    await getLogs(req, res);
    const arg = prismaMock.auditLog.findMany.mock.calls[0][0];
    expect(arg.include).toEqual({ user: { select: { email: true } } });
  });

  it('writes audit log with `userId` (never `adminId`)', async () => {
    const res = mockRes();
    await getOverview(req, res);
    const createArg = prismaMock.auditLog.create.mock.calls.at(-1)[0];
    expect(createArg.data.userId).toBe(42);
    expect(createArg.data).not.toHaveProperty('adminId');
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest adminController -i`
Expected: FAIL (`include` is `{ admin: … }`, `data.adminId` present).

- [ ] **Step 3: Implement — global replacements in `adminController.js`**

In every `prisma.auditLog.create({ data: { adminId: <X>, ... } })`, rename `adminId:` → `userId:`. In `getLogs`, change `include: { admin: { select: { email: true } } }` → `include: { user: { select: { email: true } } }`. Replace every `req.user.userId` → `req.user.id`. (Affected handlers: getOverview, getJobs, getLogs, runSkinPriceUpdate, runPortfolioSnapshot, runAlertCheck, updateUserStatus, updateUserEmailAlerts, updateUserPremiumStatus, updateFeatureFlag, executeBackfillTask, getBackfillHistory.)

- [ ] **Step 4: Run — these two tests pass** (getOverview/getJobs full behavior covered in Task 4)

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest adminController -t "audit-log" -i`

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/adminController.js backend/src/__tests__/adminController.test.js
git commit -m "fix(admin): auditLog userId/user relation + req.user.id (was adminId/userId)"
```

---

## Task 4: `getOverview` (aggregate + real alerts24h) & `getJobs` (real JobRun)

**Files:**
- Modify: `backend/src/controllers/adminController.js` (`getOverview`, `getJobs`)
- Test: extend `backend/src/__tests__/adminController.test.js`

- [ ] **Step 1: Add failing tests**

```javascript
describe('getOverview real data', () => {
  it('computes lastPriceUpdate/coverage from Skin aggregate + real alerts24h', async () => {
    const res = mockRes();
    await getOverview(req, res);
    expect(res.body.lastPriceUpdate).toEqual(new Date('2026-06-01T00:00:00Z'));
    expect(res.body.priceCoverage).toBe(10);            // 10/100 * 100
    expect(res.body.pricesWritten24h).toBe(10);
    expect(res.body.alerts24h).toEqual({ alertsChecked24h: 7, alertsSent24h: 1, alertsSkipped24h: 1 });
  });
});

describe('getJobs real data', () => {
  it('derives jobs from latest JobRun per name with mapped status + duration', async () => {
    const res = mockRes();
    await getJobs(req, res);
    const job = res.body.jobs[0];
    expect(job.name).toBe('updateSkinPrices');
    expect(job.status).toBe('success');                 // completed → success
    expect(job.duration).toBe('15m 32s');
    expect(job.resultCounts).toEqual({ updated: 1250, failed: 3 });
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest adminController -i`

- [ ] **Step 3: Implement `getOverview`** — replace the `$queryRaw` block + hardcoded alert stats:

```javascript
export const getOverview = async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [maxAgg, total, written24h, snapshot, activeAlerts, events24h] = await Promise.all([
      prisma.skin.aggregate({ _max: { priceUpdatedAt: true } }),
      prisma.skin.count(),
      prisma.skin.count({ where: { priceUpdatedAt: { gte: since } } }),
      prisma.portfolioHistory.findFirst({ orderBy: { date: 'desc' }, select: { date: true } }),
      prisma.alert.count({ where: { isActive: true } }),
      prisma.alertEvent.findMany({ where: { triggeredAt: { gte: since } }, select: { delivered: true, failed: true } }),
    ]);

    const alertsSent24h = events24h.filter(e => e.delivered?.length).length;
    const alertsSkipped24h = events24h.filter(e => e.failed?.length && !e.delivered?.length).length;

    const overview = {
      lastPriceUpdate: maxAgg._max.priceUpdatedAt || null,
      pricesWritten24h: written24h,
      priceCoverage: total > 0 ? Math.round((written24h / total) * 10000) / 100 : 0,
      portfolioSnapshotLastRun: snapshot?.date || null,
      alerts24h: {
        // alertsChecked24h: active-alert count is a proxy — no per-check log exists. (user-decision §4.3)
        alertsChecked24h: activeAlerts,
        alertsSent24h,
        alertsSkipped24h,
      },
    };

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'view', resource: 'admin_overview', details: 'Admin overview accessed' },
    });

    res.json(overview);
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to load admin overview' });
  }
};
```

- [ ] **Step 4: Implement `getJobs`** — replace the hardcoded array:

```javascript
import { formatDuration, toUiStatus } from '../utils/adminFormat.js'; // add at top of file

export const getJobs = async (req, res) => {
  try {
    const runs = await prisma.jobRun.findMany({ orderBy: { startedAt: 'desc' }, take: 100 });
    const seen = new Set();
    const jobs = [];
    for (const r of runs) {
      if (seen.has(r.jobName)) continue;
      seen.add(r.jobName);
      const durationMs = r.completedAt ? new Date(r.completedAt) - new Date(r.startedAt) : null;
      const resultCounts = {};
      if (r.updatedCount != null) resultCounts.updated = r.updatedCount;
      if (r.insertedCount != null) resultCounts.inserted = r.insertedCount;
      if (r.failedCount != null) resultCounts.failed = r.failedCount;
      if (r.actualCount != null && r.updatedCount == null) resultCounts.processed = r.actualCount;
      jobs.push({
        name: r.jobName,
        lastRun: r.startedAt,
        status: toUiStatus(r.status),
        duration: r.status === 'running' ? 'running…' : formatDuration(durationMs),
        resultCounts,
      });
    }

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'view', resource: 'admin_jobs', details: 'Admin jobs accessed' },
    });

    res.json({ jobs, pagination: { page: 1, limit: jobs.length, total: jobs.length, totalPages: 1 } });
  } catch (error) {
    console.error('Admin jobs error:', error);
    res.status(500).json({ error: 'Failed to load admin jobs' });
  }
};
```

- [ ] **Step 5: Run — expect PASS** (whole adminController suite)

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest adminController -i`

- [ ] **Step 6: Commit**

```bash
git add backend/src/controllers/adminController.js backend/src/__tests__/adminController.test.js
git commit -m "feat(admin): getOverview real aggregates+alerts24h, getJobs real JobRun data"
```

---

## Task 5: `clearSteamCache` handler

**Files:**
- Modify: `backend/src/controllers/adminController.js` (add export)
- Test: extend `backend/src/__tests__/adminController.test.js`

- [ ] **Step 1: Failing test** (add `clearInventoryCache` mock to the existing mock block first)

```javascript
// add to the mock setup at top of adminController.test.js:
const clearInventoryCacheMock = jest.fn();
await jest.unstable_mockModule('../services/steam/steamInventoryClient.js', () => ({
  clearInventoryCache: clearInventoryCacheMock,
}));
// add `clearSteamCache` to the import:
//   const { getOverview, getJobs, getLogs, clearSteamCache } = await import('../controllers/adminController.js');

describe('clearSteamCache', () => {
  it('clears the inventory cache + audit-logs + returns success', async () => {
    const res = mockRes();
    await clearSteamCache(req, res);
    expect(clearInventoryCacheMock).toHaveBeenCalled();
    expect(res.body.success).toBe(true);
    const createArg = prismaMock.auditLog.create.mock.calls.at(-1)[0];
    expect(createArg.data.userId).toBe(42);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`clearSteamCache is not a function`)

- [ ] **Step 3: Implement** — add to `adminController.js`:

```javascript
import { clearInventoryCache } from '../services/steam/steamInventoryClient.js'; // top of file

// ADM: Clear Steam inventory in-memory cache (read-only invalidation, no prod gate)
export const clearSteamCache = async (req, res) => {
  try {
    clearInventoryCache();
    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'cache_clear', resource: 'steam_inventory', details: 'Steam inventory cache cleared' },
    });
    res.json({ success: true, message: 'Steam inventory cache cleared' });
  } catch (error) {
    console.error('Error clearing steam cache:', error);
    res.status(500).json({ success: false, error: 'Failed to clear cache' });
  }
};
```

- [ ] **Step 4: Run — expect PASS**

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/adminController.js backend/src/__tests__/adminController.test.js
git commit -m "feat(admin): add clearSteamCache handler (POST /cache/steam/clear)"
```

---

## Task 6: Route modules + app.js mounts

**Files:**
- Create: `backend/src/routes/admin/systemRoutes.js`, `jobsRoutes.js`, `coverageRoutes.js`
- Modify: `backend/src/app.js`
- Test: `backend/src/__tests__/adminRoutes.test.js`

**Context:** Each router mounts at `/api/v1/admin` (multiple routers same base path = valid Express). Paths exactly match what the frontend already calls (§1.2 of spec), so no frontend URL change.

- [ ] **Step 1: Create `systemRoutes.js`**

```javascript
// backend/src/routes/admin/systemRoutes.js
import express from 'express';
import clerkAdminAuth from '../../middleware/clerkAdminAuth.js';
import { getOverview, getLogs, getMetricsDefinitions, clearSteamCache } from '../../controllers/adminController.js';

const router = express.Router();
router.use(clerkAdminAuth);

router.get('/overview', getOverview);
router.get('/logs', getLogs);
router.get('/metrics-definitions', getMetricsDefinitions);
router.post('/cache/steam/clear', clearSteamCache);

export default router;
```

- [ ] **Step 2: Create `jobsRoutes.js`**

```javascript
// backend/src/routes/admin/jobsRoutes.js
import express from 'express';
import clerkAdminAuth from '../../middleware/clerkAdminAuth.js';
import {
  getJobs, getJobStatus, getJobRun,
  runSkinPriceUpdate, runPortfolioSnapshot, runAlertCheck,
} from '../../controllers/adminController.js';

const router = express.Router();
router.use(clerkAdminAuth);

router.get('/jobs', getJobs);
router.get('/jobs/status', getJobStatus);
router.post('/jobs/skin-prices', runSkinPriceUpdate);
router.post('/jobs/portfolio-snapshots', runPortfolioSnapshot);
router.post('/jobs/alert-check', runAlertCheck);
router.get('/jobs/:jobRunId', getJobRun);

export default router;
```

- [ ] **Step 3: Create `coverageRoutes.js`**

```javascript
// backend/src/routes/admin/coverageRoutes.js
import express from 'express';
import clerkAdminAuth from '../../middleware/clerkAdminAuth.js';
import {
  getCoverageOverview, getCoverageBySegment, getTopMissingSkins, getSkinsForSegment,
} from '../../controllers/adminController.js';

const router = express.Router();
router.use(clerkAdminAuth);

router.get('/coverage/overview', getCoverageOverview);
router.get('/coverage/segments', getCoverageBySegment);
router.get('/coverage/missing-skins', getTopMissingSkins);
router.get('/coverage/segment-skins', getSkinsForSegment);

export default router;
```

- [ ] **Step 4: Mount in `app.js`** — add imports near line 26 and mounts near line 156 (BEFORE the existing `adminRoutes` catch-all `/update-skin-data` is fine; order among admin routers doesn't matter since paths are distinct):

```javascript
// imports (after adminMetricsRoutes import)
import adminSystemRoutes from "./routes/admin/systemRoutes.js";
import adminJobsRoutes from "./routes/admin/jobsRoutes.js";
import adminCoverageRoutes from "./routes/admin/coverageRoutes.js";

// mounts (immediately after the existing app.use("/api/v1/admin", adminLimiter, adminRoutes);)
app.use("/api/v1/admin", adminLimiter, adminSystemRoutes);
app.use("/api/v1/admin", adminLimiter, adminJobsRoutes);
app.use("/api/v1/admin", adminLimiter, adminCoverageRoutes);
```

- [ ] **Step 5: Auth-gate test (supertest, no DB needed — gate rejects before handler)**

```javascript
// backend/src/__tests__/adminRoutes.test.js
import { jest } from '@jest/globals';
import request from 'supertest';

// Force clerkAdminAuth to reject so we test the gate without Clerk/DB.
await jest.unstable_mockModule('../middleware/clerkAdminAuth.js', () => ({
  default: (req, res) => res.status(401).json({ error: 'Access token required' }),
}));
const { default: app } = await import('../app.js');

describe('admin routes are mounted + gated', () => {
  for (const path of ['/api/v1/admin/overview', '/api/v1/admin/jobs', '/api/v1/admin/coverage/overview']) {
    it(`GET ${path} → 401 (mounted, gate active — not 404)`, async () => {
      const res = await request(app).get(path);
      expect(res.status).toBe(401);
    });
  }
  it('POST /api/v1/admin/cache/steam/clear → 401 (mounted)', async () => {
    const res = await request(app).post('/api/v1/admin/cache/steam/clear');
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 6: Run — expect PASS** (401 proves the routes exist; 404 would prove they don't)

Run: `cd backend && npx cross-env NODE_OPTIONS=--experimental-vm-modules jest adminRoutes -i`

- [ ] **Step 7: Run the FULL suite**

Run: `cd backend && npm test`
Expected: all green.

- [ ] **Step 8: Commit**

```bash
git add backend/src/routes/admin/ backend/src/app.js backend/src/__tests__/adminRoutes.test.js
git commit -m "feat(admin): wire focused admin route modules (overview/jobs/coverage) under /api/v1/admin"
```

---

## Task 7: Live verification + manual smoke

**Files:** none (verification only)

- [ ] **Step 1: Verify queries against live Supabase** (MCP `execute_sql`, read-only): confirm `Skin.priceUpdatedAt`, `JobRun`, `AlertEvent.delivered/failed`, `AuditLog.userId` columns exist as the new code assumes; confirm no drift breaks a P1 query. Record findings.

- [ ] **Step 2: Boot backend + frontend locally**

Run: `cd backend && npm run dev` (:5000) and `cd frontend && npm run dev` (:3000)

- [ ] **Step 3: Manual smoke as an admin user** — load `/admin`, click through Overview / Jobs / Logs / Coverage / Controls. Confirm: no "Failed to load admin data"; KPI cards populate; Jobs lists real `JobRun` rows; Logs show `user.email`; Coverage loads; Controls dry-run returns an impact message; Clear Steam Cache returns success.

- [ ] **Step 4: Reconcile any frontend shape mismatch** — if a field renders blank, adjust the **controller** output to match the frontend interface (`AdminOverview`/`AdminJob`/`CoverageOverview`/etc.). Keep frontend untouched unless a genuine UI bug exists.

- [ ] **Step 5: Commit any controller shape fix**

```bash
git add backend/src/controllers/adminController.js
git commit -m "fix(admin): reconcile controller response shapes with frontend interfaces"
```

---

## Self-Review (done at write time)

- **Spec coverage:** §4.1 routing → Task 6. §4.2 bugfixes → Tasks 2–4. §4.1 clearSteamCache → Task 5. §4.3 jobHealth/alerts24h → Task 1 (`jobHealth`) + Task 4 (`alerts24h`). §4.5 tests → Tasks 1,3,4,5,6. §4.6 live verify → Task 7. ✅
- **Coverage controls handlers** (`getCoverage*`) are wired (Task 6) but not unit-tested in P1 — they call `CoverageService` unchanged (pre-existing). Smoke-covered in Task 7. Acceptable for P1.
- **Job POST handlers** wired; real execute stays mock + prod-gated (out of P1 scope — see spec §4.3/Risks). Dry-run is the functional path.
- **Placeholder scan:** none. **Type consistency:** `toUiStatus`/`formatDuration`/`jobHealth` signatures consistent across Task 1 ↔ Task 4. ✅

## Out of scope (→ Phase 2/3)
User-Management / Feature-Flags / Backfill / API-Health / Data-Quality UIs; real job execution pipeline; multi-source pricing & notifications surfaces.
