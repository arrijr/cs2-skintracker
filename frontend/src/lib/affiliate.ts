const AFFILIATE_CODES: Record<string, string> = {
  dmarket: process.env.NEXT_PUBLIC_DMARKET_REF_CODE ?? '',
  skinport: process.env.NEXT_PUBLIC_SKINPORT_REF_CODE ?? '',
};

const AFFILIATE_ENABLED = process.env.NEXT_PUBLIC_AFFILIATE_ENABLED === 'true';

export function buildMarketplaceUrl(
  marketplace: 'dmarket' | 'skinport',
  path: string,
  params: Record<string, string> = {}
): string {
  const bases: Record<string, string> = {
    dmarket: 'https://dmarket.com',
    skinport: 'https://skinport.com',
  };

  const url = new URL(path, bases[marketplace]);

  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  if (AFFILIATE_ENABLED && AFFILIATE_CODES[marketplace]) {
    url.searchParams.set('ref', AFFILIATE_CODES[marketplace]);
  }

  return url.toString();
}
