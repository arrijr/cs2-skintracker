"use client";
import { useEffect, useState } from 'react';
import { AffiliateLink } from '@/components/skins/AffiliateLink';
import { apiUrl } from '@/lib/api';

interface Source {
  source: string;
  priceUsd: number;
  effectivePriceUsd: number;
  url: string;
  meta?: Record<string, unknown>;
}

interface PriceResult {
  marketHashName: string;
  sources: Source[];
  cheapestSource: string | null;
  refreshedAt: string;
}

const SOURCE_LABELS: Record<string, string> = {
  steam: 'Steam Community Market',
  skinport: 'Skinport',
  csfloat: 'CSFloat',
  csmoney: 'CS.MONEY',
};

/**
 * Client component: fetches multi-market prices on mount.
 *
 * Was server component originally — but the backend aggregator can take
 * 30+ seconds when Skinport's 5MB feed isn't cached, and Vercel's Hobby
 * tier has a 10s function timeout. Moving the fetch to the client unblocks
 * SSR — the page renders instantly with a skeleton, then the table
 * progressively fills in once the user's browser has the data.
 */
export function MultiSourcePriceTable({ skinSlug }: { skinSlug: string }) {
  const [data, setData] = useState<PriceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl(`/api/v1/skins/${encodeURIComponent(skinSlug)}/prices`))
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then((json: PriceResult) => {
        if (!cancelled) setData(json);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [skinSlug]);

  if (error) {
    return (
      <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold mb-2">Live prices across markets</h2>
        <p className="text-slate-400 text-sm">Prices unavailable right now — please refresh in a moment.</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold mb-2">Live prices across markets</h2>
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-800 rounded w-3/4" />
        </div>
      </section>
    );
  }

  if (data.sources.length === 0) {
    return (
      <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold mb-2">Live prices across markets</h2>
        <p className="text-slate-400 text-sm">Refreshing — check back in a few minutes.</p>
      </section>
    );
  }

  return (
    <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-semibold">Live prices across markets</h2>
        <span className="text-xs text-slate-400">
          Updated {new Date(data.refreshedAt).toLocaleTimeString()}
        </span>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-left border-b border-slate-800">
            <th className="pb-2">Market</th>
            <th className="pb-2 text-right">Listed price</th>
            <th className="pb-2 text-right">After fees</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {data.sources.map((s, i) => (
            <tr key={s.source} className="border-b border-slate-800/50 last:border-0">
              <td className="py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{SOURCE_LABELS[s.source] ?? s.source}</span>
                  {i === 0 && (
                    <span className="text-[11px] bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white px-2 py-0.5 rounded-full">
                      Cheapest
                    </span>
                  )}
                </div>
              </td>
              <td className="py-3 text-right">{s.priceUsd != null && Number.isFinite(s.priceUsd) ? `$${s.priceUsd.toFixed(2)}` : "—"}</td>
              <td className="py-3 text-right text-slate-300">{s.effectivePriceUsd != null && Number.isFinite(s.effectivePriceUsd) ? `$${s.effectivePriceUsd.toFixed(2)}` : "—"}</td>
              <td className="py-3 text-right">
                <AffiliateLink
                  href={s.url}
                  source={s.source}
                  skinSlug={skinSlug}
                  className="text-fuchsia-400 hover:text-fuchsia-300 text-xs"
                >
                  View →
                </AffiliateLink>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-slate-400 mt-3">
        Steam prices include the 13% Steam Market transaction fee; Skinport and CSFloat are net.
      </p>
    </section>
  );
}
