"use client";
import { Check } from "lucide-react";

interface WearFloatBarProps {
  /** Float value 0.00 - 1.00 */
  float?: number | null;
  /** Wear name e.g. "Field-Tested" */
  wear?: string | null;
}

const WEAR_RANGES: Record<string, [number, number]> = {
  "factory new": [0.0, 0.07],
  "minimal wear": [0.07, 0.15],
  "field-tested": [0.15, 0.38],
  "well-worn": [0.38, 0.45],
  "battle-scarred": [0.45, 1.0],
};

function getWearRange(wear?: string | null): [number, number] | null {
  if (!wear) return null;
  return WEAR_RANGES[wear.toLowerCase()] ?? null;
}

function getPercentile(float: number, range: [number, number]): number {
  const [lo, hi] = range;
  const pct = ((float - lo) / (hi - lo)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * Wear/float gradient bar — visualizes float 0.00→1.00 with marker pin.
 */
export function WearFloatBar({ float, wear }: WearFloatBarProps) {
  const hasFloat = typeof float === "number";
  const range = getWearRange(wear);
  const percentile = hasFloat && range ? getPercentile(float!, range) : null;

  return (
    <div>
      <div className="flex justify-between items-baseline pb-3">
        <div>
          <div className="font-mono text-2xl font-bold text-white tabular-nums tracking-tight">
            {hasFloat ? float!.toFixed(4) : "—"}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            {wear ?? "Unknown wear"}
            {range && (
              <span> range {range[0].toFixed(2)} – {range[1].toFixed(2)}</span>
            )}
          </div>
        </div>
        {percentile !== null && (
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Percentile</div>
            <div className="font-mono text-lg font-bold text-white tabular-nums">{percentile}th</div>
            <div className="text-[11px] text-slate-400">
              cleaner than {100 - percentile}% of {wear}
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 pb-3">
        <div
          className="relative h-6 rounded-md border border-slate-700/40 overflow-hidden"
          style={{
            background:
              "linear-gradient(90deg, #34d399 0% 7%, #c8e64c 7% 15%, #f5b948 15% 38%, #ec8c0e 38% 45%, #eb4b4b 45% 100%)",
          }}
        >
          {hasFloat && (
            <div
              className="absolute -top-2 -bottom-2 w-0.5 bg-white rounded-sm"
              style={{
                left: `${float! * 100}%`,
                boxShadow: "0 0 0 1px #0c1018, 0 0 12px rgba(255,255,255,0.6)",
              }}
              aria-label={`Float ${float!.toFixed(4)}`}
            >
              <span
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white"
                style={{ boxShadow: "0 0 12px rgba(255,255,255,0.8)" }}
              />
            </div>
          )}
        </div>
        <div className="flex justify-between mt-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
          <span>0.00</span><span>FN</span><span>MW</span><span>FT</span><span>WW</span><span>BS</span><span>1.00</span>
        </div>
      </div>

      {percentile !== null && percentile < 50 && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/40 border border-slate-700/40 mt-3">
          <div className="w-7 h-7 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4" />
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">
            This float is <strong className="text-white">better than average</strong> for {wear}.
            Cleaner pieces typically trade at a premium.
          </p>
        </div>
      )}
    </div>
  );
}
