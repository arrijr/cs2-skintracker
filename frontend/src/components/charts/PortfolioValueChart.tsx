// /frontend/src/components/charts/PortfolioValueChart.tsx (Frontend)
"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PortfolioValueChartProps {
  data?: Array<{
    date: string;
    value: number;
  }>;
  loading?: boolean;
  className?: string;
}

export default function PortfolioValueChart({ 
  data = [], 
  loading = false,
  className = ""
}: PortfolioValueChartProps) {
  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-zinc-400">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-zinc-400">No data available</div>
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => new Date(d.date).toLocaleDateString()),
    datasets: [
      {
        label: "Portfolio Value",
        data: data.map(d => d.value),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `Value: $${context.parsed.y.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
          color: "#9CA3AF",
        },
        ticks: {
          color: "#9CA3AF",
        },
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Value ($)",
          color: "#9CA3AF",
        },
        ticks: {
          color: "#9CA3AF",
          callback: function(value: any) {
            return `$${value.toFixed(2)}`;
          }
        },
        grid: {
          color: "rgba(156, 163, 175, 0.1)",
        },
      },
    },
  };

  return (
    <div className={`w-full h-64 ${className}`}>
      <Line data={chartData} options={options} />
    </div>
  );
}
