// /frontend/src/app/hooks/useRequireAuth.ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

/**
 * A hook to protect a page from unauthenticated access.
 * It redirects to the /login page if the user is not logged in.
 */
export function useRequireAuth() {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // token === undefined: initial loading state from AuthContext, do nothing.
    // token === '...': user is logged in, do nothing.
    // token === null: user is confirmed to be not logged in, redirect.
    if (token === null) {
      router.push("/login");
    }
  }, [token, router]);
}
