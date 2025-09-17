// frontend/src/components/charts/price-history-chart.tsx — [Frontend]
// {/* Price History Chart Component using Shadcn UI Charts */}
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
  Legend,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import { formatUSD } from "@/lib/num";

type PriceHistory = {
  date: string;
  price: number;
};

type PriceHistoryChartProps = {
  data: PriceHistory[];
  range: string;
  scale: "linear" | "log";
  movingAverage?: "7" | "30" | "none";
  className?: string;
};

export function PriceHistoryChart({
  data,
  range,
  scale,
  movingAverage = "none",
  className,
}: PriceHistoryChartProps) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    const prices = data.map((item) => item.price);
    const labels = data.map((item) => new Date(item.date).toLocaleDateString());

    const result = data.map((item, index) => ({
      date: new Date(item.date).toLocaleDateString(),
      price: item.price,
      ...(movingAverage === "7" && {
        ma7: calculateMovingAverage(prices, 7)[index],
      }),
      ...(movingAverage === "30" && {
        ma30: calculateMovingAverage(prices, 30)[index],
      }),
    }));

    return result;
  }, [data, movingAverage]);

  const config = {
    price: {
      label: "Price",
      color: "hsl(221.2 83.2% 53.3%)", // Blue-600
    },
    ma7: {
      label: "MA 7",
      color: "hsl(142.1 76.2% 36.3%)", // Green-600
    },
    ma30: {
      label: "MA 30", 
      color: "hsl(0 84.2% 60.2%)", // Red-500
    },
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No price data available for this time range
      </div>
    );
  }

  return (
    <ChartContainer
      config={config}
      className={className}
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
            scale={scale === "log" ? "log" : "linear"}
            domain={scale === "log" ? ["dataMin", "dataMax"] : ["auto", "auto"]}
            tickFormatter={(value) => formatUSD(value)}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="dot"
                labelFormatter={(value) => `Date: ${value}`}
                formatter={(value, name) => [
                  formatUSD(value as number),
                  config[name as keyof typeof config]?.label || name,
                ]}
              />
            }
          />
          <ChartLegend
            content={
              <ChartLegendContent
                nameKey="label"
              />
            }
          />
          
          {/* Main price area */}
          <Area
            type="monotone"
            dataKey="price"
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
          
          {/* Moving averages */}
          {movingAverage === "7" && (
            <Area
              type="monotone"
              dataKey="ma7"
              stroke="hsl(142.1 76.2% 36.3%)"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={false}
            />
          )}
          
          {movingAverage === "30" && (
            <Area
              type="monotone"
              dataKey="ma30"
              stroke="hsl(0 84.2% 60.2%)"
              fill="transparent"
              strokeWidth={2}
              strokeDasharray="10 5"
              dot={false}
              activeDot={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

// Helper function to calculate moving average
function calculateMovingAverage(prices: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const avg = slice.reduce((sum, price) => sum + price, 0) / period;
      result.push(avg);
    }
  }
  return result;
}
