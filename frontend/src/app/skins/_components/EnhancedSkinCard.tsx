// /frontend/src/app/skins/_components/EnhancedSkinCard.tsx — [Frontend]
// Hi-fi trading card — rarity-tinted edge glow, vivid image area, weapon initials placeholder,
// big mono price, 24h delta chip, action buttons on hover. Designed to feel like a CS2 trading card.
"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, Plus, Star, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { rarityToken } from "@/lib/design-tokens";
import { steamImageSrc } from "@/lib/image-proxy";

interface SkinForCard {
  id: number;
  name: string;
  marketHashName?: string;
  imageUrl?: string;
  weaponType?: string;
  wear?: string;
  rarity?: string;
  quality?: string;
  isStattrak?: boolean;
  isStar?: boolean;
  priceLatest?: number;
  priceMedian?: number;
  priceMedian24h?: number;
  priceMedian7d?: number;
  sold24h?: number;
  change24h?: number;
  change7d?: number;
}

interface EnhancedSkinCardProps {
  skin: SkinForCard;
  onSkinClick?: (skinId: number) => void;
  onSkinAdd?: (skinId: number) => void;
  onToggleWatchlist?: (skinId: number) => void;
  isInWatchlist?: boolean;
  isInPortfolio?: boolean;
  className?: string;
  viewMode?: "grid" | "list";
  showHoverEffects?: boolean;
}

const WEAR_SHORT: Record<string, string> = {
  "factory new": "FN",
  "minimal wear": "MW",
  "field-tested": "FT",
  "well-worn": "WW",
  "battle-scarred": "BS",
};

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);

/** Derive a 2-3 char placeholder code from weapon name. */
function weaponCode(weapon?: string, name?: string): string {
  if (weapon) {
    const trimmed = weapon.replace(/^★\s*/, "").trim();
    const parts = trimmed.split(/[\s-]+/);
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return trimmed.slice(0, 3).toUpperCase();
  }
  if (name) return name.slice(0, 2).toUpperCase();
  return "??";
}

export function EnhancedSkinCard({
  skin,
  onSkinClick,
  onSkinAdd,
  onToggleWatchlist,
  isInWatchlist = false,
  isInPortfolio = false,
  className = "",
  viewMode = "grid",
}: EnhancedSkinCardProps) {
  const router = useRouter();
  const rarityTok = rarityToken(skin.rarity);
  const rarityHex = rarityTok.hex;
  const [imgFailed, setImgFailed] = useState(false);
  const proxiedSrc = steamImageSrc(skin.imageUrl);
  const hasImage = !!proxiedSrc && !imgFailed;

  const deltaPct = useMemo(() => {
    if (typeof skin.change24h === "number") return skin.change24h;
    if (typeof skin.priceLatest === "number" && typeof skin.priceMedian24h === "number" && skin.priceMedian24h > 0) {
      return ((skin.priceLatest - skin.priceMedian24h) / skin.priceMedian24h) * 100;
    }
    return null;
  }, [skin.change24h, skin.priceLatest, skin.priceMedian24h]);

  const isPos = (deltaPct ?? 0) >= 0;
  const wearShort = skin.wear ? WEAR_SHORT[skin.wear.toLowerCase()] ?? skin.wear.slice(0, 2).toUpperCase() : null;
  const price = skin.priceLatest ?? skin.priceMedian ?? null;
  const code = weaponCode(skin.weaponType, skin.name);

  const handleClick = () => {
    if (onSkinClick) onSkinClick(skin.id);
    else router.push(`/skins/${skin.id}`);
  };

  if (viewMode === "list") {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group flex items-center gap-4 bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl p-3 cursor-pointer transition-all",
          "hover:border-slate-600/60 hover:bg-slate-800/40",
          className
        )}
        style={{ boxShadow: `inset 3px 0 0 ${rarityHex}` }}
      >
        <div
          className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative"
          style={{ background: `radial-gradient(ellipse 70% 50% at 50% 50%, ${rarityHex}22, transparent 70%), rgba(7,9,14,0.5)` }}
        >
          {proxiedSrc && !imgFailed ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proxiedSrc}
              alt=""
              loading="lazy"
              onError={() => setImgFailed(true)}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <span className="font-display font-bold text-base" style={{ color: `${rarityHex}cc` }} aria-hidden="true">
              {code}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {skin.isStattrak && <Star className="h-3 w-3 text-amber-400 flex-shrink-0 fill-current" aria-label="StatTrak" />}
            <h3 className="text-sm font-semibold text-white truncate">{skin.name}</h3>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {skin.rarity && (
              <span
                className={cn(
                  "px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-[0.1em] border",
                  rarityTok.text,
                  rarityTok.bg,
                  rarityTok.border
                )}
              >
                {skin.rarity}
              </span>
            )}
            {skin.wear && <span>{skin.wear}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="font-mono font-bold text-sm text-white tabular-nums">
            {price != null ? `€${fmtEUR(price)}` : "—"}
          </div>
          {deltaPct != null && (
            <div className={cn("font-mono text-xs tabular-nums mt-0.5", isPos ? "text-emerald-400" : "text-rose-400")}>
              {isPos ? "+" : ""}{deltaPct.toFixed(2)}%
            </div>
          )}
        </div>
      </div>
    );
  }

  // GRID view — trading-card style
  return (
    <article
      onClick={handleClick}
      className={cn("group relative cursor-pointer", className)}
    >
      {/* Outer rarity-tinted glow halo on hover */}
      <span
        aria-hidden="true"
        className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-lg pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${rarityHex}66, ${rarityHex}22)` }}
      />

      <div
        className="relative bg-slate-900/80 backdrop-blur border border-slate-700/30 rounded-2xl overflow-hidden h-full flex flex-col group-hover:border-slate-600/70 group-hover:-translate-y-1 transition-all duration-300"
      >
        {/* Rarity stripe — left edge, full height */}
        <span
          aria-hidden="true"
          className="absolute left-0 top-0 bottom-0 w-1 z-10"
          style={{ background: `linear-gradient(180deg, ${rarityHex}, ${rarityHex}66)` }}
        />

        {/* ART AREA */}
        <div className="relative aspect-[5/4] overflow-hidden">
          {/* Atmospheric backdrop */}
          <span
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse 75% 60% at 50% 55%, ${rarityHex}38, transparent 75%), linear-gradient(180deg, rgba(15,19,28,0.3) 0%, rgba(7,9,14,0.6) 100%)`,
            }}
          />
          {/* Grid pattern overlay for that "trading card" texture */}
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />

          {/* Image — only rendered when proxiedSrc is non-null. onError flips to fallback. */}
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
              style={hasImage ? { filter: `drop-shadow(0 12px 24px ${rarityHex}50)` } : undefined}
            />
          )}

          {/* Weapon-code placeholder — shown when no URL OR when image errored */}
          {!hasImage && (
            <div className="relative w-full h-full flex flex-col items-center justify-center gap-2 px-4">
              <span
                className="font-display font-bold tracking-tight text-5xl md:text-6xl select-none opacity-90"
                style={{
                  background: `linear-gradient(135deg, ${rarityHex}, ${rarityHex}77)`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  filter: `drop-shadow(0 4px 12px ${rarityHex}55)`,
                }}
                aria-hidden="true"
              >
                {code}
              </span>
              <span className="text-[9.5px] uppercase tracking-[0.18em] text-slate-600 font-bold text-center line-clamp-1 max-w-full">
                {skin.weaponType ?? "skin"}
              </span>
            </div>
          )}

          {/* TOP-LEFT: wear chip */}
          {wearShort && (
            <span className="absolute top-2.5 left-3.5 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-slate-950/80 backdrop-blur-sm border border-slate-700/50 text-slate-200 z-10">
              {wearShort}
            </span>
          )}

          {/* TOP-RIGHT: StatTrak/Star */}
          {(skin.isStattrak || skin.isStar) && (
            <span
              className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-[0.12em] border border-amber-500/50 bg-amber-500/[0.18] backdrop-blur-sm text-amber-200 z-10"
              aria-label={skin.isStattrak ? "StatTrak" : "Special"}
            >
              <Star className="h-2.5 w-2.5 fill-current" aria-hidden="true" />
              {skin.isStattrak ? "ST" : "★"}
            </span>
          )}

          {/* BOTTOM: 24h delta badge — visual at-a-glance trend */}
          {deltaPct != null && Math.abs(deltaPct) >= 0.05 && (
            <span
              className={cn(
                "absolute bottom-2.5 left-3.5 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums font-mono backdrop-blur-sm border z-10",
                isPos
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/40"
                  : "bg-rose-500/15 text-rose-300 border-rose-500/40"
              )}
            >
              {isPos ? <TrendingUp className="h-2.5 w-2.5" aria-hidden="true" /> : <TrendingDown className="h-2.5 w-2.5" aria-hidden="true" />}
              {isPos ? "+" : ""}{deltaPct.toFixed(1)}%
            </span>
          )}

          {/* BOTTOM-RIGHT: action buttons on hover */}
          <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            {onToggleWatchlist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatchlist(skin.id);
                }}
                className={cn(
                  "w-8 h-8 rounded-md backdrop-blur-md border flex items-center justify-center transition-colors",
                  isInWatchlist
                    ? "bg-rose-500/25 border-rose-500/50 text-rose-300 hover:bg-rose-500/35"
                    : "bg-slate-950/80 border-slate-700/60 text-slate-300 hover:text-rose-300 hover:border-rose-500/50"
                )}
                aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                title="Watchlist"
              >
                <Heart className={cn("h-3.5 w-3.5", isInWatchlist && "fill-current")} aria-hidden="true" />
              </button>
            )}
            {onSkinAdd && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSkinAdd(skin.id);
                }}
                className={cn(
                  "w-8 h-8 rounded-md backdrop-blur-md border flex items-center justify-center transition-colors",
                  isInPortfolio
                    ? "bg-emerald-500/25 border-emerald-500/50 text-emerald-300"
                    : "bg-slate-950/80 border-slate-700/60 text-slate-300 hover:text-emerald-300 hover:border-emerald-500/50"
                )}
                aria-label={isInPortfolio ? "In portfolio" : "Add to portfolio"}
                title="Portfolio"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div className="flex-1 p-3 pl-4 flex flex-col gap-1.5 border-t border-slate-700/30 bg-slate-900/60">
          {/* Rarity chip + name */}
          <div className="flex items-center gap-1.5 min-h-[14px]">
            {skin.rarity && (
              <span
                className={cn(
                  "inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-[0.12em] border leading-none",
                  rarityTok.text,
                  rarityTok.bg,
                  rarityTok.border
                )}
              >
                {skin.rarity}
              </span>
            )}
          </div>
          <h3 className="text-[13px] font-semibold text-white line-clamp-2 leading-snug min-h-[2.2rem]">
            {skin.name}
          </h3>
          {/* Price — hero number */}
          <div className="font-mono font-bold text-lg text-white tabular-nums leading-none mt-1">
            {price != null ? `€${fmtEUR(price)}` : <span className="text-slate-600">—</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
