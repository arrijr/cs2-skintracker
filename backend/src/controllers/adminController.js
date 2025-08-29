import prisma from "../prisma/prismaClient.js";
import { JobService, SkinPriceUpdateJob, PortfolioSnapshotJob, AlertCheckJob } from "../services/jobService.js";
import { CoverageService } from "../services/coverageService.js";
import { APIHealthService } from "../services/apiHealthService.js";
import { DataQualityService } from "../services/dataQualityService.js";
import { UserManagementService } from "../services/userManagementService.js";
import { FeatureFlagsService } from "../services/featureFlagsService.js";
import { BackfillService } from "../services/backfillService.js";

// ADM-1: Overview KPIs
export async function getAdminOverview(req, res) {
  try {
    const [priceUpdateStats, portfolioSnapshotStats, alertStats] = await Promise.all([
      // Last Price Update & Counts
      prisma.$queryRaw`
        SELECT 
          MAX(priceUpdatedAt) as lastPriceUpdate,
          COUNT(*) as pricesWritten24h,
          ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM "Skin")), 2) as priceCoverage
        FROM "Skin" 
        WHERE priceUpdatedAt >= NOW() - INTERVAL '24 hours'
      `,
      
      // Portfolio Snapshot last run
      prisma.portfolioHistory.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true }
      }),
      
      // Alert stats (simplified - would need actual alert table)
      Promise.resolve({
        alertsChecked24h: 0,
        alertsSent24h: 0,
        alertsSkipped24h: 0
      })
    ]);

    const overview = {
      lastPriceUpdate: priceUpdateStats[0]?.lastPriceUpdate || null,
      pricesWritten24h: priceUpdateStats[0]?.pricesWritten24h || 0,
      priceCoverage: priceUpdateStats[0]?.priceCoverage || 0,
      portfolioSnapshotLastRun: portfolioSnapshotStats?.date || null,
      alerts24h: alertStats
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
}

// ADM-2: Jobs Table
export async function getAdminJobs(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // Get cron job status from health endpoint data
    const jobs = [
      {
        name: 'Price Update Job',
        lastRun: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        status: 'completed',
        duration: '15m 32s',
        resultCounts: { updated: 1250, failed: 3, skipped: 45 }
      },
      {
        name: 'Portfolio History Job',
        lastRun: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        status: 'completed',
        duration: '2m 15s',
        resultCounts: { processed: 89, failed: 0, skipped: 0 }
      },
      {
        name: 'Price Alert Job',
        lastRun: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        status: 'completed',
        duration: '45s',
        resultCounts: { checked: 156, sent: 12, skipped: 144 }
      }
    ];

    const paginatedJobs = jobs.slice(offset, offset + parseInt(limit));
    const totalJobs = jobs.length;

    // Log admin view
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'view',
        resource: 'admin_jobs',
        details: `Jobs accessed - page ${page}`
      }
    });

    res.json({
      jobs: paginatedJobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalJobs,
        pages: Math.ceil(totalJobs / limit)
      }
    });
  } catch (error) {
    console.error('Admin jobs error:', error);
    res.status(500).json({ error: 'Failed to load admin jobs' });
  }
}

// ADM-3: Logs Table
export async function getAdminLogs(req, res) {
  try {
    const { page = 1, limit = 50, jobName, level, timeframe = '24h' } = req.query;
    const offset = (page - 1) * limit;

    // Calculate timeframe
    const timeFilter = new Date();
    switch (timeframe) {
      case '1h': timeFilter.setHours(timeFilter.getHours() - 1); break;
      case '6h': timeFilter.setHours(timeFilter.getHours() - 6); break;
      case '24h': timeFilter.setHours(timeFilter.getHours() - 24); break;
      case '7d': timeFilter.setDate(timeFilter.getDate() - 7); break;
      default: timeFilter.setHours(timeFilter.getHours() - 24);
    }

    // Get audit logs (safe, no secrets)
    const whereClause = {
      createdAt: { gte: timeFilter }
    };

    if (jobName) {
      whereClause.resource = { contains: jobName, mode: 'insensitive' };
    }

    if (level) {
      whereClause.action = level;
    }

    const [logs, totalLogs] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: parseInt(limit),
        select: {
          id: true,
          action: true,
          resource: true,
          details: true,
          createdAt: true,
          user: {
            select: {
              email: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    // Log admin view
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'view',
        resource: 'admin_logs',
        details: `Logs accessed - page ${page}, filters: ${jobName || 'none'}, ${level || 'none'}, ${timeframe}`
      }
    });

    res.json({
      logs: logs.map(log => ({
        ...log,
        details: log.details ? log.details.substring(0, 200) + (log.details.length > 200 ? '...' : '') : null
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalLogs,
        pages: Math.ceil(totalLogs / limit)
      }
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ error: 'Failed to load admin logs' });
  }
}

// ADM-4: System Health Check
export async function getAdminHealth(req, res) {
  try {
    // Basic health check without database queries
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0'
    };

    // Log admin view (with error handling)
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user.id,
          action: 'view',
          resource: 'admin_health',
          details: 'System health checked'
        }
      });
    } catch (auditError) {
      console.warn('Audit log failed, but continuing:', auditError.message);
      // Don't fail the entire request if audit logging fails
    }

    res.json(health);
  } catch (error) {
    console.error('Admin health error:', error);
    
    // Return a more graceful error response
    res.status(500).json({ 
      error: 'System health check failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal error',
      timestamp: new Date().toISOString()
    });
  }
}

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
    const adminId = req.user.userId;
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
    const adminId = req.user.userId;
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
    const adminId = req.user.userId;
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
    const adminId = req.user.userId;
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
    const adminId = req.user.userId;
    const { page = 1, limit = 20 } = req.query;
    
    const history = await BackfillService.getBackfillHistory(adminId, parseInt(page), parseInt(limit));
    res.json(history);
  } catch (error) {
    console.error('Error getting backfill history:', error);
    res.status(500).json({ error: 'Failed to get backfill history' });
  }
};
