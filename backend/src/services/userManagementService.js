import prisma from "../prisma/prismaClient.js";

// User Management service for admin operations.
//
// NOTE (2026-06-01, Phase 2 fix): rewritten against the REAL Prisma schema.
// The original was written for an imagined schema — `username` (real: displayName),
// `status`/`lastLoginAt`/`updatedAt` (don't exist), `portfolios`/`watchlists`
// (singular: portfolio/watchlist), Portfolio.`quantity`/`purchasePrice`/`purchaseDate`
// (real: amount/buyPrice/buyDate), Watchlist.`targetPrice` (real: priceAlert),
// PortfolioHistory.`totalValue` (real: value), Skin.`category` (real: weaponType),
// and AuditLog `adminId`/`resourceId`/`parameters` (real: userId + details).
// `User.status`/suspend was DROPPED (no column, no enforcement → would be a façade).
// The binary `isPremium` toggle is replaced by a real 3-tier setter (free/lite/pro).
const VALID_TIERS = ['free', 'lite', 'pro'];

export class UserManagementService {
  // Get users with pagination and filtering
  static async getUsers(filters = {}, page = 1, limit = 20) {
    try {
      const offset = (page - 1) * limit;
      const whereClause = {};

      if (filters.search) {
        whereClause.OR = [
          { email: { contains: filters.search, mode: 'insensitive' } },
          { displayName: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
      if (filters.role) whereClause.role = filters.role;
      if (filters.tier) whereClause.tier = filters.tier;
      if (typeof filters.emailAlerts === 'boolean') whereClause.emailAlerts = filters.emailAlerts;

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
            tier: true,
            isPremium: true,
            emailAlerts: true,
            createdAt: true,
            _count: { select: { portfolio: true, watchlist: true } }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        prisma.user.count({ where: whereClause })
      ]);

      return {
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          tier: user.tier,
          isPremium: user.isPremium,
          emailAlerts: user.emailAlerts,
          createdAt: user.createdAt,
          portfolioCount: user._count.portfolio,
          watchlistCount: user._count.watchlist
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
      };
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  }

  // Get user details with portfolio + watchlist
  static async getUserDetails(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) },
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          tier: true,
          isPremium: true,
          emailAlerts: true,
          createdAt: true,
          portfolio: {
            select: {
              id: true,
              skin: { select: { id: true, name: true, weaponType: true, rarity: true, priceAvg: true } },
              amount: true,
              buyPrice: true,
              buyDate: true
            }
          },
          watchlist: {
            select: {
              id: true,
              skin: { select: { id: true, name: true, weaponType: true, rarity: true, priceAvg: true } },
              priceAlert: true,
              createdAt: true
            }
          },
          _count: { select: { portfolio: true, watchlist: true } }
        }
      });

      if (!user) throw new Error('User not found');

      let totalPortfolioValue = 0;
      let totalInvested = 0;
      for (const p of user.portfolio) {
        totalPortfolioValue += (p.skin.priceAvg || 0) * p.amount;
        totalInvested += (p.buyPrice || 0) * p.amount;
      }

      const portfolioStats = {
        totalItems: user._count.portfolio,
        totalValue: Math.round(totalPortfolioValue * 100) / 100,
        totalInvested: Math.round(totalInvested * 100) / 100,
        profitLoss: Math.round((totalPortfolioValue - totalInvested) * 100) / 100,
        profitLossPercentage: totalInvested > 0
          ? Math.round(((totalPortfolioValue - totalInvested) / totalInvested) * 10000) / 100
          : 0
      };

      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        tier: user.tier,
        isPremium: user.isPremium,
        emailAlerts: user.emailAlerts,
        createdAt: user.createdAt,
        portfolio: user.portfolio,
        watchlist: user.watchlist,
        portfolioStats,
        watchlistCount: user._count.watchlist
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

      const [recentPortfolioChanges, recentWatchlistAdditions] = await Promise.all([
        prisma.portfolioHistory.findMany({
          where: { userId: parseInt(userId), date: { gte: cutoffDate } },
          select: { date: true, value: true },
          orderBy: { date: 'asc' }
        }),
        prisma.watchlist.findMany({
          where: { userId: parseInt(userId), createdAt: { gte: cutoffDate } },
          select: { createdAt: true, skin: { select: { name: true, weaponType: true } } },
          orderBy: { createdAt: 'desc' }
        })
      ]);

      let portfolioGrowth = 0;
      if (recentPortfolioChanges.length >= 2) {
        const firstValue = recentPortfolioChanges[0].value;
        const lastValue = recentPortfolioChanges[recentPortfolioChanges.length - 1].value;
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

  // Update user email alerts preference
  static async updateUserEmailAlerts(userId, emailAlerts, adminId) {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { emailAlerts: Boolean(emailAlerts) },
        select: { id: true, email: true, emailAlerts: true }
      });

      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'user_email_alerts_update',
          resource: 'user',
          details: `Email alerts ${emailAlerts ? 'enabled' : 'disabled'} for user ${userId}`
        }
      });

      return updatedUser;
    } catch (error) {
      console.error('Error updating user email alerts:', error);
      throw error;
    }
  }

  // Set a user's subscription tier (admin override). Keeps isPremium in sync so
  // the notifications/quota layer (which reads User.tier) and any legacy
  // isPremium reader agree. Does NOT touch Stripe — admin/support override only.
  static async updateUserTier(userId, tier, adminId) {
    try {
      if (!VALID_TIERS.includes(tier)) throw new Error('Invalid tier');

      const updatedUser = await prisma.user.update({
        where: { id: parseInt(userId) },
        data: { tier, isPremium: tier !== 'free' },
        select: { id: true, email: true, tier: true, isPremium: true }
      });

      await prisma.auditLog.create({
        data: {
          userId: adminId,
          action: 'user_tier_update',
          resource: 'user',
          details: `Tier set to ${tier} for user ${userId} (admin override, bypasses Stripe)`
        }
      });

      return updatedUser;
    } catch (error) {
      console.error('Error updating user tier:', error);
      throw error;
    }
  }

  // Get user statistics for the admin dashboard
  static async getUserStatistics() {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        premiumUsers,
        usersWithPortfolios,
        usersWithWatchlists,
        emailAlertsEnabled,
        newUsers30Days,
        newUsers7Days
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { OR: [{ tier: { in: ['lite', 'pro'] } }, { isPremium: true }] } }),
        prisma.user.count({ where: { portfolio: { some: {} } } }),
        prisma.user.count({ where: { watchlist: { some: {} } } }),
        prisma.user.count({ where: { emailAlerts: true } }),
        prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
        prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } })
      ]);

      return {
        totalUsers,
        premiumUsers,
        usersWithPortfolios,
        usersWithWatchlists,
        emailAlertsEnabled,
        newUsers30Days,
        newUsers7Days,
        premiumUserPercentage: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 10000) / 100 : 0,
        portfolioUserPercentage: totalUsers > 0 ? Math.round((usersWithPortfolios / totalUsers) * 10000) / 100 : 0
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  // Quick search (type-ahead) — max 10 results
  static async searchUsers(query, filters = {}) {
    try {
      const whereClause = {
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { displayName: { contains: query, mode: 'insensitive' } }
        ]
      };
      if (filters.role) whereClause.role = filters.role;
      if (typeof filters.hasPortfolio === 'boolean') {
        whereClause.portfolio = filters.hasPortfolio ? { some: {} } : { none: {} };
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          displayName: true,
          role: true,
          tier: true,
          isPremium: true,
          createdAt: true,
          _count: { select: { portfolio: true, watchlist: true } }
        },
        take: 10
      });

      return users.map(user => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        tier: user.tier,
        isPremium: user.isPremium,
        createdAt: user.createdAt,
        portfolioCount: user._count.portfolio,
        watchlistCount: user._count.watchlist
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      throw error;
    }
  }
}
