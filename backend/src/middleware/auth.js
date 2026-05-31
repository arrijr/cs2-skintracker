// backend/src/middleware/auth.js
import { verifyToken } from '@clerk/backend';
import { getUserRoleFromDB } from '../utils/roleHelpers.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    
    // Verify Clerk token
    let payload;
    try {
      payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY
      });
    } catch (jwtError) {
      console.error('Clerk token verification failed:', jwtError.message);
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user role from database using centralized helper
    const userRole = await getUserRoleFromDB(payload.sub);
    
    if (!userRole.isUser) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Add user info to request
    req.user = {
      id: userRole.userId,
      email: userRole.email,
      role: userRole.role
    };
    req.clerkUserId = payload.sub; // Clerk user ID
    next();
  } catch (error) {
    console.error('Auth error:', error);
    
    return res.status(500).json({ 
      error: 'Authentication failed'    });
  }
}

export async function requireAdmin(req, res, next) {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check admin role
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    
    return res.status(500).json({ 
      error: 'Authorization failed'    });
  }
}
