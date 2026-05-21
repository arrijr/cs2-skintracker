"use client";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RarityBar } from "@/components/ui/rarity-indicator";
import { steamImageSrc } from "@/lib/image-proxy";
import { skinDetailHref } from "@/lib/skin-urls";

interface PortfolioItem {
  id?: number;
  skinId?: number;
  name?: string;
  slug?: string | null;
  weaponSlug?: string | null;
  imageUrl?: string;
  marketPrice?: number;
  priceLatest?: number;
  amount?: number;
  rarity?: string;
}

interface TopHoldingsProps {
  portfolio: PortfolioItem[];
  totalValue: number;
}

export function TopHoldings({ portfolio, totalValue }: TopHoldingsProps) {
  const top = useMemo(() => {
    return [...portfolio]
      .map((p) => ({
        ...p,
        value: (p.marketPrice ?? p.priceLatest ?? 0) * (p.amount ?? 1),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [portfolio]);

  if (top.length === 0) return null;

  return (
    <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold text-white">Top holdings</CardTitle>
        <Link
          href="/portfolio"
          className="text-xs text-slate-400 hover:text-white inline-flex items-center gap-1 group"
          aria-label="View full portfolio"
        >
          View all <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
        </Link>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {top.map((h) => {
            const pct = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
            return (
              <li key={h.skinId ?? h.id}>
                <div className="flex items-stretch gap-3 mb-1.5">
                  <RarityBar rarity={h.rarity} />
                  <div className="w-9 h-9 rounded-md bg-slate-800/60 border border-slate-700/40 flex-shrink-0 overflow-hidden flex items-center justify-center self-center">
                    {h.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={steamImageSrc(h.imageUrl) ?? h.imageUrl} alt="" width={36} height={36} className="object-contain" />
                    ) : (
                      <div className="w-full h-full bg-slate-800" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 self-center">
                    {(() => {
                      const href = skinDetailHref(h);
                      return href ? (
                        <Link
                          href={href}
                          className="text-sm text-slate-200 hover:text-white truncate block"
                        >
                          {h.name ?? "Unknown skin"}
                        </Link>
                      ) : (
                        <span
                          aria-disabled="true"
                          tabIndex={-1}
                          className="text-sm text-slate-300 truncate block cursor-default"
                        >
                          {h.name ?? "Unknown skin"}
                        </span>
                      );
                    })()}
                    <p className="text-xs text-slate-400 font-mono tabular-nums">
                      â‚¬{h.value.toFixed(2)} Â· {pct.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div
                  className="h-1 bg-slate-800/60 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(pct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${h.name ?? "Skin"} is ${pct.toFixed(1)}% of portfolio`}
                >
                  <div
                    className={cn(
                      "h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all",
                    )}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
