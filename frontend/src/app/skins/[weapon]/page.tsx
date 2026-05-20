import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { listSkinsByWeapon } from '@/lib/skins-server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skintrackr.io';

interface Props {
  params: { weapon: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const weaponLabel = params.weapon.replace(/-/g, ' ').toUpperCase();
  return {
    title: `${weaponLabel} Skins — All Variants, Live Prices | CS2 SkinTrackr`,
    description: `Browse every ${weaponLabel} skin in CS2 with current Steam, Skinport and CSFloat prices. Sorted by 7-day volume. Free alerts.`,
    alternates: { canonical: `${BASE_URL}/skins/${params.weapon}` },
  };
}

export default async function WeaponPillarPage({ params }: Props) {
  const skins = await listSkinsByWeapon(params.weapon, 200);
  if (skins.length === 0) notFound();

  const weaponLabel = params.weapon.replace(/-/g, ' ').toUpperCase();

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${weaponLabel} CS2 Skins`,
    itemListElement: skins.slice(0, 50).map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${BASE_URL}/skins/${s.weaponSlug}/${s.slug}`,
      name: s.marketHashName,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <nav className="text-sm text-slate-400 mb-6">
          <Link href="/" className="hover:text-fuchsia-400">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/skins" className="hover:text-fuchsia-400">Skins</Link>
          <span className="mx-2">/</span>
          <span className="text-slate-200 capitalize">{weaponLabel}</span>
        </nav>

        <h1 className="text-3xl md:text-5xl font-bold mb-2">{weaponLabel} Skins</h1>
        <p className="text-slate-400 mb-8">
          {skins.length} skins · sorted by 30-day sales volume
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skins.map((s) => (
            <Link
              key={s.id}
              href={`/skins/${s.weaponSlug}/${s.slug}`}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 hover:border-fuchsia-500/40 transition"
            >
              <div className="flex items-start gap-3">
                {s.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.imageUrl} alt={s.marketHashName} className="h-16 w-24 object-contain" />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="font-medium text-slate-100 truncate">{s.marketHashName}</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {s.priceLatest != null ? `$${s.priceLatest.toFixed(2)}` : '—'}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
