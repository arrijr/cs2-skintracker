import 'server-only';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface CaseDrop {
  id: number;
  rarity: string | null;
  skin: { id: number; slug: string | null; weaponSlug: string | null; marketHashName: string; priceLatest: number | null };
}

export interface CaseDetail {
  id: number;
  slug: string | null;
  name: string;
  imageUrl: string | null;
  price: number | null;
  drops: CaseDrop[];
}

export async function getCaseBySlug(slug: string): Promise<CaseDetail | null> {
  const res = await fetch(`${API_BASE}/api/v1/cases/${encodeURIComponent(slug)}`, {
    next: { revalidate: 3600, tags: [`case:${slug}`] },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getCaseBySlug HTTP ${res.status}`);
  return res.json();
}
