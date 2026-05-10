"use client";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { tokens } from "@/lib/design-tokens";

interface KPICardProps {
  label: string;
  value: string;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
}

export function KPICard({ label, value, delta, deltaLabel, icon }: KPICardProps) {
  const isPositive = (delta ?? 0) >= 0;
  return (
    <Card className={`${tokens.bg.surface} ${tokens.border.default} ${tokens.border.hover} transition-colors`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-2">
          <span className={`text-sm font-medium ${tokens.text.muted}`}>{label}</span>
          {icon}
        </div>
        <div className={`text-3xl font-bold ${tokens.text.primary} mb-1`}>{value}</div>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${isPositive ? tokens.text.success : tokens.text.danger}`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{isPositive ? '+' : ''}{delta.toFixed(2)}%</span>
            {deltaLabel && <span className={tokens.text.muted}>{deltaLabel}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
