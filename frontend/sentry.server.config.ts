// /frontend/sentry.server.config.ts
// Server-side Sentry init for Next.js (RSC, route handlers, server actions).
// Silent no-op when SENTRY_DSN is missing.
import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./sentry.scrubber";

const DSN = process.env.SENTRY_DSN;

if (DSN) {
  Sentry.init({
    dsn: DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",
    release: process.env.VERCEL_GIT_COMMIT_SHA || "dev",

    tracesSampleRate: 0.1,

    // Session Replay only ships on the client — keep defaults explicit anyway
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
