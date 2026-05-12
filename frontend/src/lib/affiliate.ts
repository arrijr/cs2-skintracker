// Note: NEXT_PUBLIC_* vars are baked in at build time — toggling these in Vercel requires a redeploy.
const AFFILIATE_CODES: Record<string, string> = {
  dmarket: process.env.NEXT_PUBLIC_DMARKET_REF_CODE ?? '',
  skinport: process.env.NEXT_PUBLIC_SKINPORT_REF_CODE ?? '',
};

const AFFILIATE_ENABLED = process.env.NEXT_PUBLIC_AFFILIATE_ENABLED === 'true';

const MARKETPLACE_BASES: Record<'dmarket' | 'skinport', string> = {
  dmarket: 'https://dmarket.com',
  skinport: 'https://skinport.com',
};

export function buildMarketplaceUrl(
  marketplace: 'dmarket' | 'skinport',
  path: string,
  params: Record<string, string> = {}
): string {
  if (/^https?:\/\/|^\/\//.test(path)) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[affiliate] path must be relative, got:', path);
    }
    return path; // return as-is, no ref appended, no redirect risk
  }

  const url = new URL(path, MARKETPLACE_BASES[marketplace]);

  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  if (AFFILIATE_ENABLED && AFFILIATE_CODES[marketplace]) {
    url.searchParams.set('ref', AFFILIATE_CODES[marketplace]);
  }

  return url.toString();
}
