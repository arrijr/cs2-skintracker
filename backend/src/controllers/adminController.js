import prisma from "../prisma/prismaClient.js";
import { JobService, SkinPriceUpdateJob, PortfolioSnapshotJob, AlertCheckJob } from "../services/jobService.js";
import { CoverageService } from "../services/coverageService.js";
import { APIHealthService } from "../services/apiHealthService.js";
import { DataQualityService } from "../services/dataQualityService.js";
import { UserManagementService } from "../services/userManagementService.js";
import { FeatureFlagsService } from "../services/featureFlagsService.js";
import { BackfillService } from "../services/backfillService.js";
import { formatDuration, toUiStatus } from "../utils/adminFormat.js";
import { clearInventoryCache } from "../services/steam/steamInventoryClient.js";

// ADM-1: Overview KPIs
export const getOverview = async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [maxAgg, total, written24h, snapshot, activeAlerts, events24h] = await Promise.all([
      prisma.skin.aggregate({ _max: { priceUpdatedAt: true } }),
      prisma.skin.count(),
      prisma.skin.count({ where: { priceUpdatedAt: { gte: since } } }),
      prisma.portfolioHistory.findFirst({ orderBy: { date: 'desc' }, select: { date: true } }),
      prisma.alert.count({ where: { isActive: true } }),
      prisma.alertEvent.findMany({
        where: { triggeredAt: { gte: since } },
        select: { delivered: true, failed: true },
      }),
    ]);

    const alertsSent24h = events24h.filter(e => e.delivered?.length).length;
    const alertsSkipped24h = events24h.filter(e => e.failed?.length && !e.delivered?.length).length;

    const overview = {
      lastPriceUpdate: maxAgg._max.priceUpdatedAt || null,
      pricesWritten24h: written24h,
      priceCoverage: total > 0 ? Math.round((written24h / total) * 10000) / 100 : 0,
      portfolioSnapshotLastRun: snapshot?.date || null,
      alerts24h: {
        // alertsChecked24h: active-alert count is a proxy — no per-check log exists.
        alertsChecked24h: activeAlerts,
        alertsSent24h,
        alertsSkipped24h,
      },
    };

    // Log admin view
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'view',
        resource: 'admin_overview',
        details: 'Admin overview accessed'
      }
    });

    res.json(overview);
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: 'Failed to load admin overview' });
  }
};

// ADM-2: Jobs Table
export const getJobs = async (req, res) => {
  try {
    // Real data: latest JobRun per jobName (cron + manual dry-runs both write JobRun).
    const runs = await prisma.jobRun.findMany({ orderBy: { startedAt: 'desc' }, take: 100 });
    const seen = new Set();
    const jobs = [];
    for (const r of runs) {
      if (seen.has(r.jobName)) continue;
      seen.add(r.jobName);
      const durationMs = r.completedAt ? new Date(r.completedAt) - new Date(r.startedAt) : null;
      const resultCounts = {};
      if (r.updatedCount != null) resultCounts.updated = r.updatedCount;
      if (r.insertedCount != null) resultCounts.inserted = r.insertedCount;
      if (r.failedCount != null) resultCounts.failed = r.failedCount;
      if (r.actualCount != null && r.updatedCount == null) resultCounts.processed = r.actualCount;
      jobs.push({
        name: r.jobName,
        lastRun: r.startedAt,
        status: toUiStatus(r.status),
        duration: r.status === 'running' ? 'running…' : formatDuration(durationMs),
        resultCounts,
      });
    }

    // Log admin view
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'view',
        resource: 'admin_jobs',
        details: 'Admin jobs accessed'
      }
    });

    res.json({
      jobs,
      pagination: { page: 1, limit: jobs.length, total: jobs.length, totalPages: 1 }
    });
  } catch (error) {
    console.error('Admin jobs error:', error);
    res.status(500).json({ error: 'Failed to load admin jobs' });
  }
};

// ADM-3: Logs Table
export const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action, resource } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};
    if (action) whereClause.action = action;
    if (resource) whereClause.resource = resource;

    // Get audit logs
    const logs = await prisma.auditLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: parseInt(limit),
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    // Get total count
    const total = await prisma.auditLog.count({ where: whereClause });

    // Log admin view
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'view',
        resource: 'admin_logs',
        details: 'Admin logs accessed'
      }
    });

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ error: 'Failed to load admin logs' });
  }
};

// ADM: Clear Steam inventory in-memory cache (read-only invalidation, no prod gate)
export const clearSteamCache = async (req, res) => {
  try {
    clearInventoryCache();
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'cache_clear',
        resource: 'steam_inventory',
        details: 'Steam inventory cache cleared'
      }
    });
    res.json({ success: true, message: 'Steam inventory cache cleared' });
  } catch (error) {
    console.error('Error clearing steam cache:', error);
    res.status(500).json({ success: false, error: 'Failed to clear cache' });
  }
};

// ADM-5: Job Management (safe controls) - Phase 2
export const getJobStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    
    // Check if any job is running
    const isRunning = await JobService.isAnyJobRunning();
    
    // Get recent job runs for this admin
    const recentRuns = await JobService.getRecentJobRuns(adminId, 10);
    
    res.json({
      isRunning,
      recentRuns,
      rateLimitMinutes: 10
    });
  } catch (error) {
    console.error('Error getting job status:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
};

export const runSkinPriceUpdate = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { take = 50, category, rarity, ids, dryRun = true } = req.body;

    // Manual real-execute is intentionally NOT wired to the live pipeline. Price/
    // alert/snapshot work runs via cron + Inngest; a real run here would invoke a
    // mock that writes placeholder data. Refuse non-dry runs honestly. (Plan 2026-06-01 T2)
    if (!dryRun) {
      return res.status(501).json({
        error: 'Manual execution is not wired to the live pipeline. These jobs run via cron/Inngest. Use dry-run for an impact estimate.',
      });
    }

    // Check rate limiting
    if (!await JobService.canRunJob('updateSkinPrices', adminId)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please wait before running this job again.' 
      });
    }
    
    // Check if any job is running
    if (await JobService.isAnyJobRunning()) {
      return res.status(409).json({ 
        error: 'Another job is currently running. Please wait.' 
      });
    }
    
    // Check production safety
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_ADMIN_WRITES_IN_PROD) {
      return res.status(403).json({ 
        error: 'Manual job execution is disabled in production for safety.' 
      });
    }
    
    const parameters = { take, category, rarity, ids };
    
    if (dryRun) {
      // Dry run - just count what would happen
      const result = await SkinPriceUpdateJob.dryRun(parameters);
      
      // Create job run record for audit
      const jobRun = await JobService.createJobRun(
        'updateSkinPrices',
        parameters,
        true,
        adminId,
        result.message
      );
      
      // Log admin action
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'job_dry_run',
          resource: 'skin_prices',
          details: `Dry run: ${result.message}`,
        }
      });
      
      res.json({
        success: true,
        dryRun: true,
        jobRunId: jobRun.id,
        ...result
      });
      
    } else {
      // Real execution
      const estimatedImpact = await SkinPriceUpdateJob.dryRun(parameters);
      
      // Create job run record
      const jobRun = await JobService.createJobRun(
        'updateSkinPrices',
        parameters,
        false,
        adminId,
        estimatedImpact.message
      );
      
      // Log admin action
      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'job_execute',
          resource: 'skin_prices',
          details: `Started skin price update: ${estimatedImpact.message}`,
          parameters: JSON.stringify(parameters)
        }
      });
      
      // Execute job asynchronously
      SkinPriceUpdateJob.execute(jobRun.id, parameters).catch(async (error) => {
        console.error('Skin price update job failed:', error);
        await JobService.updateJobRun(jobRun.id, 'failed', null, error.message);
      });
      
      res.json({
        success: true,
        dryRun: false,
        jobRunId: jobRun.id,
        message: 'Job started successfully',
        estimatedImpact: estimatedImpact.message
      });
    }
    
  } catch (error) {
    console.error('Error running skin price update:', error);
    res.status(500).json({ error: 'Failed to run skin price update' });
  }
};

export const runPortfolioSnapshot = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId, batchSize = 100, dryRun = true } = req.body;

    // Manual real-execute is intentionally NOT wired to the live pipeline. Price/
    // alert/snapshot work runs via cron + Inngest; a real run here would invoke a
    // mock that writes placeholder data. Refuse non-dry runs honestly. (Plan 2026-06-01 T2)
    if (!dryRun) {
      return res.status(501).json({
        error: 'Manual execution is not wired to the live pipeline. These jobs run via cron/Inngest. Use dry-run for an impact estimate.',
      });
    }

    // Check rate limiting
    if (!await JobService.canRunJob('rebuildSnapshots', adminId)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please wait before running this job again.' 
      });
    }
    
    // Check if any job is running
    if (await JobService.isAnyJobRunning()) {
      return res.status(409).json({ 
        error: 'Another job is currently running. Please wait.' 
      });
    }
    
    // Check production safety
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_ADMIN_WRITES_IN_PROD) {
      return res.status(403).json({ 
        error: 'Manual job execution is disabled in production for safety.' 
      });
    }
    
    const parameters = { userId, batchSize };
    
    if (dryRun) {
      // Dry run
      const result = await PortfolioSnapshotJob.dryRun(parameters);
      
      const jobRun = await JobService.createJobRun(
        'rebuildSnapshots',
        parameters,
        true,
        adminId,
        result.message
      );
      
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'job_dry_run',
          resource: 'portfolio_snapshots',
          details: `Dry run: ${result.message}`,
        }
      });
      
      res.json({
        success: true,
        dryRun: true,
        jobRunId: jobRun.id,
        ...result
      });
      
    } else {
      // Real execution
      const estimatedImpact = await PortfolioSnapshotJob.dryRun(parameters);
      
      const jobRun = await JobService.createJobRun(
        'rebuildSnapshots',
        parameters,
        false,
        adminId,
        estimatedImpact.message
      );
      
      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'job_execute',
          resource: 'portfolio_snapshots',
          details: `Started portfolio snapshot rebuild: ${estimatedImpact.message}`,
          parameters: JSON.stringify(parameters)
        }
      });
      
      PortfolioSnapshotJob.execute(jobRun.id, parameters).catch(async (error) => {
        console.error('Portfolio snapshot job failed:', error);
        await JobService.updateJobRun(jobRun.id, 'failed', null, error.message);
      });
      
      res.json({
        success: true,
        dryRun: false,
        jobRunId: jobRun.id,
        message: 'Job started successfully',
        estimatedImpact: estimatedImpact.message
      });
    }
    
  } catch (error) {
    console.error('Error running portfolio snapshot:', error);
    res.status(500).json({ error: 'Failed to run portfolio snapshot' });
  }
};

export const runAlertCheck = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { limit = 100, optInOnly = true, dryRun = true } = req.body;

    // Manual real-execute is intentionally NOT wired to the live pipeline. Price/
    // alert/snapshot work runs via cron + Inngest; a real run here would invoke a
    // mock that writes placeholder data. Refuse non-dry runs honestly. (Plan 2026-06-01 T2)
    if (!dryRun) {
      return res.status(501).json({
        error: 'Manual execution is not wired to the live pipeline. These jobs run via cron/Inngest. Use dry-run for an impact estimate.',
      });
    }

    // Check rate limiting
    if (!await JobService.canRunJob('alertCheck', adminId)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please wait before running this job again.' 
      });
    }
    
    // Check if any job is running
    if (await JobService.isAnyJobRunning()) {
      return res.status(409).json({ 
        error: 'Another job is currently running. Please wait.' 
      });
    }
    
    // Check production safety
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_ADMIN_WRITES_IN_PROD) {
      return res.status(403).json({ 
        error: 'Manual job execution is disabled in production for safety.' 
      });
    }
    
    const parameters = { limit, optInOnly };
    
    if (dryRun) {
      // Dry run
      const result = await AlertCheckJob.dryRun(parameters);
      
      const jobRun = await JobService.createJobRun(
        'alertCheck',
        parameters,
        true,
        adminId,
        result.message
      );
      
      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'job_dry_run',
          resource: 'price_alerts',
          details: `Dry run: ${result.message}`,
        }
      });
      
      res.json({
        success: true,
        dryRun: true,
        jobRunId: jobRun.id,
        ...result
      });
      
    } else {
      // Real execution
      const estimatedImpact = await AlertCheckJob.dryRun(parameters);
      
      const jobRun = await JobService.createJobRun(
        'alertCheck',
        parameters,
        false,
        adminId,
        estimatedImpact.message
      );
      
      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'job_execute',
          resource: 'price_alerts',
          details: `Started alert check: ${estimatedImpact.message}`,
          parameters: JSON.stringify(parameters)
        }
      });
      
      AlertCheckJob.execute(jobRun.id, parameters).catch(async (error) => {
        console.error('Alert check job failed:', error);
        await JobService.updateJobRun(jobRun.id, 'failed', null, error.message);
      });
      
      res.json({
        success: true,
        dryRun: false,
        jobRunId: jobRun.id,
        message: 'Job started successfully',
        estimatedImpact: estimatedImpact.message
      });
    }
    
  } catch (error) {
    console.error('Error running alert check:', error);
    res.status(500).json({ error: 'Failed to run alert check' });
  }
};

export const getJobRun = async (req, res) => {
  try {
    const { jobRunId } = req.params;
    const adminId = req.user.id;
    
    const jobRun = await JobService.getJobRun(jobRunId);
    
    if (!jobRun) {
      return res.status(404).json({ error: 'Job run not found' });
    }
    
    // Only allow admins to see their own job runs
    if (jobRun.adminId !== adminId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(jobRun);
    
  } catch (error) {
    console.error('Error getting job run:', error);
    res.status(500).json({ error: 'Failed to get job run' });
  }
};

// ADM-9: Coverage Explorer
export const getCoverageOverview = async (req, res) => {
  try {
    const overallCoverage = await CoverageService.getOverallCoverage();
    res.json(overallCoverage);
  } catch (error) {
    console.error('Error getting coverage overview:', error);
    res.status(500).json({ error: 'Failed to get coverage overview' });
  }
};

export const getCoverageBySegment = async (req, res) => {
  try {
    const { segmentType = 'weaponType', page = 1, limit = 20 } = req.query;
    const coverage = await CoverageService.getCoverageBySegment(
      segmentType, 
      parseInt(page), 
      parseInt(limit)
    );
    res.json(coverage);
  } catch (error) {
    console.error('Error getting coverage by segment:', error);
    res.status(500).json({ error: 'Failed to get coverage by segment' });
  }
};

export const getTopMissingSkins = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const missingSkins = await CoverageService.getTopMissingSkins(parseInt(limit));
    res.json(missingSkins);
  } catch (error) {
    console.error('Error getting top missing skins:', error);
    res.status(500).json({ error: 'Failed to get top missing skins' });
  }
};

export const getSkinsForSegment = async (req, res) => {
  try {
    const { segmentType, segmentValue, page = 1, limit = 20 } = req.query;
    const skins = await CoverageService.getSkinsForSegment(
      segmentType,
      segmentValue,
      parseInt(page),
      parseInt(limit)
    );
    res.json(skins);
  } catch (error) {
    console.error('Error getting skins for segment:', error);
    res.status(500).json({ error: 'Failed to get skins for segment' });
  }
};

// ADM-10: API Health
export const getAPIHealth24h = async (req, res) => {
  try {
    const metrics = await APIHealthService.get24HourMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error getting 24h API health:', error);
    res.status(500).json({ error: 'Failed to get 24h API health' });
  }
};

export const getAPIHealth7d = async (req, res) => {
  try {
    const metrics = await APIHealthService.get7DayMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error getting 7d API health:', error);
    res.status(500).json({ error: 'Failed to get 7d API health' });
  }
};

export const getAPIHealthTimeSeries = async (req, res) => {
  try {
    const timeSeries = await APIHealthService.get24HourTimeSeries();
    res.json(timeSeries);
  } catch (error) {
    console.error('Error getting API health time series:', error);
    res.status(500).json({ error: 'Failed to get API health time series' });
  }
};

export const getAPIHealthJobRuns = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const jobRuns = await APIHealthService.getLatestJobRuns(parseInt(limit));
    res.json(jobRuns);
  } catch (error) {
    console.error('Error getting API health job runs:', error);
    res.status(500).json({ error: 'Failed to get API health job runs' });
  }
};

// ADM-11: Data Quality Alerts
export const getDataQualityAlerts = async (req, res) => {
  try {
    const { rule, status, segment, priority, page = 1, limit = 20 } = req.query;
    const filters = { rule, status, segment, priority };
    
    const alerts = await DataQualityService.getAlerts(filters, parseInt(page), parseInt(limit));
    res.json(alerts);
  } catch (error) {
    console.error('Error getting data quality alerts:', error);
    res.status(500).json({ error: 'Failed to get data quality alerts' });
  }
};

export const runDataQualityChecks = async (req, res) => {
  try {
    const alerts = await DataQualityService.runAllChecks();
    res.json({
      success: true,
      message: `Found ${alerts.length} data quality issues`,
      alerts: alerts.slice(0, 10) // Return first 10 for preview
    });
  } catch (error) {
    console.error('Error running data quality checks:', error);
    res.status(500).json({ error: 'Failed to run data quality checks' });
  }
};

// ADM-12: Metrics Definitions
export const getMetricsDefinitions = async (req, res) => {
  try {
    const definitions = {
      priceCoverage: {
        name: 'Price Coverage %',
        definition: 'Skins with a valid priceAvg updated in last 7 days / total Skins',
        calculation: 'recent_prices / total_skins * 100',
        unit: 'percentage'
      },
      stalePercentage: {
        name: 'Stale %',
        definition: 'Skins with last price update > 48 hours',
        calculation: 'skins_older_than_48h / total_skins * 100',
        unit: 'percentage'
      },
      successRate: {
        name: 'Success Rate %',
        definition: 'Successful API requests / total requests (excludes 429 rate limits)',
        calculation: 'successful_requests / total_requests * 100',
        unit: 'percentage'
      },
      p50Latency: {
        name: 'P50 Latency',
        definition: '50th percentile of API response times',
        calculation: 'median(response_times)',
        unit: 'milliseconds'
      },
      p95Latency: {
        name: 'P95 Latency',
        definition: '95th percentile of API response times',
        calculation: '95th_percentile(response_times)',
        unit: 'milliseconds'
      },
      alertThroughput: {
        name: 'Alert Throughput',
        definition: 'Number of price alerts checked/sent/skipped in timeframe',
        calculation: 'alerts_processed / time_period',
        unit: 'alerts per hour'
      }
    };
    
    res.json({
      definitions,
      lastUpdated: new Date().toISOString(),
      version: '1.0.0'
    });
    
  } catch (error) {
    console.error('Error getting metrics definitions:', error);
    res.status(500).json({ error: 'Failed to get metrics definitions' });
  }
};

// ADM-13: User Management
export const getUsers = async (req, res) => {
  try {
    const { search, status, role, emailAlerts, page = 1, limit = 20 } = req.query;
    const filters = { search, status, role, emailAlerts };
    
    const users = await UserManagementService.getUsers(filters, parseInt(page), parseInt(limit));
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const userDetails = await UserManagementService.getUserDetails(userId);
    res.json(userDetails);
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({ error: 'Failed to get user details' });
  }
};

export const getUserActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    const activity = await UserManagementService.getUserActivity(userId, parseInt(days));
    res.json(activity);
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({ error: 'Failed to get user activity' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { status } = req.body;
    
    // Check production safety
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_ADMIN_WRITES_IN_PROD) {
      return res.status(403).json({ 
        error: 'User management is disabled in production for safety.' 
      });
    }
    
    const updatedUser = await UserManagementService.updateUserStatus(userId, status, adminId);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

export const updateUserEmailAlerts = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { emailAlerts } = req.body;
    
    // Check production safety
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_ADMIN_WRITES_IN_PROD) {
      return res.status(403).json({ 
        error: 'User management is disabled in production for safety.' 
      });
    }
    
    const updatedUser = await UserManagementService.updateUserEmailAlerts(userId, emailAlerts, adminId);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user email alerts:', error);
    res.status(500).json({ error: 'Failed to update user email alerts' });
  }
};

export const updateUserPremiumStatus = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { isPremium } = req.body;
    
    // Check production safety
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_ADMIN_WRITES_IN_PROD) {
      return res.status(403).json({ 
        error: 'User management is disabled in production for safety.' 
      });
    }
    
    const updatedUser = await UserManagementService.updateUserPremiumStatus(userId, isPremium, adminId);
    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user premium status:', error);
    res.status(500).json({ error: 'Failed to update user premium status' });
  }
};

export const getUserStatistics = async (req, res) => {
  try {
    const stats = await UserManagementService.getUserStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { query, role, status, hasPortfolio } = req.query;
    const filters = { role, status, hasPortfolio };
    
    const users = await UserManagementService.searchUsers(query, filters);
    res.json(users);
  } catch (error) {
    console.error('Error searching users:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
};

// ADM-14: Feature Flags Management
export const getAllFeatureFlags = async (req, res) => {
  try {
    const flags = await FeatureFlagsService.getAllFlags();
    res.json(flags);
  } catch (error) {
    console.error('Error getting feature flags:', error);
    res.status(500).json({ error: 'Failed to get feature flags' });
  }
};

export const getFeatureFlag = async (req, res) => {
  try {
    const { flagKey } = req.params;
    const value = await FeatureFlagsService.getFlagValue(flagKey);
    res.json({ flagKey, value });
  } catch (error) {
    console.error('Error getting feature flag:', error);
    res.status(500).json({ error: 'Failed to get feature flag' });
  }
};

export const updateFeatureFlag = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { flagKey } = req.params;
    const { value } = req.body;
    
    const result = await FeatureFlagsService.updateFlagValue(flagKey, value, adminId);
    res.json(result);
  } catch (error) {
    console.error('Error updating feature flag:', error);
    res.status(500).json({ error: 'Failed to update feature flag' });
  }
};

export const getFeatureFlagsSummary = async (req, res) => {
  try {
    const summary = await FeatureFlagsService.getFlagsSummary();
    res.json(summary);
  } catch (error) {
    console.error('Error getting feature flags summary:', error);
    res.status(500).json({ error: 'Failed to get feature flags summary' });
  }
};

export const validateFeatureFlags = async (req, res) => {
  try {
    const validation = await FeatureFlagsService.validateFlagConfiguration();
    res.json(validation);
  } catch (error) {
    console.error('Error validating feature flags:', error);
    res.status(500).json({ error: 'Failed to validate feature flags' });
  }
};

export const getFeatureRolloutStatus = async (req, res) => {
  try {
    const status = await FeatureFlagsService.getFeatureRolloutStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting feature rollout status:', error);
    res.status(500).json({ error: 'Failed to get feature rollout status' });
  }
};

// ADM-15: Backfill Tools
export const getDataGapsAnalysis = async (req, res) => {
  try {
    const analysis = await BackfillService.getDataGapsAnalysis();
    res.json(analysis);
  } catch (error) {
    console.error('Error getting data gaps analysis:', error);
    res.status(500).json({ error: 'Failed to get data gaps analysis' });
  }
};

export const getPrioritizedBackfillTasks = async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const tasks = await BackfillService.getPrioritizedBackfillTasks(parseInt(limit));
    res.json(tasks);
  } catch (error) {
    console.error('Error getting prioritized backfill tasks:', error);
    res.status(500).json({ error: 'Failed to get prioritized backfill tasks' });
  }
};

export const executeBackfillTask = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { taskId } = req.params;
    
    // Check production safety
    if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_ADMIN_WRITES_IN_PROD) {
      return res.status(403).json({ 
        error: 'Backfill tools are disabled in production for safety.' 
      });
    }
    
    const result = await BackfillService.executeBackfillTask(taskId, adminId);
    res.json(result);
  } catch (error) {
    console.error('Error executing backfill task:', error);
    res.status(500).json({ error: 'Failed to execute backfill task' });
  }
};

export const getBackfillHistory = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    const history = await BackfillService.getBackfillHistory(adminId, parseInt(page), parseInt(limit));
    res.json(history);
  } catch (error) {
    console.error('Error getting backfill history:', error);
    res.status(500).json({ error: 'Failed to get backfill history' });
  }
};
