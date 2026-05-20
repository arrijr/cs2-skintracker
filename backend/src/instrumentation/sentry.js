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
const SENSITIVE_HEADER_KEYS = [
  "authorization",
  "cookie",
  "set-cookie",
  "stripe-signature",
  "clerk-auth",
  "x-clerk-auth",
];

const TOKEN_PATTERNS = [
  /(__session)=[^&\s;]+/g,
  /(__client)=[^&\s;]+/g,
  /(__clerk_[a-z0-9_]+)=[^&\s;]+/gi,
  /(sk_(?:test|live)_[A-Za-z0-9]+)/g,
  /(whsec_[A-Za-z0-9]+)/g,
];

function scrubString(input) {
  let out = input;
  for (const re of TOKEN_PATTERNS) {
    out = out.replace(re, (_match, group1) => `${group1 ?? ""}[Filtered]`);
  }
  return out;
}

function scrubEvent(event) {
  try {
    // 1. Request headers — case-insensitive sweep
    if (event.request?.headers) {
      const h = event.request.headers;
      for (const key of Object.keys(h)) {
        if (SENSITIVE_HEADER_KEYS.includes(key.toLowerCase())) {
          h[key] = "[Filtered]";
        }
      }
    }

    // 2. Drop Stripe webhook bodies wholesale — they contain customer +
    //    payment metadata we never want in Sentry.
    if (typeof event.request?.url === "string") {
      event.request.url = scrubString(event.request.url);
      if (/\/subscriptions\/webhook/i.test(event.request.url)) {
        if (event.request.data !== undefined) {
          event.request.data = "[Filtered: stripe webhook body]";
        }
      }
    }

    // 3. Request body (string only) — scrub token patterns inline
    if (typeof event.request?.data === "string") {
      event.request.data = scrubString(event.request.data);
    }

    // 4. Breadcrumbs (fetch, db, console)
    if (Array.isArray(event.breadcrumbs)) {
      for (const crumb of event.breadcrumbs) {
        const data = crumb?.data;
        if (!data) continue;
        for (const key of Object.keys(data)) {
          if (SENSITIVE_HEADER_KEYS.includes(key.toLowerCase())) {
            data[key] = "[Filtered]";
          }
        }
        if (typeof data.url === "string") {
          data.url = scrubString(data.url);
        }
        if (typeof data.body === "string") {
          data.body = scrubString(data.body);
        }
      }
    }

    // 5. Drop Stripe context
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
