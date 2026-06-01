/**
 * adminController.test.js — unit tests for the Phase-1 admin panel fixes (2026-06-01).
 *
 * Fully prisma-mocked → DB-independent. Covers:
 *   - audit log writes `userId` (not `adminId`); getLogs includes `user` (not `admin`)
 *   - getOverview real aggregates + real alerts24h
 *   - getJobs derived from JobRun (status mapping + duration)
 *   - clearSteamCache clears the inventory cache + audit-logs
 *   - run* handlers refuse non-dry execution (501)
 */
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
  alertEvent: {
    findMany: jest.fn(() => Promise.resolve([
      { delivered: ['email'], failed: [] },
      { delivered: [], failed: ['email'] },
    ])),
  },
  jobRun: {
    findMany: jest.fn(() => Promise.resolve([
      {
        jobName: 'updateSkinPrices', status: 'completed',
        startedAt: new Date('2026-06-01T10:00:00Z'), completedAt: new Date('2026-06-01T10:15:32Z'),
        updatedCount: 1250, failedCount: 3, insertedCount: null, actualCount: null,
      },
    ])),
  },
};

const clearInventoryCacheMock = jest.fn();

// Dual registration matches the proven pattern in auth/integration tests — covers
// whichever relative depth the controller resolves prismaClient from.
await jest.unstable_mockModule('../../prisma/prismaClient.js', () => ({ default: prismaMock }));
await jest.unstable_mockModule('../prisma/prismaClient.js', () => ({ default: prismaMock }));

// Services imported by the controller module but not exercised by these handlers.
await jest.unstable_mockModule('../services/jobService.js', () => ({
  JobService: {}, SkinPriceUpdateJob: {}, PortfolioSnapshotJob: {}, AlertCheckJob: {},
}));
await jest.unstable_mockModule('../services/coverageService.js', () => ({ CoverageService: {} }));
await jest.unstable_mockModule('../services/apiHealthService.js', () => ({ APIHealthService: {} }));
await jest.unstable_mockModule('../services/dataQualityService.js', () => ({ DataQualityService: {} }));
await jest.unstable_mockModule('../services/userManagementService.js', () => ({ UserManagementService: {} }));
await jest.unstable_mockModule('../services/featureFlagsService.js', () => ({ FeatureFlagsService: {} }));
await jest.unstable_mockModule('../services/backfillService.js', () => ({ BackfillService: {} }));
await jest.unstable_mockModule('../services/steam/steamInventoryClient.js', () => ({
  clearInventoryCache: clearInventoryCacheMock,
}));

const { getOverview, getJobs, getLogs, clearSteamCache, runSkinPriceUpdate } =
  await import('../controllers/adminController.js');

function mockRes() {
  return {
    statusCode: 200, body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
}
const req = { user: { id: 42, email: 'admin@x.io', role: 'admin' }, query: {}, body: {} };

beforeEach(() => jest.clearAllMocks());

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

describe('getOverview real data', () => {
  it('computes lastPriceUpdate/coverage from Skin aggregate + real alerts24h', async () => {
    const res = mockRes();
    await getOverview(req, res);
    expect(res.body.lastPriceUpdate).toEqual(new Date('2026-06-01T00:00:00Z'));
    expect(res.body.priceCoverage).toBe(10);
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
    expect(job.status).toBe('success');
    expect(job.duration).toBe('15m 32s');
    expect(job.resultCounts).toEqual({ updated: 1250, failed: 3 });
  });
});

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

describe('run* handlers refuse non-dry execution', () => {
  it('runSkinPriceUpdate with dryRun:false → 501 honest message', async () => {
    const res = mockRes();
    await runSkinPriceUpdate({ ...req, body: { dryRun: false } }, res);
    expect(res.statusCode).toBe(501);
    expect(res.body.error).toMatch(/not wired to the live pipeline/i);
  });
});
