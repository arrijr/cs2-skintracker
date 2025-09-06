// /backend/src/utils/roleHelpers.js (Backend)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get user role from database by Clerk user ID
 * This is the primary source of truth for roles
 */
export async function getUserRoleFromDB(clerkUserId) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true, email: true, role: true, clerkId: true }
    });
    
    if (!user) {
      return {
        isAdmin: false,
        isUser: false,
        role: null,
        email: null,
        userId: null
      };
    }
    
    return {
      isAdmin: user.role === 'admin',
      isUser: true,
      role: user.role || 'user',
      email: user.email,
      userId: user.id
    };
  } catch (error) {
    console.error('Error getting user role from DB:', error);
    return {
      isAdmin: false,
      isUser: false,
      role: null,
      email: null,
      userId: null
    };
  }
}

/**
 * Get user role from database by email
 * Fallback method when Clerk ID is not available
 */
export async function getUserRoleByEmail(email) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, role: true, clerkId: true }
    });
    
    if (!user) {
      return {
        isAdmin: false,
        isUser: false,
        role: null,
        email: null,
        userId: null
      };
    }
    
    return {
      isAdmin: user.role === 'admin',
      isUser: true,
      role: user.role || 'user',
      email: user.email,
      userId: user.id
    };
  } catch (error) {
    console.error('Error getting user role by email:', error);
    return {
      isAdmin: false,
      isUser: false,
      role: null,
      email: null,
      userId: null
    };
  }
}

/**
 * Check if user has admin privileges
 * Primary method for admin checks
 */
export async function isAdminUser(clerkUserId) {
  const userRole = await getUserRoleFromDB(clerkUserId);
  return userRole.isAdmin;
}

/**
 * Check if user has specific role
 */
export async function hasRole(clerkUserId, role) {
  const userRole = await getUserRoleFromDB(clerkUserId);
  return userRole.role === role;
}

/**
 * Middleware helper for role-based access control
 * Can be used in routes that need specific roles
 */
export function requireRole(role) {
  return async (req, res, next) => {
    try {
      const clerkUserId = req.auth?.userId;
      
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userRole = await getUserRoleFromDB(clerkUserId);
      
      if (!userRole.isUser) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      if (userRole.role !== role) {
        return res.status(403).json({ 
          error: `Access denied. Required role: ${role}` 
        });
      }
      
      // Add user info to request
      req.user = {
        id: userRole.userId,
        email: userRole.email,
        role: userRole.role,
        clerkId: clerkUserId
      };
      
      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({ error: 'Role verification failed' });
    }
  };
}

/**
 * Admin-only middleware helper
 */
export function requireAdmin() {
  return requireRole('admin');
}

/**
 * User-only middleware helper (any authenticated user)
 */
export function requireUser() {
  return async (req, res, next) => {
    try {
      const clerkUserId = req.auth?.userId;
      
      if (!clerkUserId) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      const userRole = await getUserRoleFromDB(clerkUserId);
      
      if (!userRole.isUser) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Add user info to request
      req.user = {
        id: userRole.userId,
        email: userRole.email,
        role: userRole.role,
        clerkId: clerkUserId
      };
      
      next();
    } catch (error) {
      console.error('User check error:', error);
      return res.status(500).json({ error: 'User verification failed' });
    }
  };
}

/**
 * Update user role in database
 * Admin-only operation
 */
export async function updateUserRole(userId, newRole) {
  try {
    const validRoles = ['admin', 'user'];
    
    if (!validRoles.includes(newRole)) {
      throw new Error(`Invalid role: ${newRole}. Valid roles: ${validRoles.join(', ')}`);
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
      select: { id: true, email: true, role: true, clerkId: true }
    });
    
    console.log(`[ROLE-UPDATE] User ${updatedUser.email} role updated to ${newRole}`);
    
    return {
      success: true,
      user: updatedUser
    };
  } catch (error) {
    console.error('Error updating user role:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get all users with their roles
 * Admin-only operation
 */
export async function getAllUsersWithRoles() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        clerkId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return {
      success: true,
      users: users.map(user => ({
        ...user,
        isAdmin: user.role === 'admin'
      }))
    };
  } catch (error) {
    console.error('Error getting users with roles:', error);
    return {
      success: false,
      error: error.message,
      users: []
    };
  }
}

/**
 * Role constants for consistency
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

/**
 * Valid roles array
 */
export const VALID_ROLES = Object.values(ROLES);

// Cleanup function
export async function cleanup() {
  await prisma.$disconnect();
}
