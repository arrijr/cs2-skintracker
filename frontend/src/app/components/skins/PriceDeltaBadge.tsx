"use client";
{/* Price Delta Badge (24h) */}
import { formatUSD, numberOrNull } from "@/lib/num";

export default function PriceDeltaBadge({ current, yesterday }:{
  current: number | string | null; yesterday: number | string | null;
}) {
  const c = numberOrNull(current), y = numberOrNull(yesterday);
  if (c === null || y === null) return null;
  const abs = c - y;
  const pct = y === 0 ? 0 : (abs / y) * 100;
  const up = abs >= 0;
  return (
    <span className={`px-2 py-0.5 rounded text-xs ${up ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
      {up ? "▲" : "▼"} {formatUSD(abs)} ({pct.toFixed(2)}%)
    </span>
  );
}
