// [CRON] Market Snapshot Job — stores daily active_listings and sold_volume_24h per skin

import marketSnapshotService from '../services/marketSnapshotService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Daily market snapshot job
 * Runs every 24 hours to collect market data for all tracked skins
 */
async function runMarketSnapshotJob(options = {}) {
  const { dryRun = false, limit = null, date = new Date() } = options;
  
  console.log(`[CRON] Starting Market Snapshot Job at ${new Date().toISOString()}`);
  console.log(`[CRON] Options:`, { dryRun, limit, date: date.toISOString().split('T')[0] });

  let jobRun = null;
  
  try {
    // Create job run record for tracking
    if (!dryRun) {
      jobRun = await prisma.jobRun.create({
        data: {
          jobName: 'marketSnapshot',
          status: 'running',
          parameters: { dryRun, limit, date: date.toISOString() },
          dryRun: dryRun,
          estimatedImpact: `~${limit || 'all'} skin snapshots`,
          adminId: 1, // System user
          rateLimitKey: `marketSnapshot_1_${Date.now()}`
        }
      });
    }

    // Run the snapshot service
    const results = await marketSnapshotService.runDailySnapshot({
      dryRun,
      limit,
      date
    });

    console.log(`[CRON] Market Snapshot Job completed:`, results);

    // Update job run status
    if (jobRun) {
      await prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: 'done',
          completedAt: new Date(),
          actualCount: results.successful
        }
      });
    }

    return {
      success: true,
      results: results
    };

  } catch (error) {
    console.error(`[CRON] Market Snapshot Job failed:`, error);

    // Update job run status
    if (jobRun) {
      await prisma.jobRun.update({
        where: { id: jobRun.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error.message
        }
      });
    }

    return {
      success: false,
      error: error.message
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Manual trigger for market snapshot job
 * Can be called from admin panel or API
 */
async function triggerMarketSnapshotJob(req, res) {
  try {
    const { dryRun = false, limit = null } = req.body || {};
    
    console.log(`[API] Manual trigger for Market Snapshot Job`);
    
    const result = await runMarketSnapshotJob({
      dryRun: dryRun === 'true' || dryRun === true,
      limit: limit ? parseInt(limit) : null,
      date: new Date()
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Market snapshot job completed successfully',
        results: result.results
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Market snapshot job failed',
        error: result.error
      });
    }
  } catch (error) {
    console.error(`[API] Manual trigger failed:`, error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger market snapshot job',
      error: error.message
    });
  }
}

/**
 * Schedule the job to run daily at 2 AM UTC
 * This would typically be set up in your cron scheduler
 */
function scheduleMarketSnapshotJob() {
  // This is a placeholder - actual scheduling would depend on your cron system
  console.log(`[CRON] Market Snapshot Job scheduled to run daily at 2:00 AM UTC`);
  
  // Example: Run every 24 hours
  setInterval(async () => {
    const now = new Date();
    const hour = now.getUTCHours();
    
    // Run at 2 AM UTC
    if (hour === 2) {
      console.log(`[CRON] Triggering scheduled Market Snapshot Job`);
      await runMarketSnapshotJob({ dryRun: false });
    }
  }, 60 * 60 * 1000); // Check every hour
}

export {
  runMarketSnapshotJob,
  triggerMarketSnapshotJob,
  scheduleMarketSnapshotJob
};
