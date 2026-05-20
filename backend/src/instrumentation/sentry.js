// /backend/src/instrumentation/sentry.js
//
// Sentry init for the Express backend.
//
// Contract:
//   • If SENTRY_DSN is missing → export a no-op shim. The app keeps running,
//     no crashes, no network calls. Dev + preview deploys without a DSN
//     behave as if Sentry were never installed.
//   • Otherwise → initialise @sentry/node, scrub Authorization headers /
//     Stripe webhook bodies / Clerk session tokens out of every event
//     before it's transported.
//
// IMPORTANT: this module MUST be imported and `initSentry()` called BEFORE
// any route registration in app.js so the SDK can patch HTTP / Express
// before requests are handled.

import * as Sentry from "@sentry/node";

const DSN = process.env.SENTRY_DSN;

let initialized = false;

/**
 * `beforeSend` hook — strips PII / secrets from every event before transport.
 * Defensive: any throw inside scrubbing returns the event unmodified so we
 * never drop error reporting itself.
 */
function scrubEvent(event) {
  try {
    // Request headers — Authorization + cookies leak Clerk session tokens
    if (event.request?.headers) {
      const h = event.request.headers;
      if (h.Authorization) h.Authorization = "[Filtered]";
      if (h.authorization) h.authorization = "[Filtered]";
      if (h.Cookie) h.Cookie = "[Filtered]";
      if (h.cookie) h.cookie = "[Filtered]";
      if (h["stripe-signature"]) h["stripe-signature"] = "[Filtered]";
    }

    // Drop Stripe webhook bodies wholesale — they contain customer + payment
    // metadata that we never want in Sentry.
    if (typeof event.request?.url === "string" && /\/subscriptions\/webhook/i.test(event.request.url)) {
      if (event.request.data !== undefined) {
        event.request.data = "[Filtered: stripe webhook body]";
      }
    }

    // If a request body got captured and contains Stripe / Clerk secret
    // material, redact it.
    if (typeof event.request?.data === "string") {
      if (/sk_(test|live)_|whsec_|__session=|stripe-signature/i.test(event.request.data)) {
        event.request.data = "[Filtered]";
      }
    }

    // Scrub breadcrumb data (outgoing fetches, db queries, console)
    if (Array.isArray(event.breadcrumbs)) {
      for (const crumb of event.breadcrumbs) {
        const data = crumb?.data;
        if (!data) continue;
        if (data.Authorization) data.Authorization = "[Filtered]";
        if (data.authorization) data.authorization = "[Filtered]";
        if (typeof data.url === "string") {
          data.url = data.url.replace(/(__session=)[^&]+/g, "$1[Filtered]");
        }
        if (typeof data.body === "string" && /sk_(test|live)_|whsec_/.test(data.body)) {
          data.body = "[Filtered]";
        }
      }
    }

    // Stripe context, if any tool added one
    if (event.contexts && "stripe" in event.contexts) {
      delete event.contexts.stripe;
    }
  } catch {
    // Never let scrubbing throw — drop silently and keep the event.
  }
  return event;
}

/**
 * Initialise Sentry. Idempotent — safe to call twice.
 * No-op when SENTRY_DSN is unset.
 */
export function initSentry() {
  if (initialized) return;
  if (!DSN) {
    // No-op path. We still mark initialised so the shim doesn't keep checking.
    initialized = true;
    return;
  }

  Sentry.init({
    dsn: DSN,
    environment: process.env.NODE_ENV || "development",
    release: process.env.RENDER_GIT_COMMIT || "dev",

    // Free plan budget
    tracesSampleRate: 0.1,

    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "Non-Error promise rejection captured",
      "NetworkError when attempting to fetch resource",
    ],

    beforeSend: scrubEvent,
  });

  initialized = true;
}

/**
 * Whether Sentry is actually live (DSN present + init succeeded). Useful
 * for guards in app.js.
 */
export function isSentryEnabled() {
  return Boolean(DSN);
}

/**
 * Re-export the Sentry namespace so callers can do
 * `import { Sentry } from "./instrumentation/sentry.js"` and call
 * `Sentry.setupExpressErrorHandler(app)` etc. When the DSN is missing,
 * @sentry/node's methods are themselves no-ops, so passing them through
 * directly is safe.
 */
export { Sentry };
