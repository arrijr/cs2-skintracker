// /frontend/src/utils/roles.ts (Frontend)

import { safeLower } from "@/lib/strings";

// Types for role management
export interface UserRole {
  isAdmin: boolean;
  isUser: boolean;
  role: string | null;
  email: string | null;
}

// Admin email whitelist (fallback for development/testing)
const ADMIN_EMAILS = [
  'admin@example.com',
  'test@test.de',
  'arthur@example.com' // Add your admin email here
];

/**
 * Get user role information from Clerk user object
 * @param user - Clerk user object
 * @returns UserRole object with role information
 */
export function getUserRole(user: any): UserRole {
  if (!user) {
    return {
      isAdmin: false,
      isUser: false,
      role: null,
      email: null
    };
  }

  const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
  const isAdmin = user.publicMetadata?.role === 'admin' || 
                  user.unsafeMetadata?.role === 'admin' ||
                  ADMIN_EMAILS.includes(email || '');

  return {
    isAdmin,
    isUser: !isAdmin,
    role: isAdmin ? 'admin' : 'user',
    email
  };
}

/**
 * Check if user has specific role
 * @param user - Clerk user object
 * @param requiredRole - Role to check for
 * @returns boolean indicating if user has the role
 */
export function hasRole(user: any, requiredRole: string): boolean {
  const userRole = getUserRole(user);
  
  switch (safeLower(requiredRole)) {
    case 'admin':
      return userRole.isAdmin;
    case 'user':
      return userRole.isUser;
    default:
      return userRole.role === requiredRole;
  }
}

/**
 * Check if user is admin
 * @param user - Clerk user object
 * @returns boolean indicating if user is admin
 */
export function isAdmin(user: any): boolean {
  return hasRole(user, 'admin');
}

/**
 * Check if user is regular user
 * @param user - Clerk user object
 * @returns boolean indicating if user is regular user
 */
export function isUser(user: any): boolean {
  return hasRole(user, 'user');
}

/**
 * Get current user from Clerk (utility function)
 * @returns current user or null
 */
export function getCurrentUser(): any {
  // This will be implemented in a separate React component file
  return null;
}