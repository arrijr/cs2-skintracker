// /frontend/src/app/hooks/useRequireAuth.ts
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

/**
 * A hook to protect a page from unauthenticated access.
 * It redirects to the /sign-in page if the user is not logged in.
 */
export function useRequireAuth() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    // isLoaded === false: Clerk is still loading, do nothing.
    // user exists: user is logged in, do nothing.
    // isLoaded === true && !user: user is confirmed to be not logged in, redirect.
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [isLoaded, user, router]);
}
