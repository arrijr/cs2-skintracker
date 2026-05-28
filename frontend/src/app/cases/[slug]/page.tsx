import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCaseBySlug, getCasePriceHistory, type CaseDrop } from '@/lib/cases-server';
import CasePriceChart from '@/components/charts/CasePriceChart';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://skintrackr.io';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCaseBySlug(slug);
  if (!c) return { title: 'Case not found', robots: { index: false } };
  return {
    title: `${c.name} — Drop Table, EV & CS2 Case Prices | SkinTrackr`,
    description: `${c.name} drop table with every skin, current Steam Market prices, and expected-value calculation. Free CS2 case opening analyzer.`,
    alternates: { canonical: `${BASE_URL}/cases/${c.slug ?? slug}` },
  };
}

// CS2 rarity sort order (lowest → highest tier). Special/knife items go last.
const RARITY_ORDER: Record<string, number> = {
  'Consumer Grade': 1,
  'Industrial Grade': 2,
  'Mil-Spec Grade': 3,
  Restricted: 4,
  Classified: 5,
  Covert: 6,
  'Extraordinary': 7,
  'Exceedingly Rare': 7,
  'Master Collection': 7,
};

// Tailwind classes per rarity for ring/border/text accent.
const RARITY_STYLES: Record<string, { ring: string; text: string; bg: string }> = {
  'Consumer Grade': { ring: 'ring-slate-500', text: 'text-slate-300', bg: 'from-slate-700/40' },
  'Industrial Grade': { ring: 'ring-sky-500', text: 'text-sky-400', bg: 'from-sky-700/40' },
  'Mil-Spec Grade': { ring: 'ring-blue-500', text: 'text-blue-400', bg: 'from-blue-700/40' },
  Restricted: { ring: 'ring-purple-500', text: 'text-purple-400', bg: 'from-purple-700/40' },
  Classified: { ring: 'ring-pink-500', text: 'text-pink-400', bg: 'from-pink-700/40' },
  Covert: { ring: 'ring-red-500', text: 'text-red-400', bg: 'from-red-700/40' },
  'Extraordinary': { ring: 'ring-yellow-400', text: 'text-yellow-300', bg: 'from-yellow-600/40' },
  'Exceedingly Rare': { ring: 'ring-yellow-400', text: 'text-yellow-300', bg: 'from-yellow-600/40' },
  'Master Collection': { ring: 'ring-yellow-400', text: 'text-yellow-300', bg: 'from-yellow-600/40' },
};

function rarityRank(d: CaseDrop): number {
  const r = d.rarity ?? d.skin.rarity ?? '';
  return RARITY_ORDER[r] ?? 99;
}

function rarityStyle(d: CaseDrop) {
  const r = d.rarity ?? d.skin.rarity ?? '';
  return (
    RARITY_STYLES[r] ?? { ring: 'ring-slate-700', text: 'text-slate-400', bg: 'from-slate-800/40' }
  );
}

function formatChange(n: number | null): { label: string; cls: string } | null {
  if (n == null || !Number.isFinite(n)) return null;
  const cls = n > 0 ? 'text-emerald-400' : n < 0 ? 'text-red-400' : 'text-slate-400';
  const sign = n > 0 ? '+' : '';
  return { label: `${sign}${n.toFixed(2)}%`, cls };
}

// Relative-time formatter for the "Last updated" stamp in the hero — accepts
// an ISO date string and returns either "just now", "Xm ago", "Xh ago", or
// "Xd ago". Snapshot is taken at render time on the server, so for cached
// pages it reflects the moment the page was last regenerated.
function formatRelativeUpdate(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return '';
  const diffMs = Date.now() - then;
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default async function CaseDetailPage({ params }: Props) {
  const { slug } = await params;
  const c = await getCaseBySlug(slug);
  if (!c) notFound();

  // Pull history in parallel — best-effort, render empty chart if missing.
  const history = await getCasePriceHistory(c.id, 90);

  // Sort drops by rarity (high → low) so the rare stuff shows first, then by
  // priceLatest within the same rarity tier so the most valuable variant
  // leads the row.
  const drops = [...c.drops].sort((a, b) => {
    const dr = rarityRank(b) - rarityRank(a);
    if (dr !== 0) return dr;
    return (b.skin.priceLatest ?? 0) - (a.skin.priceLatest ?? 0);
  });

  // Naive EV — average drop price across all variants. Real EV needs
  // rarity-weighted odds + special-item factor; treat this as directional.
  const dropPrices = drops.map((d) => d.skin.priceLatest ?? 0).filter((p) => p > 0);
  const avgDrop = dropPrices.length ? dropPrices.reduce((a, b) => a + b, 0) / dropPrices.length : 0;

  const ch24 = formatChange(c.priceChange24h);
  const ch7 = formatChange(c.priceChange7d);
  const ch30 = formatChange(c.priceChange30d);

  return (
    <main className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Hero — case art + name + price + 24/7/30d change */}
      <section className="mb-10 grid gap-6 md:grid-cols-[240px_1fr] items-start">
        <div className="relative aspect-square w-full max-w-[240px] rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          {c.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.imageUrl} alt={c.name} className="absolute inset-0 h-full w-full object-contain p-4" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-slate-500">No image</div>
          )}
        </div>

        <div className="min-w-0">
          <Link href="/cases" className="text-sm text-slate-400 hover:text-fuchsia-400">
            ← Back to all cases
          </Link>
          <h1 className="mt-2 text-3xl md:text-4xl font-bold text-slate-100">{c.name}</h1>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Current price</div>
              <div className="text-3xl font-bold text-slate-100">
                {c.price != null && Number.isFinite(c.price) ? `$${c.price.toFixed(2)}` : '—'}
              </div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Avg drop value</div>
              <div className="text-2xl font-semibold text-slate-300">
                {avgDrop > 0 ? `$${avgDrop.toFixed(2)}` : '—'}
              </div>
            </div>
          </div>

          {(ch24 || ch7 || ch30) && (
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {ch24 && (
                <div>
                  <span className="text-slate-500">24h </span>
                  <span className={ch24.cls}>{ch24.label}</span>
                </div>
              )}
              {ch7 && (
                <div>
                  <span className="text-slate-500">7d </span>
                  <span className={ch7.cls}>{ch7.label}</span>
                </div>
              )}
              {ch30 && (
                <div>
                  <span className="text-slate-500">30d </span>
                  <span className={ch30.cls}>{ch30.label}</span>
                </div>
              )}
            </div>
          )}

          {c.isDiscontinued && (
            <div className="mt-4 inline-flex rounded-md border border-amber-700/50 bg-amber-900/20 px-3 py-1 text-xs font-medium text-amber-300">
              Discontinued — supply tightening
            </div>
          )}

          {c.lastUpdated && (
            <div className="mt-3 text-xs text-slate-500">
              Price updated {formatRelativeUpdate(c.lastUpdated)} · Source: Steam Market
            </div>
          )}
        </div>
      </section>

      {/* Price history chart */}
      <section className="mb-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Price history</h2>
          <span className="text-xs text-slate-500">{history.length} daily snapshots · 90d</span>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          {history.length > 0 ? (
            <CasePriceChart data={history} timeRange="30d" />
          ) : (
            <div className="grid place-items-center h-48 text-sm text-slate-500">
              <div className="text-center">
                <div>No daily snapshots yet.</div>
                <div className="mt-1 text-xs">
                  Price history is captured 06:30 UTC daily — first row appears the day after the case is priced.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Drops grid — sorted by rarity desc, cards with image + price */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Possible drops</h2>
          <span className="text-xs text-slate-500">{drops.length} skins · sorted by rarity</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {drops.map((d) => {
            const s = rarityStyle(d);
            const href =
              d.skin.weaponSlug && d.skin.slug
                ? `/skins/${d.skin.weaponSlug}/${d.skin.slug}`
                : null;
            const inner = (
              <div
                className={`group relative h-full rounded-xl border border-slate-800 bg-gradient-to-b ${s.bg} to-slate-900/80 p-3 transition hover:border-slate-600 hover:-translate-y-0.5 hover:shadow-lg ring-1 ring-inset ${s.ring}/30`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden rounded-md bg-slate-950/60">
                  {d.skin.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={d.skin.imageUrl}
                      alt={d.skin.marketHashName}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-contain p-2"
                    />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-xs text-slate-600">
                      No image
                    </div>
                  )}
                  {d.isSpecial && (
                    <div className="absolute right-1.5 top-1.5 rounded bg-yellow-500/90 px-1.5 py-0.5 text-[10px] font-bold text-black">
                      ★ RARE
                    </div>
                  )}
                </div>

                <div className="mt-2 min-h-[2.5rem]">
                  <div className={`text-[11px] font-medium uppercase tracking-wide ${s.text}`}>
                    {d.rarity ?? d.skin.rarity ?? '—'}
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-slate-100 line-clamp-2">
                    {d.skin.marketHashName}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between border-t border-slate-800/60 pt-2">
                  <span className="text-xs text-slate-500">{d.skin.weaponType ?? ''}</span>
                  <span className="text-sm font-semibold text-slate-100">
                    {d.skin.priceLatest != null && Number.isFinite(d.skin.priceLatest)
                      ? `$${d.skin.priceLatest.toFixed(2)}`
                      : '—'}
                  </span>
                </div>
              </div>
            );
            return href ? (
              <Link key={d.id} href={href} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 rounded-xl">
                {inner}
              </Link>
            ) : (
              <div key={d.id} className="opacity-80 cursor-not-allowed">
                {inner}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
