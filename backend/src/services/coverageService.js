import prisma from "../prisma/prismaClient.js";

// Coverage analysis service for data quality insights.
//
// NOTE (2026-06-01, Phase 2 fix): this service was written against an imagined
// schema. The real Skin model uses `priceUpdatedAt` (not `lastPriceUpdate`),
// `weaponType` (not `category`), and the relation is `watchlist` (singular).
// Queries now use the real columns; the API response still exposes the keys the
// frontend expects (`category`, `lastPriceUpdate`) by mapping at the boundary.
export class CoverageService {
  // Get overall price coverage statistics
  static async getOverallCoverage() {
    try {
      const totalSkins = await prisma.skin.count();

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const skinsWithRecentPrices = await prisma.skin.count({
        where: { priceUpdatedAt: { gte: sevenDaysAgo } }
      });

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const skinsWithoutHistory = await prisma.skin.count({
        where: {
          OR: [
            { priceUpdatedAt: null },
            { priceUpdatedAt: { lt: thirtyDaysAgo } }
          ]
        }
      });

      const coveragePercentage = totalSkins > 0 ? (skinsWithRecentPrices / totalSkins) * 100 : 0;

      // Median last-price timestamp. Average two epoch-ms numerically (the old
      // code added two Date objects → NaN on even-length sets).
      const skinsWithPrices = await prisma.skin.findMany({
        where: { priceUpdatedAt: { not: null } },
        select: { priceUpdatedAt: true },
        orderBy: { priceUpdatedAt: 'asc' }
      });

      let medianAge = null;
      if (skinsWithPrices.length > 0) {
        const ms = skinsWithPrices.map(s => new Date(s.priceUpdatedAt).getTime());
        const mid = Math.floor(ms.length / 2);
        const medMs = ms.length % 2 === 0 ? (ms[mid - 1] + ms[mid]) / 2 : ms[mid];
        medianAge = new Date(medMs);
      }

      return {
        totalSkins,
        skinsWithRecentPrices,
        coveragePercentage: Math.round(coveragePercentage * 100) / 100,
        skinsWithoutHistory,
        medianLastPriceAge: medianAge,
        sevenDaysAgo,
        thirtyDaysAgo
      };
    } catch (error) {
      console.error('Error getting overall coverage:', error);
      throw error;
    }
  }

  // Get coverage by segment (weapon type, rarity, wear)
  static async getCoverageBySegment(segmentType, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;

      // Map the UI segment name → the real Skin column.
      const segmentField = CoverageService._segmentField(segmentType);

      const segmentValues = await prisma.skin.findMany({
        select: { [segmentField]: true },
        where: { [segmentField]: { not: null } },
        distinct: [segmentField]
      });

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

      const segmentCoverage = await Promise.all(
        segmentValues.map(async (segment) => {
          const value = segment[segmentField];

          const [totalInSegment, withRecentPrices, withoutHistory, stalePrices] = await Promise.all([
            prisma.skin.count({ where: { [segmentField]: value } }),
            prisma.skin.count({ where: { [segmentField]: value, priceUpdatedAt: { gte: sevenDaysAgo } } }),
            prisma.skin.count({
              where: {
                [segmentField]: value,
                OR: [{ priceUpdatedAt: null }, { priceUpdatedAt: { lt: thirtyDaysAgo } }]
              }
            }),
            prisma.skin.count({ where: { [segmentField]: value, priceUpdatedAt: { lt: fortyEightHoursAgo } } })
          ]);

          const coverage = totalInSegment > 0 ? (withRecentPrices / totalInSegment) * 100 : 0;
          const stalePercentage = totalInSegment > 0 ? (stalePrices / totalInSegment) * 100 : 0;

          return {
            segment: value,
            totalSkins: totalInSegment,
            coveragePercentage: Math.round(coverage * 100) / 100,
            stalePercentage: Math.round(stalePercentage * 100) / 100,
            withoutHistory,
            withRecentPrices
          };
        })
      );

      const sortedCoverage = segmentCoverage.sort((a, b) => a.coveragePercentage - b.coveragePercentage);
      const paginatedCoverage = sortedCoverage.slice(offset, offset + limit);

      return {
        segmentType,
        coverage: paginatedCoverage,
        pagination: {
          page,
          limit,
          total: segmentCoverage.length,
          totalPages: Math.ceil(segmentCoverage.length / limit)
        }
      };
    } catch (error) {
      console.error('Error getting coverage by segment:', error);
      throw error;
    }
  }

  // Get top missing skins (most relevant without fresh prices)
  static async getTopMissingSkins(limit = 50) {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const missingSkins = await prisma.skin.findMany({
        where: {
          OR: [
            { priceUpdatedAt: null },
            { priceUpdatedAt: { lt: sevenDaysAgo } }
          ]
        },
        select: {
          id: true,
          name: true,
          weaponType: true,
          rarity: true,
          wear: true,
          priceUpdatedAt: true,
          priceAvg: true,
          _count: { select: { watchlist: true } }
        },
        orderBy: [
          { priceAvg: 'desc' },
          { _count: { watchlist: 'desc' } }
        ],
        take: limit
      });

      return missingSkins.map(skin => ({
        id: skin.id,
        name: skin.name,
        category: skin.weaponType,             // API contract key
        rarity: skin.rarity,
        wear: skin.wear,
        lastPriceUpdate: skin.priceUpdatedAt,  // API contract key
        hadPrice: skin.priceAvg !== null,
        watchlistCount: skin._count.watchlist,
        daysSinceUpdate: skin.priceUpdatedAt
          ? Math.floor((Date.now() - new Date(skin.priceUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
          : null
      }));
    } catch (error) {
      console.error('Error getting top missing skins:', error);
      throw error;
    }
  }

  // Get skins for drill-down (specific segment value)
  static async getSkinsForSegment(segmentType, segmentValue, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const segmentField = CoverageService._segmentField(segmentType);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const where = {
        [segmentField]: segmentValue,
        OR: [{ priceUpdatedAt: null }, { priceUpdatedAt: { lt: sevenDaysAgo } }]
      };

      const [skins, total] = await Promise.all([
        prisma.skin.findMany({
          where,
          select: {
            id: true,
            name: true,
            weaponType: true,
            rarity: true,
            wear: true,
            priceUpdatedAt: true,
            priceAvg: true
          },
          orderBy: { name: 'asc' },
          skip: offset,
          take: limit
        }),
        prisma.skin.count({ where })
      ]);

      return {
        segmentType,
        segmentValue,
        skins: skins.map(skin => ({
          id: skin.id,
          name: skin.name,
          category: skin.weaponType,
          rarity: skin.rarity,
          wear: skin.wear,
          lastPriceUpdate: skin.priceUpdatedAt,
          priceAvg: skin.priceAvg,
          daysSinceUpdate: skin.priceUpdatedAt
            ? Math.floor((Date.now() - new Date(skin.priceUpdatedAt).getTime()) / (1000 * 60 * 60 * 24))
            : null
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting skins for segment:', error);
      throw error;
    }
  }

  // UI segment name → real Skin column. 'weaponType' UI value maps to the
  // weaponType column (the old code wrongly used a non-existent `category`).
  static _segmentField(segmentType) {
    switch (segmentType) {
      case 'weaponType': return 'weaponType';
      case 'rarity': return 'rarity';
      case 'wear': return 'wear';
      default: throw new Error('Invalid segment type');
    }
  }
}
