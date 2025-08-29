import express from 'express';
import { adminAuth } from '../middleware/adminAuth.js';
import { 
  getOverview, 
  getJobs, 
  getLogs,
  // Phase 2: Job Management
  getJobStatus,
  runSkinPriceUpdate,
  runPortfolioSnapshot,
  runAlertCheck,
  getJobRun,
  // Phase 3: Analytics & Explorer
  getCoverageOverview,
  getCoverageBySegment,
  getTopMissingSkins,
  getSkinsForSegment,
  getAPIHealth24h,
  getAPIHealth7d,
  getAPIHealthTimeSeries,
  getAPIHealthJobRuns,
  getDataQualityAlerts,
  runDataQualityChecks,
  getMetricsDefinitions
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require admin authentication
router.use(adminAuth);

// ADM-1: Overview
router.get('/overview', getOverview);

// ADM-2: Jobs (read-only)
router.get('/jobs', getJobs);

// ADM-3: Logs (read-only)
router.get('/logs', getLogs);

// ADM-5: Job Management (safe controls) - Phase 2
router.get('/jobs/status', getJobStatus);
router.post('/jobs/skin-prices', runSkinPriceUpdate);
router.post('/jobs/portfolio-snapshots', runPortfolioSnapshot);
router.post('/jobs/alert-check', runAlertCheck);
router.get('/jobs/runs/:jobRunId', getJobRun);

// ADM-9: Coverage Explorer - Phase 3
router.get('/coverage/overview', getCoverageOverview);
router.get('/coverage/segments', getCoverageBySegment);
router.get('/coverage/missing-skins', getTopMissingSkins);
router.get('/coverage/segment-skins', getSkinsForSegment);

// ADM-10: API Health - Phase 3
router.get('/api-health/24h', getAPIHealth24h);
router.get('/api-health/7d', getAPIHealth7d);
router.get('/api-health/time-series', getAPIHealthTimeSeries);
router.get('/api-health/job-runs', getAPIHealthJobRuns);

// ADM-11: Data Quality Alerts - Phase 3
router.get('/data-quality/alerts', getDataQualityAlerts);
router.post('/data-quality/run-checks', runDataQualityChecks);

// ADM-12: Metrics Definitions - Phase 3
router.get('/metrics/definitions', getMetricsDefinitions);

export default router;
