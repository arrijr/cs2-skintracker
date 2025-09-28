// /frontend/src/components/charts/CasePriceChart.tsx — [Frontend]
// {/* Case Price Chart - Interactive price history visualization */}
"use client";
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface PriceData {
  id: number;
  date: string;
  price: number;
  marketCap?: number;
  remaining?: number;
}

interface CasePriceChartProps {
  data: PriceData[];
  className?: string;
}

export default function CasePriceChart({ data, className = "" }: CasePriceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">No price data available</div>
          <div className="text-sm text-gray-500">Price history will appear here once available</div>
        </div>
      </div>
    );
  }

  // Sort data by date
  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate price changes
  const priceChanges = sortedData.map((item, index) => {
    if (index === 0) return 0;
    const prevPrice = sortedData[index - 1].price;
    return ((item.price - prevPrice) / prevPrice) * 100;
  });

  const chartData = {
    labels: sortedData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [
      {
        label: 'Price (USD)',
        data: sortedData.map(item => item.price),
        borderColor: 'rgb(34, 197, 94)', // green-500
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5,
        yAxisID: 'y',
      },
      {
        label: 'Market Cap (USD)',
        data: sortedData.map(item => item.marketCap || 0),
        borderColor: 'rgb(59, 130, 246)', // blue-500
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: false,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5,
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
        text: 'Price History',
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
            const datasetLabel = context.dataset.label;
            
            if (datasetLabel === 'Price (USD)') {
              return `Price: $${value.toFixed(2)}`;
            } else if (datasetLabel === 'Market Cap (USD)') {
              const formattedValue = value >= 1000000 
                ? (value / 1000000).toFixed(1) + 'M'
                : value >= 1000 
                  ? (value / 1000).toFixed(1) + 'K'
                  : value.toLocaleString();
              return `Market Cap: $${formattedValue}`;
            }
            
            return `${datasetLabel}: ${value}`;
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
          text: 'Price (USD)',
          color: '#d1d5db',
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value: any) {
            return `$${value.toFixed(2)}`;
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
          text: 'Market Cap (USD)',
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
      <Line data={chartData} options={options} />
    </div>
  );
}
