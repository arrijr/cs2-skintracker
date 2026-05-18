"use client";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StatusTickerProps {
  lastUpdated?: string | null;
  steamConnected?: boolean;
  alertCount?: number;
}

/**
 * Bloomberg/Robinhood-style ticker bar — shows live status of the app.
 * Anchored to the bottom of the dashboard or floats above hero.
 */
export function StatusTicker({ lastUpdated, steamConnected, alertCount = 0 }: StatusTickerProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const utc = now.toISOString().slice(11, 19); // HH:MM:SS

  return (
    <div
      role="status"
      aria-live="off"
      className="bg-slate-950 border border-slate-800 px-4 py-1.5 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-slate-500 flex items-center justify-between flex-wrap gap-x-4 gap-y-1"
    >
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 text-green-400">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
          SYSTEM OPERATIONAL
        </span>
        <span className="text-slate-700">│</span>
        <span>
          STEAM:{" "}
          <span className={cn(steamConnected ? "text-green-400" : "text-slate-600")}>
            {steamConnected ? "CONNECTED" : "OFFLINE"}
          </span>
        </span>
        <span className="text-slate-700">│</span>
        <span>
          ALERTS: <span className="text-purple-300">{alertCount}</span>
        </span>
      </div>
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <>
            <span>LAST SYNC: <span className="text-slate-400 tabular-nums">{new Date(lastUpdated).toLocaleTimeString("en-GB", { hour12: false })}</span></span>
            <span className="text-slate-700">│</span>
          </>
        )}
        <span suppressHydrationWarning>UTC <span className="text-slate-400 tabular-nums">{utc}</span></span>
      </div>
    </div>
  );
}
