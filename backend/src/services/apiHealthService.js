import prisma from "../prisma/prismaClient.js";

// API Health monitoring service using JobRun data
export class APIHealthService {
  // Get API health metrics for the last 24 hours
  static async get24HourMetrics() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Get all job runs from the last 24 hours
      const recentJobRuns = await prisma.jobRun.findMany({
        where: {
          startedAt: { gte: twentyFourHoursAgo },
          jobName: { in: ['updateSkinPrices', 'priceHistoryUpdate'] } // API-related jobs
        },
        select: {
          id: true,
          jobName: true,
          status: true,
          startedAt: true,
          completedAt: true,
          actualCount: true,
          error: true,
          parameters: true
        }
      });
      
      // Calculate metrics
      let totalRequests = 0;
      let successCount = 0;
      let errorCount = 0;
      let rateLimitCount = 0;
      const latencies = [];
      
      recentJobRuns.forEach(jobRun => {
        if (jobRun.status === 'done') {
          successCount++;
          totalRequests += jobRun.actualCount || 0;
          
          // Calculate latency if we have completion time
          if (jobRun.completedAt) {
            const latency = jobRun.completedAt.getTime() - jobRun.startedAt.getTime();
            latencies.push(latency);
          }
        } else if (jobRun.status === 'failed') {
          errorCount++;
          
          // Check if it's a rate limit error
          if (jobRun.error && jobRun.error.includes('rate limit')) {
            rateLimitCount++;
          }
        }
      });
      
      // Calculate percentages and latency stats
      const successRate = totalRequests > 0 ? (successCount / (successCount + errorCount)) * 100 : 0;
      const p50Latency = latencies.length > 0 ? this.calculatePercentile(latencies, 50) : null;
      const p95Latency = latencies.length > 0 ? this.calculatePercentile(latencies, 95) : null;
      
      return {
        timeRange: '24h',
        totalRequests,
        successCount,
        errorCount,
        successRate: Math.round(successRate * 100) / 100,
        rateLimitCount,
        p50Latency,
        p95Latency,
        totalJobRuns: recentJobRuns.length
      };
      
    } catch (error) {
      console.error('Error getting 24-hour API metrics:', error);
      throw error;
    }
  }

  // Get API health metrics for the last 7 days
  static async get7DayMetrics() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get all job runs from the last 7 days
      const recentJobRuns = await prisma.jobRun.findMany({
        where: {
          startedAt: { gte: sevenDaysAgo },
          jobName: { in: ['updateSkinPrices', 'priceHistoryUpdate'] }
        },
        select: {
          id: true,
          jobName: true,
          status: true,
          startedAt: true,
          completedAt: true,
          actualCount: true,
          error: true
        }
      });
      
      // Calculate metrics
      let totalRequests = 0;
      let successCount = 0;
      let errorCount = 0;
      let rateLimitCount = 0;
      const latencies = [];
      
      recentJobRuns.forEach(jobRun => {
        if (jobRun.status === 'done') {
          successCount++;
          totalRequests += jobRun.actualCount || 0;
          
          if (jobRun.completedAt) {
            const latency = jobRun.completedAt.getTime() - jobRun.startedAt.getTime();
            latencies.push(latency);
          }
        } else if (jobRun.status === 'failed') {
          errorCount++;
          
          if (jobRun.error && jobRun.error.includes('rate limit')) {
            rateLimitCount++;
          }
        }
      });
      
      const successRate = totalRequests > 0 ? (successCount / (successCount + errorCount)) * 100 : 0;
      const p50Latency = latencies.length > 0 ? this.calculatePercentile(latencies, 50) : null;
      const p95Latency = latencies.length > 0 ? this.calculatePercentile(latencies, 95) : null;
      
      return {
        timeRange: '7d',
        totalRequests,
        successCount,
        errorCount,
        successRate: Math.round(successRate * 100) / 100,
        rateLimitCount,
        p50Latency,
        p95Latency,
        totalJobRuns: recentJobRuns.length
      };
      
    } catch (error) {
      console.error('Error getting 7-day API metrics:', error);
      throw error;
    }
  }

  // Get time series data for charts (24h)
  static async get24HourTimeSeries() {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Group job runs by hour
      const hourlyData = await prisma.jobRun.groupBy({
        by: ['startedAt'],
        where: {
          startedAt: { gte: twentyFourHoursAgo },
          jobName: { in: ['updateSkinPrices', 'priceHistoryUpdate'] }
        },
        _count: {
          id: true
        },
        _sum: {
          actualCount: true
        }
      });
      
      // Process into time series format
      const timeSeries = hourlyData.map(hour => ({
        timestamp: hour.startedAt,
        hour: hour.startedAt.getHours(),
        jobCount: hour._count.id,
        totalRequests: hour._sum.actualCount || 0
      }));
      
      return timeSeries.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      
    } catch (error) {
      console.error('Error getting 24-hour time series:', error);
      throw error;
    }
  }

  // Get latest job runs for the table
  static async getLatestJobRuns(limit = 20) {
    try {
      const jobRuns = await prisma.jobRun.findMany({
        where: {
          jobName: { in: ['updateSkinPrices', 'priceHistoryUpdate'] }
        },
        select: {
          id: true,
          jobName: true,
          startedAt: true,
          completedAt: true,
          status: true,
          actualCount: true,
          error: true,
          admin: {
            select: { email: true }
          }
        },
        orderBy: { startedAt: 'desc' },
        take: limit
      });
      
      return jobRuns.map(jobRun => {
        const duration = jobRun.completedAt 
          ? jobRun.completedAt.getTime() - jobRun.startedAt.getTime()
          : null;
        
        return {
          id: jobRun.id,
          jobName: jobRun.jobName,
          startedAt: jobRun.startedAt,
          duration: duration ? Math.round(duration / 1000) : null, // in seconds
          status: jobRun.status,
          successCount: jobRun.status === 'done' ? jobRun.actualCount : 0,
          errorCount: jobRun.status === 'failed' ? 1 : 0,
          rateLimitHits: jobRun.error && jobRun.error.includes('rate limit') ? 1 : 0,
          avgLatency: duration ? Math.round(duration / 1000) : null,
          adminEmail: jobRun.admin?.email || 'System'
        };
      });
      
    } catch (error) {
      console.error('Error getting latest job runs:', error);
      throw error;
    }
  }

  // Helper method to calculate percentiles
  static calculatePercentile(values, percentile) {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || null;
  }
}
