// /backend/src/middleware/clerkAuth.js (Backend)
// Clerk authentication middleware for Express.js backend

import { clerkMiddleware, requireAuth } from '@clerk/express';

/**
 * Clerk authentication middleware using @clerk/express
 * Verifies JWT tokens from Clerk and adds user info to request
 */
export const clerkAuth = (req, res, next) => {
  // Skip auth for public routes
  const publicRoutes = [
    '/api/v1/health',
    '/api/v1/skins',
    '/api/v1/skins/search',
    '/api/v1/skins/browse'
  ];
  
  if (publicRoutes.some(route => req.path.startsWith(route))) {
    return next();
  }

  // Use Clerk's requireAuth middleware
  return requireAuth()(req, res, (err) => {
    if (err) {
      console.error('Clerk auth middleware error:', err);
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    // Add user info to request after successful auth
    if (req.auth && req.auth.userId) {
      req.user = {
        id: req.auth.userId,
        email: req.auth.sessionClaims?.email,
        role: req.auth.publicMetadata?.role || 'user',
        tier: req.auth.publicMetadata?.tier || 'free'
      };
      req.userId = req.auth.userId;
    }

    next();
  });
};

/**
 * Optional authentication middleware using @clerk/express
 * Adds user info if token is present, but doesn't require it
 */
export const optionalClerkAuth = (req, res, next) => {
  // Use clerkMiddleware for optional auth
  return clerkMiddleware()(req, res, (err) => {
    if (err) {
      console.warn('Optional Clerk auth middleware error:', err);
      req.user = null;
      req.userId = null;
      return next();
    }

    // Add user info to request if authenticated
    if (req.auth && req.auth.userId) {
      req.user = {
        id: req.auth.userId,
        email: req.auth.sessionClaims?.email,
        role: req.auth.publicMetadata?.role || 'user',
        tier: req.auth.publicMetadata?.tier || 'free'
      };
      req.userId = req.auth.userId;
    } else {
      req.user = null;
      req.userId = null;
    }

    next();
  });
};

/**
 * Admin role middleware
 * Must be used after clerkAuth middleware
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      code: 'ADMIN_REQUIRED'
    });
  }

  next();
};

/**
 * Premium tier middleware
 * Must be used after clerkAuth middleware
 */
export const requirePremium = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.tier !== 'premium') {
    return res.status(403).json({ 
      error: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED'
    });
  }

  next();
};

/**
 * User ownership middleware
 * Checks if user owns the resource
 */
export const requireOwnership = (resourceUserIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      });
    }

    const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
    
    if (!resourceUserId) {
      return res.status(400).json({ 
        error: 'Resource user ID not found',
        code: 'MISSING_RESOURCE_USER_ID'
      });
    }

    if (req.user.id !== resourceUserId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied: You can only access your own resources',
        code: 'OWNERSHIP_REQUIRED'
      });
    }

    next();
  };
};

export default {
  clerkAuth,
  optionalClerkAuth,
  requireAdmin,
  requirePremium,
  requireOwnership
};
