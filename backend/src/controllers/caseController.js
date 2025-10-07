// /backend/src/controllers/caseController.js — [Backend]
// {/* Case Controller - Handle case-related API endpoints */}
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

/**
 * Get all cases with optional filtering and sorting
 * GET /api/cases
 */
const getAllCases = async (req, res) => {
  try {
    const { 
      search, 
      discontinued, 
      sortBy = 'timeToExtinction', 
      sortOrder = 'asc',
      limit = 100,
      offset = 0
    } = req.query;

    // Build where clause
    const where = {};
    
    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    if (discontinued !== undefined) {
      where.isDiscontinued = discontinued === 'true';
    }

    // Build orderBy clause
    const orderBy = {};
    orderBy[sortBy] = sortOrder;

    // Get cases with pagination
    const cases = await prisma.case.findMany({
      where,
      orderBy,
      take: parseInt(limit),
      skip: parseInt(offset),
      include: {
        caseSkins: {
          include: {
            skin: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                rarity: true
              }
            }
          }
        }
      }
    });

    // Get total count for pagination
    const totalCount = await prisma.case.count({ where });

    res.json({
      cases,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ 
      error: 'Failed to fetch cases',
      details: error.message 
    });
  }
};

/**
 * Get a specific case by ID with detailed information
 * GET /api/cases/:id
 */
const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const caseId = parseInt(id);

    if (isNaN(caseId)) {
      return res.status(400).json({ error: 'Invalid case ID' });
    }

    const caseData = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        caseSkins: {
          include: {
            skin: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                rarity: true,
                priceLatest: true,
                priceMedian: true,
                // Real SteamWebAPI.com data
                offerVolume: true,
                soldToday: true,
                sold7d: true,
                sold30d: true,
                sold90d: true,
                soldTotal: true
              }
            }
          },
          orderBy: {
            rarity: 'asc'
          }
        },
        caseSupply: {
          orderBy: {
            date: 'desc'
          },
          take: 30 // Last 30 days
        },
        casePriceHistory: {
          orderBy: {
            date: 'desc'
          },
          take: 90 // Last 90 days
        }
      }
    });

    if (!caseData) {
      return res.status(404).json({ error: 'Case not found' });
    }

    // Get real SteamWebAPI.com data for the case itself
    const steamCaseData = await prisma.skin.findFirst({
      where: {
        name: caseData.name,
        weaponType: 'case'
      },
      select: {
        offerVolume: true,
        soldToday: true,
        sold7d: true,
        sold30d: true,
        sold90d: true,
        soldTotal: true,
        priceLatest: true,
        priceMedian: true,
        priceChange24h: true,
        priceChange7d: true,
        priceChange30d: true
      }
    });

    // Calculate aggregated statistics from contained skins
    const totalOfferVolume = (caseData.caseSkins || []).reduce((sum, caseSkin) => 
      sum + (caseSkin.skin?.offerVolume || 0), 0
    );
    const totalSold7d = (caseData.caseSkins || []).reduce((sum, caseSkin) => 
      sum + (caseSkin.skin?.sold7d || 0), 0
    );
    const totalSold30d = (caseData.caseSkins || []).reduce((sum, caseSkin) => 
      sum + (caseSkin.skin?.sold30d || 0), 0
    );
    const totalSold90d = (caseData.caseSkins || []).reduce((sum, caseSkin) => 
      sum + (caseSkin.skin?.sold90d || 0), 0
    );

    // Enhanced case data with real SteamWebAPI.com statistics
    const enhancedCaseData = {
      ...caseData,
      // Real SteamWebAPI.com data for the case itself
      steamData: steamCaseData ? {
        offerVolume: steamCaseData.offerVolume,
        soldToday: steamCaseData.soldToday,
        sold7d: steamCaseData.sold7d,
        sold30d: steamCaseData.sold30d,
        sold90d: steamCaseData.sold90d,
        soldTotal: steamCaseData.soldTotal,
        priceLatest: steamCaseData.priceLatest,
        priceMedian: steamCaseData.priceMedian,
        priceChange24h: steamCaseData.priceChange24h,
        priceChange7d: steamCaseData.priceChange7d,
        priceChange30d: steamCaseData.priceChange30d
      } : null,
      // Aggregated statistics from contained skins
      aggregatedStats: {
        totalOfferVolume,
        totalSold7d,
        totalSold30d,
        totalSold90d,
        averageSold7d: (caseData.caseSkins || []).length > 0 ? Math.round(totalSold7d / (caseData.caseSkins || []).length) : 0,
        averageSold30d: (caseData.caseSkins || []).length > 0 ? Math.round(totalSold30d / (caseData.caseSkins || []).length) : 0,
        averageSold90d: (caseData.caseSkins || []).length > 0 ? Math.round(totalSold90d / (caseData.caseSkins || []).length) : 0
      }
    };

    res.json(enhancedCaseData);

  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ 
      error: 'Failed to fetch case',
      details: error.message 
    });
  }
};

/**
 * Get case supply history
 * GET /api/cases/:id/supply
 */
const getCaseSupply = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 90 } = req.query;
    const caseId = parseInt(id);

    if (isNaN(caseId)) {
      return res.status(400).json({ error: 'Invalid case ID' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const supplyData = await prisma.caseSupply.findMany({
      where: {
        caseId,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    res.json(supplyData);

  } catch (error) {
    console.error('Error fetching case supply:', error);
    res.status(500).json({ 
      error: 'Failed to fetch case supply',
      details: error.message 
    });
  }
};

/**
 * Get case price history
 * GET /api/cases/:id/price-history
 */
const getCasePriceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 90 } = req.query;
    const caseId = parseInt(id);

    if (isNaN(caseId)) {
      return res.status(400).json({ error: 'Invalid case ID' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const priceData = await prisma.casePriceHistory.findMany({
      where: {
        caseId,
        date: {
          gte: startDate
        }
      },
      orderBy: {
        date: 'asc'
      }
    });

    res.json(priceData);

  } catch (error) {
    console.error('Error fetching case price history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch case price history',
      details: error.message 
    });
  }
};

/**
 * Get skins contained in a case
 * GET /api/cases/:id/skins
 */
const getCaseSkins = async (req, res) => {
  try {
    const { id } = req.params;
    const caseId = parseInt(id);

    if (isNaN(caseId)) {
      return res.status(400).json({ error: 'Invalid case ID' });
    }

    const skins = await prisma.caseSkin.findMany({
      where: { caseId },
      include: {
        skin: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            rarity: true,
            priceLatest: true,
            priceMedian: true,
            weaponType: true
          }
        }
      },
      orderBy: [
        { rarity: 'asc' },
        { skin: { name: 'asc' } }
      ]
    });

    res.json(skins);

  } catch (error) {
    console.error('Error fetching case skins:', error);
    res.status(500).json({ 
      error: 'Failed to fetch case skins',
      details: error.message 
    });
  }
};

/**
 * Get case statistics and market overview
 * GET /api/cases/stats
 */
const getCaseStats = async (req, res) => {
  try {
    const stats = await prisma.case.aggregate({
      _count: {
        id: true
      },
      _avg: {
        price: true,
        marketCap: true,
        timeToExtinction: true
      },
      _sum: {
        remaining: true,
        dropped: true,
        unboxed: true
      }
    });

    const discontinuedCount = await prisma.case.count({
      where: { isDiscontinued: true }
    });

    const activeCount = await prisma.case.count({
      where: { isDiscontinued: false }
    });

    res.json({
      totalCases: stats._count.id,
      activeCases: activeCount,
      discontinuedCases: discontinuedCount,
      averagePrice: stats._avg.price,
      averageMarketCap: stats._avg.marketCap,
      averageTimeToExtinction: stats._avg.timeToExtinction,
      totalRemaining: stats._sum.remaining,
      totalDropped: stats._sum.dropped,
      totalUnboxed: stats._sum.unboxed
    });

  } catch (error) {
    console.error('Error fetching case stats:', error);
    res.status(500).json({ 
      error: 'Failed to fetch case statistics',
      details: error.message 
    });
  }
};

export default {
  getAllCases,
  getCaseById,
  getCaseSupply,
  getCasePriceHistory,
  getCaseSkins,
  getCaseStats
};