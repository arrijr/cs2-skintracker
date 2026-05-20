// /frontend/sentry.client.config.ts
// Browser-side Sentry init. Loads on every page in the App Router.
// Silent no-op when NEXT_PUBLIC_SENTRY_DSN is missing — dev + preview deploys
// won't crash if Sentry isn't provisioned.
import * as Sentry from "@sentry/nextjs";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA || "dev",

    // Free plan budget — keep traces low so we don't blow the quota
    tracesSampleRate: 0.1,

    // Session Replay (privacy-first defaults)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,

    // Noise we never want to see in the issues feed
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "NetworkError when attempting to fetch resource",
    ],

    // Strip PII / secrets out of every event before transport
    beforeSend(event) {
      try {
        // Scrub request headers
        if (event.request?.headers) {
          const h = event.request.headers as Record<string, string>;
          if (h.Authorization) h.Authorization = "[Filtered]";
          if (h.authorization) h.authorization = "[Filtered]";
          if (h.Cookie) h.Cookie = "[Filtered]";
          if (h.cookie) h.cookie = "[Filtered]";
        }

        // Scrub breadcrumbs (fetch / xhr / console) — drop Authorization headers
        // and any Clerk / Stripe identifiers we noticed.
        if (Array.isArray(event.breadcrumbs)) {
          for (const crumb of event.breadcrumbs) {
            const data = crumb?.data as Record<string, unknown> | undefined;
            if (!data) continue;
            if (data.Authorization) data.Authorization = "[Filtered]";
            if (data.authorization) data.authorization = "[Filtered]";
            // Strip Clerk session tokens that sometimes leak into URLs/bodies
            if (typeof data.url === "string") {
              data.url = (data.url as string).replace(/(__session=)[^&]+/g, "$1[Filtered]");
            }
            if (typeof data.body === "string" && /sk_(test|live)_/.test(data.body)) {
              data.body = "[Filtered]";
            }
          }
        }

        // Drop request bodies that look like Stripe webhook payloads or
        // contain Clerk tokens.
        if (typeof event.request?.data === "string") {
          if (/sk_(test|live)_|__session=|stripe-signature/i.test(event.request.data)) {
            event.request.data = "[Filtered]";
          }
        }

        // Extra contexts may include Stripe metadata — wipe it.
        if (event.contexts && "stripe" in event.contexts) {
          delete (event.contexts as Record<string, unknown>).stripe;
        }
      } catch {
        // Never let beforeSend throw — drop the event silently if scrubbing
        // fails so we don't lose error reporting itself.
      }
      return event;
    },
  });
}
