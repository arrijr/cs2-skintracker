import prisma from "../prisma/prismaClient.js";

// Data Quality monitoring service with configurable rules
export class DataQualityService {
  // Default rules configuration
  static RULES = {
    STALE_PRICE: {
      name: 'Stale Price',
      description: 'Price not updated for > 48 hours',
      threshold: 48, // hours
      priority: 'high'
    },
    FLAT_PRICE: {
      name: 'Flat Price',
      description: 'Price unchanged for ≥ 7 days on popular skins',
      threshold: 7, // days
      priority: 'medium'
    },
    MISSING_HISTORY: {
      name: 'Missing History',
      description: 'No PriceHistory entries for ≥ 7 days',
      threshold: 7, // days
      priority: 'medium'
    },
    LOW_COVERAGE: {
      name: 'Low Coverage Segment',
      description: 'Segment with coverage < 95%',
      threshold: 95, // percentage
      priority: 'low'
    },
    ALERT_THROUGHPUT_DROP: {
      name: 'Alert Throughput Drop',
      description: 'Alerts checked < 80% of 7-day median',
      threshold: 80, // percentage
      priority: 'high'
    }
  };

  // Check for stale prices (> 48h)
  static async checkStalePrices() {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      
      const staleSkins = await prisma.skin.findMany({
        where: {
          lastPriceUpdate: { lt: fortyEightHoursAgo }
        },
        select: {
          id: true,
          name: true,
          category: true,
          rarity: true,
          lastPriceUpdate: true
        },
        take: 100 // Limit for performance
      });
      
      return staleSkins.map(skin => ({
        rule: 'STALE_PRICE',
        segment: skin.category,
        skinId: skin.id,
        skinName: skin.name,
        details: `Last update: ${skin.lastPriceUpdate}`,
        priority: this.RULES.STALE_PRICE.priority,
        threshold: this.RULES.STALE_PRICE.threshold
      }));
      
    } catch (error) {
      console.error('Error checking stale prices:', error);
      return [];
    }
  }

  // Check for flat prices (unchanged for ≥ 7 days)
  static async checkFlatPrices() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get skins with recent price history to check for flat prices
      const skinsWithHistory = await prisma.skin.findMany({
        where: {
          lastPriceUpdate: { gte: sevenDaysAgo },
          priceAvg: { not: null }
        },
        select: {
          id: true,
          name: true,
          category: true,
          rarity: true,
          priceAvg: true,
          lastPriceUpdate: true
        },
        take: 100
      });
      
      // This is a simplified check - in production you'd compare with actual price history
      const flatPriceSkins = skinsWithHistory.filter(skin => {
        // Mock check: if price is exactly the same for 7+ days
        return skin.lastPriceUpdate && 
               skin.lastPriceUpdate.getTime() < sevenDaysAgo.getTime() + (24 * 60 * 60 * 1000);
      });
      
      return flatPriceSkins.map(skin => ({
        rule: 'FLAT_PRICE',
        segment: skin.category,
        skinId: skin.id,
        skinName: skin.name,
        details: `Price: $${skin.priceAvg}, Last update: ${skin.lastPriceUpdate}`,
        priority: this.RULES.FLAT_PRICE.priority,
        threshold: this.RULES.FLAT_PRICE.threshold
      }));
      
    } catch (error) {
      console.error('Error checking flat prices:', error);
      return [];
    }
  }

  // Check for missing price history
  static async checkMissingHistory() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      const skinsWithoutHistory = await prisma.skin.findMany({
        where: {
          OR: [
            { lastPriceUpdate: null },
            { lastPriceUpdate: { lt: sevenDaysAgo } }
          ]
        },
        select: {
          id: true,
          name: true,
          category: true,
          rarity: true,
          lastPriceUpdate: true
        },
        take: 100
      });
      
      return skinsWithoutHistory.map(skin => ({
        rule: 'MISSING_HISTORY',
        segment: skin.category,
        skinId: skin.id,
        skinName: skin.name,
        details: `No history for ${skin.lastPriceUpdate ? '7+ days' : 'ever'}`,
        priority: this.RULES.MISSING_HISTORY.priority,
        threshold: this.RULES.MISSING_HISTORY.threshold
      }));
      
    } catch (error) {
      console.error('Error checking missing history:', error);
      return [];
    }
  }

  // Check for low coverage segments
  static async checkLowCoverageSegments() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      // Get coverage by weapon type
      const categories = await prisma.skin.findMany({
        select: { category: true },
        where: { category: { not: null } },
        distinct: ['category']
      });
      
      const lowCoverageSegments = [];
      
      for (const cat of categories) {
        const totalInCategory = await prisma.skin.count({
          where: { category: cat.category }
        });
        
        const withRecentPrices = await prisma.skin.count({
          where: {
            category: cat.category,
            lastPriceUpdate: { gte: sevenDaysAgo }
          }
        });
        
        const coverage = totalInCategory > 0 ? (withRecentPrices / totalInCategory) * 100 : 0;
        
        if (coverage < this.RULES.LOW_COVERAGE.threshold) {
          lowCoverageSegments.push({
            rule: 'LOW_COVERAGE',
            segment: cat.category,
            skinId: null,
            skinName: null,
            details: `${coverage.toFixed(1)}% coverage (${withRecentPrices}/${totalInCategory})`,
            priority: this.RULES.LOW_COVERAGE.priority,
            threshold: this.RULES.LOW_COVERAGE.threshold
          });
        }
      }
      
      return lowCoverageSegments;
      
    } catch (error) {
      console.error('Error checking low coverage segments:', error);
      return [];
    }
  }

  // Check alert throughput drop
  static async checkAlertThroughputDrop() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
      
      // Get alert check jobs from last 7 days
      const recentAlerts = await prisma.jobRun.count({
        where: {
          jobName: 'alertCheck',
          startedAt: { gte: sevenDaysAgo }
        }
      });
      
      // Get alert check jobs from previous 7 days
      const previousAlerts = await prisma.jobRun.count({
        where: {
          jobName: 'alertCheck',
          startedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo }
        }
      });
      
      if (previousAlerts > 0) {
        const throughputRatio = (recentAlerts / previousAlerts) * 100;
        
        if (throughputRatio < this.RULES.ALERT_THROUGHPUT_DROP.threshold) {
          return [{
            rule: 'ALERT_THROUGHPUT_DROP',
            segment: 'System',
            skinId: null,
            skinName: null,
            details: `${throughputRatio.toFixed(1)}% of previous throughput (${recentAlerts} vs ${previousAlerts})`,
            priority: this.RULES.ALERT_THROUGHPUT_DROP.priority,
            threshold: this.RULES.ALERT_THROUGHPUT_DROP.threshold
          }];
        }
      }
      
      return [];
      
    } catch (error) {
      console.error('Error checking alert throughput drop:', error);
      return [];
    }
  }

  // Run all data quality checks
  static async runAllChecks() {
    try {
      const [
        stalePrices,
        flatPrices,
        missingHistory,
        lowCoverage,
        alertThroughput
      ] = await Promise.all([
        this.checkStalePrices(),
        this.checkFlatPrices(),
        this.checkMissingHistory(),
        this.checkLowCoverageSegments(),
        this.checkAlertThroughputDrop()
      ]);
      
      // Combine all alerts
      const allAlerts = [
        ...stalePrices,
        ...flatPrices,
        ...missingHistory,
        ...lowCoverage,
        ...alertThroughput
      ];
      
      // Add metadata
      return allAlerts.map((alert, index) => ({
        id: `dq_${Date.now()}_${index}`,
        ...alert,
        firstSeen: new Date(),
        lastSeen: new Date(),
        status: 'open',
        note: null
      }));
      
    } catch (error) {
      console.error('Error running data quality checks:', error);
      return [];
    }
  }

  // Get alerts with filtering and pagination
  static async getAlerts(filters = {}, page = 1, limit = 20) {
    try {
      // For now, we'll run checks on-demand
      // In production, you'd store alerts in a database
      const allAlerts = await this.runAllChecks();
      
      // Apply filters
      let filteredAlerts = allAlerts;
      
      if (filters.rule) {
        filteredAlerts = filteredAlerts.filter(alert => alert.rule === filters.rule);
      }
      
      if (filters.status) {
        filteredAlerts = filteredAlerts.filter(alert => alert.status === filters.status);
      }
      
      if (filters.segment) {
        filteredAlerts = filteredAlerts.filter(alert => alert.segment === filters.segment);
      }
      
      if (filters.priority) {
        filteredAlerts = filteredAlerts.filter(alert => alert.priority === filters.priority);
      }
      
      // Apply pagination
      const offset = (page - 1) * limit;
      const paginatedAlerts = filteredAlerts.slice(offset, offset + limit);
      
      return {
        alerts: paginatedAlerts,
        pagination: {
          page,
          limit,
          total: filteredAlerts.length,
          totalPages: Math.ceil(filteredAlerts.length / limit)
        },
        filters
      };
      
    } catch (error) {
      console.error('Error getting alerts:', error);
      throw error;
    }
  }
}
