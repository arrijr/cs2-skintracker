"use client";
import { useMemo, useState, useRef, useId } from "react";

interface Point {
  date: string;
  price: number;
}

interface PatchMarker {
  date: string;
  label: string;
}

interface SkinPriceChartProps {
  data: Point[];
  patches?: PatchMarker[];
  currency?: string;
  height?: number;
}

/**
 * Hi-fi item-detail price chart — purple→pink gradient line, area fill, patch markers, hover crosshair.
 * Adapted from item-detail-hifi.html.
 */
export function SkinPriceChart({ data, patches = [], currency = "€", height = 280 }: SkinPriceChartProps) {
  const id = useId().replace(/:/g, "");
  const [hover, setHover] = useState<{ i: number; x: number; y: number; p: Point } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const layout = useMemo(() => {
    if (!data || data.length < 2) return null;
    const values = data.map((d) => d.price);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(max - min, 1);
    const padY = 16;

    const xs = (i: number) => (i / (data.length - 1)) * 100;
    const ys = (v: number) => padY + (1 - (v - min) / range) * (100 - padY * 2);

    const pts = data.map((p, i) => ({ x: xs(i), y: ys(p.price), p, i }));

    // Smooth cubic-bezier path
    const line = pts.reduce((acc, pt, i) => {
      if (i === 0) return `M ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
      const prev = pts[i - 1];
      const cpX = (prev.x + pt.x) / 2;
      return acc + ` C ${cpX.toFixed(2)} ${prev.y.toFixed(2)}, ${cpX.toFixed(2)} ${pt.y.toFixed(2)}, ${pt.x.toFixed(2)} ${pt.y.toFixed(2)}`;
    }, "");
    const area = `${line} L 100 100 L 0 100 Z`;

    // Y-axis label values (4 horizontal lines)
    const niceRange = max - min;
    const step = niceRange / 4;
    const yLabels = [0, 1, 2, 3, 4].map((i) => {
      const v = min + step * i;
      return { v, y: ys(v) };
    });

    // X-axis labels (5 evenly spaced dates)
    const xLabelCount = Math.min(5, data.length);
    const xLabels = Array.from({ length: xLabelCount }, (_, i) => {
      const idx = Math.round((i / (xLabelCount - 1)) * (data.length - 1));
      const p = data[idx];
      const d = new Date(p.date);
      return {
        x: (idx / (data.length - 1)) * 100,
        label: `${d.toLocaleDateString("en-GB", { month: "short", day: "numeric" })}`,
      };
    });

    // Patch markers
    const patchLines = patches
      .map((pm) => {
        const t = new Date(pm.date).getTime();
        const idx = data.findIndex((d) => new Date(d.date).getTime() >= t);
        if (idx < 0) return null;
        return { x: xs(idx), label: pm.label };
      })
      .filter(Boolean) as Array<{ x: number; label: string }>;

    return { pts, line, area, yLabels, xLabels, patchLines, min, max };
  }, [data, patches]);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || !layout) return;
    const rect = svgRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    let best = layout.pts[0];
    let bestDist = Infinity;
    for (const pt of layout.pts) {
      const d = Math.abs(pt.x - xPct);
      if (d < bestDist) {
        bestDist = d;
        best = pt;
      }
    }
    setHover({ i: best.i, x: best.x, y: best.y, p: best.p });
  };

  if (!layout) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 text-sm"
        style={{ height }}
      >
        Not enough price history yet.
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full cursor-crosshair"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`Price chart, ${data.length} points`}
      >
        <defs>
          <linearGradient id={`fill-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={`stroke-${id}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {layout.yLabels.map((l, i) => (
          <line
            key={i}
            x1="0"
            x2="100"
            y1={l.y}
            y2={l.y}
            stroke="rgba(120,130,170,0.08)"
            strokeWidth="0.2"
            strokeDasharray="0.5,0.7"
          />
        ))}

        {/* Area + line */}
        <path d={layout.area} fill={`url(#fill-${id})`} />
        <path
          d={layout.line}
          stroke={`url(#stroke-${id})`}
          strokeWidth="0.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{ filter: "drop-shadow(0 0 4px rgba(168,85,247,0.5))" }}
        />

        {/* Patch markers */}
        {layout.patchLines.map((pm, i) => (
          <g key={i}>
            <line
              x1={pm.x}
              x2={pm.x}
              y1="0"
              y2="100"
              stroke="rgba(245,185,72,0.4)"
              strokeWidth="0.3"
              strokeDasharray="0.5,0.6"
            />
          </g>
        ))}

        {/* Last-point dot */}
        <circle
          cx={layout.pts[layout.pts.length - 1].x}
          cy={layout.pts[layout.pts.length - 1].y}
          r="0.9"
          fill="#ec4899"
          stroke="#0c1018"
          strokeWidth="0.3"
          vectorEffect="non-scaling-stroke"
        />

        {/* Hover crosshair + dot */}
        {hover && (
          <>
            <line
              x1={hover.x}
              x2={hover.x}
              y1="0"
              y2="100"
              stroke="#a855f7"
              strokeWidth="0.3"
              strokeDasharray="0.5,0.5"
              vectorEffect="non-scaling-stroke"
              opacity="0.8"
            />
            <circle
              cx={hover.x}
              cy={hover.y}
              r="0.7"
              fill="#ec4899"
              stroke="#0c1018"
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          </>
        )}
      </svg>

      {/* Y-axis labels (left overlay) */}
      <div className="absolute inset-0 pointer-events-none">
        {layout.yLabels.map((l, i) => (
          <span
            key={i}
            className="absolute font-mono text-[10px] text-slate-600 tabular-nums"
            style={{ left: 4, top: `${l.y}%`, transform: "translateY(-50%)" }}
          >
            {currency}{l.v.toFixed(0)}
          </span>
        ))}
      </div>

      {/* X-axis labels (bottom overlay) */}
      <div className="absolute bottom-[-22px] left-0 right-0 flex justify-between font-mono text-[10px] text-slate-600">
        {layout.xLabels.map((l, i) => (
          <span key={i} style={{ position: "absolute", left: `${l.x}%`, transform: "translateX(-50%)" }}>
            {l.label}
          </span>
        ))}
      </div>

      {/* Patch labels (top overlay) */}
      <div className="absolute top-1 left-0 right-0 pointer-events-none">
        {layout.patchLines.map((pm, i) => (
          <span
            key={i}
            className="absolute font-mono text-[10px] font-bold text-amber-400 whitespace-nowrap"
            style={{ left: `${pm.x}%`, transform: "translateX(4px)" }}
          >
            {pm.label}
          </span>
        ))}
      </div>

      {/* Hover tooltip */}
      {hover && (
        <div
          className="absolute pointer-events-none z-10 px-3 py-2 rounded-lg bg-slate-950/95 border border-slate-700 shadow-xl whitespace-nowrap"
          style={{
            left: `min(${hover.x}%, calc(100% - 140px))`,
            top: `${hover.y}%`,
            transform: "translate(12px, -50%)",
          }}
        >
          <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-0.5">
            {new Date(hover.p.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })}
          </div>
          <div className="font-mono font-bold text-pink-400 tabular-nums">
            {currency}{hover.p.price.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}
