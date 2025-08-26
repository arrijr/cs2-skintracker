"use client";
import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import type { ChartData, ChartOptions } from "chart.js";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from "chart.js";

// Chart.js Registration
Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

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

const PERIODS = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "All", days: null },
];

function filterHistory(history: HistoryEntry[], days: number | null) {
  if (!days) return history;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return history.filter(h => new Date(h.date) >= cutoff);
}

export default function PortfolioChart({ history, onRangeChange }: Props) {
  const [selected, setSelected] = useState(1); // Default: 1M

  const filtered = useMemo(
    () => filterHistory(history, PERIODS[selected].days),
    [history, selected]
  );

  // Value-Change-Stats
  const latestValue = filtered.length > 0 ? filtered[filtered.length - 1].value : 0;
  const firstValue = filtered.length > 0 ? filtered[0].value : 0;
  const valueDiff = latestValue - firstValue;
  const valuePct = firstValue !== 0 ? ((latestValue - firstValue) / firstValue) * 100 : 0;

  const valueDiffSign = valueDiff >= 0 ? "+" : "-";
  const valueDiffClass = valueDiff >= 0 ? "text-emerald-400" : "text-red-400";

  // Notify parent of range change
  const handleRangeChange = (index: number) => {
    setSelected(index);
    if (onRangeChange) {
      onRangeChange(PERIODS[index].label, PERIODS[index].days);
    }
  };

  const chartData: ChartData<"line"> = {
    labels: filtered.map(entry => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: "Portfolio Value",
        data: filtered.map(entry => entry.value),
        fill: false,
        borderColor: "#10b981", // Tailwind emerald-500
        backgroundColor: "rgba(16, 185, 129, 0.1)",
        tension: 0.25,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "#10b981",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { 
        mode: "index", 
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#10b981",
        borderWidth: 1,
        callbacks: {
          title: function(context) {
            const date = new Date(context[0].label);
            return date.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            });
          },
          label: function(context) {
            const value = context.parsed.y;
            return `Value: $${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          },
          afterLabel: function(context) {
            if (context.dataIndex > 0) {
              const currentValue = context.parsed.y;
              const previousValue = context.dataset.data[context.dataIndex - 1] as number;
              const change = currentValue - previousValue;
              const changePercent = previousValue > 0 ? (change / previousValue) * 100 : 0;
              const sign = change >= 0 ? "+" : "";
              return `Change: ${sign}$${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
            }
            return null;
          }
        }
      },
    },
    scales: {
      x: { 
        grid: { color: "#374151" }, 
        ticks: { color: "#9ca3af" },
        border: { color: "#374151" }
      },
      y: { 
        grid: { color: "#374151" }, 
        ticks: { 
          color: "#9ca3af",
          callback: function(value) {
            return '$' + Number(value).toLocaleString('en-US', { 
              minimumFractionDigits: 0, 
              maximumFractionDigits: 0 
            });
          }
        },
        border: { color: "#374151" },
        beginAtZero: false, // Auto-scale based on data
      },
    },
    interaction: {
      intersect: false,
      mode: 'index',
    },
    elements: {
      point: {
        hoverRadius: 6,
      },
    },
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md w-full max-w-3xl mx-auto">
      {/* Zeitraum-Filter */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p, i) => (
          <button
            key={p.label}
            className={`px-3 py-1 rounded transition-colors ${
              i === selected
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            onClick={() => handleRangeChange(i)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Wert-Badge mit %-Veränderung */}
      <div className="mb-6 flex items-center gap-4">
        <div className="text-3xl font-bold">
          {latestValue.toLocaleString("en-US", { style: "currency", currency: "USD" })}
        </div>
        <div className={`text-lg font-semibold ${valueDiffClass}`}>
          {valueDiffSign}
          {Math.abs(valuePct).toFixed(2)}%
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
