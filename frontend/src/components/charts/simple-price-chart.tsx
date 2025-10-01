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
    console.log('[SimplePriceChart] Processing data:', data.length, 'items');
    console.log('[SimplePriceChart] First item:', data[0]);
    
    if (!data.length) {
      console.log('[SimplePriceChart] No data available');
      return [];
    }

    const prices = data.map((item) => item.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    console.log('[SimplePriceChart] Raw prices range:', minPrice, 'to', maxPrice);

    // Percentage-based outlier detection (more suitable for varying price ranges)
    // Calculate median
    const sortedPrices = [...prices].sort((a, b) => a - b);
    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
    
    // Only filter if there are EXTREME outliers (>500% of median)
    // This prevents filtering normal variations in low-price items
    const lowerBound = median * 0.20; // 80% below median
    const upperBound = median * 6.0;  // 500% above median (catches $120 when median is ~$0.05)
    
    console.log('[SimplePriceChart] Median:', median, 'Outlier bounds:', lowerBound, 'to', upperBound);

    // Only cap extreme outliers, keep normal variations
    const cleanedData = data.map((item) => {
      const price = item.price;
      if (price < lowerBound || price > upperBound) {
        const cappedPrice = Math.max(lowerBound, Math.min(upperBound, price));
        console.log('[SimplePriceChart] Capping outlier:', price, '->', cappedPrice);
        return {
          ...item,
          price: cappedPrice
        };
      }
      return item;
    });

    const cleanedPrices = cleanedData.map(item => item.price);
    console.log('[SimplePriceChart] Cleaned prices range:', Math.min(...cleanedPrices), 'to', Math.max(...cleanedPrices));

    const result = cleanedData.map((item, index) => ({
      date: new Date(item.date).toLocaleDateString(),
      price: item.price,
      ...(movingAverage === "7" && {
        ma7: calculateMovingAverage(cleanedPrices, 7)[index],
      }),
      ...(movingAverage === "30" && {
        ma30: calculateMovingAverage(cleanedPrices, 30)[index],
      }),
    }));

    console.log('[SimplePriceChart] Chart data prepared:', result.length, 'points');
    console.log('[SimplePriceChart] Sample data:', result.slice(0, 3));
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
    <div className={`w-full h-96 ${className}`}>
      <ResponsiveContainer width="100%" height={400}>
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
          />
          <YAxis 
            className="text-xs fill-muted-foreground"
            tickLine={false}
            axisLine={false}
            scale={scale === "log" ? "log" : "linear"}
            domain={scale === "log" ? ["dataMin", "dataMax"] : ["auto", "auto"]}
            tickFormatter={(value) => formatUSD(value)}
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
