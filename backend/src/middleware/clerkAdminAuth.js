// /backend/src/middleware/clerkAdminAuth.js (Backend)
import { verifyToken } from '@clerk/backend';
import { getUserRoleFromDB } from '../utils/roleHelpers.js';

export default async function clerkAdminAuth(req, res, next) {
  try {
    // Get token from Authorization header
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

    // Check admin role using centralized helper
    if (!userRole.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
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
    console.error('Admin auth error:', error);
    
    return res.status(500).json({ 
      error: 'Authentication failed'    });
  }
}
