/**
 * Tier-based Feature Gating Middleware
 * Restricts features based on user subscription tier
 *
 * Usage:
 *   const { requireTier, getTierLimits } = require('./middleware/tier-gating');
 *
 *   // Protect routes
 *   app.post('/api/alerts/advanced', requireTier('pro'), handleAdvancedAlerts);
 *
 *   // Check limits in endpoint
 *   const limits = getTierLimits(user.tier);
 *   if (portfolio.skins.length > limits.maxPortfolioSkins) {
 *     return res.status(402).json({ error: 'Portfolio limit exceeded. Upgrade to Pro.' });
 *   }
 */

import logger from '../utils/logger.js';

/**
 * Tier feature limits configuration
 */
const TIER_LIMITS = {
  free: {
    maxSkins: 10,
    maxAlerts: 5,
    maxPortfolioItems: 20,
    maxAPIKeysPerUser: 0, // Cannot create API keys
    maxPortfolioSize: 10000, // €10,000 max portfolio value
    priceHistoryDays: 30,
    hasAdvancedCharts: false,
    hasExportCSV: false,
    hasEmailAlerts: false,
    hasAPIAccess: false,
    refreshRateMinutes: 60 // Updates every hour
  },
  pro: {
    maxSkins: Infinity,
    maxAlerts: 100,
    maxPortfolioItems: Infinity,
    maxAPIKeysPerUser: 5,
    maxPortfolioSize: Infinity,
    priceHistoryDays: 365,
    hasAdvancedCharts: true,
    hasExportCSV: true,
    hasEmailAlerts: true,
    hasAPIAccess: true,
    refreshRateMinutes: 1, // Real-time updates (future enhancement)
    apiCallsPerDay: 10000,
    monthlyPrice: 4.99 // EUR
  },
  enterprise: {
    maxSkins: Infinity,
    maxAlerts: Infinity,
    maxPortfolioItems: Infinity,
    maxAPIKeysPerUser: Infinity,
    maxPortfolioSize: Infinity,
    priceHistoryDays: Infinity,
    hasAdvancedCharts: true,
    hasExportCSV: true,
    hasEmailAlerts: true,
    hasAPIAccess: true,
    refreshRateMinutes: 1,
    apiCallsPerDay: Infinity,
    monthlyPrice: 99.00 // EUR, custom billing
  }
};

/**
 * Middleware: Require specific tier or higher
 * @param {string} minTier - Minimum tier required (free, pro, enterprise)
 * @returns {Function} Express middleware
 */
function requireTier(minTier) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const tierHierarchy = ['free', 'pro', 'enterprise'];
      const userTierIndex = tierHierarchy.indexOf(user.tier || 'free');
      const minTierIndex = tierHierarchy.indexOf(minTier);

      if (userTierIndex < minTierIndex) {
        const limits = getTierLimits(minTier);
        return res.status(402).json({
          error: `Upgrade to ${minTier.charAt(0).toUpperCase() + minTier.slice(1)} to access this feature`,
          requiredTier: minTier,
          currentTier: user.tier || 'free',
          upgrade: {
            url: '/pricing',
            price: limits.monthlyPrice,
            currency: 'EUR'
          }
        });
      }

      next();
    } catch (error) {
      logger.error('Tier gating check failed', {
        userId: req.user?.id,
        error: error.message
      });
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/**
 * Get tier limits for a given tier
 * @param {string} tier - User tier (free, pro, enterprise)
 * @returns {Object} Tier limits
 */
function getTierLimits(tier) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  return {
    ...limits,
    tier,
    upgradeUrl: '/pricing'
  };
}

/**
 * Check if user has reached a specific limit
 * @param {Object} user - User object with tier
 * @param {string} limitKey - Key in TIER_LIMITS (e.g., 'maxSkins')
 * @param {number} currentUsage - Current usage count
 * @returns {Object} { exceeded: boolean, remaining: number, limit: number }
 */
function checkLimit(user, limitKey, currentUsage) {
  const limits = getTierLimits(user.tier || 'free');
  const limit = limits[limitKey];

  return {
    exceeded: currentUsage >= limit,
    remaining: Math.max(0, limit - currentUsage),
    limit,
    tier: user.tier || 'free'
  };
}

/**
 * Validate API key usage against tier limits
 * @param {Object} apiKey - APIKey record from database
 * @returns {Object} { canUse: boolean, message?: string }
 */
function validateAPIKeyUsage(apiKey) {
  // Check key validity before rate limits (fail fast, correct error messages)
  if (!apiKey.isActive) {
    return {
      canUse: false,
      message: 'API key is inactive'
    };
  }

  if (apiKey.expiresAt && new Date() > new Date(apiKey.expiresAt)) {
    return {
      canUse: false,
      message: 'API key has expired'
    };
  }

  const tierLimits = TIER_LIMITS[apiKey.tier] || TIER_LIMITS.free;

  if (apiKey.callsUsed >= tierLimits.apiCallsPerDay) {
    return {
      canUse: false,
      message: `API limit exceeded (${apiKey.callsUsed}/${tierLimits.apiCallsPerDay} calls today)`,
      limit: tierLimits.apiCallsPerDay,
      used: apiKey.callsUsed
    };
  }

  return {
    canUse: true,
    remaining: tierLimits.apiCallsPerDay - apiKey.callsUsed
  };
}

/**
 * Get feature availability for a tier
 * Returns only enabled features for faster checking
 * @param {string} tier - User tier
 * @returns {Array<string>} Array of available feature keys
 */
function getEnabledFeatures(tier) {
  const limits = getTierLimits(tier);
  const features = [];

  Object.entries(limits).forEach(([key, value]) => {
    if (key.startsWith('has') && value === true) {
      features.push(key.substring(3)); // Remove 'has' prefix
    }
  });

  return features;
}

export {
  requireTier,
  getTierLimits,
  checkLimit,
  validateAPIKeyUsage,
  getEnabledFeatures,
  TIER_LIMITS
};
