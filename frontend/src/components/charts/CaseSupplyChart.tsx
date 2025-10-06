// /frontend/src/components/charts/CaseSupplyChart.tsx — [Frontend]
// {/* Case Supply Chart - Real SteamWebAPI.com market data visualization */}
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
  offerVolume?: number;
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
          <strong>Real Market Data:</strong> Offer volume and sales data from SteamWebAPI.com. Shows actual Steam market activity - current offers available and daily sales volume over 90 days.
        </div>
      </div>
    </div>
  );

  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate daily sales from cumulative data
  const dailySalesData = sortedData.map((item, index) => {
    if (index === 0) return 0;
    const prevItem = sortedData[index - 1];
    return Math.max(0, item.dropped - prevItem.dropped);
  });

  const chartData = {
    labels: sortedData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Daily Sales Volume',
        data: dailySalesData,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Offer Volume',
        data: sortedData.map(item => item.offerVolume || 0),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.1,
        yAxisID: 'y1',
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#d1d5db',
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#d1d5db',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          title: (context: any) => {
            return new Date(sortedData[context[0].dataIndex].date).toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
          },
          label: (context: any) => {
            const dataIndex = context.dataIndex;
            const datasetLabel = context.dataset.label;
            const value = context.parsed.y;
            
            if (datasetLabel === 'Daily Sales Volume') {
              return `${datasetLabel}: ${value.toLocaleString()} cases sold`;
            } else if (datasetLabel === 'Offer Volume') {
              return `${datasetLabel}: ${value.toLocaleString()} offers available`;
            }
            
            return `${datasetLabel}: ${value.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          maxTicksLimit: 8,
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Daily Sales Volume',
          color: '#9ca3af',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: 'Offer Volume',
          color: '#9ca3af',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return value.toLocaleString();
          }
        },
      },
    },
  };

  return (
    <div className={`w-full h-96 ${className}`}>
      {dataInfo}
      <Chart type="bar" data={chartData} options={options} />
    </div>
  );
}