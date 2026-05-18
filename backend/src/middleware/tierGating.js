/**
 * Tier Gating Middleware
 * Validates user's subscription tier before allowing access to features
 */

import subscriptionService from '../services/subscriptionService.js';
import logger from '../utils/logger.js';

/**
 * Middleware factory: require specific tier
 * Usage: router.get('/pro-feature', requireTier('pro'), handler)
 *
 * @param {string} requiredTier - Minimum required tier (free, creator, pro)
 * @returns {Function} Express middleware
 */
export function requireTier(requiredTier) {
  return async (req, res, next) => {
    try {
      // Extract user ID from JWT (set by verifyClerkJwt middleware)
      const userId = req.auth?.userId;

      if (!userId) {
        logger.warn('Tier check: No authentication found');
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Check tier
      const hasAccess = await subscriptionService.checkTier(userId, requiredTier);

      if (!hasAccess) {
        const sub = await subscriptionService.getOrCreateSubscription(userId);
        logger.warn('Tier check failed', {
          userId,
          userTier: sub.tier,
          requiredTier
        });

        return res.status(403).json({
          error: `Upgrade required`,
          message: `This feature requires ${requiredTier} tier. You have: ${sub.tier}`,
          currentTier: sub.tier,
          requiredTier: requiredTier
        });
      }

      // Tier check passed
      logger.debug('Tier check passed', { userId, tier: requiredTier });
      next();
    } catch (error) {
      logger.error('Tier check failed with error', {
        userId: req.auth?.userId,
        error: error.message
      });

      return res.status(500).json({ error: 'Tier validation failed' });
    }
  };
}

/**
 * Middleware: attach subscription data to request
 * Usage: router.get('/feature', attachSubscription, handler)
 * Sets: req.subscription = UserSubscriptions record
 *
 * @returns {Function} Express middleware
 */
export function attachSubscription(req, res, next) {
  return (async () => {
    try {
      const userId = req.auth?.userId;

      if (!userId) {
        req.subscription = null;
        return next();
      }

      const sub = await subscriptionService.getOrCreateSubscription(userId);
      req.subscription = sub;

      logger.debug('Subscription attached', { userId, tier: sub.tier });
      next();
    } catch (error) {
      logger.error('Failed to attach subscription', {
        userId: req.auth?.userId,
        error: error.message
      });

      req.subscription = null;
      next();
    }
  })();
}

/**
 * Middleware: optional tier check (doesn't block, just annotates)
 * Usage: router.get('/feature', optionalTierCheck, handler)
 * Sets: req.hasTier = boolean
 *
 * @param {string} requiredTier - Tier to check for
 * @returns {Function} Express middleware
 */
export function optionalTierCheck(requiredTier) {
  return async (req, res, next) => {
    try {
      const userId = req.auth?.userId;

      if (!userId) {
        req.hasTier = false;
        return next();
      }

      const hasTier = await subscriptionService.checkTier(userId, requiredTier);
      req.hasTier = hasTier;

      logger.debug('Optional tier check', { userId, tier: requiredTier, hasTier });
      next();
    } catch (error) {
      logger.error('Optional tier check failed', {
        userId: req.auth?.userId,
        error: error.message
      });

      req.hasTier = false;
      next();
    }
  };
}

export default { requireTier, attachSubscription, optionalTierCheck };
