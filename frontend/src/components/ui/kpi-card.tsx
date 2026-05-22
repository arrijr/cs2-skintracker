"use client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KPICardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  icon?: ReactNode;
  /** "pos" | "acc" | "gold" | "neutral" — colors the icon badge */
  tone?: "pos" | "acc" | "gold" | "neutral";
  /** Optional secondary text below value (e.g. "across 9 weapons") */
  sub?: string;
  /** Optional inline sparkline points */
  spark?: number[];
}

const toneClass = {
  pos: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  acc: "text-purple-300 bg-purple-500/10 border-purple-500/30",
  gold: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  neutral: "text-slate-300 bg-slate-500/[0.04] border-slate-700/40",
} as const;

export function KPICard({ label, value, delta, deltaLabel, icon, tone = "neutral", sub, spark }: KPICardProps) {
  const hasDelta = delta != null && Number.isFinite(delta);
  const isPos = hasDelta && delta >= 0;
  return (
    <Card className="relative overflow-hidden bg-slate-900/70 backdrop-blur border-slate-700/30 rounded-2xl">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{label}</span>
          {icon && (
            <span
              className={cn(
                "w-8 h-8 rounded-[9px] inline-flex items-center justify-center border",
                toneClass[tone]
              )}
              aria-hidden="true"
            >
              {icon}
            </span>
          )}
        </div>
        {/* CS HUD-style big number — font-mono tabular-nums for that scoreboard /
            terminal feel. Stays on slate-950 + brand baseline. */}
        <div className="font-mono text-[28px] font-semibold tracking-[-0.025em] text-white tabular-nums leading-tight">
          {value}
        </div>
        {(hasDelta || sub) && (
          <div
            className={cn(
              "font-mono text-xs mt-1.5 flex items-center gap-1.5",
              hasDelta
                ? isPos ? "text-emerald-400" : "text-rose-400"
                : "text-slate-400"
            )}
          >
            {hasDelta && (
              <>
                {isPos ? <TrendingUp className="h-3 w-3" aria-hidden="true" /> : <TrendingDown className="h-3 w-3" aria-hidden="true" />}
                <span className="tabular-nums">
                  {isPos ? "+" : ""}{delta.toFixed(2)}%
                </span>
                {deltaLabel && <span className="text-slate-400 font-sans ml-0.5">{deltaLabel}</span>}
              </>
            )}
            {!hasDelta && sub && <span className="font-sans">{sub}</span>}
          </div>
        )}
        {spark && spark.length > 1 && (
          <Sparkline points={spark} positive={isPos} />
        )}
      </CardContent>
    </Card>
  );
}

function Sparkline({ points, positive }: { points: number[]; positive: boolean }) {
  const w = 80;
  const h = 24;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const r = Math.max(max - min, 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${(i / (points.length - 1)) * w},${h - ((p - min) / r) * h}`)
    .join(" ");
  return (
    <svg
      className="absolute right-3 bottom-3 opacity-60"
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d={path}
        fill="none"
        stroke={positive ? "#34d399" : "#fb7185"}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
