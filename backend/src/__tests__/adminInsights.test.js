/**
 * adminInsights.test.js — Phase 3 insights service (2026-06-01).
 * Asserts shape + that it queries the real columns that actually carry data
 * (steamId, importedFromSteamAt, tier, MarketSnapshot.source).
 */
import { jest } from '@jest/globals';

const prismaMock = {
  user: {
    groupBy: jest.fn(() => Promise.resolve([
      { tier: 'pro', _count: { id: 1 } },
      { tier: 'free', _count: { id: 1 } },
    ])),
    count: jest.fn(() => Promise.resolve(1)), // steam-connected
  },
  portfolio: { count: jest.fn(() => Promise.resolve(78)) },
  alert: { count: jest.fn(() => Promise.resolve(2)) },
  alertEvent: {
    count: jest.fn(({ where } = {}) => Promise.resolve(where ? 5 : 67)),
    findMany: jest.fn(() => Promise.resolve([
      { delivered: ['email'], failed: [], readAt: null },
      { delivered: [], failed: ['email'], readAt: new Date() },
    ])),
  },
  marketSnapshot: {
    groupBy: jest.fn(() => Promise.resolve([
      { source: 'steam_market', _count: { id: 1340 }, _max: { fetchedAt: new Date('2026-05-31T03:31:00Z') } },
    ])),
    count: jest.fn(() => Promise.resolve(0)),
  },
};

await jest.unstable_mockModule('../../prisma/prismaClient.js', () => ({ default: prismaMock }));
await jest.unstable_mockModule('../prisma/prismaClient.js', () => ({ default: prismaMock }));

const { AdminInsightsService } = await import('../services/adminInsightsService.js');

describe('AdminInsightsService.getInsights', () => {
  it('aggregates tiers/steam/notifications/pricing from real columns', async () => {
    const r = await AdminInsightsService.getInsights();

    expect(r.tiers.distribution).toEqual({ free: 1, lite: 0, pro: 1, untiered: 0 });
    expect(r.tiers.totalUsers).toBe(2);
    expect(r.tiers.premiumUsers).toBe(1);

    expect(r.steam.connectedUsers).toBe(1);
    expect(r.steam.importedPortfolioRows).toBe(78);

    expect(r.notifications.activeAlerts).toBe(2);
    expect(r.notifications.totalEvents).toBe(67);
    expect(r.notifications.events24h).toBe(5);
    expect(r.notifications.events7d).toBe(2);
    expect(r.notifications.delivered7d).toBe(1);
    expect(r.notifications.failed7d).toBe(1);
    expect(r.notifications.unread7d).toBe(1);

    expect(r.pricing.sources[0]).toMatchObject({ source: 'steam_market', rows: 1340 });
    expect(typeof r.pricing.sources[0].staleHours).toBe('number');
    expect(r.pricing.snapshotTotal).toBe(1340);

    // queries the REAL columns
    expect(prismaMock.user.count.mock.calls[0][0]).toEqual({ where: { steamId: { not: null } } });
    expect(prismaMock.portfolio.count.mock.calls[0][0]).toEqual({ where: { importedFromSteamAt: { not: null } } });
    expect(prismaMock.user.groupBy.mock.calls[0][0].by).toEqual(['tier']);
    expect(prismaMock.marketSnapshot.groupBy.mock.calls[0][0].by).toEqual(['source']);
  });
});
