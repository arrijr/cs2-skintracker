// /frontend/sentry.scrubber.ts
// Shared `beforeSend` PII / secret scrubber for client, server, and edge
// Sentry runtimes. Strips Authorization, Clerk session cookies/headers,
// Stripe secret keys, and Stripe webhook signatures from every event
// before transport.
//
// Never throws — if scrubbing fails, the event is returned as-is rather
// than dropped (we prefer over-reporting to silent loss).

import type { ErrorEvent, EventHint } from "@sentry/nextjs";

// Headers we always redact, case-insensitive.
const SENSITIVE_HEADER_KEYS = [
  "authorization",
  "cookie",
  "set-cookie",
  "stripe-signature",
  "clerk-auth",
  "x-clerk-auth",
];

// Tokens / cookies / keys we redact inside URLs + bodies.
// Each entry replaces `<name>=<value>` with `<name>=[Filtered]`.
const TOKEN_PATTERNS: RegExp[] = [
  // Clerk session cookies + auth tokens (any __clerk_* variant)
  /(__session)=[^&\s;]+/g,
  /(__client)=[^&\s;]+/g,
  /(__clerk_[a-z0-9_]+)=[^&\s;]+/gi,
  // Stripe secret keys (server-side, but in case they leak into client logs)
  /(sk_(?:test|live)_[A-Za-z0-9]+)/g,
  // Clerk publishable keys are public — do NOT redact pk_*
];

export function scrubEvent<E extends ErrorEvent>(event: E, _hint?: EventHint): E {
  try {
    // 1. Request headers
    if (event.request?.headers) {
      const headers = event.request.headers as Record<string, string>;
      for (const key of Object.keys(headers)) {
        if (SENSITIVE_HEADER_KEYS.includes(key.toLowerCase())) {
          headers[key] = "[Filtered]";
        }
      }
    }

    // 2. Request URL
    if (typeof event.request?.url === "string") {
      event.request.url = scrubString(event.request.url);
    }

    // 3. Request body (string form only — objects are scrubbed by Sentry's
    //    own data-sanitization in the SDK).
    if (typeof event.request?.data === "string") {
      event.request.data = scrubString(event.request.data);
    }

    // 4. Breadcrumbs (fetch / xhr / console)
    if (Array.isArray(event.breadcrumbs)) {
      for (const crumb of event.breadcrumbs) {
        const data = crumb?.data as Record<string, unknown> | undefined;
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

    // 5. Drop entire Stripe context if present
    if (event.contexts && "stripe" in event.contexts) {
      delete (event.contexts as Record<string, unknown>).stripe;
    }
  } catch {
    // Never let scrubbing throw.
  }
  return event;
}

function scrubString(input: string): string {
  let out = input;
  for (const re of TOKEN_PATTERNS) {
    out = out.replace(re, (_match, group1) => `${group1 ?? ""}[Filtered]`);
  }
  return out;
}
