"use client";
import { useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart, ArcElement, Tooltip, Legend } from "chart.js";

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
};

type AllocationData = {
  labels: string[];
  data: number[];
  backgroundColor: string[];
  borderColor: string[];
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

export default function PortfolioAllocation({ portfolio }: Props) {
  const [allocationType, setAllocationType] = useState<"weaponType" | "rarity" | "wear">("weaponType");

  const allocationData = useMemo((): AllocationData => {
    if (!portfolio || portfolio.length === 0) {
      return { labels: [], data: [], backgroundColor: [], borderColor: [] };
    }

    const allocationMap = new Map<string, number>();
    let totalValue = 0;

    // Calculate total portfolio value
    for (const entry of portfolio) {
      const positionValue = entry.avgPrice * entry.amount;
      totalValue += positionValue;
    }

    // Group by selected allocation type
    for (const entry of portfolio) {
      let key = "Unknown";
      
      if (allocationType === "weaponType" && entry.skin.weaponType) {
        key = entry.skin.weaponType;
      } else if (allocationType === "rarity" && entry.skin.rarity) {
        key = entry.skin.rarity;
      } else if (allocationType === "wear" && entry.skin.wear) {
        key = entry.skin.wear;
      }

      const positionValue = entry.avgPrice * entry.amount;
      allocationMap.set(key, (allocationMap.get(key) || 0) + positionValue);
    }

    // Convert to chart data format
    const entries = Array.from(allocationMap.entries())
      .sort((a, b) => b[1] - a[1]); // Sort by value descending

    // Take top 5 + group others
    const topEntries = entries.slice(0, 5);
    const otherValue = entries.slice(5).reduce((sum, [_, value]) => sum + value, 0);

    const labels = topEntries.map(([key, _]) => key);
    const data = topEntries.map(([_, value]) => (value / totalValue) * 100);

    if (otherValue > 0) {
      labels.push("Others");
      data.push((otherValue / totalValue) * 100);
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

    return { labels, data, backgroundColor, borderColor };
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
  };

  if (!portfolio || portfolio.length === 0) {
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
    </div>
  );
}
