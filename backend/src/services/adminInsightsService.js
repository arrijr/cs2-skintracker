import prisma from "../prisma/prismaClient.js";

// Admin "Insights" — Phase 3 monitoring surfaces built ONLY on data sources that
// actually carry data (verified against prod 2026-06-01):
//   - Tier distribution        ← User.tier (real)
//   - Steam adoption           ← User.steamId + Portfolio.importedFromSteamAt (real)
//   - Notifications throughput ← Alert + AlertEvent (real)
//   - Snapshot freshness       ← MarketSnapshot grouped by source (real; today only
//                                 `steam_market` exists + is stale — surfaced honestly)
//
// Deliberately NOT included: a multi-source skinport/csfloat price comparison
// (those snapshots are never persisted) and an Inngest/cron panel driven by
// JobRun (the recurring jobs don't write JobRun rows) — both would be empty.
export class AdminInsightsService {
  static async getInsights() {
    const now = Date.now();
    const since24h = new Date(now - 24 * 60 * 60 * 1000);
    const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [
      tierGroups,
      steamConnected,
      importedPortfolioRows,
      activeAlerts,
      totalEvents,
      events24h,
      events7dRows,
      snapshotSources,
      snapshot24h,
    ] = await Promise.all([
      prisma.user.groupBy({ by: ['tier'], _count: { id: true } }),
      prisma.user.count({ where: { steamId: { not: null } } }),
      prisma.portfolio.count({ where: { importedFromSteamAt: { not: null } } }),
      prisma.alert.count({ where: { isActive: true } }),
      prisma.alertEvent.count(),
      prisma.alertEvent.count({ where: { triggeredAt: { gte: since24h } } }),
      prisma.alertEvent.findMany({
        where: { triggeredAt: { gte: since7d } },
        select: { delivered: true, failed: true, readAt: true },
      }),
      prisma.marketSnapshot.groupBy({ by: ['source'], _count: { id: true }, _max: { fetchedAt: true } }),
      prisma.marketSnapshot.count({ where: { date: { gte: since24h } } }),
    ]);

    // Tiers
    const totalUsers = tierGroups.reduce((s, g) => s + g._count.id, 0);
    const tierMap = { free: 0, lite: 0, pro: 0 };
    let untiered = 0;
    for (const g of tierGroups) {
      if (g.tier === 'free' || g.tier === 'lite' || g.tier === 'pro') tierMap[g.tier] = g._count.id;
      else untiered += g._count.id; // null/legacy
    }
    const premiumUsers = tierMap.lite + tierMap.pro;

    // Notifications
    const delivered7d = events7dRows.filter(e => e.delivered?.length).length;
    const failed7d = events7dRows.filter(e => e.failed?.length).length;
    const unread = events7dRows.filter(e => !e.readAt).length;

    // Snapshot freshness
    const sources = snapshotSources
      .map(s => {
        const lastFetch = s._max.fetchedAt;
        const staleHours = lastFetch ? Math.floor((now - new Date(lastFetch).getTime()) / 3_600_000) : null;
        return { source: s.source, rows: s._count.id, lastFetch, staleHours };
      })
      .sort((a, b) => b.rows - a.rows);
    const snapshotTotal = sources.reduce((s, x) => s + x.rows, 0);

    return {
      tiers: {
        distribution: { free: tierMap.free, lite: tierMap.lite, pro: tierMap.pro, untiered },
        totalUsers,
        premiumUsers,
        premiumPercentage: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 10000) / 100 : 0,
      },
      steam: {
        connectedUsers: steamConnected,
        totalUsers,
        connectedPercentage: totalUsers > 0 ? Math.round((steamConnected / totalUsers) * 10000) / 100 : 0,
        importedPortfolioRows,
      },
      notifications: {
        activeAlerts,
        totalEvents,
        events24h,
        events7d: events7dRows.length,
        delivered7d,
        failed7d,
        unread7d: unread,
      },
      pricing: {
        sources,
        snapshotTotal,
        rows24h: snapshot24h,
      },
      generatedAt: new Date(now).toISOString(),
    };
  }
}
