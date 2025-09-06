// /backend/src/routes/adminMetricsRoutes.js (Backend)
import express from "express";
import { PrismaClient } from "@prisma/client";
import clerkAdminAuth from "../middleware/clerkAdminAuth.js";

const router = express.Router();
const prisma = new PrismaClient();

// All routes require admin authentication
router.use(clerkAdminAuth);

// Get comprehensive admin metrics
router.get("/overview", async (req, res) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for better performance
    const [
      userStats,
      watchlistStats,
      portfolioStats,
      priceHistoryStats,
      portfolioHistoryStats,
      transactionStats,
      jobStats,
      recentActivity
    ] = await Promise.all([
      // User statistics
      prisma.user.groupBy({
        by: ['role'],
        _count: { id: true }
      }),
      
      // Watchlist statistics
      prisma.watchlist.groupBy({
        by: ['skinId'],
        _count: { id: true }
      }),
      
      // Portfolio statistics
      prisma.portfolio.groupBy({
        by: ['userId'],
        _count: { id: true },
        _sum: { amount: true }
      }),
      
      // Price history statistics
      prisma.priceHistory.groupBy({
        by: ['skinId'],
        where: {
          date: { gte: last24h }
        },
        _count: { id: true }
      }),
      
      // Portfolio history statistics
      prisma.portfolioHistory.groupBy({
        by: ['userId'],
        where: {
          date: { gte: last7d }
        },
        _count: { id: true },
        _avg: { value: true }
      }),
      
      // Transaction statistics
      prisma.transaction.groupBy({
        by: ['type'],
        where: {
          createdAt: { gte: last24h }
        },
        _count: { id: true },
        _sum: { amount: true }
      }),
      
      // Job run statistics
      prisma.jobRun.groupBy({
        by: ['jobName', 'status'],
        where: {
          startedAt: { gte: last24h }
        },
        _count: { id: true }
      }),
      
      // Recent activity (last 10 entries)
      prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { email: true }
          }
        }
      })
    ]);

    // Calculate totals
    const totalUsers = userStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const adminUsers = userStats.find(stat => stat.role === 'admin')?._count.id || 0;
    const regularUsers = userStats.find(stat => stat.role === 'user')?._count.id || 0;
    
    const totalWatchlistItems = watchlistStats.length;
    const totalPortfolioItems = portfolioStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const totalPortfolioValue = portfolioStats.reduce((sum, stat) => sum + (stat._sum.amount || 0), 0);
    
    const totalPriceHistoryEntries = priceHistoryStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const uniqueSkinsWithPrices = priceHistoryStats.length;
    
    const totalPortfolioHistoryEntries = portfolioHistoryStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const avgPortfolioValue = portfolioHistoryStats.reduce((sum, stat) => sum + (stat._avg.value || 0), 0) / Math.max(portfolioHistoryStats.length, 1);
    
    const totalTransactions = transactionStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const totalTransactionValue = transactionStats.reduce((sum, stat) => sum + (stat._sum.amount || 0), 0);
    
    const totalJobRuns = jobStats.reduce((sum, stat) => sum + stat._count.id, 0);
    const successfulJobs = jobStats.filter(stat => stat.status === 'completed').reduce((sum, stat) => sum + stat._count.id, 0);
    const failedJobs = jobStats.filter(stat => stat.status === 'failed').reduce((sum, stat) => sum + stat._count.id, 0);

    // Calculate growth rates
    const userGrowth24h = await prisma.user.count({
      where: { createdAt: { gte: last24h } }
    });
    
    const watchlistGrowth24h = await prisma.watchlist.count({
      where: { createdAt: { gte: last24h } }
    });
    
    const portfolioGrowth24h = await prisma.portfolio.count({
      where: { createdAt: { gte: last24h } }
    });

    // System health indicators
    const systemHealth = {
      database: 'healthy', // Could be enhanced with actual DB health check
      api: 'healthy',
      cron: successfulJobs > 0 ? 'healthy' : 'warning',
      memory: process.memoryUsage().heapUsed / 1024 / 1024 < 500 ? 'healthy' : 'warning'
    };

    const metrics = {
      users: {
        total: totalUsers,
        admins: adminUsers,
        regular: regularUsers,
        growth24h: userGrowth24h,
        growthRate: totalUsers > 0 ? (userGrowth24h / totalUsers * 100).toFixed(2) : '0.00'
      },
      watchlist: {
        totalItems: totalWatchlistItems,
        uniqueSkins: watchlistStats.length,
        growth24h: watchlistGrowth24h,
        growthRate: totalWatchlistItems > 0 ? (watchlistGrowth24h / totalWatchlistItems * 100).toFixed(2) : '0.00'
      },
      portfolio: {
        totalItems: totalPortfolioItems,
        totalValue: Math.round(totalPortfolioValue * 100) / 100,
        uniqueUsers: portfolioStats.length,
        growth24h: portfolioGrowth24h,
        growthRate: totalPortfolioItems > 0 ? (portfolioGrowth24h / totalPortfolioItems * 100).toFixed(2) : '0.00'
      },
      priceHistory: {
        totalEntries: totalPriceHistoryEntries,
        uniqueSkins: uniqueSkinsWithPrices,
        last24h: totalPriceHistoryEntries,
        coverage: totalWatchlistItems > 0 ? ((uniqueSkinsWithPrices / totalWatchlistItems) * 100).toFixed(2) : '0.00'
      },
      portfolioHistory: {
        totalEntries: totalPortfolioHistoryEntries,
        avgValue: Math.round(avgPortfolioValue * 100) / 100,
        uniqueUsers: portfolioHistoryStats.length
      },
      transactions: {
        total: totalTransactions,
        totalValue: Math.round(totalTransactionValue * 100) / 100,
        last24h: totalTransactions,
        byType: transactionStats.map(stat => ({
          type: stat.type,
          count: stat._count.id,
          value: stat._sum.amount || 0
        }))
      },
      jobs: {
        total: totalJobRuns,
        successful: successfulJobs,
        failed: failedJobs,
        successRate: totalJobRuns > 0 ? ((successfulJobs / totalJobRuns) * 100).toFixed(2) : '0.00',
        byJob: jobStats.map(stat => ({
          jobName: stat.jobName,
          status: stat.status,
          count: stat._count.id
        }))
      },
      system: {
        health: systemHealth,
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        timestamp: now.toISOString()
      },
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        details: activity.details,
        userEmail: activity.user?.email || 'System',
        createdAt: activity.createdAt
      }))
    };

    res.json({
      success: true,
      metrics,
      generatedAt: now.toISOString()
    });

  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin metrics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get real-time metrics (lightweight)
router.get("/realtime", async (req, res) => {
  try {
    const now = new Date();
    const last5min = new Date(now.getTime() - 5 * 60 * 1000);

    const [
      activeUsers,
      recentActivity,
      systemMetrics
    ] = await Promise.all([
      // Active users in last 5 minutes
      prisma.user.count({
        where: {
          updatedAt: { gte: last5min }
        }
      }),
      
      // Recent activity
      prisma.auditLog.count({
        where: {
          createdAt: { gte: last5min }
        }
      }),
      
      // System metrics
      Promise.resolve({
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
        },
        cpu: process.cpuUsage()
      })
    ]);

    res.json({
      success: true,
      realtime: {
        activeUsers,
        recentActivity,
        system: systemMetrics,
        timestamp: now.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching real-time metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch real-time metrics'
    });
  }
});

// Get metrics for specific time range
router.get("/range", async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        error: 'Start and end dates are required'
      });
    }

    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    const [
      userGrowth,
      watchlistGrowth,
      portfolioGrowth,
      priceHistoryGrowth,
      transactionGrowth
    ] = await Promise.all([
      prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      
      prisma.watchlist.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      
      prisma.portfolio.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      }),
      
      prisma.priceHistory.count({
        where: {
          date: { gte: startDate, lte: endDate }
        }
      }),
      
      prisma.transaction.count({
        where: {
          createdAt: { gte: startDate, lte: endDate }
        }
      })
    ]);

    res.json({
      success: true,
      range: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        growth: {
          users: userGrowth,
          watchlist: watchlistGrowth,
          portfolio: portfolioGrowth,
          priceHistory: priceHistoryGrowth,
          transactions: transactionGrowth
        }
      }
    });

  } catch (error) {
    console.error('Error fetching range metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch range metrics'
    });
  }
});

export default router;
