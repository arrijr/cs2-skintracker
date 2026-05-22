import express from 'express';
import marketSnapshotController from '../controllers/marketSnapshotController.js';
import { triggerMarketSnapshotJob } from '../cron/marketSnapshotJob.js';
import clerkAdminAuth from '../middleware/clerkAdminAuth.js';

const router = express.Router();

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
 *
 * Comment claimed "admin only" but no auth middleware was attached, so until
 * 2026-05-22 anyone on the internet could kick off the daily snapshot job
 * (heavy outbound traffic + DB writes). Gate behind clerkAdminAuth.
 */
router.post('/snapshots/trigger', clerkAdminAuth, triggerMarketSnapshotJob);

export default router;
