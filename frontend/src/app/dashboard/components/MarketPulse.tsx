"use client";
import Link from "next/link";
import { Activity, Crown, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketPulseProps {
  isPremium?: boolean;
  index24h?: number;
  topSector?: string;
  liquidity?: "High" | "Medium" | "Low";
}

/**
 * Market pulse card with Pro gating overlay — adapted from dashboard-hifi.html.
 * Free users see blurred decorative chart + lock + amber "Upgrade to Pro" CTA + 3 mini stats.
 * Premium users see real index data and breakdown.
 */
export default function MarketPulse({
  isPremium = false,
  index24h = 2.3,
  topSector = "Covert ★",
  liquidity = "High",
}: MarketPulseProps) {
  const isPos = index24h >= 0;

  // Decorative blurred chart
  const w = 400;
  const h = 130;
  const pts = Array.from({ length: 60 }, (_, i) =>
    70 + Math.sin(i * 0.4) * 22 + Math.cos(i * 0.18) * 12 - i * 0.5
  );
  const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * w},${p + 30}`).join(" ");
  const area = `${path} L${w},${h} L0,${h} Z`;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 border"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 20% 0%, rgba(245,185,72,0.10), transparent 60%), rgba(20,26,38,0.72)",
        borderColor: "rgba(245,185,72,0.20)",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-base font-semibold text-white flex items-center gap-2">
          <Activity className="h-4 w-4 text-amber-300" aria-hidden="true" /> Market pulse
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-600 ml-1">· CS2 Index</span>
        </h3>
        <span className="flex items-center gap-1.5 font-mono font-bold text-sm">
          <span className={isPos ? "text-emerald-400" : "text-rose-400"}>
            {isPos ? "+" : ""}{index24h.toFixed(2)}%
          </span>
          <span className="text-slate-600 font-medium">24h</span>
        </span>
      </div>

      {/* Blurred decorative chart with overlay */}
      <div className="relative h-[130px] my-4 rounded-[10px] border border-slate-700/40 bg-slate-950/50 overflow-hidden" style={{ filter: isPremium ? "none" : "blur(2.5px)" }}>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height="100%">
          <defs>
            <linearGradient id="pulse-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f5b948" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f5b948" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#pulse-fill)" />
          <path d={path} fill="none" stroke="#f5b948" strokeWidth="2" strokeOpacity="0.7" />
        </svg>
      </div>

      {!isPremium && (
        <div
          className="absolute inset-x-0 flex flex-col items-center justify-center gap-3 px-6 z-10"
          style={{ top: "calc(54px + 32px)", height: "130px" }}
        >
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ background: "rgba(245,185,72,0.16)", border: "1px solid rgba(245,185,72,0.40)", color: "#f5b948" }}
          >
            <Lock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="font-display text-lg font-semibold text-white text-center">Unlock Pro Insights</div>
          <p className="text-sm text-slate-400 text-center max-w-[260px]">
            7-day trends, liquidity analysis, sector rotation & portfolio benchmarking.
          </p>
          <Button
            asChild
            className="bg-gradient-to-br from-amber-400 to-orange-500 hover:opacity-95 text-[#2c1c00] font-bold gap-2 px-5 py-3 rounded-[10px] shadow-[0_12px_30px_-10px_rgba(245,185,72,0.5)] min-h-[40px]"
          >
            <Link href="/pricing">
              <Crown className="h-4 w-4" aria-hidden="true" /> Upgrade to Pro · €9.99/mo
            </Link>
          </Button>
        </div>
      )}

      {/* Mini stats strip */}
      <div className="grid grid-cols-3 gap-2.5 mt-4 relative z-0">
        <MiniStat label="Index 24h" value={`${isPos ? "+" : ""}${index24h.toFixed(2)}%`} tone={isPos ? "pos" : "neg"} />
        <MiniStat label="Top sector" value={topSector} />
        <MiniStat label="Liquidity" value={liquidity} />
      </div>
    </div>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "pos" | "neg" }) {
  return (
    <div
      className="p-3 rounded-[10px] border border-slate-700/40"
      style={{ background: "rgba(7,9,14,0.4)" }}
    >
      <div className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-slate-600">{label}</div>
      <div
        className={
          "font-mono font-bold text-sm mt-1 " +
          (tone === "pos" ? "text-emerald-400" : tone === "neg" ? "text-rose-400" : "text-white")
        }
      >
        {value}
      </div>
    </div>
  );
}
