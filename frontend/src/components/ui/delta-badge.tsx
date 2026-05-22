"use client";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeltaBadgeProps {
  value: number | null | undefined; // percent, e.g. 4.27 = +4.27%
  size?: "xs" | "sm" | "md";
  showIcon?: boolean;
  suffix?: string; // e.g. "today", "all-time"
  className?: string;
}

const sizeMap = {
  xs: { text: "text-xs", icon: "h-3 w-3", gap: "gap-0.5" },
  sm: { text: "text-sm", icon: "h-3 w-3", gap: "gap-1" },
  md: { text: "text-base", icon: "h-4 w-4", gap: "gap-1" },
} as const;

export function DeltaBadge({ value, size = "sm", showIcon = true, suffix, className }: DeltaBadgeProps) {
  const hasValue = value != null && Number.isFinite(value);
  const isPositive = hasValue && value > 0;
  const isNegative = hasValue && value < 0;
  const sz = sizeMap[size];
  const color = isPositive
    ? "text-green-400"
    : isNegative
    ? "text-red-400"
    : "text-slate-400";
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  return (
    <div className={cn("inline-flex items-center", sz.gap, sz.text, color, className)}>
      {showIcon && <Icon className={sz.icon} />}
      <span>
        {hasValue ? `${isPositive ? "+" : ""}${value.toFixed(2)}%` : "—"}
      </span>
      {suffix && <span className="text-slate-400 ml-1">{suffix}</span>}
    </div>
  );
}
