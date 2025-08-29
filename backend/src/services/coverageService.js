import prisma from "../prisma/prismaClient.js";

// Coverage analysis service for data quality insights
export class CoverageService {
  // Get overall price coverage statistics
  static async getOverallCoverage() {
    try {
      // Total skins count
      const totalSkins = await prisma.skin.count();
      
      // Skins with recent prices (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const skinsWithRecentPrices = await prisma.skin.count({
        where: {
          lastPriceUpdate: { gte: sevenDaysAgo }
        }
      });
      
      // Skins without any price history (30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const skinsWithoutHistory = await prisma.skin.count({
        where: {
          OR: [
            { lastPriceUpdate: null },
            { lastPriceUpdate: { lt: thirtyDaysAgo } }
          ]
        }
      });
      
      // Calculate coverage percentage
      const coveragePercentage = totalSkins > 0 ? (skinsWithRecentPrices / totalSkins) * 100 : 0;
      
      // Get median last price age
      const skinsWithPrices = await prisma.skin.findMany({
        where: { lastPriceUpdate: { not: null } },
        select: { lastPriceUpdate: true },
        orderBy: { lastPriceUpdate: 'asc' }
      });
      
      let medianAge = null;
      if (skinsWithPrices.length > 0) {
        const sortedDates = skinsWithPrices.map(s => s.lastPriceUpdate).sort();
        const mid = Math.floor(sortedDates.length / 2);
        medianAge = sortedDates.length % 2 === 0 
          ? (sortedDates[mid - 1] + sortedDates[mid]) / 2
          : sortedDates[mid];
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
      
      // Get unique values for the segment
      let segmentValues = [];
      let segmentField = '';
      
      switch (segmentType) {
        case 'weaponType':
          segmentField = 'category';
          segmentValues = await prisma.skin.findMany({
            select: { category: true },
            where: { category: { not: null } },
            distinct: ['category']
          });
          break;
        case 'rarity':
          segmentField = 'rarity';
          segmentValues = await prisma.skin.findMany({
            select: { rarity: true },
            where: { rarity: { not: null } },
            distinct: ['rarity']
          });
          break;
        case 'wear':
          segmentField = 'wear';
          segmentValues = await prisma.skin.findMany({
            select: { wear: true },
            where: { wear: { not: null } },
            distinct: ['wear']
          });
          break;
        default:
          throw new Error('Invalid segment type');
      }
      
      // Calculate coverage for each segment
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const segmentCoverage = await Promise.all(
        segmentValues.map(async (segment) => {
          const value = segment[segmentField];
          
          // Total skins in this segment
          const totalInSegment = await prisma.skin.count({
            where: { [segmentField]: value }
          });
          
          // Skins with recent prices
          const withRecentPrices = await prisma.skin.count({
            where: {
              [segmentField]: value,
              lastPriceUpdate: { gte: sevenDaysAgo }
            }
          });
          
          // Skins without history
          const withoutHistory = await prisma.skin.count({
            where: {
              [segmentField]: value,
              OR: [
                { lastPriceUpdate: null },
                { lastPriceUpdate: { lt: thirtyDaysAgo } }
              ]
            }
          });
          
          // Stale prices (> 48h)
          const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
          const stalePrices = await prisma.skin.count({
            where: {
              [segmentField]: value,
              lastPriceUpdate: { lt: fortyEightHoursAgo }
            }
          });
          
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
      
      // Sort by coverage percentage (ascending) and paginate
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
      
      // Get skins without recent prices, ordered by relevance
      // Relevance: skins that had prices historically OR are in watchlists
      const missingSkins = await prisma.skin.findMany({
        where: {
          OR: [
            { lastPriceUpdate: null },
            { lastPriceUpdate: { lt: sevenDaysAgo } }
          ]
        },
        select: {
          id: true,
          name: true,
          category: true,
          rarity: true,
          wear: true,
          lastPriceUpdate: true,
          priceAvg: true,
          // Add watchlist count if available
          _count: {
            select: {
              watchlists: true
            }
          }
        },
        orderBy: [
          { priceAvg: 'desc' }, // Had prices historically
          { _count: { watchlists: 'desc' } } // Popular in watchlists
        ],
        take: limit
      });
      
      return missingSkins.map(skin => ({
        id: skin.id,
        name: skin.name,
        category: skin.category,
        rarity: skin.rarity,
        wear: skin.wear,
        lastPriceUpdate: skin.lastPriceUpdate,
        hadPrice: skin.priceAvg !== null,
        watchlistCount: skin._count.watchlists,
        daysSinceUpdate: skin.lastPriceUpdate 
          ? Math.floor((Date.now() - skin.lastPriceUpdate.getTime()) / (1000 * 60 * 60 * 24))
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
      
      let segmentField = '';
      switch (segmentType) {
        case 'weaponType':
          segmentField = 'category';
          break;
        case 'rarity':
          segmentField = 'rarity';
          break;
        case 'wear':
          segmentField = 'wear';
          break;
        default:
          throw new Error('Invalid segment type');
      }
      
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get skins in this segment without recent prices
      const skins = await prisma.skin.findMany({
        where: {
          [segmentField]: segmentValue,
          OR: [
            { lastPriceUpdate: null },
            { lastPriceUpdate: { lt: sevenDaysAgo } }
          ]
        },
        select: {
          id: true,
          name: true,
          category: true,
          rarity: true,
          wear: true,
          lastPriceUpdate: true,
          priceAvg: true
        },
        orderBy: { name: 'asc' },
        skip: offset,
        take: limit
      });
      
      // Get total count for pagination
      const total = await prisma.skin.count({
        where: {
          [segmentField]: segmentValue,
          OR: [
            { lastPriceUpdate: null },
            { lastPriceUpdate: { lt: sevenDaysAgo } }
          ]
        }
      });
      
      return {
        segmentType,
        segmentValue,
        skins: skins.map(skin => ({
          ...skin,
          daysSinceUpdate: skin.lastPriceUpdate 
            ? Math.floor((Date.now() - skin.lastPriceUpdate.getTime()) / (1000 * 60 * 60 * 24))
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
}
