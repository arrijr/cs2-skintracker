// frontend/src/components/charts/portfolio-allocation-chart.tsx — [Frontend]
// {/* Portfolio Allocation Chart Component using Shadcn UI Charts */}
"use client";

import { useMemo } from "react";
import {
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
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

type PortfolioEntry = {
  id: number;
  amount: number;
  avgPrice: number;
  skin: {
    id: number;
    name: string;
    weaponType?: string;
    rarity?: string;
    wear?: string;
  };
};

type Props = {
  portfolio: PortfolioEntry[];
  onFilterChange?: (filter: { type: string; value: string } | null) => void;
  activeFilter?: { type: string; value: string } | null;
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
  "hsl(var(--muted))",
  "hsl(var(--destructive))",
];

export function PortfolioAllocationChart({
  portfolio,
  onFilterChange,
  activeFilter,
}: Props) {
  const chartData = useMemo(() => {
    if (!portfolio.length) return [];

    // Group by weapon type
    const weaponGroups = portfolio.reduce((acc, entry) => {
      const weaponType = entry.skin.weaponType || "Unknown";
      const currentValue = entry.amount * entry.avgPrice;
      
      if (!acc[weaponType]) {
        acc[weaponType] = {
          weaponType,
          value: 0,
          count: 0,
          skins: [],
        };
      }
      
      acc[weaponType].value += currentValue;
      acc[weaponType].count += entry.amount;
      acc[weaponType].skins.push(entry);
      
      return acc;
    }, {} as Record<string, any>);

    const totalValue = Object.values(weaponGroups).reduce(
      (sum: number, group: any) => sum + group.value,
      0
    );

    return Object.values(weaponGroups)
      .map((group: any, index) => ({
        name: group.weaponType,
        value: group.value,
        percentage: ((group.value / totalValue) * 100).toFixed(1),
        count: group.count,
        color: COLORS[index % COLORS.length],
        skins: group.skins,
      }))
      .sort((a, b) => b.value - a.value);
  }, [portfolio]);

  const config = {
    value: {
      label: "Value",
    },
  };

  if (!portfolio.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No portfolio data available
      </div>
    );
  }

  return (
    <ChartContainer
      config={config}
      className="w-full h-64"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  if (onFilterChange) {
                    const isActive = activeFilter?.type === "weapon" && 
                      activeFilter?.value === entry.name;
                    onFilterChange(
                      isActive 
                        ? null 
                        : { type: "weapon", value: entry.name }
                    );
                  }
                }}
              />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={(value, name, props) => [
                  formatUSD(value as number),
                  `${props.payload?.name} (${props.payload?.percentage}%)`,
                ]}
              />
            }
          />
          <ChartLegend
            content={
              <ChartLegendContent
                nameKey="name"
                className="flex flex-wrap justify-center gap-4"
              />
            }
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
