import 'server-only';

/**
 * Server-only DB readers for skin pages. NEVER import this from a
 * client component — it pulls server-only code into the client bundle.
 */

// Defensive fallback chain:
//   1. NEXT_PUBLIC_API_URL — set on Vercel/local for the canonical API origin.
//   2. NODE_ENV === 'production' → hardcoded prod URL so SSR doesn't hang on
//      a missing env var (e.g. preview deploys before env vars propagate).
//   3. Local dev → localhost:5000.
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.skintrackr.io' : 'http://localhost:5000');

export interface SkinDetail {
  id: number;
  slug: string;
  weaponSlug: string;
  name: string;
  marketHashName: string;
  imageUrl: string | null;
  weaponType: string | null;
  collection: string | null;
  wear: string | null;
  rarity: string | null;
  isStattrak: boolean | null;
  priceLatest: number | null;
  priceMedian: number | null;
  priceAvg: number | null;
  priceMin: number | null;
  priceMax: number | null;
  priceMedian7d: number | null;
  priceMedian30d: number | null;
  priceMedian90d: number | null;
  sold24h: number | null;
  sold7d: number | null;
  sold30d: number | null;
  variantOf: number | null;
}

// Hard 9s timeout — sits just under Vercel Hobby's 10s function ceiling.
// Backend cold start can take 4-6s on Render Free Tier; 5s was too tight and
// caused intermittent 404s when getSkinBySlug aborted right before the data
// arrived. 9s gives ~2x headroom while still degrading gracefully (null/empty
// → notFound() / empty list) instead of 504-ing the whole request.
const SSR_FETCH_TIMEOUT_MS = 9000;

export async function getSkinBySlug(slug: string): Promise<SkinDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/skins/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600, tags: [`skin:${slug}`] },
      signal: AbortSignal.timeout(SSR_FETCH_TIMEOUT_MS),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`getSkinBySlug HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    console.error('[skins-server] getSkinBySlug failed', e);
    return null;
  }
}

export async function listSkinsByWeapon(weaponSlug: string, limit = 200): Promise<SkinDetail[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/skins?weapon=${encodeURIComponent(weaponSlug)}&limit=${limit}`,
      {
        next: { revalidate: 3600, tags: [`weapon:${weaponSlug}`] },
        signal: AbortSignal.timeout(SSR_FETCH_TIMEOUT_MS),
      }
    );
    if (!res.ok) throw new Error(`listSkinsByWeapon HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    console.error('[skins-server] listSkinsByWeapon failed', e);
    return [];
  }
}

/**
 * Paginated reader for sitemap generation. Returns slugs + lastModified.
 * NOT cached — sitemap rebuilds on every request to the chunked URL,
 * Next batches them via generateSitemaps.
 */
export async function listSkinSlugsPaged(
  page: number,
  pageSize = 5000
): Promise<Array<{ slug: string; weaponSlug: string; updatedAt: string }>> {
  const res = await fetch(
    `${API_BASE}/api/v1/skins/slugs?page=${page}&pageSize=${pageSize}`,
    { cache: 'no-store' }
  );
  if (!res.ok) throw new Error(`listSkinSlugsPaged HTTP ${res.status}`);
  return res.json();
}
