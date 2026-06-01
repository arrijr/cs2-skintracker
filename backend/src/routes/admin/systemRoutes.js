// backend/src/routes/admin/systemRoutes.js
// System-level admin endpoints: overview KPIs, audit logs, metrics definitions,
// Steam cache invalidation. All gated by clerkAdminAuth.
import express from 'express';
import clerkAdminAuth from '../../middleware/clerkAdminAuth.js';
import {
  getOverview,
  getLogs,
  getMetricsDefinitions,
  clearSteamCache,
} from '../../controllers/adminController.js';

const router = express.Router();
router.use(clerkAdminAuth);

router.get('/overview', getOverview);
router.get('/logs', getLogs);
router.get('/metrics-definitions', getMetricsDefinitions);
router.post('/cache/steam/clear', clearSteamCache);

export default router;
