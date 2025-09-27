// /frontend/src/hooks/useUserRole.ts (Frontend)
"use client";

import { useUser } from "@clerk/nextjs";
import { useMemo } from "react";
import { getUserRole, UserRole } from "@/utils/roles";

/**
 * Hook to get current user role information
 * Returns role data and loading state
 */
export function useUserRole(): { 
  role: UserRole | null; 
  loading: boolean; 
  isAdmin: boolean; 
  isUser: boolean; 
  isPremium: boolean; 
} {
  const { user, isLoaded } = useUser();
  
  const role = useMemo(() => {
    if (!isLoaded || !user) {
      return null;
    }
    
    return getUserRole(user);
  }, [isLoaded, user]);
  
  return {
    role,
    loading: !isLoaded,
    isAdmin: role?.isAdmin ?? false,
    isUser: role?.isUser ?? false,
    isPremium: role?.isPremium ?? false
  };
}
