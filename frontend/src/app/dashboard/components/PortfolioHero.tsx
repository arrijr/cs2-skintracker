"use client";
import { useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { FlashValue } from "@/components/ui/flash-value";

export type RangeKey = "24h" | "7d" | "30d" | "90d" | "1y" | "all";

interface PortfolioHeroProps {
  totalValue: number;
  deltas: Partial<Record<RangeKey, number>>;
  history: Array<{ date: string; value: number }>;
  range: RangeKey;
  onRangeChange: (range: RangeKey) => void;
  currency?: string;
}

const RANGE_LABEL: Record<RangeKey, string> = {
  "24h": "24h",
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
  "1y": "1Y",
  all: "All",
};
const RANGE_PERIOD: Record<RangeKey, string> = {
  "24h": "today",
  "7d": "this week",
  "30d": "this month",
  "90d": "last 90 days",
  "1y": "this year",
  all: "all-time",
};

const splitValue = (n: number) => {
  const formatted = new Intl.NumberFormat("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
  const [intPart, decPart] = formatted.split(".");
  return [intPart, decPart ?? "00"];
};

export function PortfolioHero({
  totalValue,
  deltas,
  history,
  range,
  onRangeChange,
  currency = "€",
}: PortfolioHeroProps) {
  const delta = deltas[range] ?? 0;
  const isPos = delta > 0;
  const isNeg = delta < 0;
  const deltaAbs = (totalValue * delta) / 100;
  const [intPart, decPart] = splitValue(totalValue);

  const chartRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ x: number; y: number; date: string; value: number } | null>(null);

  const { path, area, min, max, ptsScreen } = useMemo(() => {
    if (!history || history.length < 2) {
      return { path: "", area: "", min: 0, max: 0, ptsScreen: [] as Array<{ xPct: number; yPct: number; date: string; v: number }> };
    }
    const w = 900;
    const h = 240;
    const values = history.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const r = Math.max(max - min, 1);
    const px = (i: number) => (i / (history.length - 1)) * w;
    const py = (v: number) => h - ((v - min) / r) * (h - 8) - 4;
    const lineCmds = history.map((p, i) => `${i === 0 ? "M" : "L"}${px(i).toFixed(2)},${py(p.value).toFixed(2)}`).join(" ");
    const areaCmds = lineCmds + ` L${w},${h} L0,${h} Z`;

    const ptsScreen = history.map((p, i) => ({
      xPct: (i / (history.length - 1)) * 100,
      yPct: (py(p.value) / h) * 100,
      date: p.date,
      v: p.value,
    }));

    return { path: lineCmds, area: areaCmds, min, max, ptsScreen };
  }, [history]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!chartRef.current || ptsScreen.length === 0) return;
    const rect = chartRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    let best = ptsScreen[0];
    let bestDist = Infinity;
    for (const p of ptsScreen) {
      const d = Math.abs(p.xPct - xPct);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    setHover({ x: best.xPct, y: best.yPct, date: best.date, value: best.v });
  };

  return (
    <section
      className="relative overflow-hidden rounded-[20px] border border-slate-700/30 backdrop-blur-[12px]"
      style={{
        background: "linear-gradient(155deg, rgba(20,26,38,0.85), rgba(15,19,28,0.7))",
      }}
      aria-labelledby="portfolio-value-heading"
    >
      {/* Inner gradient wash — emerald top right + purple bottom left */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isPos
            ? "radial-gradient(ellipse 70% 60% at 92% 8%, rgba(52,211,153,0.16), transparent 60%), radial-gradient(ellipse 50% 50% at 0% 100%, rgba(168,85,247,0.08), transparent 70%)"
            : isNeg
            ? "radial-gradient(ellipse 70% 60% at 92% 8%, rgba(251,113,133,0.16), transparent 60%), radial-gradient(ellipse 50% 50% at 0% 100%, rgba(168,85,247,0.08), transparent 70%)"
            : "radial-gradient(ellipse 70% 60% at 92% 8%, rgba(168,85,247,0.10), transparent 60%)",
        }}
      />

      <div className="relative p-5 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5 lg:gap-6 mb-6 sm:mb-7">
          <div>
            {/* Eyebrow with pulse dot */}
            <div
              id="portfolio-value-heading"
              className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400 mb-3.5"
            >
              <span
                className={cn(
                  "inline-block w-[7px] h-[7px] rounded-full animate-pulse",
                  isPos && "bg-emerald-400",
                  isNeg && "bg-rose-400",
                  !isPos && !isNeg && "bg-purple-400"
                )}
                style={isPos ? { boxShadow: "0 0 12px #34d399" } : isNeg ? { boxShadow: "0 0 12px #fb7185" } : { boxShadow: "0 0 12px #a855f7" }}
                aria-hidden="true"
              />
              Portfolio value
            </div>

            {/* Huge value — responsive scaling so it fits a 320px viewport */}
            <FlashValue
              value={totalValue}
              className="font-display flex items-baseline gap-1 mb-3.5"
            >
              <span
                className="font-display font-semibold text-white leading-[0.95] tracking-[-0.035em] flex items-baseline gap-1 text-[44px] sm:text-[60px] md:text-[76px]"
                aria-label={`Portfolio value: ${currency}${intPart}.${decPart}`}
              >
                <span className="text-slate-400 text-[26px] sm:text-[36px] md:text-[44px] mr-1 -translate-y-1 inline-block">
                  {currency}
                </span>
                <span>{intPart}</span>
                <span className="text-slate-400 text-[22px] sm:text-[30px] md:text-[36px]">.{decPart}</span>
              </span>
            </FlashValue>

            {/* Big delta chip */}
            <div
              className={cn(
                "inline-flex flex-wrap items-center gap-2.5 px-3.5 py-2.5 rounded-[11px] text-[15px] sm:text-[17px] font-semibold border",
                isPos && "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
                isNeg && "bg-rose-500/10 text-rose-400 border-rose-500/25",
                !isPos && !isNeg && "bg-slate-500/10 text-slate-400 border-slate-500/25"
              )}
            >
              <ArrowIcon dir={isPos ? "up" : isNeg ? "down" : "flat"} />
              <span className="font-mono tabular-nums">
                {currency}{new Intl.NumberFormat("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "always" }).format(deltaAbs)}
              </span>
              <span className="font-bold font-mono tabular-nums">
                ({isPos ? "+" : ""}{delta.toFixed(2)}%)
              </span>
              <span className="text-slate-400 font-medium text-[13px] border-l border-white/10 pl-2.5 ml-1">
                {RANGE_PERIOD[range]}
              </span>
            </div>
          </div>

          {/* Range toggle — horizontally scrollable on narrow viewports so it never overflows */}
          <div
            className="inline-flex gap-0.5 p-1 rounded-[11px] border border-slate-700/40 self-start lg:self-auto max-w-full overflow-x-auto"
            style={{ background: "rgba(7,9,14,0.55)" }}
            role="group"
            aria-label="Time range"
          >
            {(["24h", "7d", "30d", "90d", "1y", "all"] as RangeKey[]).map((r) => (
              <button
                key={r}
                onClick={() => onRangeChange(r)}
                aria-pressed={range === r}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-[0.04em] transition-all min-h-[28px] min-w-[44px]",
                  range === r
                    ? "text-white bg-gradient-to-br from-purple-500 to-pink-500"
                    : "text-slate-400 hover:text-white",
                  range === r && "shadow-[0_8px_20px_-8px_rgba(168,85,247,0.55)]"
                )}
              >
                {RANGE_LABEL[r]}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div ref={chartRef} className="relative h-[240px] -mx-2" onMouseMove={handleMove} onMouseLeave={() => setHover(null)}>
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-[22px] w-[70px] flex flex-col justify-between pr-2 font-mono text-[10.5px] text-slate-600 text-right">
            <span>{currency}{max.toFixed(0)}</span>
            <span>{currency}{((max + min) / 2).toFixed(0)}</span>
            <span>{currency}{min.toFixed(0)}</span>
          </div>

          {/* SVG chart */}
          {history.length >= 2 && (
            <svg
              className="absolute left-[70px] right-2 top-0 bottom-[22px] w-[calc(100%-78px)] h-[calc(100%-22px)]"
              viewBox="0 0 900 240"
              preserveAspectRatio="none"
              role="img"
              aria-label="Portfolio value over time"
            >
              <defs>
                <linearGradient id="hero-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#a855f7" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="hero-line" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="80%" stopColor="#34d399" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#hero-area)" />
              <path
                d={path}
                fill="none"
                stroke="url(#hero-line)"
                strokeWidth="2.2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {hover && (
                <>
                  <line
                    x1={(hover.x / 100) * 900}
                    y1={0}
                    x2={(hover.x / 100) * 900}
                    y2={240}
                    stroke="rgba(255,255,255,0.18)"
                    strokeDasharray="3 3"
                    vectorEffect="non-scaling-stroke"
                  />
                  <circle
                    cx={(hover.x / 100) * 900}
                    cy={(hover.y / 100) * 240}
                    r="4.5"
                    fill="#fff"
                    stroke="#a855f7"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              )}
            </svg>
          )}

          {/* X-axis labels */}
          {history.length >= 2 && (
            <div className="absolute left-[70px] right-2 bottom-0 flex justify-between font-mono text-[10.5px] text-slate-600">
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
                const idx = Math.round(p * (history.length - 1));
                const d = new Date(history[idx].date);
                return (
                  <span key={i}>
                    {`${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`}
                  </span>
                );
              })}
            </div>
          )}

          {/* Tooltip */}
          {hover && (
            <div
              className="absolute pointer-events-none px-3 py-2.5 rounded-[10px] border border-slate-600/40 bg-slate-950/95 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.6)] whitespace-nowrap z-10"
              style={{
                left: `calc(70px + ${hover.x}% - ${hover.x * 0.78}px)`,
                top: `${hover.y * 0.91}%`,
                transform: "translate(-50%, -100%)",
                marginTop: -10,
              }}
            >
              <div className="text-[10.5px] uppercase tracking-[0.08em] text-slate-400 mb-1">
                {new Date(hover.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
              </div>
              <div className="font-mono font-bold text-[14px] text-white tabular-nums">
                {currency}{hover.value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function ArrowIcon({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "up") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 17 17 7" />
        <path d="M8 7h9v9" />
      </svg>
    );
  }
  if (dir === "down") {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 7 17 17" />
        <path d="M17 8v9H8" />
      </svg>
    );
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M5 12h14" />
    </svg>
  );
}
