import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function adminAuth(req, res, next) {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid token' });
      }
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      throw jwtError;
    }
    
    // Get user with role
    let user;
    try {
      user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, role: true }
      });
    } catch (dbError) {
      console.error('Database error in admin auth:', dbError);
      return res.status(500).json({ error: 'Database connection failed' });
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
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    
    // Return a more graceful error response
    return res.status(500).json({ 
      error: 'Authentication failed',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
}
