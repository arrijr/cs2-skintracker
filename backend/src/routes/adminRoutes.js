import express from 'express';
import clerkAdminAuth from '../middleware/clerkAdminAuth.js';
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
  getMetricsDefinitions,
  // Phase 4: Advanced Features
  getUsers,
  getUserDetails,
  getUserActivity,
  updateUserStatus,
  updateUserEmailAlerts,
  getUserStatistics,
  searchUsers,
  getAllFeatureFlags,
  getFeatureFlag,
  updateFeatureFlag,
  getFeatureFlagsSummary,
  validateFeatureFlags,
  getFeatureRolloutStatus,
  getDataGapsAnalysis,
  getPrioritizedBackfillTasks,
  executeBackfillTask,
  getBackfillHistory
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require admin authentication
router.use(clerkAdminAuth);

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

// ADM-4: System Health Check (Frontend compatibility)
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    admin: true 
  });
});

// ADM-5: Admin Ping Test
router.get('/ping', (req, res) => {
  res.json({ 
    message: 'admin ok',
    user: req.user?.email,
    timestamp: new Date().toISOString()
  });
});

// ADM-6: Steam Price Cache Management
router.get('/cache/steam/stats', async (req, res) => {
  try {
    const { getCacheStats } = await import('../services/steamService.js');
    const stats = getCacheStats();
    res.json({
      success: true,
      cache: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get cache stats' 
    });
  }
});

router.get('/cache/steam/items', async (req, res) => {
  try {
    const { getCachedItems } = await import('../services/steamService.js');
    const items = getCachedItems();
    res.json({
      success: true,
      items,
      count: items.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting cached items:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get cached items' 
    });
  }
});

router.post('/cache/steam/clear', async (req, res) => {
  try {
    const { clearCache } = await import('../services/steamService.js');
    const clearedCount = clearCache();
    res.json({
      success: true,
      message: `Cleared ${clearedCount} cache entries`,
      clearedCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear cache' 
    });
  }
});

// ADM-13: User Management - Phase 4
router.get('/users', getUsers);
router.get('/users/search', searchUsers);
router.get('/users/:userId', getUserDetails);
router.get('/users/:userId/activity', getUserActivity);
router.put('/users/:userId/status', updateUserStatus);
router.put('/users/:userId/email-alerts', updateUserEmailAlerts);
router.get('/users/stats/overview', getUserStatistics);

// ADM-14: Feature Flags Management - Phase 4
router.get('/feature-flags', getAllFeatureFlags);
router.get('/feature-flags/summary', getFeatureFlagsSummary);
router.get('/feature-flags/validate', validateFeatureFlags);
router.get('/feature-flags/rollout-status', getFeatureRolloutStatus);
router.get('/feature-flags/:flagKey', getFeatureFlag);
router.put('/feature-flags/:flagKey', updateFeatureFlag);

// ADM-15: Backfill Tools - Phase 4
router.get('/backfill/gaps-analysis', getDataGapsAnalysis);
router.get('/backfill/prioritized-tasks', getPrioritizedBackfillTasks);
router.post('/backfill/execute/:taskId', executeBackfillTask);
router.get('/backfill/history', getBackfillHistory);

export default router;
