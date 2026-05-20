// /frontend/sentry.edge.config.ts
// Edge runtime Sentry init — for middleware and any route handler that uses
// `export const runtime = "edge"`. Silent no-op without SENTRY_DSN.
import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./sentry.scrubber";

const DSN = process.env.SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA || "dev",

    tracesSampleRate: 0.1,

    // Replay is browser-only — kept declared for parity / future-proofing
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.1,

    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "NetworkError when attempting to fetch resource",
    ],

    beforeSend(event, hint) {
      return scrubEvent(event, hint);
    },
  });
}
