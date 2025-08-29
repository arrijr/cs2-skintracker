import prisma from "../prisma/prismaClient.js";

// User Management service for admin operations
export class UserManagementService {
  // Get users with pagination and filtering
  static async getUsers(filters = {}, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      
      // Build where clause based on filters
      const whereClause = {};
      
      if (filters.search) {
        whereClause.OR = [
          { email: { contains: filters.search, mode: 'insensitive' } },
          { username: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      
      if (filters.status) {
        whereClause.status = filters.status;
      }
      
      if (filters.role) {
        whereClause.role = filters.role;
      }
      
      if (filters.emailAlerts !== undefined) {
        whereClause.emailAlerts = filters.emailAlerts;
      }
      
      // Get users with portfolio and watchlist counts
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          emailAlerts: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              portfolios: true,
              watchlists: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      });
      
      // Get total count for pagination
      const total = await prisma.user.count({ where: whereClause });
      
      return {
        users: users.map(user => ({
          ...user,
          portfolioCount: user._count.portfolios,
          watchlistCount: user._count.watchlists
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
      
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  // Get user details with portfolio and activity
  static async getUserDetails(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          emailAlerts: true,
          createdAt: true,
          lastLoginAt: true,
          portfolios: {
            select: {
              id: true,
              skin: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  rarity: true,
                  priceAvg: true
                }
              },
              quantity: true,
              purchasePrice: true,
              purchaseDate: true
            }
          },
          watchlists: {
            select: {
              id: true,
              skin: {
                select: {
                  id: true,
                  name: true,
                  category: true,
                  rarity: true,
                  priceAvg: true
                }
              },
              targetPrice: true,
              createdAt: true
            }
          },
          _count: {
            select: {
              portfolios: true,
              watchlists: true
            }
          }
        }
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Calculate portfolio value
      let totalPortfolioValue = 0;
      let totalInvested = 0;
      
      user.portfolios.forEach(portfolio => {
        const currentValue = (portfolio.skin.priceAvg || 0) * portfolio.quantity;
        const investedValue = (portfolio.purchasePrice || 0) * portfolio.quantity;
        totalPortfolioValue += currentValue;
        totalInvested += investedValue;
      });
      
      const portfolioStats = {
        totalItems: user._count.portfolios,
        totalValue: totalPortfolioValue,
        totalInvested: totalInvested,
        profitLoss: totalPortfolioValue - totalInvested,
        profitLossPercentage: totalInvested > 0 ? ((totalPortfolioValue - totalInvested) / totalInvested) * 100 : 0
      };
      
      return {
        ...user,
        portfolioStats,
        watchlistCount: user._count.watchlists
      };
      
    } catch (error) {
      console.error('Error getting user details:', error);
      throw error;
    }
  }

  // Get user activity summary
  static async getUserActivity(userId, days = 30) {
    try {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      
      // Get recent portfolio changes
      const recentPortfolioChanges = await prisma.portfolioHistory.findMany({
        where: {
          userId: parseInt(userId),
          date: { gte: cutoffDate }
        },
        select: {
          date: true,
          totalValue: true
        },
        orderBy: { date: 'asc' }
      });
      
      // Get recent watchlist additions
      const recentWatchlistAdditions = await prisma.watchlist.findMany({
        where: {
          userId: parseInt(userId),
          createdAt: { gte: cutoffDate }
        },
        select: {
          createdAt: true,
          skin: {
            select: {
              name: true,
              category: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Calculate portfolio growth
      let portfolioGrowth = 0;
      if (recentPortfolioChanges.length >= 2) {
        const firstValue = recentPortfolioChanges[0].totalValue;
        const lastValue = recentPortfolioChanges[recentPortfolioChanges.length - 1].totalValue;
        portfolioGrowth = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;
      }
      
      return {
        portfolioGrowth: Math.round(portfolioGrowth * 100) / 100,
        recentPortfolioChanges,
        recentWatchlistAdditions,
        totalWatchlistAdditions: recentWatchlistAdditions.length
      };
      
    } catch (error) {
      console.error('Error getting user activity:', error);
      throw error;
    }
  }

  // Soft actions on users (no permanent deletion)
  static async updateUserStatus(userId, status, adminId) {
    try {
      // Validate status
      const validStatuses = ['active', 'suspended', 'inactive'];
      if (!validStatuses.includes(status)) {
        throw new Error('Invalid status');
      }
      
      // Update user status
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { status },
        select: {
          id: true,
          email: true,
          status: true,
          updatedAt: true
        }
      });
      
      // Log admin action
      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'user_status_update',
          resource: 'user',
          resourceId: userId.toString(),
          details: `User status changed to ${status}`,
          parameters: JSON.stringify({ status })
        }
      });
      
      return updatedUser;
      
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Update user email alerts preference
  static async updateUserEmailAlerts(userId, emailAlerts, adminId) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { emailAlerts: Boolean(emailAlerts) },
        select: {
          id: true,
          email: true,
          emailAlerts: true,
          updatedAt: true
        }
      });
      
      // Log admin action
      await prisma.auditLog.create({
        data: {
          adminId,
          action: 'user_email_alerts_update',
          resource: 'user',
          resourceId: userId.toString(),
          details: `Email alerts ${emailAlerts ? 'enabled' : 'disabled'}`,
          parameters: JSON.stringify({ emailAlerts })
        }
      });
      
      return updatedUser;
      
    } catch (error) {
      console.error('Error updating user email alerts:', error);
      throw error;
    }
  }

  // Get user statistics for admin dashboard
  static async getUserStatistics() {
    try {
      const [
        totalUsers,
        activeUsers,
        suspendedUsers,
        usersWithPortfolios,
        usersWithWatchlists,
        emailAlertsEnabled
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { status: 'active' } }),
        prisma.user.count({ where: { status: 'suspended' } }),
        prisma.user.count({
          where: {
            portfolios: { some: {} }
          }
        }),
        prisma.user.count({
          where: {
            watchlists: { some: {} }
          }
        }),
        prisma.user.count({ where: { emailAlerts: true } })
      ]);
      
      // Get user growth over time (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const newUsers30Days = await prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      });
      
      // Get user growth over time (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newUsers7Days = await prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } }
      });
      
      return {
        totalUsers,
        activeUsers,
        suspendedUsers,
        usersWithPortfolios,
        usersWithWatchlists,
        emailAlertsEnabled,
        newUsers30Days,
        newUsers7Days,
        activeUserPercentage: totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0,
        portfolioUserPercentage: totalUsers > 0 ? (usersWithPortfolios / totalUsers) * 100 : 0
      };
      
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  // Search users by various criteria
  static async searchUsers(query, filters = {}) {
    try {
      const whereClause = {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { username: { contains: query, mode: 'insensitive' } }
        ]
      };
      
      // Add additional filters
      if (filters.role) whereClause.role = filters.role;
      if (filters.status) whereClause.status = filters.status;
      if (filters.hasPortfolio !== undefined) {
        if (filters.hasPortfolio) {
          whereClause.portfolios = { some: {} };
        } else {
          whereClause.portfolios = { none: {} };
        }
      }
      
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          status: true,
          createdAt: true,
          _count: {
            select: {
              portfolios: true,
              watchlists: true
            }
          }
        },
        take: 10 // Limit search results
      });
      
      return users.map(user => ({
        ...user,
        portfolioCount: user._count.portfolios,
        watchlistCount: user._count.watchlists
      }));
      
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}
