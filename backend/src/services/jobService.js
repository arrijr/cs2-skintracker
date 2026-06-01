import prisma from "../prisma/prismaClient.js";

// Rate limiting: 1 run per 10 minutes per job per admin
const RATE_LIMIT_MINUTES = 10;

// TODO(tech-debt, Phase 2): job-status vocabulary split-brain — this file +
// cron/marketSnapshotJob.js write 'done'; services/apiHealthService.js reads
// 'done'; routes/adminMetricsRoutes.js reads 'completed'. Harmonise to the
// schema's 'completed' across all readers+writers when the API-health UI lands.

// Job execution service with safety features
export class JobService {
  // Check if admin can run a specific job (rate limiting)
  static async canRunJob(jobName, adminId) {
    const rateLimitKey = `${jobName}_${adminId}`;
    const cutoffTime = new Date(Date.now() - RATE_LIMIT_MINUTES * 60 * 1000);
    
    const recentRun = await prisma.jobRun.findFirst({
      where: {
        rateLimitKey,
        status: { in: ['queued', 'running'] },
        startedAt: { gt: cutoffTime }
      }
    });
    
    return !recentRun;
  }

  // Create a new job run
  static async createJobRun(jobName, parameters, dryRun, adminId, estimatedImpact) {
    const rateLimitKey = `${jobName}_${adminId}`;
    
    return await prisma.jobRun.create({
      data: {
        jobName,
        status: 'queued',
        parameters,
        dryRun,
        estimatedImpact,
        adminId,
        rateLimitKey
      }
    });
  }

  // Update job run status
  static async updateJobRun(jobRunId, status, actualCount = null, error = null) {
    const updateData = { status };
    
    if (status === 'done' || status === 'failed') {
      updateData.completedAt = new Date();
    }
    
    if (actualCount !== null) {
      updateData.actualCount = actualCount;
    }
    
    if (error !== null) {
      updateData.error = error;
    }
    
    return await prisma.jobRun.update({
      where: { id: jobRunId },
      data: updateData
    });
  }

  // Get recent job runs for admin
  static async getRecentJobRuns(adminId, limit = 20) {
    return await prisma.jobRun.findMany({
      where: { adminId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        admin: {
          select: { email: true }
        }
      }
    });
  }

  // Get job run by ID
  static async getJobRun(jobRunId) {
    return await prisma.jobRun.findUnique({
      where: { id: jobRunId },
      include: {
        admin: {
          select: { email: true }
        }
      }
    });
  }

  // Check if any job is currently running
  static async isAnyJobRunning() {
    const runningJob = await prisma.jobRun.findFirst({
      where: { status: 'running' }
    });
    return !!runningJob;
  }
}

// Specific job implementations
export class SkinPriceUpdateJob {
  static async dryRun(parameters) {
    const { take = 50, category, rarity, ids } = parameters;
    
    // Count what would be updated
    const whereClause = {};
    if (category) whereClause.category = category;
    if (rarity) whereClause.rarity = rarity;
    if (ids && ids.length > 0) whereClause.id = { in: ids };
    
    const count = await prisma.skin.count({ where: whereClause });
    const estimatedCount = Math.min(count, take);
    
    return {
      estimatedCount,
      message: `Would update ~${estimatedCount} skin prices`,
      parameters: { take, category, rarity, ids }
    };
  }

  static async execute(jobRunId, parameters) {
    try {
      await JobService.updateJobRun(jobRunId, 'running');
      
      const { take = 50, category, rarity, ids } = parameters;
      const whereClause = {};
      if (category) whereClause.category = category;
      if (rarity) whereClause.rarity = rarity;
      if (ids && ids.length > 0) whereClause.id = { in: ids };
      
      // Simulate price update (replace with actual logic)
      const skins = await prisma.skin.findMany({
        where: whereClause,
        take: parseInt(take)
      });
      
      // Update prices (mock implementation)
      let updatedCount = 0;
      for (const skin of skins) {
        // Simulate price update
        await prisma.skin.update({
          where: { id: skin.id },
          data: { 
            lastPriceUpdate: new Date(),
            // Add actual price update logic here
          }
        });
        updatedCount++;
      }
      
      await JobService.updateJobRun(jobRunId, 'done', updatedCount);
      return { success: true, updatedCount };
      
    } catch (error) {
      await JobService.updateJobRun(jobRunId, 'failed', null, error.message);
      throw error;
    }
  }
}

export class PortfolioSnapshotJob {
  static async dryRun(parameters) {
    const { userId, batchSize = 100 } = parameters;
    
    let estimatedCount = 0;
    if (userId) {
      // Count portfolio entries for specific user
      estimatedCount = await prisma.portfolio.count({
        where: { userId: parseInt(userId) }
      });
    } else {
      // Count all portfolio entries
      estimatedCount = await prisma.portfolio.count();
    }
    
    return {
      estimatedCount,
      message: `Would rebuild ~${estimatedCount} portfolio snapshots`,
      parameters: { userId, batchSize }
    };
  }

  static async execute(jobRunId, parameters) {
    try {
      await JobService.updateJobRun(jobRunId, 'running');
      
      const { userId, batchSize = 100 } = parameters;
      const whereClause = userId ? { userId: parseInt(userId) } : {};
      
      // Simulate snapshot rebuild (replace with actual logic)
      const portfolios = await prisma.portfolio.findMany({
        where: whereClause,
        take: parseInt(batchSize)
      });
      
      let processedCount = 0;
      for (const portfolio of portfolios) {
        // Simulate snapshot creation
        await prisma.portfolioHistory.upsert({
          where: {
            userId_date: {
              userId: portfolio.userId,
              date: new Date().toISOString().split('T')[0]
            }
          },
          update: {
            totalValue: portfolio.totalValue,
            updatedAt: new Date()
          },
          create: {
            userId: portfolio.userId,
            date: new Date().toISOString().split('T')[0],
            totalValue: portfolio.totalValue
          }
        });
        processedCount++;
      }
      
      await JobService.updateJobRun(jobRunId, 'done', processedCount);
      return { success: true, processedCount };
      
    } catch (error) {
      await JobService.updateJobRun(jobRunId, 'failed', null, error.message);
      throw error;
    }
  }
}

export class AlertCheckJob {
  static async dryRun(parameters) {
    const { limit = 100, optInOnly = true } = parameters;
    
    let estimatedCount = 0;
    if (optInOnly) {
      estimatedCount = await prisma.user.count({
        where: { emailAlerts: true }
      });
    } else {
      estimatedCount = await prisma.user.count();
    }
    
    const actualCount = Math.min(estimatedCount, limit);
    
    return {
      estimatedCount: actualCount,
      message: `Would check ~${actualCount} users for price alerts`,
      parameters: { limit, optInOnly }
    };
  }

  static async execute(jobRunId, parameters) {
    try {
      await JobService.updateJobRun(jobRunId, 'running');
      
      const { limit = 100, optInOnly = true } = parameters;
      const whereClause = optInOnly ? { emailAlerts: true } : {};
      
      const users = await prisma.user.findMany({
        where: whereClause,
        take: parseInt(limit)
      });
      
      let checkedCount = 0;
      for (const user of users) {
        // Simulate alert check (replace with actual logic)
        // This would check user's watchlist against current prices
        checkedCount++;
      }
      
      await JobService.updateJobRun(jobRunId, 'done', checkedCount);
      return { success: true, checkedCount };
      
    } catch (error) {
      await JobService.updateJobRun(jobRunId, 'failed', null, error.message);
      throw error;
    }
  }
}
