// /frontend/src/utils/roles.ts (Frontend)
import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";

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
 * Hook to get user role information from Clerk
 * Uses DB-first approach: checks user.role from database via API
 * Falls back to Clerk metadata and email whitelist
 */
export function useUserRole(): UserRole {
  const { user, isLoaded } = useUser();
  
  return useMemo(() => {
    if (!isLoaded || !user) {
      return {
        isAdmin: false,
        isUser: false,
        role: null,
        email: null
      };
    }

    const email = user.emailAddresses?.[0]?.emailAddress || null;
    const clerkRole = user.publicMetadata?.role as string | undefined;
    
    // Primary: Check if user has admin role in Clerk metadata
    const isAdminFromMetadata = clerkRole === 'admin';
    
    // Fallback: Check email whitelist
    const isAdminFromEmail = email ? ADMIN_EMAILS.includes(email) : false;
    
    const isAdmin = isAdminFromMetadata || isAdminFromEmail;
    
    return {
      isAdmin,
      isUser: true,
      role: isAdmin ? 'admin' : 'user',
      email
    };
  }, [user, isLoaded]);
}

/**
 * Server-side role check (for use in server components)
 * This should be used sparingly as it requires API calls
 */
export async function checkUserRoleServerSide(userId: string): Promise<UserRole> {
  try {
    // This would make an API call to get user role from database
    // For now, return basic info - this should be implemented with a proper API endpoint
    return {
      isAdmin: false,
      isUser: true,
      role: 'user',
      email: null
    };
  } catch (error) {
    console.error('Error checking user role server-side:', error);
    return {
      isAdmin: false,
      isUser: false,
      role: null,
      email: null
    };
  }
}

/**
 * Client-side role check with database verification
 * Makes API call to verify role from database
 */
export async function checkUserRoleFromDB(): Promise<UserRole> {
  try {
    const { apiFetch } = await import('@/lib/http');
    const response = await apiFetch('/api/v1/users/me/role');
    
    if (response.ok) {
      return {
        isAdmin: response.role === 'admin',
        isUser: true,
        role: response.role,
        email: response.email
      };
    }
    
    // Fallback to Clerk metadata if API fails
    return {
      isAdmin: false,
      isUser: true,
      role: 'user',
      email: null
    };
  } catch (error) {
    console.error('Error checking user role from DB:', error);
    return {
      isAdmin: false,
      isUser: false,
      role: null,
      email: null
    };
  }
}

/**
 * Utility function to check if user has admin privileges
 * Can be used in components without hooks
 */
export function isAdminUser(user: any): boolean {
  if (!user) return false;
  
  const email = user.emailAddresses?.[0]?.emailAddress;
  const clerkRole = user.publicMetadata?.role;
  
  return clerkRole === 'admin' || (email ? ADMIN_EMAILS.includes(email) : false);
}

/**
 * Utility function to check if user has specific role
 */
export function hasRole(user: any, role: string): boolean {
  if (!user) return false;
  
  const userRole = user.publicMetadata?.role;
  return userRole === role;
}

/**
 * Role-based component wrapper
 * Shows children only if user has required role
 */
export function RequireRole({ 
  children, 
  role, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  role: string; 
  fallback?: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  
  if (!isLoaded) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <>{fallback}</>;
  }
  
  const hasRequiredRole = hasRole(user, role);
  
  return hasRequiredRole ? <>{children}</> : <>{fallback}</>;
}

/**
 * Admin-only component wrapper
 * Shows children only if user is admin
 */
export function RequireAdmin({ 
  children, 
  fallback = null 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode;
}) {
  return <RequireRole role="admin" fallback={fallback}>{children}</RequireRole>;
}

/**
 * Role constants for consistency
 */
export const ROLES = {
  ADMIN: 'admin',
  USER: 'user'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];
