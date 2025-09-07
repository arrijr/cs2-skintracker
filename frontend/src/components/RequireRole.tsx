// /frontend/src/components/RequireRole.tsx (Frontend)
"use client";

import { useUser } from "@clerk/nextjs";
import { hasRole } from "@/utils/roles";

interface RequireRoleProps {
  children: React.ReactNode;
  role: string;
  fallback?: React.ReactNode;
}

/**
 * Role-based component wrapper
 * Shows children only if user has required role
 */
export function RequireRole({ 
  children, 
  role, 
  fallback = null 
}: RequireRoleProps) {
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
