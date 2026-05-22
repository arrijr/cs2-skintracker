"use client";
import { useMemo, useState, useRef, useId } from "react";

interface Point {
  date: string;
  value: number;
}

interface PortfolioValueChartProps {
  data: Point[];
  /** "up" tints pos, "down" tints neg, "flat" stays brand purple. */
  trend?: "up" | "down" | "flat";
  height?: number;
  currency?: string;
  className?: string;
}

/**
 * CS:HUD-style portfolio area chart — purple-500 stroke on slate-950 backdrop with
 * faint radar grid lines reminiscent of de_dust2 minimap overlays. No axes/frame.
 * Renamed from TerminalAreaChart (Bloomberg-y) — stays on-brand for SkinTrackr.
 */
export function PortfolioValueChart({
  data,
  trend = "flat",
  height = 220,
  currency = "€",
  className,
}: PortfolioValueChartProps) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<{ x: number; y: number; point: Point; i: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Brand purple base. CS HUD red on clearly negative trend.
  const stroke = trend === "down" ? "#ef4444" : "#a855f7";
  const strokeEnd = trend === "down" ? "#f43f5e" : "#ec4899";

  const { path, areaPath, points, min, max } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: "", areaPath: "", points: [] as Array<{ x: number; y: number; p: Point }>, min: 0, max: 0 };
    }
    const values = data.map((d) => d.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const rangeV = Math.max(maxV - minV, 1);

    const padTop = 12;
    const padBottom = 18;
    const drawH = 100 - padTop - padBottom;

    const pts = data.map((p, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * 100;
      const y = padTop + (1 - (p.value - minV) / rangeV) * drawH;
      return { x, y, p };
    });

    const linePath = pts.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = pts[i - 1];
      const cpX = (prev.x + pt.x) / 2;
      return acc + ` C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
    }, "");
    const fillPath = `${linePath} L 100 100 L 0 100 Z`;

    return { path: linePath, areaPath: fillPath, points: pts, min: minV, max: maxV };
  }, [data]);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    let nearest = points[0];
    let nearestI = 0;
    let nearestDist = Infinity;
    points.forEach((pt, i) => {
      const d = Math.abs(pt.x - xPct);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = pt;
        nearestI = i;
      }
    });
    setHover({ x: nearest.x, y: nearest.y, point: nearest.p, i: nearestI });
  };

  if (data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-slate-400 text-sm ${className ?? ""}`}
        style={{ height }}
      >
        No history yet — check back after the next price refresh.
      </div>
    );
  }

  const dateLabels = useMemo(() => {
    if (data.length < 2) return [];
    const first = data[0];
    const mid = data[Math.floor(data.length / 2)];
    const last = data[data.length - 1];
    return [first, mid, last].map((p) => {
      const d = new Date(p.date);
      return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    });
  }, [data]);

  return (
    <div className={`relative ${className ?? ""}`} style={{ height }}>
      {/* Y-axis range labels — CS HUD mono */}
      <div className="absolute top-0 left-0 font-mono text-[0.65rem] text-slate-400 tabular-nums pointer-events-none">
        {currency}{max.toFixed(2)}
      </div>
      <div className="absolute bottom-5 left-0 font-mono text-[0.65rem] text-slate-400 tabular-nums pointer-events-none">
        {currency}{min.toFixed(2)}
      </div>

      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`Area chart from ${currency}${min.toFixed(2)} to ${currency}${max.toFixed(2)}`}
      >
        <defs>
          {/* HUD-grid pattern — 4 horizontal + 8 vertical lines, ultra-subtle */}
          <pattern id={`grid-${id}`} width="12.5" height="25" patternUnits="userSpaceOnUse">
            <path d="M 12.5 0 L 0 0 0 25" fill="none" stroke="rgba(168,85,247,0.06)" strokeWidth="0.15" vectorEffect="non-scaling-stroke" />
          </pattern>
          {/* Area fill — purple-500/15 brand-consistent */}
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`line-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={stroke} />
            <stop offset="100%" stopColor={strokeEnd} />
          </linearGradient>
        </defs>

        {/* HUD radar grid behind the chart */}
        <rect width="100" height="100" fill={`url(#grid-${id})`} />

        {/* Area fill */}
        <path d={areaPath} fill={`url(#g-${id})`} />

        {/* Line — purple → pink gradient stroke */}
        <path
          d={path}
          fill="none"
          stroke={`url(#line-${id})`}
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{ filter: `drop-shadow(0 0 6px ${stroke}80)` }}
        />

        {/* Hover crosshair */}
        {hover && (
          <>
            <line
              x1={hover.x}
              y1="0"
              x2={hover.x}
              y2="100"
              stroke={stroke}
              strokeWidth="0.3"
              strokeDasharray="1,1"
              vectorEffect="non-scaling-stroke"
              opacity="0.8"
            />
            <circle
              cx={hover.x}
              cy={hover.y}
              r="0.8"
              fill={stroke}
              stroke="#0f172a"
              strokeWidth="0.4"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>

      {/* X-axis date labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between font-mono text-[0.6rem] text-slate-600 uppercase tracking-[0.15em] pointer-events-none">
        {dateLabels.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      {/* Hover tooltip */}
      {hover && (
        <div
          className="absolute pointer-events-none px-2 py-1 bg-slate-950 border border-slate-700 font-mono text-xs tabular-nums whitespace-nowrap"
          style={{
            left: `min(${hover.x}%, calc(100% - 120px))`,
            top: `${hover.y}%`,
            transform: "translate(8px, -50%)",
            color: stroke,
          }}
        >
          <div className="text-slate-400 text-[0.6rem] uppercase tracking-[0.15em]">
            {new Date(hover.point.date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "2-digit",
            })}
          </div>
          <div className="font-semibold">
            {currency}{hover.point.value.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
