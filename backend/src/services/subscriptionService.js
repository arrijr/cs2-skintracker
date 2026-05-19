/**
 * Subscription Service
 * Handles subscription lifecycle: creation, updates, cancellation, tier checking
 */

import prisma from '../prisma/prismaClient.js';
import logger from '../utils/logger.js';

export const subscriptionService = {
  /**
   * Get or create a subscription for user
   * Falls back to User.isPremium since UserSubscriptions table is not in schema.
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Subscription-like record
   */
  async getOrCreateSubscription(userId) {
    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new Error(`User ${userId} not found`);
      }
      const tier = user.tier || (user.isPremium ? 'pro' : 'free');
      const isPaid = tier === 'pro' || tier === 'lite';
      // CSV export is Pro-only — keep aligned with `exportPortfolio`
      // controller gate (`backend/src/controllers/portfolioController.js`).
      const isPro = tier === 'pro';
      return {
        id: user.id,
        userId: user.id,
        tier,
        status: user.subscriptionStatus || (isPaid ? 'active' : 'inactive'),
        stripeCustomerId: user.stripeCustomerId ?? null,
        stripeSubId: user.stripeSubscriptionId ?? null,
        currentPeriodStart: user.currentPeriodStart ?? null,
        currentPeriodEnd: user.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: user.cancelAtPeriodEnd ?? false,
        canceledAt: null,
        canCreatePortfolio: true,
        canAccessResearch: isPaid,
        canExportCSV: isPro
      };
    } catch (error) {
      logger.error('Failed to get/create subscription', { userId, error: error.message });
      throw error;
    }
  },

  /**
   * Update subscription from Stripe webhook event
   * @param {Object} stripeSubscription - Stripe subscription object
   * @returns {Promise<Object>} Updated UserSubscriptions record
   */
  async updateSubscriptionFromStripe(stripeSubscription) {
    try {
      // Extract user ID and tier from metadata
      const userId = parseInt(stripeSubscription.metadata?.userId || 0);
      const tier = stripeSubscription.metadata?.tier || 'lite';

      if (!userId) {
        logger.error('No userId in Stripe metadata', { stripeSubId: stripeSubscription.id });
        throw new Error('Missing userId in Stripe metadata');
      }

      const isPaid = tier === 'pro' || tier === 'lite';
      const sub = await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: isPaid,
          tier,
          stripeCustomerId: stripeSubscription.customer ?? undefined,
          stripeSubscriptionId: stripeSubscription.id ?? undefined,
          subscriptionStatus: stripeSubscription.status ?? null,
          currentPeriodStart: stripeSubscription.current_period_start
            ? new Date(stripeSubscription.current_period_start * 1000)
            : null,
          currentPeriodEnd: stripeSubscription.current_period_end
            ? new Date(stripeSubscription.current_period_end * 1000)
            : null,
          cancelAtPeriodEnd: !!stripeSubscription.cancel_at_period_end,
        }
      });

      logger.info('Subscription updated from Stripe', {
        userId,
        tier,
        status: sub.subscriptionStatus,
        stripeSubId: stripeSubscription.id
      });

      return sub;
    } catch (error) {
      logger.error('Failed to update subscription from Stripe', {
        stripeSubId: stripeSubscription.id,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Cancel subscription from Stripe webhook event
   * @param {Object} stripeSubscription - Stripe subscription object
   * @returns {Promise<Object>} Updated UserSubscriptions record
   */
  async cancelSubscriptionFromStripe(stripeSubscription) {
    try {
      const userId = parseInt(stripeSubscription.metadata?.userId || 0);

      if (!userId) {
        logger.error('No userId in Stripe metadata for cancellation', {
          stripeSubId: stripeSubscription.id
        });
        throw new Error('Missing userId in Stripe metadata');
      }

      const sub = await prisma.user.update({
        where: { id: userId },
        data: {
          isPremium: false,
          tier: 'free',
          subscriptionStatus: 'canceled',
          cancelAtPeriodEnd: false,
          stripeSubscriptionId: null,
        }
      });

      logger.info('Subscription canceled', {
        userId,
        stripeSubId: stripeSubscription.id
      });

      return sub;
    } catch (error) {
      logger.error('Failed to cancel subscription from Stripe', {
        stripeSubId: stripeSubscription.id,
        error: error.message
      });
      throw error;
    }
  },

  /**
   * Check if user has required tier
   * @param {number} userId - User ID
   * @param {string} requiredTier - Required tier (free, lite, pro)
   * @returns {Promise<boolean>} True if user has tier or higher
   */
  async checkTier(userId, requiredTier) {
    try {
      const sub = await this.getOrCreateSubscription(userId);

      const tierHierarchy = { free: 0, lite: 1, pro: 2 };
      const userLevel = tierHierarchy[sub?.tier || 'free'] || 0;
      const requiredLevel = tierHierarchy[requiredTier] || 0;

      const hasAccess = userLevel >= requiredLevel;

      if (!hasAccess) {
        logger.warn('Tier check failed', {
          userId,
          userTier: sub?.tier || 'free',
          requiredTier
        });
      }

      return hasAccess;
    } catch (error) {
      logger.error('Failed to check tier', { userId, requiredTier, error: error.message });
      throw error;
    }
  },

  /**
   * Get feature flags for a tier
   * @param {string} tier - Tier name
   * @returns {Object} Feature flags
   */
  getTierFeatures(tier) {
    const features = {
      free: {
        canCreatePortfolio: true,
        canAccessResearch: false,
        canExportCSV: false,
        maxSkins: 0, // Unlimited for now
        priceHistoryDays: 30
      },
      lite: {
        canCreatePortfolio: true,
        canAccessResearch: false,
        canExportCSV: false,
        maxSkins: 0,
        priceHistoryDays: 90
      },
      pro: {
        canCreatePortfolio: true,
        canAccessResearch: true,
        canExportCSV: true,
        maxSkins: 0,
        priceHistoryDays: 180
      }
    };

    return features[tier] || features.free;
  },

  /**
   * Update subscription status (for manual admin operations)
   * @param {number} userId - User ID
   * @param {string} newTier - New tier
   * @param {string} newStatus - New status
   * @returns {Promise<Object>} Updated subscription
   */
  async updateSubscriptionStatus(userId, newTier, newStatus) {
    try {
      const sub = await prisma.user.update({
        where: { id: userId },
        data: { isPremium: newTier === 'pro' || newTier === 'lite' }
      });

      logger.info('Subscription status updated manually', {
        userId,
        tier: newTier,
        status: newStatus
      });

      return sub;
    } catch (error) {
      logger.error('Failed to update subscription status', {
        userId,
        error: error.message
      });
      throw error;
    }
  }
};

export default subscriptionService;
