// backend/src/routes/admin/jobsRoutes.js
// Job monitoring + safe controls. GET /jobs reads real JobRun rows; the POST
// controls run dry-run impact estimates (real execution is refused — see the
// controller). All gated by clerkAdminAuth.
import express from 'express';
import clerkAdminAuth from '../../middleware/clerkAdminAuth.js';
import {
  getJobs,
  getJobStatus,
  getJobRun,
  runSkinPriceUpdate,
  runPortfolioSnapshot,
  runAlertCheck,
} from '../../controllers/adminController.js';

const router = express.Router();
router.use(clerkAdminAuth);

router.get('/jobs', getJobs);
router.get('/jobs/status', getJobStatus);
router.post('/jobs/skin-prices', runSkinPriceUpdate);
router.post('/jobs/portfolio-snapshots', runPortfolioSnapshot);
router.post('/jobs/alert-check', runAlertCheck);
// Keep the param route last so it doesn't shadow the literal /jobs/* paths above.
router.get('/jobs/:jobRunId', getJobRun);

export default router;
