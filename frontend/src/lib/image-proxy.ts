// Steam CDN images don't always load directly on networks with TLS-MITM (corp / VPN / dev).
// Wrap Steam URLs through our /api/steam-image proxy so they always render.

const STEAM_HOSTS = [
  "community.akamai.steamstatic.com",
  "community.cloudflare.steamstatic.com",
  "steamcommunity-a.akamaihd.net",
  "steamcdn-a.akamaihd.net",
  "cdn.cloudflare.steamstatic.com",
  "economy.cloudflare.steamstatic.com",
  "media.steampowered.com",
];

/**
 * Detect bogus Steam URLs the backend may have seeded with placeholder slugs.
 * Real Steam economy URLs look like `/economy/image/{long_base64_hash}` (no `/class/`).
 * Fake URLs from older seed data have shape `/economy/image/class/730/{slug}` — they 404.
 */
function isBogusSteamUrl(url: string): boolean {
  return /\/economy\/image\/class\/730\//.test(url);
}

/**
 * Returns the URL routed through our proxy, OR null if the URL is known-bad
 * (caller should fall back to a placeholder).
 *
 * - null/empty input → null
 * - bogus `class/730/{slug}` pseudo-URLs → null (don't even try)
 * - non-Steam URLs → returned unchanged
 * - real Steam URLs → wrapped through `/api/steam-image`
 */
export function steamImageSrc(url?: string | null): string | null {
  if (!url) return null;
  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (!STEAM_HOSTS.includes(host)) return url;
  if (isBogusSteamUrl(url)) return null;
  return `/api/steam-image?url=${encodeURIComponent(url)}`;
}
