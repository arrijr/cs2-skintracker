// frontend/src/app/skins/[weapon]/[slug]/_components/SimilarSkinsGrid.tsx — [Frontend]
// Renders up to 6 "similar" skins (same weapon + rarity, within +-30% price band)
// underneath the canonical skin detail body. Client component so SSR stays
// fast on Vercel Hobby (10s ceiling) — fetches on mount via the dedicated
// /api/v1/skins/by-id/:id/similar endpoint.
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import { skinDetailHref } from "@/lib/skin-urls";
import { rarityToken } from "@/lib/design-tokens";
import { steamImageSrc } from "@/lib/image-proxy";
import { cn } from "@/lib/utils";

interface SimilarSkin {
  id: number;
  name: string;
  slug: string | null;
  weaponSlug: string | null;
  imageUrl: string | null;
  wear: string | null;
  rarity: string | null;
  priceLatest: number | null;
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

export function SimilarSkinsGrid({ skinId }: { skinId: number }) {
  const [items, setItems] = useState<SimilarSkin[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(apiUrl(`/skins/by-id/${skinId}/similar`))
      .then((r) => (r.ok ? r.json() : []))
      .then((json: SimilarSkin[]) => {
        if (!cancelled) setItems(Array.isArray(json) ? json : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [skinId]);

  // Loading skeleton — reserves layout space so CLS stays clean.
  if (items === null) {
    return (
      <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h2 className="text-xl font-semibold mb-4">Similar skins</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] rounded-lg bg-slate-800/50 animate-pulse"
            />
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) return null;

  return (
    <section className="my-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
      <h2 className="text-xl font-semibold mb-1">Similar skins</h2>
      <p className="text-sm text-slate-400 mb-4">
        Same rarity and weapon, similar price range — by 30-day trade volume.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {items.map((s) => {
          const href = skinDetailHref(s);
          const t = rarityToken(s.rarity);
          const rarityHex = t.hex;
          const card = (
            <div
              className={cn(
                "group relative rounded-lg border bg-slate-950/40 p-3 transition-colors h-full flex flex-col gap-2",
                "border-slate-800 hover:border-slate-600"
              )}
              style={{
                boxShadow: `inset 0 0 0 1px ${rarityHex}20`,
              }}
            >
              <div
                className="aspect-[4/3] rounded-md flex items-center justify-center overflow-hidden"
                style={{
                  background: `radial-gradient(ellipse 60% 50% at 50% 60%, ${rarityHex}25, transparent 70%), linear-gradient(180deg, #1a0b0b 0%, #0a0508 100%)`,
                }}
              >
                {s.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={steamImageSrc(s.imageUrl) ?? s.imageUrl}
                    alt={s.name}
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span className="font-mono text-slate-600 text-xs">NO IMG</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.14em] truncate"
                  style={{ color: rarityHex }}
                >
                  {s.rarity ?? "—"}
                </div>
                <div className="text-sm font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                  {s.name}
                </div>
                {s.wear && (
                  <div className="text-[11px] text-slate-400 truncate">{s.wear}</div>
                )}
                <div className="font-mono font-bold text-sm text-white tabular-nums mt-1">
                  {s.priceLatest != null ? `€${fmtEUR(s.priceLatest)}` : "—"}
                </div>
              </div>
            </div>
          );
          return href ? (
            <Link key={s.id} href={href} aria-label={`View ${s.name}`} className="block">
              {card}
            </Link>
          ) : (
            <div key={s.id}>{card}</div>
          );
        })}
      </div>
    </section>
  );
}
