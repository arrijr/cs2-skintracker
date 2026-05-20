// /frontend/sentry.server.config.ts
// Server-side Sentry init for Next.js (RSC, route handlers, server actions).
// Silent no-op when SENTRY_DSN is missing.
import * as Sentry from "@sentry/nextjs";

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

    beforeSend(event) {
      try {
        if (event.request?.headers) {
          const h = event.request.headers as Record<string, string>;
          if (h.Authorization) h.Authorization = "[Filtered]";
          if (h.authorization) h.authorization = "[Filtered]";
          if (h.Cookie) h.Cookie = "[Filtered]";
          if (h.cookie) h.cookie = "[Filtered]";
        }

        if (Array.isArray(event.breadcrumbs)) {
          for (const crumb of event.breadcrumbs) {
            const data = crumb?.data as Record<string, unknown> | undefined;
            if (!data) continue;
            if (data.Authorization) data.Authorization = "[Filtered]";
            if (data.authorization) data.authorization = "[Filtered]";
            if (typeof data.url === "string") {
              data.url = (data.url as string).replace(/(__session=)[^&]+/g, "$1[Filtered]");
            }
            if (typeof data.body === "string" && /sk_(test|live)_/.test(data.body)) {
              data.body = "[Filtered]";
            }
          }
        }

        if (typeof event.request?.data === "string") {
          if (/sk_(test|live)_|__session=|stripe-signature/i.test(event.request.data)) {
            event.request.data = "[Filtered]";
          }
        }

        if (event.contexts && "stripe" in event.contexts) {
          delete (event.contexts as Record<string, unknown>).stripe;
        }
      } catch {
        // swallow scrubber errors — don't lose the event
      }
      return event;
    },
  });
}
