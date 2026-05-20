"use client";

/**
 * PostHogProvider — initializes PostHog once on the client, mirrors Clerk
 * identity into analytics, and fires manual pageviews on App Router route
 * changes.
 *
 * Behavior:
 *  - If NEXT_PUBLIC_POSTHOG_KEY is missing, `initAnalytics()` returns null
 *    and every downstream call no-ops. The provider stays mounted so the
 *    tree is identical between configured/unconfigured environments.
 *  - Identify on Clerk user load; reset on sign-out.
 *  - Pageviews fire on (pathname, searchParams) changes.
 */

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { analytics, initAnalytics } from "@/lib/analytics";

/**
 * Inner component that reads `useSearchParams()` — must be wrapped in a
 * Suspense boundary or Next 15 bails out of static generation for every
 * page in the tree (including framework pages like /_not-found).
 */
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const qs = searchParams?.toString();
    const fullPath = qs ? `${pathname}?${qs}` : pathname;
    analytics.page(fullPath);
  }, [pathname, searchParams]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const lastIdentifiedRef = useRef<string | null>(null);

  // 1. Init PostHog once on mount. PostHog inits in opt-out-by-default mode
  //    for GDPR; the cookie banner calls analytics.optIn() once the user
  //    accepts. If they previously accepted (localStorage), we replay that
  //    decision immediately after init so the SDK starts capturing.
  useEffect(() => {
    void initAnalytics().then(() => {
      if (analytics.hasConsent() === "accepted") {
        analytics.optIn();
      }
    });
  }, []);

  // 2. Identify / reset based on Clerk user state.
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && user) {
      if (lastIdentifiedRef.current === user.id) return;
      const traits: Record<string, unknown> = {};
      const email = user.primaryEmailAddress?.emailAddress;
      if (email) traits.email = email;
      if (user.firstName) traits.first_name = user.firstName;
      if (user.createdAt) traits.created_at = user.createdAt;

      analytics.identify(user.id, traits);
      lastIdentifiedRef.current = user.id;
    } else if (lastIdentifiedRef.current) {
      // User signed out — clear PostHog identity so the next session starts
      // anonymous.
      analytics.reset();
      lastIdentifiedRef.current = null;
    }
  }, [isLoaded, isSignedIn, user]);

  return (
    <>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </>
  );
}

export default PostHogProvider;
