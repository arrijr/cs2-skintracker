"use client";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PortfolioItem {
  name?: string;
  marketPrice?: number;
  priceLatest?: number;
  amount?: number;
  rarity?: string;
  weaponType?: string;
  wear?: string;
}

interface Slice {
  name: string;
  val: number;
  color: string;
  pct: number;
}

interface AllocationDonutProps {
  portfolio: PortfolioItem[];
  currency?: string;
}

const RARITY_COLOR: Record<string, string> = {
  covert: "#eb4b4b",
  classified: "#d32ce6",
  restricted: "#8847ff",
  "mil-spec": "#4b69ff",
  milspec: "#4b69ff",
  "mil-spec grade": "#4b69ff",
  industrial: "#5e98d9",
  consumer: "#b0c3d9",
  "extraordinary": "#ffd700",
  "exceedingly rare": "#ffd700",
  contraband: "#e4ae39",
};

const PALETTE = ["#a855f7", "#ec4899", "#f5b948", "#34d399", "#06b6d4", "#fb7185", "#4b69ff"];

type Tab = "Rarity" | "Weapon" | "Exterior";

export function AllocationDonut({ portfolio, currency = "â‚¬" }: AllocationDonutProps) {
  const [tab, setTab] = useState<Tab>("Rarity");

  const slices = useMemo<Slice[]>(() => {
    const buckets = new Map<string, number>();
    portfolio.forEach((p) => {
      const value = (p.marketPrice ?? p.priceLatest ?? 0) * (p.amount ?? 1);
      let key: string;
      if (tab === "Rarity") key = p.rarity ?? "Unknown";
      else if (tab === "Weapon") key = p.weaponType ?? "Other";
      else key = p.wear ?? "Unknown";
      buckets.set(key, (buckets.get(key) ?? 0) + value);
    });

    const arr = Array.from(buckets.entries()).map(([name, val], i) => {
      const color =
        tab === "Rarity"
          ? RARITY_COLOR[name.toLowerCase()] ?? PALETTE[i % PALETTE.length]
          : PALETTE[i % PALETTE.length];
      return { name, val, color, pct: 0 };
    });
    const total = arr.reduce((s, a) => s + a.val, 0);
    return arr
      .map((s) => ({ ...s, pct: total > 0 ? (s.val / total) * 100 : 0 }))
      .sort((a, b) => b.val - a.val);
  }, [portfolio, tab]);

  const total = slices.reduce((s, a) => s + a.val, 0);

  const arcs = useMemo(() => {
    if (slices.length === 0 || total === 0) return [];
    const r = 75;
    const cx = 100;
    const cy = 100;
    const gap = 0.012;
    let acc = 0;
    return slices.map((s) => {
      const start = (acc / 100) * 2 * Math.PI - Math.PI / 2 + gap;
      acc += s.pct;
      const end = (acc / 100) * 2 * Math.PI - Math.PI / 2 - gap;
      const x1 = cx + r * Math.cos(start);
      const y1 = cy + r * Math.sin(start);
      const x2 = cx + r * Math.cos(end);
      const y2 = cy + r * Math.sin(end);
      const large = end - start > Math.PI ? 1 : 0;
      return { ...s, d: `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 ${large} 1 ${x2.toFixed(2)},${y2.toFixed(2)}` };
    });
  }, [slices, total]);

  return (
    <Card className="bg-slate-900/70 backdrop-blur border-slate-700/30 rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-white">Allocation</h3>
          <div
            className="inline-flex gap-0.5 p-1 rounded-[10px] border border-slate-700/40"
            style={{ background: "rgba(7,9,14,0.5)" }}
            role="group"
            aria-label="Allocation breakdown"
          >
            {(["Rarity", "Weapon", "Exterior"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                aria-pressed={tab === t}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold tracking-[0.04em] transition-colors",
                  tab === t ? "text-white" : "text-slate-400 hover:text-slate-200"
                )}
                style={
                  tab === t
                    ? { background: "rgba(168,85,247,0.18)", boxShadow: "inset 0 0 0 1px rgba(168,85,247,0.35)" }
                    : undefined
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {slices.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">No data yet.</p>
        ) : (
          <div className="flex flex-col items-center">
            <div className="relative w-[200px] h-[200px]">
              <svg viewBox="0 0 200 200" width="200" height="200">
                <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="22" />
                {arcs.map((a, i) => (
                  <path
                    key={i}
                    d={a.d}
                    fill="none"
                    stroke={a.color}
                    strokeWidth="22"
                    strokeLinecap="butt"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-display text-[22px] font-semibold tracking-[-0.02em] text-white tabular-nums">
                  {currency}{total.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600 mt-0.5">
                  {tab}
                </span>
              </div>
            </div>

            <ul className="flex flex-col gap-2 mt-4 w-full">
              {arcs.map((a, i) => (
                <li key={i} className="grid grid-cols-[12px_1fr_auto_auto] gap-2.5 items-center text-xs">
                  <span className="w-2.5 h-2.5 rounded-[3px]" style={{ background: a.color }} aria-hidden="true" />
                  <span className="text-slate-300 truncate">{a.name}</span>
                  <span className="font-mono text-slate-400 min-w-[44px] text-right">{a.pct.toFixed(0)}%</span>
                  <span className="font-mono font-semibold text-white">
                    {currency}{a.val.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
