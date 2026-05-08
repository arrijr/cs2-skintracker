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
      const tier = user.isPremium ? 'pro' : 'free';
      return {
        id: user.id,
        userId: user.id,
        tier,
        status: 'active',
        stripeCustomerId: null,
        stripeSubId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        canceledAt: null,
        canCreatePortfolio: true,
        canAccessResearch: user.isPremium,
        canExportCSV: user.isPremium
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
      const tier = stripeSubscription.metadata?.tier || 'creator';

      if (!userId) {
        logger.error('No userId in Stripe metadata', { stripeSubId: stripeSubscription.id });
        throw new Error('Missing userId in Stripe metadata');
      }

      const sub = await prisma.user.update({
        where: { id: userId },
        data: { isPremium: tier === 'pro' || tier === 'creator' }
      });

      logger.info('Subscription updated from Stripe', {
        userId,
        tier,
        status: sub.status,
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
        data: { isPremium: false }
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
   * @param {string} requiredTier - Required tier (free, creator, pro)
   * @returns {Promise<boolean>} True if user has tier or higher
   */
  async checkTier(userId, requiredTier) {
    try {
      const sub = await this.getOrCreateSubscription(userId);

      const tierHierarchy = { free: 0, creator: 1, pro: 2 };
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
      creator: {
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
        data: { isPremium: newTier === 'pro' || newTier === 'creator' }
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
