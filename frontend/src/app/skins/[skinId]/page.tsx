// frontend/src/app/skins/[skinId]/page.tsx
//
// LEGACY INTEGER URL — preserved for backward compatibility.
//
// New canonical URL pattern is /skins/[weapon]/[slug] (Sprint 2 SEO work).
// This server component looks up the skin by id and 301s the user to the
// canonical slug URL. Any old bookmarks, social links, and Google index
// entries keep working until they get re-crawled.

import { redirect, notFound } from 'next/navigation';
import { permanentRedirect } from 'next/navigation';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.skintrackr.io' : 'http://localhost:5000');

interface PageProps {
  params: { skinId: string };
}

async function getSkinIdLookup(id: string): Promise<{ slug: string; weaponSlug: string } | null> {
  const res = await fetch(`${API_BASE}/api/v1/skins/by-id/${encodeURIComponent(id)}`, {
    next: { revalidate: 3600 },
  });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  const data = await res.json();
  if (!data?.slug || !data?.weaponSlug) return null;
  return { slug: data.slug, weaponSlug: data.weaponSlug };
}

export default async function LegacySkinIdRedirect({ params }: PageProps) {
  const lookup = await getSkinIdLookup(params.skinId);
  if (!lookup) notFound();
  // permanentRedirect = 308 (modern HTTP equivalent of 301 — preserves method,
  // browsers + crawlers treat it as a permanent move just like 301).
  permanentRedirect(`/skins/${lookup.weaponSlug}/${lookup.slug}`);
}
