import prisma from "../prisma/prismaClient.js";

// Backfill service for data gap filling and repair tools
export class BackfillService {
  // Get data gaps analysis
  static async getDataGapsAnalysis() {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      // Analyze different types of data gaps
      const [
        missingPrices,
        missingHistory,
        stalePrices,
        incompleteSkins,
        orphanedPortfolios,
        orphanedWatchlists
      ] = await Promise.all([
        // Skins without prices
        prisma.skin.count({
          where: { priceAvg: null }
        }),
        
        // Skins without recent price updates
        prisma.skin.count({
          where: {
            OR: [
              { lastPriceUpdate: null },
              { lastPriceUpdate: { lt: thirtyDaysAgo } }
            ]
          }
        }),
        
        // Stale prices (> 48h)
        prisma.skin.count({
          where: {
            lastPriceUpdate: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) }
          }
        }),
        
        // Skins with missing required fields
        prisma.skin.count({
          where: {
            OR: [
              { category: null },
              { rarity: null },
              { wear: null }
            ]
          }
        }),
        
        // Portfolios with non-existent skins
        prisma.portfolio.count({
          where: {
            skin: null
          }
        }),
        
        // Watchlists with non-existent skins
        prisma.watchlist.count({
          where: {
            skin: null
          }
        })
      ]);
      
      // Calculate total impact
      const totalSkins = await prisma.skin.count();
      const totalPortfolios = await prisma.portfolio.count();
      const totalWatchlists = await prisma.watchlist.count();
      
      return {
        gaps: {
          missingPrices: {
            count: missingPrices,
            percentage: totalSkins > 0 ? (missingPrices / totalSkins) * 100 : 0,
            priority: 'high',
            description: 'Skins without any price data'
          },
          missingHistory: {
            count: missingHistory,
            percentage: totalSkins > 0 ? (missingHistory / totalSkins) * 100 : 0,
            priority: 'medium',
            description: 'Skins without recent price updates'
          },
          stalePrices: {
            count: stalePrices,
            percentage: totalSkins > 0 ? (stalePrices / totalSkins) * 100 : 0,
            priority: 'medium',
            description: 'Prices older than 48 hours'
          },
          incompleteSkins: {
            count: incompleteSkins,
            percentage: totalSkins > 0 ? (incompleteSkins / totalSkins) * 100 : 0,
            priority: 'low',
            description: 'Skins missing required metadata'
          },
          orphanedPortfolios: {
            count: orphanedPortfolios,
            percentage: totalPortfolios > 0 ? (orphanedPortfolios / totalPortfolios) * 100 : 0,
            priority: 'high',
            description: 'Portfolio entries with deleted skins'
          },
          orphanedWatchlists: {
            count: orphanedWatchlists,
            percentage: totalWatchlists > 0 ? (orphanedWatchlists / totalWatchlists) * 100 : 0,
            priority: 'medium',
            description: 'Watchlist entries with deleted skins'
          }
        },
        summary: {
          totalGaps: missingPrices + missingHistory + stalePrices + incompleteSkins + orphanedPortfolios + orphanedWatchlists,
          criticalGaps: missingPrices + orphanedPortfolios,
          dataHealthScore: this.calculateDataHealthScore({
            missingPrices, missingHistory, stalePrices, incompleteSkins, orphanedPortfolios, orphanedWatchlists
          })
        }
      };
      
    } catch (error) {
      console.error('Error getting data gaps analysis:', error);
      throw error;
    }
  }

  // Calculate data health score (0-100)
  static calculateDataHealthScore(gaps) {
    const weights = {
      missingPrices: 0.3,
      missingHistory: 0.2,
      stalePrices: 0.15,
      incompleteSkins: 0.1,
      orphanedPortfolios: 0.15,
      orphanedWatchlists: 0.1
    };
    
    let score = 100;
    
    // Reduce score based on gap severity
    for (const [gapType, count] of Object.entries(gaps)) {
      if (count > 0) {
        const weight = weights[gapType] || 0;
        score -= (count * weight * 0.1); // Reduce score based on gap count and weight
      }
    }
    
    return Math.max(0, Math.round(score));
  }

  // Get prioritized backfill tasks
  static async getPrioritizedBackfillTasks(limit = 20) {
    try {
      const tasks = [];
      
      // High priority: Missing prices for popular skins
      const missingPricesSkins = await prisma.skin.findMany({
        where: { priceAvg: null },
        select: {
          id: true,
          name: true,
          category: true,
          rarity: true,
          _count: {
            select: {
              portfolios: true,
              watchlists: true
            }
          }
        },
        orderBy: [
          { _count: { portfolios: 'desc' } },
          { _count: { watchlists: 'desc' } }
        ],
        take: Math.ceil(limit * 0.4) // 40% of tasks
      });
      
      tasks.push(...missingPricesSkins.map(skin => ({
        id: `missing_price_${skin.id}`,
        type: 'missing_price',
        priority: 'high',
        skinId: skin.id,
        skinName: skin.name,
        category: skin.category,
        rarity: skin.rarity,
        impact: skin._count.portfolios + skin._count.watchlists,
        description: `Missing price for ${skin.name} (${skin.category})`,
        estimatedEffort: 'low'
      })));
      
      // Medium priority: Stale prices
      const stalePricesSkins = await prisma.skin.findMany({
        where: {
          lastPriceUpdate: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) }
        },
        select: {
          id: true,
          name: true,
          category: true,
          rarity: true,
          lastPriceUpdate: true
        },
        orderBy: { lastPriceUpdate: 'asc' },
        take: Math.ceil(limit * 0.3) // 30% of tasks
      });
      
      tasks.push(...stalePricesSkins.map(skin => ({
        id: `stale_price_${skin.id}`,
        type: 'stale_price',
        priority: 'medium',
        skinId: skin.id,
        skinName: skin.name,
        category: skin.category,
        rarity: skin.rarity,
        lastUpdate: skin.lastPriceUpdate,
        daysStale: Math.floor((Date.now() - skin.lastPriceUpdate.getTime()) / (1000 * 60 * 60 * 24)),
        description: `Stale price for ${skin.name} (${skin.category})`,
        estimatedEffort: 'low'
      })));
      
      // Low priority: Incomplete metadata
      const incompleteSkins = await prisma.skin.findMany({
        where: {
          OR: [
            { category: null },
            { rarity: null },
            { wear: null }
          ]
        },
        select: {
          id: true,
          name: true,
          category: true,
          rarity: true,
          wear: true
        },
        take: Math.ceil(limit * 0.3) // 30% of tasks
      });
      
      tasks.push(...incompleteSkins.map(skin => ({
        id: `incomplete_${skin.id}`,
        type: 'incomplete_metadata',
        priority: 'low',
        skinId: skin.id,
        skinName: skin.name,
        category: skin.category,
        rarity: skin.rarity,
        wear: skin.wear,
        missingFields: [
          !skin.category && 'category',
          !skin.rarity && 'rarity',
          !skin.wear && 'wear'
        ].filter(Boolean),
        description: `Incomplete metadata for ${skin.name}`,
        estimatedEffort: 'low'
      })));
      
      // Sort by priority and impact
      return tasks.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return (b.impact || 0) - (a.impact || 0);
      }).slice(0, limit);
      
    } catch (error) {
      console.error('Error getting prioritized backfill tasks:', error);
      throw error;
    }
  }

  // Execute backfill task
  static async executeBackfillTask(taskId, adminId) {
    try {
      const [taskType, skinId] = taskId.split('_');
      
      if (!skinId) {
        throw new Error('Invalid task ID format');
      }
      
      let result = {};
      
      switch (taskType) {
        case 'missing_price':
          result = await this.backfillMissingPrice(parseInt(skinId), adminId);
          break;
        case 'stale_price':
          result = await this.backfillStalePrice(parseInt(skinId), adminId);
          break;
        case 'incomplete':
          result = await this.backfillIncompleteMetadata(parseInt(skinId), adminId);
          break;
        default:
          throw new Error(`Unknown task type: ${taskType}`);
      }
      
      // Log admin action
      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'backfill_task_execute',
          resource: 'skin',
          resourceId: skinId,
          details: `Backfill task executed: ${taskType}`,
          parameters: JSON.stringify({ taskId, taskType, skinId })
        }
      });
      
      return result;
      
    } catch (error) {
      console.error('Error executing backfill task:', error);
      throw error;
    }
  }

  // Backfill missing price
  static async backfillMissingPrice(skinId, adminId) {
    try {
      const skin = await prisma.skin.findUnique({
        where: { id: skinId },
        select: { id: true, name: true, category: true }
      });
      
      if (!skin) {
        throw new Error('Skin not found');
      }
      
      // This would integrate with your actual price update logic
      // For now, we'll simulate the process
      console.log(`Would backfill price for skin ${skin.name} (${skin.category})`);
      
      return {
        success: true,
        message: `Price backfill initiated for ${skin.name}`,
        skinId,
        skinName: skin.name,
        action: 'price_backfill_initiated'
      };
      
    } catch (error) {
      console.error('Error backfilling missing price:', error);
      throw error;
    }
  }

  // Backfill stale price
  static async backfillStalePrice(skinId, adminId) {
    try {
      const skin = await prisma.skin.findUnique({
        where: { id: skinId },
        select: { id: true, name: true, category: true, lastPriceUpdate: true }
      });
      
      if (!skin) {
        throw new Error('Skin not found');
      }
      
      // This would trigger a price update
      console.log(`Would update stale price for skin ${skin.name} (${skin.category})`);
      
      return {
        success: true,
        message: `Price update initiated for ${skin.name}`,
        skinId,
        skinName: skin.name,
        action: 'price_update_initiated',
        lastUpdate: skin.lastPriceUpdate
      };
      
    } catch (error) {
      console.error('Error backfilling stale price:', error);
      throw error;
    }
  }

  // Backfill incomplete metadata
  static async backfillIncompleteMetadata(skinId, adminId) {
    try {
      const skin = await prisma.skin.findUnique({
        where: { id: skinId },
        select: { id: true, name: true, category: true, rarity: true, wear: true }
      });
      
      if (!skin) {
        throw new Error('Skin not found');
      }
      
      // This would attempt to fill missing metadata
      console.log(`Would complete metadata for skin ${skin.name}`);
      
      return {
        success: true,
        message: `Metadata completion initiated for ${skin.name}`,
        skinId,
        skinName: skin.name,
        action: 'metadata_completion_initiated',
        currentMetadata: {
          category: skin.category,
          rarity: skin.rarity,
          wear: skin.wear
        }
      };
      
    } catch (error) {
      console.error('Error backfilling incomplete metadata:', error);
      throw error;
    }
  }

  // Get backfill execution history
  static async getBackfillHistory(adminId, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      const history = await prisma.auditLog.findMany({
        where: {
          adminId,
          action: { startsWith: 'backfill_' }
        },
        select: {
          id: true,
          action: true,
          resource: true,
          resourceId: true,
          details: true,
          parameters: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });
      
      // Get total count for pagination
      const total = await prisma.auditLog.count({
        where: {
          adminId,
          action: { startsWith: 'backfill_' }
        }
      });
      
      return {
        history: history.map(entry => ({
          ...entry,
          parameters: entry.parameters ? JSON.parse(entry.parameters) : null
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      console.error('Error getting backfill history:', error);
      throw error;
    }
  }
}
