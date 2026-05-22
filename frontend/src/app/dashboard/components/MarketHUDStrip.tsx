"use client";
import { useEffect, useMemo, useState } from "react";
import { Activity, Bell, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketHUDStripProps {
  /** Total active alerts (firing-eligible) for this user. */
  activeAlerts?: number;
  /** Flat portfolio rows for computing significant 24h moves. */
  portfolio?: Array<{ priceChange24h?: number | null }>;
  /** ISO timestamp of last portfolio refresh. */
  lastUpdated?: string | null;
}

/**
 * Thin CS-HUD market-pulse bar — sits above the dashboard hero.
 * Three live stats: active alerts firing, skins with >5% moves today, time since
 * last refresh. Uses mono / tabular-nums for that scoreboard / radar-readout feel.
 *
 * Replaces the old Bloomberg-y StatusTicker (SYSTEM OPERATIONAL / UTC clock).
 * Stays on slate-950 + purple-500 brand baseline, rounded-2xl border-slate-800.
 */
export function MarketHUDStrip({ activeAlerts = 0, portfolio = [], lastUpdated }: MarketHUDStripProps) {
  // Skins with abs(24h %) > 5 — significant movers
  const movers = useMemo(() => {
    return portfolio.filter((p) => {
      const c = p?.priceChange24h;
      if (c == null || Number.isNaN(c)) return false;
      return Math.abs(c) > 5;
    }).length;
  }, [portfolio]);

  // Time-since-refresh string. Re-tick every 30s so it stays fresh without thrashing.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const sinceLabel = useMemo(() => {
    if (!lastUpdated) return "—";
    const seconds = Math.max(0, Math.round((Date.now() - new Date(lastUpdated).getTime()) / 1000));
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    return `${hrs}h ago`;
    // tick variable intentionally referenced via closure (lint suppress)
  }, [lastUpdated, tick]);

  return (
    <div
      role="status"
      aria-live="off"
      aria-label="Market HUD"
      className="rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur px-4 py-2.5 flex items-center gap-4 sm:gap-6 flex-wrap"
    >
      {/* Live pulse dot — pulses purple (brand) when idle, emerald when alerts firing */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "inline-block w-[7px] h-[7px] rounded-full animate-pulse",
            activeAlerts > 0 ? "bg-emerald-400" : "bg-purple-400"
          )}
          style={{
            boxShadow: activeAlerts > 0 ? "0 0 10px #34d399" : "0 0 10px #a855f7",
          }}
          aria-hidden="true"
        />
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
          Market HUD
        </span>
      </div>

      <span className="text-slate-700 hidden sm:inline" aria-hidden="true">│</span>

      <HUDStat
        icon={<Bell className="h-3.5 w-3.5" aria-hidden="true" />}
        label="Alerts armed"
        value={String(activeAlerts)}
        tone={activeAlerts > 0 ? "acc" : "muted"}
      />

      <HUDStat
        icon={<TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />}
        label="Movers >5%"
        value={String(movers)}
        tone={movers > 0 ? "pos" : "muted"}
      />

      <HUDStat
        icon={<Activity className="h-3.5 w-3.5" aria-hidden="true" />}
        label="Last sync"
        value={sinceLabel}
        tone="muted"
      />
    </div>
  );
}

function HUDStat({
  icon,
  label,
  value,
  tone = "muted",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "pos" | "acc" | "muted";
}) {
  const toneText =
    tone === "pos" ? "text-emerald-300" : tone === "acc" ? "text-purple-300" : "text-slate-300";
  const toneIcon =
    tone === "pos" ? "text-emerald-400" : tone === "acc" ? "text-purple-400" : "text-slate-500";

  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className={cn("shrink-0", toneIcon)}>{icon}</span>
      <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-500 shrink-0">
        {label}
      </span>
      <span className={cn("font-mono font-bold text-sm tabular-nums tracking-tight truncate", toneText)}>
        {value}
      </span>
    </div>
  );
}
