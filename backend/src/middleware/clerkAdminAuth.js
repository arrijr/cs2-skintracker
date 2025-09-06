// /backend/src/middleware/clerkAdminAuth.js (Backend)
import { verifyToken } from '@clerk/backend';

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
    
    // Check if user exists in our database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { email: payload.email },
        select: { id: true, email: true, role: true }
      });
    } catch (dbError) {
      console.error('Database error in admin auth:', dbError);
      return res.status(500).json({ error: 'Database connection failed' });
    } finally {
      await prisma.$disconnect();
    }

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Check admin role
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Add user info to request
    req.user = user;
    req.clerkUserId = payload.sub; // Clerk user ID
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
}
