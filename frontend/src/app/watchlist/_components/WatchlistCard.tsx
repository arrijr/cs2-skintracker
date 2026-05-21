"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { rarityToken } from "@/lib/design-tokens";
import { steamImageSrc } from "@/lib/image-proxy";
import { skinDetailHref } from "@/lib/skin-urls";

interface WatchlistCardProps {
  skinId: number;
  slug?: string | null;
  weaponSlug?: string | null;
  name: string;
  imageUrl?: string | null;
  rarity?: string | null;
  wear?: string | null;
  currentPrice?: number | null;
  delta?: number | null;
  targetPrice?: number | null;
  /** "buy" | "sell" | "watch" — drives tag colour */
  type?: "buy" | "sell" | "watch";
  note?: string;
  history?: number[]; // sparkline values
  onSetAlert?: () => void;
}

const TAG_CLS = {
  buy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
  sell: "bg-rose-500/10 text-rose-400 border-rose-500/25",
  watch: "bg-purple-500/10 text-purple-300 border-purple-500/30",
} as const;
const TAG_LABEL = {
  buy: "↘ Buy",
  sell: "↗ Sell",
  watch: "👁 Watch",
} as const;

function getRarityChip(rarity?: string | null) {
  const t = rarityToken(rarity);
  return cn("inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-[0.1em] border", t.text, t.bg, t.border);
}

export function WatchlistCard({
  skinId,
  slug,
  weaponSlug,
  name,
  imageUrl,
  rarity,
  wear,
  currentPrice,
  delta,
  targetPrice,
  type = "watch",
  note,
  history = [],
  onSetAlert,
}: WatchlistCardProps) {
  const detailHref = skinDetailHref({ id: skinId, slug, weaponSlug });
  const rarityHex = rarityToken(rarity).hex;
  const isUp = (delta ?? 0) >= 0;

  // Progress towards target
  const progressPct = (() => {
    if (!currentPrice || !targetPrice) return 0;
    if (type === "buy") {
      // approaching from above
      return Math.max(0, Math.min(100, 100 - ((currentPrice - targetPrice) / targetPrice) * 100 * 5));
    }
    return Math.max(0, Math.min(100, (currentPrice / targetPrice) * 100));
  })();

  // Sparkline
  const sparkPath = (() => {
    if (history.length < 2) return null;
    const w = 280;
    const h = 70;
    const min = Math.min(...history);
    const max = Math.max(...history);
    const r = Math.max(max - min, 1);
    const line = history
      .map((p, i) => `${i === 0 ? "M" : "L"}${(i / (history.length - 1)) * w},${h - ((p - min) / r) * (h - 6) - 3}`)
      .join(" ");
    return { line, area: `${line} L${w},${h} L0,${h} Z`, color: isUp ? "#34d399" : "#fb7185" };
  })();

  return (
    <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30 rounded-2xl">
      <CardContent className="p-5 flex flex-col gap-3.5">
        {/* Head: thumbnail + name + tag */}
        <div className="flex items-start gap-3">
          <div
            className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-slate-700/40 relative"
            style={{
              background: "linear-gradient(135deg, rgba(40,50,70,0.6), rgba(20,26,38,0.7))",
              boxShadow: `inset 0 -2px 0 ${rarityHex}`,
            }}
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={steamImageSrc(imageUrl) ?? imageUrl} alt="" className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="font-mono text-[9px] text-slate-600 tracking-wider">SKIN</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate mb-1">{name}</div>
            <div className="flex items-center gap-1.5 text-[11.5px] text-slate-400 flex-wrap">
              {rarity && <span className={getRarityChip(rarity)}>{rarity}</span>}
              {wear && <span>{wear}</span>}
            </div>
          </div>
          <span className={cn("text-[9.5px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded border whitespace-nowrap", TAG_CLS[type])}>
            {TAG_LABEL[type]}
          </span>
        </div>

        {/* Price + delta */}
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl font-semibold text-white tabular-nums tracking-[-0.02em]">
            €{(currentPrice ?? 0).toFixed(2)}
          </span>
          {delta !== null && delta !== undefined && (
            <span
              className={cn(
                "font-mono text-[12.5px] font-bold px-2 py-0.5 rounded-md border",
                isUp ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/28" : "bg-rose-500/10 text-rose-400 border-rose-500/28"
              )}
            >
              {isUp ? "+" : ""}{delta.toFixed(1)}%
            </span>
          )}
        </div>

        {/* Sparkline */}
        {sparkPath && (
          <div className="h-[70px] -mx-1.5">
            <svg viewBox="0 0 280 70" preserveAspectRatio="none" width="100%" height="100%">
              <defs>
                <linearGradient id={`wl-${skinId}`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor={sparkPath.color} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={sparkPath.color} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={sparkPath.area} fill={`url(#wl-${skinId})`} />
              <path d={sparkPath.line} fill="none" stroke={sparkPath.color} strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Target progress bar */}
        {targetPrice && (
          <div className="p-3 rounded-[10px] border border-slate-700/40" style={{ background: "rgba(7,9,14,0.4)" }}>
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400 mb-2">
              <span>{type === "buy" ? "Buy target" : type === "sell" ? "Sell target" : "Watch range"}</span>
              {note && <span className="font-normal normal-case tracking-normal text-slate-400">{note}</span>}
            </div>
            <div className="h-2 rounded-full bg-slate-600/15 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: `${progressPct.toFixed(0)}%` }}
              />
            </div>
            <div className="flex justify-between font-mono text-[11.5px] mt-1.5">
              <span className="font-bold text-white">
                €{(currentPrice ?? 0).toFixed(2)} <span className="text-slate-600 font-normal">now</span>
              </span>
              <span className="font-bold text-purple-300">
                €{targetPrice.toFixed(2)} <span className="text-slate-600 font-normal">target</span>
              </span>
            </div>
          </div>
        )}

        {/* Footer buttons */}
        <div className="flex gap-1.5">
          <Button
            onClick={onSetAlert}
            variant="outline"
            size="sm"
            className="flex-1 border-slate-700/50 text-slate-300 hover:text-white gap-1.5"
          >
            <Bell className="h-3.5 w-3.5" aria-hidden="true" /> Set alert
          </Button>
          {detailHref ? (
            <Button asChild variant="outline" size="sm" className="flex-1 border-slate-700/50 text-slate-300 hover:text-white gap-1.5">
              <Link href={detailHref}>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /> Detail
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-disabled="true"
              tabIndex={-1}
              className="flex-1 border-slate-700/50 text-slate-400 cursor-not-allowed gap-1.5"
            >
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /> Detail
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function WatchlistEmptySlot() {
  return (
    <div
      className="rounded-2xl border border-dashed border-slate-600/50 flex flex-col items-center justify-center gap-2 p-7 text-center text-slate-400"
      style={{ minHeight: "320px" }}
    >
      <div
        className="w-10 h-10 rounded-[9px] flex items-center justify-center text-purple-300 text-xl font-bold border"
        style={{ background: "rgba(168,85,247,0.10)", borderColor: "rgba(168,85,247,0.30)" }}
      >
        +
      </div>
      <div className="text-[13px] font-semibold text-white">Add to watchlist</div>
      <div className="text-[11.5px]">Track up to 50 skins on Pro</div>
      <Button asChild size="sm" variant="outline" className="border-slate-700/50 text-slate-300 hover:text-white mt-1">
        <Link href="/skins">Browse skins →</Link>
      </Button>
    </div>
  );
}
