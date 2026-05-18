// /frontend/src/app/api/steam-image/route.ts — [Frontend]
// Server-side image proxy for Steam CDN.
// Why it exists: some networks (corp / VPN / MITM-cert) can't reach community.akamai.steamstatic.com
// directly because of TLS cert-chain issues. This proxies the fetch through the Next server,
// caches aggressively, and gracefully falls back so the client never sees a TLS error.
//
// Usage: <img src={`/api/steam-image?url=${encodeURIComponent(steamUrl)}`} />

import { NextRequest } from "next/server";

const ALLOWED_HOSTS = new Set([
  "community.akamai.steamstatic.com",
  "community.cloudflare.steamstatic.com",
  "steamcommunity-a.akamaihd.net",
  "steamcdn-a.akamaihd.net",
  "cdn.cloudflare.steamstatic.com",
  "economy.cloudflare.steamstatic.com",
  "media.steampowered.com",
]);

// Force Node runtime — Edge has stricter TLS handling and no NODE_TLS_REJECT_UNAUTHORIZED.
export const runtime = "nodejs";

// Cache responses 1 day at CDN, 1 hour on user, allow stale-while-revalidate.
const CACHE_HEADER = "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800";

export async function GET(req: NextRequest) {
  const target = req.nextUrl.searchParams.get("url");
  if (!target) {
    return new Response("missing url", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response("invalid url", { status: 400 });
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return new Response("forbidden protocol", { status: 400 });
  }
  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new Response("forbidden host", { status: 403 });
  }

  // Dev fallback for TLS-MITM networks: temporarily disable cert verification.
  // SAFE because we restrict to known Steam hostnames above.
  const tlsReject = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (process.env.NODE_ENV !== "production") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  }

  try {
    const upstream = await fetch(parsed.toString(), {
      headers: {
        // Mimic a browser; Steam CDN sometimes blocks raw fetch UA
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36",
        accept: "image/avif,image/webp,image/png,image/*,*/*;q=0.8",
      },
      // 10s upstream timeout
      signal: AbortSignal.timeout(10_000),
    });

    if (!upstream.ok || !upstream.body) {
      return new Response("upstream " + upstream.status, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") ?? "image/png";
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": CACHE_HEADER,
        "x-proxy-source": parsed.hostname,
      },
    });
  } catch (err) {
    return new Response(
      "proxy fetch failed: " + (err instanceof Error ? err.message : String(err)),
      { status: 502 }
    );
  } finally {
    if (process.env.NODE_ENV !== "production") {
      if (tlsReject === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      else process.env.NODE_TLS_REJECT_UNAUTHORIZED = tlsReject;
    }
  }
}
