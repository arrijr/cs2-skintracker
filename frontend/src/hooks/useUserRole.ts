// /frontend/src/hooks/useUserRole.ts (Frontend)
"use client";

import { useUser } from "@clerk/nextjs";
import { useSubscription } from "./useSubscription";

interface UserRole {
  role: 'admin' | 'user' | null;
  loading: boolean;
  isAdmin: boolean;
  isUser: boolean;
  isPremium: boolean;
}

const ADMIN_EMAILS = ['admin@example.com', 'arthur@example.com'];

/**
 * Hook to get current user role information.
 * isPremium is sourced from the backend (DB-backed) via useSubscription —
 * NOT from Clerk publicMetadata, so Stripe webhook updates are reflected
 * after a refresh without needing Clerk metadata sync.
 */
export function useUserRole(): UserRole {
  const { user, isLoaded } = useUser();
  const { tier } = useSubscription();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;
  const isAdmin =
    user?.publicMetadata?.role === 'admin' ||
    user?.unsafeMetadata?.role === 'admin' ||
    ADMIN_EMAILS.includes(email || '');
  return {
    role: isAdmin ? 'admin' : (user ? 'user' : null),
    loading: !isLoaded,
    isAdmin,
    isUser: !isAdmin && !!user,
    isPremium: tier === 'lite' || tier === 'pro',
  };
}
