// backend/src/routes/admin/coverageRoutes.js
// Data-coverage explorer: overall coverage, per-segment breakdown, top missing
// skins, and the skin list for a given segment. All gated by clerkAdminAuth.
import express from 'express';
import clerkAdminAuth from '../../middleware/clerkAdminAuth.js';
import {
  getCoverageOverview,
  getCoverageBySegment,
  getTopMissingSkins,
  getSkinsForSegment,
} from '../../controllers/adminController.js';

const router = express.Router();
router.use(clerkAdminAuth);

router.get('/coverage/overview', getCoverageOverview);
router.get('/coverage/segments', getCoverageBySegment);
router.get('/coverage/missing-skins', getTopMissingSkins);
router.get('/coverage/segment-skins', getSkinsForSegment);

export default router;
