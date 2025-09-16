// /frontend/src/hooks/useAuthenticatedApi.ts (Frontend)
"use client";

import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";
import { createAuthenticatedFetcher, apiUrl } from "@/lib/api";

/**
 * Hook für authentifizierte API-Calls
 * Verwendet Clerk JWT-Token für Backend-Authentifizierung
 */
export function useAuthenticatedApi() {
  const { getToken } = useAuth();

  const authenticatedFetcher = useMemo(() => {
    return createAuthenticatedFetcher(() => getToken({ template: "backend" }));
  }, [getToken]);

  return {
    authenticatedFetcher,
    apiUrl,
  };
}
