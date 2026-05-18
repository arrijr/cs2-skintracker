"use client";
import { useState } from "react";
import Link from "next/link";
import type { MarketItem } from "@/hooks/useMarketItems";
import { cn } from "@/lib/utils";
import { steamImageSrc } from "@/lib/image-proxy";

const CATEGORY_LABELS: Record<MarketItem['category'], string> = {
  sticker: 'Sticker',
  agent: 'Agent',
  patch: 'Patch',
  graffiti: 'Graffiti',
  music_kit: 'Music Kit',
  collectible: 'Collectible',
  key: 'Key',
};

const CATEGORY_HEX: Record<MarketItem['category'], string> = {
  sticker: '#a855f7',
  agent: '#4b69ff',
  patch: '#f5b948',
  graffiti: '#ec4899',
  music_kit: '#34d399',
  collectible: '#06b6d4',
  key: '#94a3b8',
};

const CATEGORY_CODE: Record<MarketItem['category'], string> = {
  sticker: 'STK',
  agent: 'AGT',
  patch: 'PAT',
  graffiti: 'GFT',
  music_kit: 'MUS',
  collectible: 'COL',
  key: 'KEY',
};

interface ItemCardProps {
  item: MarketItem;
}

export function ItemCard({ item }: ItemCardProps) {
  const hex = CATEGORY_HEX[item.category];
  const code = CATEGORY_CODE[item.category];
  const isFresh = item.priceUpdatedAt && (Date.now() - new Date(item.priceUpdatedAt).getTime()) < 24 * 3600_000;
  const [imgFailed, setImgFailed] = useState(false);
  const proxiedSrc = steamImageSrc(item.imageUrl);
  const hasImage = !!proxiedSrc && !imgFailed;

  return (
    <Link href={`/items/${item.id}`} className="group relative block">
      {/* Outer category-tinted glow halo */}
      <span
        aria-hidden="true"
        className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${hex}66, ${hex}22)` }}
      />

      <article
        className={cn(
          "relative bg-slate-900/80 backdrop-blur border border-slate-700/30 rounded-2xl overflow-hidden transition-all duration-300",
          "group-hover:border-slate-600/70 group-hover:-translate-y-1",
          "h-full flex flex-col"
        )}
      >
        {/* Left-edge category stripe */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-1 z-10"
          style={{ background: `linear-gradient(180deg, ${hex}, ${hex}66)` }}
        />

        {/* ART AREA */}
        <div className="relative aspect-square overflow-hidden">
          <span
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 75% 60% at 50% 55%, ${hex}30, transparent 75%), linear-gradient(180deg, rgba(15,19,28,0.3) 0%, rgba(7,9,14,0.6) 100%)`,
            }}
          />
          {/* Subtle grid texture */}
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          {proxiedSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proxiedSrc}
              alt=""
              loading="lazy"
              onError={() => setImgFailed(true)}
              className={cn(
                "relative w-full h-full object-contain p-4 transition-all duration-500",
                hasImage ? "group-hover:scale-110 opacity-100" : "opacity-0 absolute inset-0"
              )}
              style={hasImage ? { filter: `drop-shadow(0 12px 24px ${hex}50)` } : undefined}
            />
          )}

          {!hasImage && (
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-2">
              <span
                className="font-display font-bold tracking-tight text-5xl select-none opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${hex}, ${hex}77)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: `drop-shadow(0 4px 12px ${hex}55)`,
                }}
                aria-hidden="true"
              >
                {code}
              </span>
              <span className="text-[9.5px] uppercase tracking-[0.18em] text-slate-600 font-bold">
                {CATEGORY_LABELS[item.category]}
              </span>
            </div>
          )}

          {/* Category tag — top-left */}
          <span
            className="absolute top-2.5 left-3.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-[0.14em] border backdrop-blur-sm z-10"
            style={{
              background: `${hex}1f`,
              borderColor: `${hex}55`,
              color: hex,
            }}
          >
            {CATEGORY_LABELS[item.category]}
          </span>

          {/* Live indicator — top-right */}
          {isFresh && (
            <span
              className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-emerald-300 z-10"
              aria-label="Recently updated"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
              Live
            </span>
          )}

          {/* Volume badge — bottom-left */}
          {item.volume24h != null && item.volume24h > 0 && (
            <span className="absolute bottom-2.5 left-3.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-[0.12em] bg-slate-950/70 backdrop-blur-sm border border-slate-700/40 text-slate-300 z-10">
              Vol {item.volume24h}
            </span>
          )}
        </div>

        {/* BODY */}
        <div className="flex-1 p-3 pl-4 flex flex-col gap-1.5 border-t border-slate-700/30 bg-slate-900/60">
          {item.rarity && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-[0.12em] border border-slate-700/50 bg-slate-800/40 text-slate-400 leading-none self-start">
              {item.rarity}
            </span>
          )}
          <h3 className="text-[13px] font-semibold text-white line-clamp-2 leading-snug min-h-[2.2rem]">
            {item.name}
          </h3>
          <div className="font-mono font-bold text-lg text-white tabular-nums leading-none mt-1">
            {item.priceLatest != null ? `€${item.priceLatest.toFixed(2)}` : <span className="text-slate-600">—</span>}
          </div>
        </div>
      </article>
    </Link>
  );
}
