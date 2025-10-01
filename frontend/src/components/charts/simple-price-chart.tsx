// frontend/src/components/charts/simple-price-chart.tsx — [Frontend]
// {/* Simple Price History Chart Component */}
"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { formatUSD } from "@/lib/num";

type PriceHistory = {
  date: string;
  price: number;
};

type Props = {
  data: PriceHistory[];
  range: string;
  scale: "linear" | "log";
  movingAverage?: "7" | "30" | "none";
  className?: string;
};

export function SimplePriceChart({
  data,
  range,
  scale,
  movingAverage = "none",
  className,
}: Props) {
  const chartData = useMemo(() => {
    if (!data.length) return [];

    const prices = data.map((item) => item.price);

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

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        No price data available for this time range
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
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
          <CartesianGrid strokeDasharray="1 3" className="stroke-muted/15" />
          <XAxis 
            dataKey="date" 
            className="text-xs fill-muted-foreground"
            tickLine={false}
            axisLine={false}
            tickCount={5}
            minTickGap={30}
          />
          <YAxis 
            className="text-xs fill-muted-foreground"
            tickLine={false}
            axisLine={false}
            scale={scale === "log" ? "log" : "linear"}
            domain={scale === "log" ? ["dataMin", "dataMax"] : [(dataMin: number) => dataMin * 0.95, (dataMax: number) => dataMax * 1.10]}
            tickFormatter={(value) => formatUSD(value)}
            tickCount={5}
          />
          <Tooltip
            formatter={(value, name) => [
              formatUSD(value as number),
              name === "price" ? "Price" : name === "ma7" ? "MA 7" : "MA 30",
            ]}
            labelFormatter={(value) => `Date: ${value}`}
          />
          
          {/* Main price area */}
          <Area
            type="monotone"
            dataKey="price"
            stroke="hsl(221.2 83.2% 53.3%)"
            fill="hsl(221.2 83.2% 53.3%)"
            fillOpacity={0.05}
            strokeWidth={1.5}
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
              strokeWidth={1.5}
              strokeDasharray="5 5"
              strokeOpacity={0.8}
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
              strokeWidth={1.5}
              strokeDasharray="10 5"
              strokeOpacity={0.8}
              dot={false}
              activeDot={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
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
