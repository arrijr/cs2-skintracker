// /frontend/instrumentation.ts
// Next.js 15 calls `register()` once per runtime (nodejs + edge). Loads the
// matching Sentry config file so server-side errors are captured.
// See: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Required for Sentry to capture React Server Component render errors in
// Next.js 15. Re-export the hook from @sentry/nextjs; it no-ops when the
// SDK isn't initialised.
export { captureRequestError as onRequestError } from "@sentry/nextjs";
