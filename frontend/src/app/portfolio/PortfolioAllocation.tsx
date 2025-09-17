// frontend/src/app/portfolio/PortfolioAllocation.tsx — [Frontend]
// {/* Portfolio Allocation Component using Shadcn UI Charts */}
"use client";
import { PortfolioAllocationChart } from "@/components/charts/portfolio-allocation-chart";

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

export default function PortfolioAllocation({ portfolio, onFilterChange, activeFilter }: Props) {
  return (
    <div className="space-y-4">
      <PortfolioAllocationChart
        portfolio={portfolio}
        onFilterChange={onFilterChange}
        activeFilter={activeFilter}
      />
    </div>
  );
}