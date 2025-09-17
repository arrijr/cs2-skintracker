// frontend/src/components/charts/PortfolioValueChart.tsx — [Frontend]
// {/* Portfolio Value Chart Component using Shadcn UI Charts */}
"use client";
import { PortfolioValueChart as ShadcnPortfolioValueChart } from "./portfolio-value-chart";

interface PortfolioValueChartProps {
  data?: Array<{
    date: string;
    value: number;
  }>;
  className?: string;
}

export function PortfolioValueChart({ data, className }: PortfolioValueChartProps) {
  return (
    <ShadcnPortfolioValueChart
      data={data}
      className={className}
    />
  );
}