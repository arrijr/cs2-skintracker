import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCaseBySlug } from '@/lib/cases-server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://cs2-skintracker.com';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCaseBySlug(params.slug);
  if (!c) return { title: 'Case not found', robots: { index: false } };
  return {
    title: `${c.name} — Drop Table, EV & CS2 Case Prices | SkinTrackr`,
    description: `${c.name} drop table with every skin, current Steam Market prices, and expected-value calculation. Free CS2 case opening analyzer.`,
    alternates: { canonical: `${BASE_URL}/cases/${c.slug ?? params.slug}` },
  };
}

export default async function CaseDetailPage({ params }: Props) {
  const c = await getCaseBySlug(params.slug);
  if (!c) notFound();

  // Naive EV: average drop price, ignoring rarity-weighted odds (a refinement
  // can come later). Use it as a directional, not precise, signal.
  const dropPrices = c.drops.map((d) => d.skin.priceLatest ?? 0);
  const avg = dropPrices.length ? dropPrices.reduce((a, b) => a + b, 0) / dropPrices.length : 0;

  return (
    <main className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-3xl md:text-5xl font-bold mb-2">{c.name}</h1>
      <p className="text-slate-400 mb-8">
        Case price: {c.price != null ? `$${c.price.toFixed(2)}` : '—'} · avg drop value: ${avg.toFixed(2)}
      </p>

      <h2 className="text-xl font-semibold mb-4">Possible drops</h2>
      <ul className="space-y-2">
        {c.drops.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/50 p-3">
            <Link
              href={d.skin.weaponSlug && d.skin.slug ? `/skins/${d.skin.weaponSlug}/${d.skin.slug}` : '#'}
              className="text-slate-100 hover:text-fuchsia-400"
            >
              {d.skin.marketHashName}
            </Link>
            <span className="text-slate-300 text-sm">
              {d.skin.priceLatest != null ? `$${d.skin.priceLatest.toFixed(2)}` : '—'}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
