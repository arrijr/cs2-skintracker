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
};

const PERIODS = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
  { label: "5Y", days: 1825 },
  { label: "All", days: null },
];

function filterHistory(history: HistoryEntry[], days: number | null) {
  if (!days) return history;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return history.filter(h => new Date(h.date) >= cutoff);
}

export default function PortfolioChart({ history }: Props) {
  const [selected, setSelected] = useState(2); // Default: 6M

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

  const data: ChartData<"line"> = {
    labels: filtered.map(entry => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: "Portfolio Value",
        data: filtered.map(entry => entry.value),
        fill: false,
        borderColor: "#10b981", // Tailwind emerald-500
        tension: 0.25,
        pointRadius: 0,
      },
    ],
  };

  const options: ChartOptions<"line"> = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { mode: "index", intersect: false },
    },
    scales: {
      x: { grid: { color: "#222" }, ticks: { color: "#bbb" } },
      y: { grid: { color: "#222" }, ticks: { color: "#bbb" } },
    },
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md w-full max-w-3xl mx-auto">
      {/* Zeitraum-Filter */}
      <div className="flex gap-2 mb-6">
        {PERIODS.map((p, i) => (
          <button
            key={p.label}
            className={`px-3 py-1 rounded ${
              i === selected
                ? "bg-emerald-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            }`}
            onClick={() => setSelected(i)}
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
      <Line data={data} options={options} height={300} />
    </div>
  );
}
