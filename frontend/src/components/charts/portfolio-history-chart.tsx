// frontend/src/components/charts/portfolio-history-chart.tsx — [Frontend]
// {/* Portfolio History Chart Component using Shadcn UI Charts */}
"use client";

import React, { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatUSD } from "@/lib/num";

type HistoryEntry = {
  id: number;
  userId: number;
  date: string;
  value: number;
};

type Props = {
  history: HistoryEntry[];
  onRangeChange?: (range: string, days: number | null) => void;
};

const PERIODS = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "All", days: null },
];

export function PortfolioHistoryChart({ history, onRangeChange }: Props) {
  const [selectedPeriod, setSelectedPeriod] = React.useState("1M");

  const chartData = useMemo(() => {
    if (!history.length) return [];

    const selectedPeriodData = PERIODS.find(p => p.label === selectedPeriod);
    const days = selectedPeriodData?.days;
    
    let filteredHistory = history;
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      filteredHistory = history.filter(entry => 
        new Date(entry.date) >= cutoffDate
      );
    }

    return filteredHistory
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((entry) => ({
        date: new Date(entry.date).toLocaleDateString(),
        value: entry.value,
        formattedValue: formatUSD(entry.value),
      }));
  }, [history, selectedPeriod]);

  const config = {
    value: {
      label: "Portfolio Value",
      color: "hsl(var(--primary))",
    },
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const periodData = PERIODS.find(p => p.label === period);
    if (onRangeChange) {
      onRangeChange(period, periodData?.days || null);
    }
  };

  if (!history.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No portfolio history data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Period Selector */}
      <div className="flex gap-2 justify-center">
        {PERIODS.map((period) => (
          <button
            key={period.label}
            onClick={() => handlePeriodChange(period.label)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedPeriod === period.label
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      <ChartContainer
        config={config}
        className="w-full h-64"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              className="text-xs fill-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatUSD(value)}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => `Date: ${value}`}
                  formatter={(value, name) => [
                    formatUSD(value as number),
                    "Portfolio Value",
                  ]}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--color-value)"
              fill="var(--color-value)"
              fillOpacity={0.1}
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: "var(--color-value)",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
