// /frontend/src/components/charts/CaseSupplyChart.tsx — [Frontend]
// {/* Case Supply Chart - Interactive supply over time visualization */}
"use client";
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface SupplyData {
  id: number;
  date: string;
  remaining: number;
  dropped: number;
  unboxed: number;
  price?: number;
  marketCap?: number;
}

interface CaseSupplyChartProps {
  data: SupplyData[];
  className?: string;
}

export default function CaseSupplyChart({ data, className = "" }: CaseSupplyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">No supply data available</div>
          <div className="text-sm text-gray-500">Supply data will appear here once available</div>
        </div>
      </div>
    );
  }

  // Add info about real data
  const dataInfo = (
    <div className="mb-4 p-3 bg-green-900/20 border border-green-600/30 rounded-lg">
      <div className="flex items-start gap-2">
        <div className="text-green-400 text-sm">✅</div>
        <div className="text-sm text-green-200">
          <strong>Real Data:</strong> Supply history is calculated from actual Steam market sales data (sold7d, sold30d, sold90d) via SteamWebAPI.com. Drops and unboxings are estimated based on real sales patterns.
        </div>
      </div>
    </div>
  );

  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate net change (dropped - unboxed)
  const netChangeData = sortedData.map(item => item.dropped - item.unboxed);

  const chartData = {
    labels: sortedData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Monthly Drops',
        data: sortedData.map(item => item.dropped),
        backgroundColor: 'rgba(59, 130, 246, 0.8)', // blue-500
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'bar' as const, // Monthly Unboxings as bar chart
        label: 'Monthly Unboxings',
        data: sortedData.map(item => item.unboxed),
        backgroundColor: 'rgba(249, 115, 22, 0.6)', // orange-500 with transparency
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Remaining Supply',
        data: sortedData.map(item => item.remaining),
        borderColor: 'rgb(156, 163, 175)', // gray-400
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderDash: [5, 5],
        yAxisID: 'y1',
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Supply Over Time',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold' as const,
        }
      },
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#d1d5db', // gray-300
          usePointStyle: true,
          pointStyle: 'circle',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)', // gray-900
        titleColor: '#ffffff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(75, 85, 99, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            const formattedValue = value >= 1000000 
              ? (value / 1000000).toFixed(1) + 'M'
              : value >= 1000 
                ? (value / 1000).toFixed(1) + 'K'
                : value.toLocaleString();
            
            return `${context.dataset.label}: ${formattedValue}`;
          }
        }
      }
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Date',
          color: '#d1d5db',
        },
        ticks: {
          color: '#9ca3af', // gray-400
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Count',
          color: '#d1d5db',
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return value >= 1000000 
              ? (value / 1000000).toFixed(1) + 'M'
              : value >= 1000 
                ? (value / 1000).toFixed(1) + 'K'
                : value;
          }
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)',
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Cumulative Supply',
          color: '#d1d5db',
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return value >= 1000000 
              ? (value / 1000000).toFixed(1) + 'M'
              : value >= 1000 
                ? (value / 1000).toFixed(1) + 'K'
                : value;
          }
        },
        grid: {
          drawOnChartArea: false,
        }
      }
    }
  };

  return (
    <div className={`w-full h-96 ${className}`}>
      {dataInfo}
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
}
