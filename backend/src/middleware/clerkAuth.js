// /backend/src/middleware/clerkAuth.js (Backend)
// Clerk authentication middleware for Express.js backend

import { verifyToken } from '@clerk/nextjs/server';

/**
 * Clerk authentication middleware
 * Verifies JWT tokens from Clerk and adds user info to request
 */
export const clerkAuth = async (req, res, next) => {
  try {
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

    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Missing or invalid authorization header',
        code: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify the token with Clerk
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });

      // Add user info to request
      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.publicMetadata?.role || 'user',
        tier: payload.publicMetadata?.tier || 'free'
      };

      // Add user ID to request for easy access
      req.userId = payload.sub;

      next();
    } catch (tokenError) {
      console.error('Token verification failed:', tokenError);
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }
  } catch (error) {
    console.error('Clerk auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info if token is present, but doesn't require it
 */
export const optionalClerkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      req.userId = null;
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });

      req.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.publicMetadata?.role || 'user',
        tier: payload.publicMetadata?.tier || 'free'
      };

      req.userId = payload.sub;
    } catch (tokenError) {
      console.warn('Optional auth token verification failed:', tokenError);
      req.user = null;
      req.userId = null;
    }

    next();
  } catch (error) {
    console.error('Optional clerk auth middleware error:', error);
    req.user = null;
    req.userId = null;
    next();
  }
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
