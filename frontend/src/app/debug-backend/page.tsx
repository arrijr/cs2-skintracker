// frontend/src/app/debug-backend/page.tsx
//
// SSR-side diagnostic. NOT under /api so it bypasses the rewrite in
// next.config.ts. Runs in the Vercel serverless function — hits
// api.skintrackr.io directly + reports timing.

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DebugResult {
  ok?: boolean;
  status?: number;
  elapsedMs: number;
  bodyLength?: number;
  bodyPreview?: string;
  error?: string;
  errorName?: string;
  errorCause?: string;
  apiBase: string;
  url: string;
  envApiUrl: string | null;
  envApiOrigin: string | null;
  envSiteUrl: string | null;
  nodeEnv: string | null;
  vercelEnv: string | null;
  vercelRegion: string | null;
}

async function probeBackend(): Promise<DebugResult> {
  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ||
    (process.env.NODE_ENV === 'production' ? 'https://api.skintrackr.io' : 'http://localhost:5000');

  const url = `${API_BASE}/api/v1/skins/ak-47-redline-field-tested`;
  const startedAt = Date.now();

  const baseInfo = {
    apiBase: API_BASE,
    url,
    envApiUrl: process.env.NEXT_PUBLIC_API_URL ?? null,
    envApiOrigin: process.env.NEXT_PUBLIC_API_ORIGIN ?? null,
    envSiteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? null,
    nodeEnv: process.env.NODE_ENV ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelRegion: process.env.VERCEL_REGION ?? null,
  };

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    const elapsed = Date.now() - startedAt;
    const body = await res.text();
    return {
      ok: res.ok,
      status: res.status,
      elapsedMs: elapsed,
      bodyLength: body.length,
      bodyPreview: body.slice(0, 200),
      ...baseInfo,
    };
  } catch (e: unknown) {
    const err = e as Error & { cause?: unknown };
    return {
      ok: false,
      error: err.message,
      errorName: err.name,
      errorCause: String(err.cause ?? ''),
      elapsedMs: Date.now() - startedAt,
      ...baseInfo,
    };
  }
}

export default async function DebugBackendPage() {
  const result = await probeBackend();
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Backend Probe — SSR Diagnostic</h1>
      <pre className="bg-slate-900 p-4 rounded overflow-auto text-xs">
        {JSON.stringify(result, null, 2)}
      </pre>
    </main>
  );
}
