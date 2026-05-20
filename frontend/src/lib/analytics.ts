/**
 * Analytics wrapper around posthog-js.
 *
 * Design goals:
 *  - Typed event names + payloads (discriminated union) so we can't typo events.
 *  - Safe no-op when NEXT_PUBLIC_POSTHOG_KEY is missing (dev/preview builds
 *    must not crash if PostHog isn't provisioned yet).
 *  - Respect Do-Not-Track on init.
 *  - Never throw, never log noisy errors.
 *
 * Init happens in `PostHogProvider` — this module exposes the helpers.
 */
import type { PostHog } from "posthog-js";

// --- Event taxonomy ---------------------------------------------------------

export type AnalyticsEvent =
  | { name: "signup_completed"; properties?: { method?: string } }
  | {
      name: "onboarding_step_completed";
      properties: { step: 1 | 2 | 3; skipped?: boolean };
    }
  | { name: "onboarding_completed"; properties?: Record<string, unknown> }
  | { name: "steam_connect_started"; properties?: { source?: string } }
  | { name: "steam_connect_completed"; properties?: Record<string, unknown> }
  | {
      name: "portfolio_first_item_added";
      properties: { source: "manual" | "steam_import" };
    }
  | {
      name: "alert_created";
      properties: {
        type: string;
        channels: string[];
        skinId?: number | null;
      };
    }
  | {
      name: "alert_triggered";
      properties: { alertId: number; type: string };
    }
  | { name: "pricing_page_viewed"; properties?: Record<string, unknown> }
  | {
      name: "checkout_started";
      properties: {
        tier: "lite" | "pro";
        billing?: "monthly" | "annual";
      };
    }
  | {
      name: "subscription_created";
      properties: { tier: string; amount: number; currency: string };
    }
  | { name: "subscription_canceled"; properties?: Record<string, unknown> }
  | { name: "subscription_reactivated"; properties?: Record<string, unknown> }
  | { name: "csv_export_used"; properties?: Record<string, unknown> }
  | {
      name: "affiliate_click";
      properties: { skin?: string; source?: string };
    }
  | { name: "extension_installed"; properties?: Record<string, unknown> }
  // Sprint 2 SEO events — fired from programmatic skin/weapon/case landing pages.
  | {
      name: "seo_landing_viewed";
      properties: { skinSlug: string; weaponSlug: string };
    }
  | {
      name: "seo_internal_link_clicked";
      properties: { from: string; to: string };
    };

export type AnalyticsEventName = AnalyticsEvent["name"];

// --- Internal state ---------------------------------------------------------

let posthogInstance: PostHog | null = null;
let initPromise: Promise<PostHog | null> | null = null;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getKey(): string | undefined {
  return process.env.NEXT_PUBLIC_POSTHOG_KEY;
}

function getHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";
}

/**
 * Initialize PostHog once. Returns the instance, or null if PostHog is
 * disabled (missing key, server-side, or load error).
 *
 * Safe to call multiple times — second call is a no-op.
 */
export async function initAnalytics(): Promise<PostHog | null> {
  if (!isBrowser()) return null;
  if (!getKey()) return null;
  if (posthogInstance) return posthogInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Dynamic import keeps posthog-js out of the SSR bundle.
      const mod = await import("posthog-js");
      const posthog = mod.default;

      posthog.init(getKey() as string, {
        api_host: getHost(),
        // Respect Do-Not-Track on the user's browser.
        respect_dnt: true,
        // GDPR: start opted-out, require explicit consent via cookie banner
        // before any events are captured or cookies are written. Banner
        // calls analytics.optIn() / .optOut() to flip this.
        opt_out_capturing_by_default: true,
        // Capture pageviews manually — App Router doesn't auto-fire them.
        capture_pageview: false,
        autocapture: true,
        person_profiles: "identified_only",
        loaded: (ph) => {
          if (
            typeof navigator !== "undefined" &&
            navigator.doNotTrack === "1"
          ) {
            try {
              ph.opt_out_capturing();
            } catch {
              // Swallow — we'll just no-op everything downstream.
            }
          }
        },
      });

      posthogInstance = posthog;
      return posthog;
    } catch {
      return null;
    }
  })();

  return initPromise;
}

/**
 * Synchronously read the instance if it's been initialized. Returns null
 * otherwise. Used by the helpers below so we don't await for fire-and-forget.
 */
function ph(): PostHog | null {
  return posthogInstance;
}

// --- Public API -------------------------------------------------------------

export const analytics = {
  /**
   * Tie subsequent events to a Clerk user.
   */
  identify(userId: string, traits?: Record<string, unknown>): void {
    if (!getKey()) return;
    try {
      ph()?.identify(userId, traits);
    } catch {
      // never throw from analytics
    }
  },

  /**
   * Clear the identified user (call on sign-out).
   */
  reset(): void {
    if (!getKey()) return;
    try {
      ph()?.reset();
    } catch {
      // ignore
    }
  },

  /**
   * Fire a typed event.
   *
   * Pass a discriminated event object (`{ name, properties }`) for full
   * type-checking on the payload, or a `(name, properties)` pair for
   * codepaths where TS narrowing is inconvenient.
   */
  track(
    eventOrName: AnalyticsEvent | AnalyticsEventName,
    properties?: Record<string, unknown>
  ): void {
    if (!getKey()) return;
    try {
      if (typeof eventOrName === "string") {
        ph()?.capture(eventOrName, properties);
      } else {
        ph()?.capture(
          eventOrName.name,
          (eventOrName as { properties?: Record<string, unknown> }).properties
        );
      }
    } catch {
      // ignore
    }
  },

  /**
   * Manually fire a pageview. App Router doesn't auto-track navigations,
   * so the provider hooks `usePathname` + `useSearchParams` and calls this.
   */
  page(path: string, properties?: Record<string, unknown>): void {
    if (!getKey()) return;
    try {
      ph()?.capture("$pageview", { $current_url: path, ...properties });
    } catch {
      // ignore
    }
  },

  /**
   * Cookie-consent: user accepted analytics. Flips PostHog into capturing
   * mode and writes a persistent flag the banner reads on revisit.
   */
  optIn(): void {
    if (!getKey()) return;
    try {
      ph()?.opt_in_capturing();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("cookie-consent", "accepted");
      }
    } catch {
      // ignore
    }
  },

  /**
   * Cookie-consent: user declined analytics. Stays opted-out and writes
   * the persistent flag so we don't ask again on every visit.
   */
  optOut(): void {
    if (!getKey()) return;
    try {
      ph()?.opt_out_capturing();
      if (typeof window !== "undefined") {
        window.localStorage.setItem("cookie-consent", "declined");
      }
    } catch {
      // ignore
    }
  },

  /**
   * Read persisted consent decision. Returns:
   *  - 'accepted' — user clicked accept; analytics enabled
   *  - 'declined' — user clicked decline; analytics disabled
   *  - null      — never asked; banner should be shown
   */
  hasConsent(): "accepted" | "declined" | null {
    if (typeof window === "undefined") return null;
    const v = window.localStorage.getItem("cookie-consent");
    if (v === "accepted" || v === "declined") return v;
    return null;
  },
};

export type Analytics = typeof analytics;
