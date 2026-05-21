// frontend/src/app/skins/[weapon]/[slug]/page.tsx
//
// Canonical SSR landing page for every skin in our catalog.
// - Generates per-skin metadata (title, description, OG, canonical).
// - Embeds Product + Offer + BreadcrumbList + FAQPage JSON-LD.
// - Renders the interactive UI through a client child component.
// - ISR-cached at 1h via the lib/skins-server reader.

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSkinBySlug } from '@/lib/skins-server';
import SkinDetailClient from './_components/SkinDetailClient';
import { MultiSourcePriceTable } from './_components/MultiSourcePriceTable';
import { WearComparisonTable } from './_components/WearComparisonTable';
import { SkinFAQ } from './_components/SkinFAQ';
import { SkinProductSchema } from '@/components/skins/SkinProductSchema';

// Next.js 15: params + searchParams are async — must be awaited before access.
interface PageProps {
  params: Promise<{ weapon: string; slug: string }>;
  searchParams: Promise<{ wear?: string }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skintrackr.io';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const skin = await getSkinBySlug(slug);
  if (!skin) {
    return { title: 'Skin not found', robots: { index: false } };
  }

  const title = `${skin.marketHashName} Price & Float History | CS2 SkinTrackr`;
  const description =
    `Live ${skin.marketHashName} price across Steam Market, Skinport and CSFloat. ` +
    `30/60/90-day chart, float distribution, set alerts free.`;
  const canonical = `${BASE_URL}/skins/${skin.weaponSlug}/${skin.slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: 'CS2 SkinTrackr',
      images: skin.imageUrl ? [{ url: skin.imageUrl, width: 512, height: 384, alt: skin.marketHashName }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: skin.imageUrl ? [skin.imageUrl] : [],
    },
    robots: {
      // De-index until we have a real current price — thin-content guard.
      index: skin.priceLatest != null,
      follow: true,
    },
  };
}

export default async function SkinDetailPage({ params, searchParams }: PageProps) {
  const { weapon, slug } = await params;
  const sp = await searchParams;
  const skin = await getSkinBySlug(slug);
  if (!skin) notFound();

  // Guard: if user lands on /skins/awp/ak-47-redline-ft (wrong weapon), 404
  // rather than render confusing content.
  if (skin.weaponSlug !== weapon) notFound();

  return (
    <>
      <SkinProductSchema skin={skin} canonicalUrl={`${BASE_URL}/skins/${skin.weaponSlug}/${skin.slug}`} />

      <main className="relative min-h-screen bg-slate-950 text-white">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Breadcrumbs */}
          <nav className="mb-6 text-sm text-slate-400" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-fuchsia-400">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/skins" className="hover:text-fuchsia-400">Skins</Link>
            <span className="mx-2">/</span>
            <Link href={`/skins/${skin.weaponSlug}`} className="hover:text-fuchsia-400 capitalize">
              {skin.weaponSlug.replace(/-/g, ' ')}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-slate-200">{skin.marketHashName}</span>
          </nav>

          {/* H1 — must come from the catalog, not duplicated. */}
          <h1 className="text-3xl md:text-5xl font-bold mb-2">{skin.marketHashName}</h1>
          <p className="text-slate-400 mb-8">
            {skin.weaponType} · {skin.rarity} · {skin.collection ?? 'No collection'}
          </p>

          {/* Client-rendered chart + interactivity */}
          <SkinDetailClient skin={skin} initialWear={sp.wear ?? null} />

          {/* Client components — fetch data on mount, render skeleton during.
              Keeps SSR function fast (Vercel Hobby = 10s limit). Cold-cache
              first hit shows skeleton ~30s while backend hydrates Skinport +
              CSFloat caches; subsequent hits hit 5min in-memory backend cache. */}
          <MultiSourcePriceTable skinSlug={skin.slug} />
          <WearComparisonTable weaponSlug={skin.weaponSlug} baseId={skin.variantOf ?? skin.id} />
          <SkinFAQ skin={skin} />
        </div>
      </main>
    </>
  );
}
