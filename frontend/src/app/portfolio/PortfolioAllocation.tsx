"use client";
import { useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";
import { X } from "lucide-react";

// Chart.js Registration
Chart.register(ArcElement, Tooltip, Legend);

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

type AllocationData = {
  labels: string[];
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
  filterValues: string[]; // Store actual filter values for each segment
};

const WEAPON_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1"
];

const RARITY_COLORS = [
  "#6B7280", // Consumer Grade
  "#10B981", // Industrial Grade
  "#3B82F6", // Mil-Spec Grade
  "#8B5CF6", // Restricted
  "#F59E0B", // Classified
  "#EF4444", // Covert
  "#F97316", // Contraband
];

const WEAR_COLORS = [
  "#10B981", // Factory New
  "#84CC16", // Minimal Wear
  "#F59E0B", // Field-Tested
  "#F97316", // Well-Worn
  "#EF4444", // Battle-Scarred
];

export default function PortfolioAllocation({ portfolio, onFilterChange, activeFilter }: Props) {
  const [allocationType, setAllocationType] = useState<"weaponType" | "rarity" | "wear">("weaponType");

  // Feature flag for click-to-filter
  const FILTER_ENABLED = process.env.NEXT_PUBLIC_PORTFOLIO_ALLOCATION_FILTER === 'true';

  const allocationData = useMemo((): AllocationData => {
    if (!portfolio || portfolio.length === 0) {
      return { labels: [], data: [], backgroundColor: [], borderColor: [], filterValues: [] };
    }

    const allocationMap = new Map<string, number>();
    const filterValueMap = new Map<string, string[]>(); // Map segment labels to actual filter values
    let totalValue = 0;

    // Calculate total portfolio value
    for (const entry of portfolio) {
      const positionValue = entry.avgPrice * entry.amount;
      totalValue += positionValue;
    }

    // Group by selected allocation type
    for (const entry of portfolio) {
      let key = "Unknown";
      let filterValue = "Unknown";
      
      if (allocationType === "weaponType" && entry.skin.weaponType) {
        key = entry.skin.weaponType;
        filterValue = entry.skin.weaponType;
      } else if (allocationType === "rarity" && entry.skin.rarity) {
        key = entry.skin.rarity;
        filterValue = entry.skin.rarity;
      } else if (allocationType === "wear" && entry.skin.wear) {
        key = entry.skin.wear;
        filterValue = entry.skin.wear;
      }

      const positionValue = entry.avgPrice * entry.amount;
      allocationMap.set(key, (allocationMap.get(key) || 0) + positionValue);
      
      // Store filter values for this segment
      if (!filterValueMap.has(key)) {
        filterValueMap.set(key, []);
      }
      filterValueMap.get(key)!.push(filterValue);
    }

    // Convert to chart data format
    const entries = Array.from(allocationMap.entries())
      .sort((a, b) => b[1] - a[1]); // Sort by value descending

    // Take top 5 + group others
    const topEntries = entries.slice(0, 5);
    const otherEntries = entries.slice(5);
    const otherValue = otherEntries.reduce((sum, [_, value]) => sum + value, 0);

    const labels = topEntries.map(([key, _]) => key);
    const data = topEntries.map(([_, value]) => (value / totalValue) * 100);
    const filterValues = topEntries.map(([key, _]) => key);

    if (otherValue > 0) {
      labels.push("Others");
      data.push((otherValue / totalValue) * 100);
      // Collect all filter values for "Others" segment
      const otherFilterValues = otherEntries.flatMap(([key, _]) => filterValueMap.get(key) || []);
      filterValues.push("Others");
    }

    // Assign colors based on allocation type
    let colors: string[];
    if (allocationType === "weaponType") {
      colors = WEAPON_COLORS;
    } else if (allocationType === "rarity") {
      colors = RARITY_COLORS;
    } else {
      colors = WEAR_COLORS;
    }

    const backgroundColor = labels.map((_, index) => colors[index % colors.length]);
    const borderColor = backgroundColor.map(color => color + "80"); // Add transparency

    return { labels, data, backgroundColor, borderColor, filterValues };
  }, [portfolio, allocationType]);

  const chartData = {
    labels: allocationData.labels,
    datasets: [
      {
        data: allocationData.data,
        backgroundColor: allocationData.backgroundColor,
        borderColor: allocationData.borderColor,
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "#9ca3af",
          padding: 20,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#10b981",
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${percentage}%`;
          },
        },
      },
    },
    onClick: (event: any, elements: any[]) => {
      if (!FILTER_ENABLED || !onFilterChange) return;
      
      if (elements.length > 0) {
        const index = elements[0].index;
        const label = allocationData.labels[index];
        const filterValue = allocationData.filterValues[index];
        
        if (label === "Others") {
          // For "Others", we need to collect all the filter values that make up this segment
          const otherFilterValues = (Array.isArray(portfolio) ? portfolio : [])
            .filter(entry => {
              let key = "Unknown";
              if (allocationType === "weaponType" && entry.skin.weaponType) {
                key = entry.skin.weaponType;
              } else if (allocationType === "rarity" && entry.skin.rarity) {
                key = entry.skin.rarity;
              } else if (allocationType === "wear" && entry.skin.wear) {
                key = entry.skin.wear;
              }
              return !allocationData.labels.slice(0, 5).includes(key);
            })
            .map(entry => {
              if (allocationType === "weaponType") return entry.skin.weaponType || "Unknown";
              if (allocationType === "rarity") return entry.skin.rarity || "Unknown";
              if (allocationType === "wear") return entry.skin.wear || "Unknown";
              return "Unknown";
            });
          
          onFilterChange({ type: allocationType, value: "Others", values: otherFilterValues });
        } else {
          onFilterChange({ type: allocationType, value: filterValue });
        }
      }
    },
  };

  const handleClearFilter = () => {
    if (onFilterChange) {
      onFilterChange(null);
    }
  };

  if (!portfolio || !Array.isArray(portfolio) || portfolio.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4">Portfolio Allocation</h3>
        <div className="text-center text-gray-400 py-8">
          No portfolio data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Portfolio Allocation</h3>
        
        {/* Allocation Type Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setAllocationType("weaponType")}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              allocationType === "weaponType"
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Weapon Type
          </button>
          <button
            onClick={() => setAllocationType("rarity")}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              allocationType === "rarity"
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Rarity
          </button>
          <button
            onClick={() => setAllocationType("wear")}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              allocationType === "wear"
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
          >
            Wear
          </button>
        </div>
      </div>

      {/* Active Filter Chip */}
      {FILTER_ENABLED && activeFilter && (
        <div className="mb-4 flex items-center gap-2">
          <div className="bg-emerald-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
            <span>{allocationType === "weaponType" ? "Weapon Type" : allocationType === "rarity" ? "Rarity" : "Wear"}: {activeFilter.value}</span>
            <button
              onClick={handleClearFilter}
              className="hover:bg-emerald-700 rounded-full p-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-64 flex items-center justify-center">
        {allocationData.data.length > 0 ? (
          <Doughnut data={chartData} options={options} />
        ) : (
          <div className="text-center text-gray-400">
            <p>No {allocationType} data available</p>
            <p className="text-sm">Add skins with {allocationType} information</p>
          </div>
        )}
      </div>

      {/* Summary */}
      {allocationData.data.length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          Total: {allocationData.data.reduce((sum, value) => sum + value, 0).toFixed(1)}%
        </div>
      )}

      {/* Click-to-Filter Info */}
      {FILTER_ENABLED && (
        <div className="mt-4 text-center text-xs text-gray-500">
          💡 Click on segments to filter portfolio table
        </div>
      )}
    </div>
  );
}
