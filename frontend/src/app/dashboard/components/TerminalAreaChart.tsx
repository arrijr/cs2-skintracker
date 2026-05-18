"use client";
import { useMemo, useState, useRef, useId } from "react";

interface Point {
  date: string;
  value: number;
}

interface TerminalAreaChartProps {
  data: Point[];
  /** "up" tints green, "down" tints red, "flat" tints slate. */
  trend?: "up" | "down" | "flat";
  height?: number;
  currency?: string;
  className?: string;
}

/**
 * Custom SVG area chart — terminal-brutalist style.
 * No axes/grid frame. Gradient fill matches trend. Dashed crosshair on hover.
 * Designed to bleed full-width inside hero card.
 */
export function TerminalAreaChart({
  data,
  trend = "flat",
  height = 220,
  currency = "€",
  className,
}: TerminalAreaChartProps) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<{ x: number; y: number; point: Point; i: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Use brand purple as default, only swap to red on clearly negative trend.
  // Gaming/Robinhood vibe — keep it vibrant, not just green/red.
  const stroke =
    trend === "down" ? "#ef4444" : "#a855f7"; // pink-500 base, red on down
  const strokeEnd =
    trend === "down" ? "#f43f5e" : "#ec4899"; // gradient end stop (pink-500)

  const { path, areaPath, points, min, max, range } = useMemo(() => {
    if (!data || data.length === 0) {
      return { path: "", areaPath: "", points: [] as Array<{ x: number; y: number; p: Point }>, min: 0, max: 0, range: 0 };
    }
    const values = data.map((d) => d.value);
    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const rangeV = Math.max(maxV - minV, 1);

    // Padding so line doesn't kiss edges
    const padTop = 12;
    const padBottom = 18;
    const drawH = 100 - padTop - padBottom; // %

    const pts = data.map((p, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * 100;
      const y = padTop + (1 - (p.value - minV) / rangeV) * drawH;
      return { x, y, p };
    });

    // Smooth Catmull-Rom-ish path using cubic Bezier control points.
    const linePath = pts.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = pts[i - 1];
      // Control points at 1/2 of segment width — cheap smoothing
      const cpX = (prev.x + pt.x) / 2;
      return acc + ` C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
    }, "");
    const fillPath = `${linePath} L 100 100 L 0 100 Z`;

    return { path: linePath, areaPath: fillPath, points: pts, min: minV, max: maxV, range: rangeV };
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
        className={`flex items-center justify-center text-slate-500 text-sm ${className ?? ""}`}
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
      {/* Y-axis range labels (top-left + bottom-left, terminal style) */}
      <div className="absolute top-0 left-0 font-mono text-[0.65rem] text-slate-500 tabular-nums pointer-events-none">
        {currency}{max.toFixed(2)}
      </div>
      <div className="absolute bottom-5 left-0 font-mono text-[0.65rem] text-slate-500 tabular-nums pointer-events-none">
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
          {/* Vertical fill gradient — fades to transparent */}
          <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.45" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
          {/* Horizontal line gradient — purple to pink (or red gradient on down) */}
          <linearGradient id={`line-${id}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={stroke} />
            <stop offset="100%" stopColor={strokeEnd} />
          </linearGradient>
        </defs>

        {/* Area fill */}
        <path d={areaPath} fill={`url(#g-${id})`} />

        {/* Line — gradient stroke + smooth curve via path data */}
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
