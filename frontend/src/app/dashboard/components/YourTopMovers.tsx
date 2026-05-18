"use client";
import { useMemo } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DeltaBadge } from "@/components/ui/delta-badge";
import { RarityBar } from "@/components/ui/rarity-indicator";
import { steamImageSrc } from "@/lib/image-proxy";

interface PortfolioItem {
  id?: number;
  skinId?: number;
  name?: string;
  imageUrl?: string;
  marketPrice?: number;
  priceLatest?: number;
  amount?: number;
  priceChange24h?: number;
  priceChange7d?: number;
  rarity?: string;
}

interface YourTopMoversProps {
  portfolio: PortfolioItem[];
  timeframe: "24h" | "7d";
  onTimeframeChange: (tf: "24h" | "7d") => void;
}

export function YourTopMovers({ portfolio, timeframe, onTimeframeChange }: YourTopMoversProps) {
  const { gainers, losers } = useMemo(() => {
    const withDelta = portfolio
      .map((p) => {
        const delta =
          timeframe === "24h"
            ? p.priceChange24h ?? 0
            : p.priceChange7d ?? 0;
        return {
          ...p,
          delta,
          value: (p.marketPrice ?? p.priceLatest ?? 0) * (p.amount ?? 1),
        };
      })
      .filter((p) => p.delta !== 0);

    const sortedByDelta = [...withDelta].sort((a, b) => b.delta - a.delta);
    return {
      gainers: sortedByDelta.slice(0, 3),
      losers: sortedByDelta.slice(-3).reverse(),
    };
  }, [portfolio, timeframe]);

  const hasMovers = gainers.length > 0 || losers.length > 0;

  return (
    <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base font-semibold text-white">
          Your top movers
        </CardTitle>
        <ToggleGroup
          type="single"
          value={timeframe}
          onValueChange={(v) => v && onTimeframeChange(v as "24h" | "7d")}
          className="bg-slate-800/50 border border-slate-700/40 rounded-md p-0.5"
        >
          <ToggleGroupItem value="24h" className="text-xs px-2.5 py-1 rounded data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500 data-[state=on]:to-pink-500 data-[state=on]:text-white text-slate-400">
            24h
          </ToggleGroupItem>
          <ToggleGroupItem value="7d" className="text-xs px-2.5 py-1 rounded data-[state=on]:bg-gradient-to-r data-[state=on]:from-purple-500 data-[state=on]:to-pink-500 data-[state=on]:text-white text-slate-400">
            7d
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>
      <CardContent>
        {!hasMovers ? (
          <p className="text-sm text-slate-500 text-center py-6">
            No price movement in your portfolio yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-green-400" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Gainers
                </span>
              </div>
              <MoverList items={gainers} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-red-400" aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Losers
                </span>
              </div>
              <MoverList items={losers} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MoverList({ items }: { items: Array<PortfolioItem & { delta: number; value: number }> }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-600 italic">—</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.skinId ?? it.id} className="flex items-stretch gap-3 group">
          <RarityBar rarity={it.rarity} />
          <div className="w-10 h-10 rounded-md bg-slate-800/60 border border-slate-700/40 flex-shrink-0 overflow-hidden flex items-center justify-center self-center">
            {it.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={steamImageSrc(it.imageUrl) ?? it.imageUrl}
                alt={it.name ?? "Skin"}
                width={40}
                height={40}
                className="object-contain"
              />
            ) : (
              <div className="w-full h-full bg-slate-800" />
            )}
          </div>
          <div className="flex-1 min-w-0 self-center">
            <Link
              href={`/skins/${it.skinId ?? it.id}`}
              className="text-sm text-slate-200 hover:text-white truncate block group-hover:underline"
            >
              {it.name ?? "Unknown skin"}
            </Link>
            <p className="text-xs text-slate-500 font-mono tabular-nums">
              €{(it.marketPrice ?? it.priceLatest ?? 0).toFixed(2)}
            </p>
          </div>
          <div className="self-center">
            <DeltaBadge value={it.delta} size="sm" />
          </div>
        </li>
      ))}
    </ul>
  );
}
