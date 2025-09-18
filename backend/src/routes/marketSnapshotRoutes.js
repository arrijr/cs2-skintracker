const express = require('express');
const router = express.Router();
const marketSnapshotController = require('../controllers/marketSnapshotController');
const { triggerMarketSnapshotJob } = require('../cron/marketSnapshotJob');

// [API] Quantity History — daily active listings (and volume) for bar chart on Skin Detail

/**
 * Get quantity history for a specific skin
 * GET /api/v1/skins/:skinId/history/quantity?range=30d|90d|1y|all
 */
router.get('/skins/:skinId/history/quantity', marketSnapshotController.getQuantityHistory);

/**
 * Get combined price and quantity history for a skin
 * GET /api/v1/skins/:skinId/history/price-and-quantity?range=30d|90d|1y|all
 */
router.get('/skins/:skinId/history/price-and-quantity', marketSnapshotController.getPriceAndQuantityHistory);

/**
 * Get latest market snapshot for a skin
 * GET /api/v1/skins/:skinId/snapshot/latest
 */
router.get('/skins/:skinId/snapshot/latest', marketSnapshotController.getLatestSnapshot);

/**
 * Get market snapshot statistics
 * GET /api/v1/snapshots/stats?days=7
 */
router.get('/snapshots/stats', marketSnapshotController.getSnapshotStats);

/**
 * Trigger market snapshot job manually (admin only)
 * POST /api/v1/snapshots/trigger
 */
router.post('/snapshots/trigger', triggerMarketSnapshotJob);

module.exports = router;
