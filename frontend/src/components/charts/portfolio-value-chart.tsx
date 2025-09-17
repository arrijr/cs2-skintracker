// frontend/src/components/charts/portfolio-value-chart.tsx — [Frontend]
// {/* Portfolio Value Chart Component using Shadcn UI Charts */}
"use client";

import { useMemo } from "react";
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

interface PortfolioValueChartProps {
  data?: Array<{
    date: string;
    value: number;
  }>;
  className?: string;
}

export function PortfolioValueChart({ data = [], className }: PortfolioValueChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    return data.map((item) => ({
      date: new Date(item.date).toLocaleDateString(),
      value: item.value,
      formattedValue: formatUSD(item.value),
    }));
  }, [data]);

  const config = {
    value: {
      label: "Portfolio Value",
      color: "hsl(221.2 83.2% 53.3%)", // Blue-600
    },
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No portfolio history data available
      </div>
    );
  }

  return (
    <ChartContainer
      config={config}
      className={className || "w-full h-64"}
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
            stroke="hsl(221.2 83.2% 53.3%)"
            fill="hsl(221.2 83.2% 53.3%)"
            fillOpacity={0.1}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: "hsl(221.2 83.2% 53.3%)",
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
