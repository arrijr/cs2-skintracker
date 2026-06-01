/**
 * adminP2Services.test.js — Phase 2 service fixes (2026-06-01).
 *
 * These services were written against an imagined schema. A mocked prisma does
 * NOT validate column names, so we can't assert "right number out" — instead we
 * spy on the prisma CALL ARGS and assert the services query the REAL columns
 * (priceUpdatedAt not lastPriceUpdate, weaponType not category, watchlist not
 * watchlists, displayName not username, userId not adminId).
 */
import { jest } from '@jest/globals';

const prismaMock = {
  skin: {
    count: jest.fn(({ where } = {}) => Promise.resolve(where ? 5 : 100)),
    findMany: jest.fn(() => Promise.resolve([
      { id: 1, name: 'AK', weaponType: 'Rifle', rarity: 'Covert', wear: 'FT',
        priceUpdatedAt: new Date('2026-05-01'), priceAvg: 10, _count: { watchlist: 3 } },
    ])),
  },
  user: {
    findMany: jest.fn(() => Promise.resolve([
      { id: 1, email: 'a@b.c', displayName: 'A', role: 'user', tier: 'pro', isPremium: true,
        emailAlerts: true, createdAt: new Date(), _count: { portfolio: 2, watchlist: 4 } },
    ])),
    findUnique: jest.fn(() => Promise.resolve({
      id: 1, email: 'a@b.c', displayName: 'A', role: 'user', tier: 'free', isPremium: false,
      emailAlerts: true, createdAt: new Date(),
      portfolio: [{ id: 1, skin: { id: 1, name: 'AK', weaponType: 'Rifle', rarity: 'Covert', priceAvg: 10 }, amount: 2, buyPrice: 5, buyDate: new Date() }],
      watchlist: [{ id: 1, skin: { id: 2, name: 'AWP', weaponType: 'Sniper', rarity: 'Covert', priceAvg: 20 }, priceAlert: 15, createdAt: new Date() }],
      _count: { portfolio: 1, watchlist: 1 },
    })),
    count: jest.fn(() => Promise.resolve(7)),
    update: jest.fn(({ data }) => Promise.resolve({ id: 1, email: 'a@b.c', ...data })),
  },
  auditLog: { create: jest.fn(() => Promise.resolve({})) },
  portfolioHistory: { findMany: jest.fn(() => Promise.resolve([
    { date: new Date('2026-05-01'), value: 100 }, { date: new Date('2026-05-10'), value: 150 },
  ])) },
  watchlist: { findMany: jest.fn(() => Promise.resolve([])) },
};

await jest.unstable_mockModule('../../prisma/prismaClient.js', () => ({ default: prismaMock }));
await jest.unstable_mockModule('../prisma/prismaClient.js', () => ({ default: prismaMock }));

const { CoverageService } = await import('../services/coverageService.js');
const { UserManagementService } = await import('../services/userManagementService.js');

beforeEach(() => jest.clearAllMocks());

describe('CoverageService uses real Skin columns (fixes Phase-1 Coverage 500)', () => {
  it('getOverallCoverage queries priceUpdatedAt, never lastPriceUpdate; median is a valid Date', async () => {
    const r = await CoverageService.getOverallCoverage();
    const whereJson = prismaMock.skin.count.mock.calls.map(c => JSON.stringify(c[0] || {}));
    expect(whereJson.some(s => s.includes('priceUpdatedAt'))).toBe(true);
    expect(whereJson.some(s => s.includes('lastPriceUpdate'))).toBe(false);
    expect(r.medianLastPriceAge).toBeInstanceOf(Date);
    expect(Number.isNaN(r.medianLastPriceAge.getTime())).toBe(false);
  });

  it('getTopMissingSkins selects weaponType + _count.watchlist, maps to category/watchlistCount', async () => {
    const rows = await CoverageService.getTopMissingSkins(10);
    const arg = prismaMock.skin.findMany.mock.calls[0][0];
    expect(arg.select.weaponType).toBe(true);
    expect(arg.select._count.select.watchlist).toBe(true);
    expect(rows[0].category).toBe('Rifle');
    expect(rows[0].watchlistCount).toBe(3);
    expect(rows[0].lastPriceUpdate).toBeInstanceOf(Date);
  });
});

describe('UserManagementService uses the real schema', () => {
  it('getUsers selects displayName + _count.portfolio/watchlist (not username/portfolios)', async () => {
    const r = await UserManagementService.getUsers({});
    const arg = prismaMock.user.findMany.mock.calls[0][0];
    expect(arg.select.displayName).toBe(true);
    expect(arg.select.username).toBeUndefined();
    expect(arg.select._count.select.portfolio).toBe(true);
    expect(arg.select._count.select.watchlist).toBe(true);
    expect(r.users[0].portfolioCount).toBe(2);
    expect(r.users[0].tier).toBe('pro');
  });

  it('getUserDetails computes portfolioStats from amount/buyPrice', async () => {
    const r = await UserManagementService.getUserDetails(1);
    expect(r.portfolioStats.totalValue).toBe(20);    // amount 2 * priceAvg 10
    expect(r.portfolioStats.totalInvested).toBe(10); // amount 2 * buyPrice 5
    expect(r.portfolioStats.profitLoss).toBe(10);
  });

  it('updateUserTier sets tier + isPremium and audit-logs with userId (not adminId/parameters)', async () => {
    const r = await UserManagementService.updateUserTier(1, 'lite', 42);
    expect(prismaMock.user.update.mock.calls[0][0].data).toEqual({ tier: 'lite', isPremium: true });
    const audit = prismaMock.auditLog.create.mock.calls[0][0].data;
    expect(audit.userId).toBe(42);
    expect(audit).not.toHaveProperty('adminId');
    expect(audit).not.toHaveProperty('parameters');
    expect(r.isPremium).toBe(true);
  });

  it('updateUserTier free → isPremium false', async () => {
    await UserManagementService.updateUserTier(1, 'free', 42);
    expect(prismaMock.user.update.mock.calls[0][0].data).toEqual({ tier: 'free', isPremium: false });
  });

  it('updateUserTier rejects an invalid tier', async () => {
    await expect(UserManagementService.updateUserTier(1, 'enterprise', 42)).rejects.toThrow('Invalid tier');
  });

  it('getUserStatistics returns premiumUsers and no status-based counts', async () => {
    const s = await UserManagementService.getUserStatistics();
    expect(s).toHaveProperty('premiumUsers');
    expect(s).not.toHaveProperty('suspendedUsers');
    expect(s).not.toHaveProperty('activeUsers');
  });
});
