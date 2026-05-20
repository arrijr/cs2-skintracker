// /frontend/sentry.client.config.ts
// Browser-side Sentry init. Loads on every page in the App Router.
// Silent no-op when NEXT_PUBLIC_SENTRY_DSN is missing — dev + preview deploys
// won't crash if Sentry isn't provisioned.
import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./sentry.scrubber";

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

    // Strip PII / secrets out of every event before transport.
    // Shared helper covers Authorization, Cookie, Stripe-Signature, Clerk
    // session cookies (`__session`, `__client`, `__clerk_*`), and Stripe
    // secret keys (`sk_test_*`, `sk_live_*`) in URLs + bodies + breadcrumbs.
    beforeSend(event, hint) {
      return scrubEvent(event, hint);
    },
  });
}
