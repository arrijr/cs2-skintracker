"use client";

/**
 * CookieBanner — GDPR-compliant cookie consent prompt.
 *
 * Shows a slate-themed banner at the bottom of the screen on first visit.
 * Two choices: "Accept analytics" (flips PostHog into capturing mode) or
 * "Essential only" (keeps PostHog opted out). Decision persists to
 * localStorage so the banner doesn't reappear.
 *
 * Essential cookies (auth via Clerk, currency preference, theme) are not
 * gated by this banner — they're required for the service to function and
 * fall under "necessary" under GDPR Art. 6(1)(b) (contract performance).
 *
 * Linked to /legal/privacy for full disclosure.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { analytics } from "@/lib/analytics";

export function CookieBanner() {
  // null = initial state, undefined while we haven't read localStorage yet.
  const [decision, setDecision] = useState<
    "accepted" | "declined" | null | undefined
  >(undefined);

  useEffect(() => {
    setDecision(analytics.hasConsent());
  }, []);

  // Still reading localStorage, or user already chose — render nothing.
  if (decision === undefined || decision !== null) return null;

  const accept = () => {
    analytics.optIn();
    setDecision("accepted");
  };

  const decline = () => {
    analytics.optOut();
    setDecision("declined");
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-3 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/95 p-5 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-slate-900/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex-1 text-sm text-slate-300">
            <p className="mb-1 font-medium text-slate-100">
              We respect your privacy.
            </p>
            <p className="leading-relaxed">
              Essential cookies (login, preferences) are always on. We&apos;d
              also like to use analytics cookies to understand what features
              matter so we can improve the product. No third-party advertising,
              no selling your data.{" "}
              <Link
                href="/legal/privacy"
                className="text-purple-400 underline-offset-2 hover:text-purple-300 hover:underline"
              >
                Privacy policy
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:w-44 sm:shrink-0">
            <button
              type="button"
              onClick={accept}
              className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-purple-400 hover:to-pink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              Accept analytics
            </button>
            <button
              type="button"
              onClick={decline}
              className="rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-600 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              Essential only
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieBanner;
