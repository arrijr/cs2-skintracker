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

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

/**
 * Hook to get current user role information.
 * isPremium is sourced from the backend (DB-backed) via useSubscription —
 * NOT from Clerk publicMetadata, so Stripe webhook updates are reflected
 * after a refresh without needing Clerk metadata sync.
 */
export function useUserRole(): UserRole {
  const { user, isLoaded } = useUser();
  const { tier, isLoading: subLoading } = useSubscription();
  const email =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress;
  // NOTE: unsafeMetadata is client-writable in the Clerk SDK — never trust it
  // for privilege decisions. Only publicMetadata (server-set) or env-allowlisted
  // emails grant admin.
  const isAdmin =
    user?.publicMetadata?.role === 'admin' ||
    ADMIN_EMAILS.includes(email || '');
  return {
    role: isAdmin ? 'admin' : (user ? 'user' : null),
    loading: !isLoaded || subLoading,
    isAdmin,
    isUser: !isAdmin && !!user,
    isPremium: tier === 'lite' || tier === 'pro',
  };
}
