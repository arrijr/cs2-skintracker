// frontend/src/app/portfolio/PortfolioChart.tsx — [Frontend]
// {/* Portfolio Chart Component using Shadcn UI Charts */}
"use client";
import { PortfolioHistoryChart } from "@/components/charts/portfolio-history-chart";

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

export default function PortfolioChart({ history, onRangeChange }: Props) {
  return (
    <PortfolioHistoryChart
      history={history}
      onRangeChange={onRangeChange}
    />
  );
}