"use client";

// /frontend/src/app/global-error.tsx
// Next.js 15 global error boundary — catches errors thrown in the root layout
// (which `error.tsx` cannot reach). Per Sentry's Next.js guidance, we forward
// the error to Sentry on mount, then render a minimal fallback UI.
//
// Sentry.captureException is a no-op when the SDK isn't initialised, so this
// works without a DSN.

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        {/* `NextError` renders the default Next.js error page chrome. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
