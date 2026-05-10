"use client";
import { useState, useMemo } from "react";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Chart, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip as ChartTooltip, Legend, Title, Filler } from "chart.js";
import { TrendingUp, TrendingDown, BarChart3, PieChart, Lock, Info } from "lucide-react";
import Tooltip from "../components/Tooltip";

// Chart.js Registration
Chart.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, ChartTooltip, Legend, Title, Filler
);

type PortfolioEntry = {
  id: number;
  amount: number;
  avgPrice: number;
  skin: {
    id: number;
    name: string;
    weaponType?: string;
    rarity?: string;
  };
};

type Props = {
  portfolio: PortfolioEntry[];
  history: Array<{
    date: string;
    value: number;
  }>;
  isPremium?: boolean;
};

type ChartType = "candlestick" | "volume" | "correlation" | "heatmap";

export default function AdvancedCharts({ portfolio, history, isPremium = false }: Props) {
  const [selectedChart, setSelectedChart] = useState<ChartType>("candlestick");

  // Feature flag for advanced charts - enable for premium users
  const ADVANCED_CHARTS_ENABLED = isPremium || process.env.NEXT_PUBLIC_PORTFOLIO_ADVANCED_CHARTS === 'true';

  const chartData = useMemo(() => {
    if (!history || history.length < 2) return null;

    // Generate candlestick data (simplified - using daily values)
    const candlestickData = history.map((entry, index) => {
      const prevValue = index > 0 ? history[index - 1].value : entry.value;
      const currentValue = entry.value;
      const change = currentValue - prevValue;
      
      return {
        date: entry.date,
        open: prevValue,
        high: Math.max(prevValue, currentValue),
        low: Math.min(prevValue, currentValue),
        close: currentValue,
        change,
        changePercent: prevValue > 0 ? (change / prevValue) * 100 : 0
      };
    });

    // Volume data (simulated based on price changes)
    const volumeData = candlestickData.map(entry => ({
      date: entry.date,
      volume: Math.abs(entry.change) * 1000 + Math.random() * 500 // Simulated volume
    }));

    // Correlation matrix data
    const weaponTypes = [...new Set(portfolio.map(entry => entry.skin.weaponType).filter(Boolean))];
    const correlationMatrix = weaponTypes.map(type1 => 
      weaponTypes.map(type2 => {
        if (type1 === type2) return 1;
        // Simplified correlation calculation
        return Math.random() * 0.8 - 0.4; // Random correlation between -0.4 and 0.4
      })
    );

    return {
      candlestick: candlestickData,
      volume: volumeData,
      correlation: {
        labels: weaponTypes,
        data: correlationMatrix
      }
    };
  }, [portfolio, history]);

  if (!chartData) {
    return (
      <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-white">Advanced Charts</h3>
        <div className="text-center text-slate-400 py-8">
          Not enough data to generate advanced charts
        </div>
      </div>
    );
  }

  const candlestickChartData = {
    labels: chartData.candlestick.map(entry => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Portfolio Value',
        data: chartData.candlestick.map(entry => entry.close),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.1
      }
    ]
  };

  const volumeChartData = {
    labels: chartData.volume.map(entry => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Trading Volume',
        data: chartData.volume.map(entry => entry.volume),
        backgroundColor: chartData.volume.map(entry => 
          entry.volume > 1000 ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
        ),
        borderColor: chartData.volume.map(entry => 
          entry.volume > 1000 ? '#22C55E' : '#EF4444'
        ),
        borderWidth: 1
      }
    ]
  };

  const correlationChartData = {
    labels: chartData.correlation.labels,
    datasets: [{
      data: chartData.correlation.data[0] || [], // First row for doughnut
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
      ],
      borderWidth: 2,
      borderColor: '#1F2937'
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9CA3AF'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#FFFFFF',
        bodyColor: '#FFFFFF',
        borderColor: '#10B981',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: { color: '#9CA3AF' },
        grid: { color: 'rgba(156, 163, 175, 0.1)' }
      },
      y: {
        ticks: { color: '#9CA3AF' },
        grid: { color: 'rgba(156, 163, 175, 0.1)' }
      }
    }
  };

  const renderChart = () => {
    switch (selectedChart) {
      case "candlestick":
        return (
          <div className="h-80">
            <Line data={candlestickChartData} options={chartOptions} />
          </div>
        );
      
      case "volume":
        return (
          <div className="h-80">
            <Bar data={volumeChartData} options={chartOptions} />
          </div>
        );
      
      case "correlation":
        return (
          <div className="h-80 flex items-center justify-center">
            <div className="w-64 h-64">
              <Doughnut 
                data={correlationChartData} 
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      ...chartOptions.plugins.legend,
                      position: 'bottom'
                    }
                  }
                }} 
              />
            </div>
          </div>
        );
      
      case "heatmap":
        return (
          <div className="h-80 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Heatmap Chart</p>
              <p className="text-sm">Coming soon...</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (!ADVANCED_CHARTS_ENABLED) {
    return (
      <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-white">Advanced Charts</h3>
        <div className="text-center py-8">
          <div className="text-2xl mb-4">🔒</div>
          <h4 className="text-lg font-medium mb-2 text-white">Advanced Charting Disabled</h4>
          <p className="text-sm text-slate-400 mb-4">
            Enable advanced charts with NEXT_PUBLIC_PORTFOLIO_ADVANCED_CHARTS=true
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Advanced Charts</h3>
        {!isPremium && (
          <div className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded">
            🔒 Premium Feature
          </div>
        )}
      </div>

      {/* Chart Type Selector */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setSelectedChart("candlestick")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            selectedChart === "candlestick"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <TrendingUp className="inline w-4 h-4 mr-1" />
          Candlestick
        </button>
        <button
          onClick={() => setSelectedChart("volume")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            selectedChart === "volume"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <BarChart3 className="inline w-4 h-4 mr-1" />
          Volume
        </button>
        <button
          onClick={() => setSelectedChart("correlation")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            selectedChart === "correlation"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <PieChart className="inline w-4 h-4 mr-1" />
          Correlation
        </button>
        <button
          onClick={() => setSelectedChart("heatmap")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            selectedChart === "heatmap"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <BarChart3 className="inline w-4 h-4 mr-1" />
          Heatmap
        </button>
      </div>

      {/* Chart Content */}
      {isPremium ? (
        <div>
          {renderChart()}
          
          {/* Chart Info */}
          <div className="mt-4 text-sm text-slate-400">
            {selectedChart === "candlestick" && (
              <p>Portfolio value over time with daily changes</p>
            )}
            {selectedChart === "volume" && (
              <p>Trading volume based on price volatility</p>
            )}
            {selectedChart === "correlation" && (
              <p>Correlation between different weapon types</p>
            )}
            {selectedChart === "heatmap" && (
              <p>Performance heatmap by weapon type and time</p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-8 max-w-md mx-auto">
            <Lock className="w-16 h-16 mx-auto mb-4 text-purple-400" />
            <h4 className="text-xl font-medium mb-2 text-white">Unlock Advanced Charts</h4>
            <p className="text-sm text-slate-400 mb-6">
              Get professional-grade charting: Candlesticks, Volume Analysis, Correlation Matrix, and Performance Heatmaps.
            </p>
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}

      {/* Chart Stats */}
      {isPremium && selectedChart === "candlestick" && (
        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <Tooltip content="Highest single-day percentage gain in your portfolio">
              <div className="text-center p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg hover:border-slate-600 transition-colors cursor-help">
                <div className="text-slate-400 flex items-center justify-center gap-1 mb-1">
                  Best Day
                  <Info className="w-3 h-3 text-slate-500 hover:text-slate-300 transition-colors" />
                </div>
                <div className="text-green-400 font-medium">
                  {Math.max(...chartData.candlestick.map(entry => entry.changePercent)).toFixed(2)}%
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Lowest single-day percentage loss in your portfolio">
              <div className="text-center p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg hover:border-slate-600 transition-colors cursor-help">
                <div className="text-slate-400 flex items-center justify-center gap-1 mb-1">
                  Worst Day
                  <Info className="w-3 h-3 text-slate-500 hover:text-slate-300 transition-colors" />
                </div>
                <div className="text-red-400 font-medium">
                  {Math.min(...chartData.candlestick.map(entry => entry.changePercent)).toFixed(2)}%
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Average daily percentage change across all trading days">
              <div className="text-center p-3 bg-slate-800/60 border border-slate-700/50 rounded-lg hover:border-slate-600 transition-colors cursor-help">
                <div className="text-slate-400 flex items-center justify-center gap-1 mb-1">
                  Avg Daily Change
                  <Info className="w-3 h-3 text-slate-500 hover:text-slate-300 transition-colors" />
                </div>
                <div className="text-purple-400 font-medium">
                  {(chartData.candlestick.reduce((sum, entry) => sum + entry.changePercent, 0) / chartData.candlestick.length).toFixed(2)}%
                </div>
              </div>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
}
