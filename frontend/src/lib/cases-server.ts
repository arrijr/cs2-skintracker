import 'server-only';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.skintrackr.io' : 'http://localhost:5000');

export interface CaseDrop {
  id: number;
  rarity: string | null;
  dropChance: number | null;
  isSpecial: boolean;
  skin: {
    id: number;
    name: string | null;
    slug: string | null;
    weaponSlug: string | null;
    marketHashName: string;
    imageUrl: string | null;
    rarity: string | null;
    weaponType: string | null;
    priceLatest: number | null;
  };
}

export interface CaseDetail {
  id: number;
  slug: string | null;
  name: string;
  imageUrl: string | null;
  price: number | null;
  priceChange24h: number | null;
  priceChange7d: number | null;
  priceChange30d: number | null;
  lastUpdated: string | null;
  isDiscontinued: boolean;
  drops: CaseDrop[];
}

export async function getCaseBySlug(slug: string): Promise<CaseDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/cases/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600, tags: [`case:${slug}`] },
      signal: AbortSignal.timeout(9000),
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`getCaseBySlug HTTP ${res.status}`);
    return res.json();
  } catch (e) {
    console.error('[cases-server] getCaseBySlug failed', e);
    return null;
  }
}

export interface CasePricePoint {
  id: number;
  caseId: number;
  date: string;
  price: number;
  marketCap: number | null;
  remaining: number | null;
}

export async function getCasePriceHistory(caseId: number, days = 90): Promise<CasePricePoint[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/cases/${caseId}/price-history?days=${days}`,
      {
        next: { revalidate: 21600, tags: [`case-history:${caseId}`] }, // 6h cache — history only updates 1×/day
        signal: AbortSignal.timeout(9000),
      },
    );
    if (!res.ok) return [];
    return res.json();
  } catch (e) {
    console.error('[cases-server] getCasePriceHistory failed', e);
    return [];
  }
}
