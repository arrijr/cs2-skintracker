// [API] Quantity History — daily active listings (and volume) for bar chart on Skin Detail

const marketSnapshotService = require('../services/marketSnapshotService');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Get quantity history for a specific skin
 * GET /api/v1/skins/:skinId/history/quantity?range=30d|90d|1y|all
 */
const getQuantityHistory = async (req, res) => {
  try {
    const { skinId } = req.params;
    const { range = '30d' } = req.query;

    // Validate range parameter
    const validRanges = ['7d', '30d', '90d', '1y', 'all'];
    if (!validRanges.includes(range)) {
      return res.status(400).json({
        error: 'Invalid range parameter',
        validRanges: validRanges
      });
    }

    // Check if skin exists
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { id: true, name: true }
    });

    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    // Get quantity history
    const history = await marketSnapshotService.getQuantityHistory(parseInt(skinId), range);

    res.json({
      skinId: parseInt(skinId),
      skinName: skin.name,
      range: range,
      data: history,
      count: history.length
    });

  } catch (error) {
    console.error(`[API] Failed to get quantity history for skin ${req.params.skinId}:`, error);
    res.status(500).json({ error: 'Failed to fetch quantity history' });
  }
};

/**
 * Get combined price and quantity history for a skin
 * GET /api/v1/skins/:skinId/history/price-and-quantity?range=30d|90d|1y|all
 */
const getPriceAndQuantityHistory = async (req, res) => {
  try {
    const { skinId } = req.params;
    const { range = '30d' } = req.query;

    // Validate range parameter
    const validRanges = ['7d', '30d', '90d', '1y', 'all'];
    if (!validRanges.includes(range)) {
      return res.status(400).json({
        error: 'Invalid range parameter',
        validRanges: validRanges
      });
    }

    // Check if skin exists
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { id: true, name: true }
    });

    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    // Get quantity history (includes price data)
    const history = await marketSnapshotService.getQuantityHistory(parseInt(skinId), range);

    res.json({
      skinId: parseInt(skinId),
      skinName: skin.name,
      range: range,
      data: history,
      count: history.length
    });

  } catch (error) {
    console.error(`[API] Failed to get price and quantity history for skin ${req.params.skinId}:`, error);
    res.status(500).json({ error: 'Failed to fetch price and quantity history' });
  }
};

/**
 * Get latest market snapshot for a skin
 * GET /api/v1/skins/:skinId/snapshot/latest
 */
const getLatestSnapshot = async (req, res) => {
  try {
    const { skinId } = req.params;

    // Check if skin exists
    const skin = await prisma.skin.findUnique({
      where: { id: parseInt(skinId) },
      select: { id: true, name: true }
    });

    if (!skin) {
      return res.status(404).json({ error: 'Skin not found' });
    }

    // Get latest snapshot
    const snapshot = await marketSnapshotService.getLatestSnapshot(parseInt(skinId));

    if (!snapshot) {
      return res.status(404).json({ error: 'No market snapshot found for this skin' });
    }

    res.json({
      skinId: parseInt(skinId),
      skinName: skin.name,
      snapshot: snapshot
    });

  } catch (error) {
    console.error(`[API] Failed to get latest snapshot for skin ${req.params.skinId}:`, error);
    res.status(500).json({ error: 'Failed to fetch latest snapshot' });
  }
};

/**
 * Get market snapshot statistics
 * GET /api/v1/snapshots/stats
 */
const getSnapshotStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Get snapshot statistics
    const stats = await prisma.marketSnapshot.aggregate({
      where: {
        date: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      _avg: {
        activeListings: true,
        soldVolume24h: true
      },
      _sum: {
        activeListings: true,
        soldVolume24h: true
      }
    });

    // Get unique skins with snapshots
    const uniqueSkins = await prisma.marketSnapshot.groupBy({
      by: ['skinId'],
      where: {
        date: {
          gte: startDate
        }
      },
      _count: {
        skinId: true
      }
    });

    res.json({
      period: `${days} days`,
      totalSnapshots: stats._count.id,
      uniqueSkins: uniqueSkins.length,
      averageActiveListings: stats._avg.activeListings,
      averageSoldVolume24h: stats._avg.soldVolume24h,
      totalActiveListings: stats._sum.activeListings,
      totalSoldVolume24h: stats._sum.soldVolume24h
    });

  } catch (error) {
    console.error(`[API] Failed to get snapshot stats:`, error);
    res.status(500).json({ error: 'Failed to fetch snapshot statistics' });
  }
};

module.exports = {
  getQuantityHistory,
  getPriceAndQuantityHistory,
  getLatestSnapshot,
  getSnapshotStats
};
