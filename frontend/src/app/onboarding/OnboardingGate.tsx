"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { apiUrl } from "@/lib/api";

/**
 * Mounts inside the landing page (`/`).
 *
 * When a signed-in user lands here without an `onboardingCompletedAt`
 * timestamp on their profile, push them to `/onboarding`. Anyone else
 * (signed-out, or signed-in + already onboarded) just sees the landing.
 *
 * Renders nothing. Intentionally narrow scope — DO NOT extend to other
 * pages: arbitrary auto-redirects are confusing. Only the landing page +
 * the post-signup flow should route into onboarding.
 */
export function OnboardingGate() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || checked) return;

    let cancelled = false;
    (async () => {
      try {
        const token = await getToken({ template: "backend" });
        const res = await fetch(apiUrl("/api/v1/users/me"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          // Don't trap the user on landing — server errors here mean we
          // can't decide their onboarding state, so just let them see the
          // landing and they can navigate to /dashboard manually if needed.
          console.warn("[OnboardingGate] /users/me failed", res.status);
          return;
        }
        const data = await res.json();
        if (cancelled) return;

        if (!data?.onboardingCompletedAt) {
          router.replace("/onboarding");
          return;
        }
        // Onboarded user landing on `/` while signed in — send to dashboard,
        // which matches the "post-signin destination" convention used across
        // the app.
        router.replace("/dashboard");
      } catch (err) {
        // Network or parse failure — leave user on landing.
        console.warn("[OnboardingGate] gate check failed", err);
      } finally {
        if (!cancelled) setChecked(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, checked, getToken, router]);

  return null;
}
