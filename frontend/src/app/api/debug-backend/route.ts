// frontend/src/app/api/debug-backend/route.ts
//
// One-off Vercel-side diagnostic. Runs in the Vercel serverless function
// runtime, hits api.skintrackr.io directly, reports timing + error.
// Removable after debugging SSR hang.

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://api.skintrackr.io' : 'http://localhost:5000');

  const url = `${API_BASE}/api/v1/skins/ak-47-redline-field-tested`;
  const startedAt = Date.now();

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    const elapsed = Date.now() - startedAt;
    const body = await res.text();
    return NextResponse.json({
      ok: res.ok,
      status: res.status,
      elapsedMs: elapsed,
      bodyLength: body.length,
      bodyPreview: body.slice(0, 200),
      apiBase: API_BASE,
      url,
      envApiUrl: process.env.NEXT_PUBLIC_API_URL ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      vercelRegion: process.env.VERCEL_REGION ?? null,
    });
  } catch (e: unknown) {
    const err = e as Error & { cause?: unknown };
    return NextResponse.json({
      ok: false,
      error: err.message,
      errorName: err.name,
      errorCause: String(err.cause ?? ''),
      elapsedMs: Date.now() - startedAt,
      apiBase: API_BASE,
      url,
      envApiUrl: process.env.NEXT_PUBLIC_API_URL ?? null,
      nodeEnv: process.env.NODE_ENV ?? null,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      vercelRegion: process.env.VERCEL_REGION ?? null,
    });
  }
}
