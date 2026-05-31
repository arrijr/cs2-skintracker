"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/api';

interface WearRow {
  wear: string;
  slug: string | null;
  priceLatest: number | null;
}

const WEARS = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];

/**
 * Client component for the same reason as MultiSourcePriceTable:
 * keeps the SSR function fast on Vercel's Hobby tier (10s limit).
 */
export function WearComparisonTable({
  weaponSlug,
  baseId,
}: {
  weaponSlug: string;
  baseId: number;
}) {
  const [variants, setVariants] = useState<WearRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl(`/api/v1/skins/by-id/${baseId}/variants`))
      .then((r) => (r.ok ? r.json() : []))
      .then((json: WearRow[]) => {
        if (!cancelled) setVariants(json);
      })
      .catch(() => {
        if (!cancelled) setVariants([]);
      });
    return () => {
      cancelled = true;
    };
  }, [baseId]);

  if (variants === null) {
    // Still loading — render skeleton to reserve layout space
    return (
      <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold mb-4">Compare wear conditions</h2>
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-800 rounded w-full" />
          <div className="h-4 bg-slate-800 rounded w-2/3" />
        </div>
      </section>
    );
  }

  if (variants.length <= 1) return null;

  const byWear = new Map(variants.map((v) => [v.wear, v]));

  return (
    <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="text-xl font-semibold mb-4">Compare wear conditions</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-left border-b border-slate-800">
            <th className="pb-2">Wear</th>
            <th className="pb-2 text-right">Current price</th>
            <th className="pb-2"></th>
          </tr>
        </thead>
        <tbody>
          {WEARS.map((w) => {
            const v = byWear.get(w);
            return (
              <tr key={w} className="border-b border-slate-800/50 last:border-0">
                <td className="py-3">{w}</td>
                <td className="py-3 text-right text-slate-200">
                  {v?.priceLatest != null ? `$${v.priceLatest.toFixed(2)}` : '—'}
                </td>
                <td className="py-3 text-right">
                  {v?.slug ? (
                    <Link
                      href={`/skins/${weaponSlug}/${v.slug}`}
                      className="text-purple-400 hover:text-purple-300 text-xs"
                    >
                      View →
                    </Link>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
