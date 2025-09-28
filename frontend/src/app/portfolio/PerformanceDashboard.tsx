"use client";
import { useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, Shield, Target, BarChart3 } from "lucide-react";
import Tooltip from "../components/Tooltip";

type PortfolioEntry = {
  id: number;
  amount: number;
  avgPrice: number;
  purchases: Array<{
    buyPrice: number;
    buyDate: string;
  }>;
  skin: {
    id: number;
    name: string;
    marketPrice?: number | null;
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

export default function PerformanceDashboard({ portfolio, history, isPremium = false }: Props) {
  const metrics = useMemo(() => {
    if (!portfolio || portfolio.length === 0 || !history || history.length < 2) {
      return null;
    }

    // Calculate basic metrics
    const totalInvested = portfolio.reduce((sum, entry) => sum + (entry.avgPrice * entry.amount), 0);
    const currentValue = portfolio.reduce((sum, entry) => {
      const marketValue = entry.skin.marketPrice || entry.avgPrice;
      return sum + (marketValue * entry.amount);
    }, 0);
    
    const totalReturn = currentValue - totalInvested;
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Calculate daily returns for advanced metrics
    const dailyReturns: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const prevValue = history[i - 1].value;
      const currentValue = history[i].value;
      if (prevValue > 0) {
        dailyReturns.push((currentValue - prevValue) / prevValue);
      }
    }

    // Advanced metrics (Premium only)
    let sharpeRatio = 0;
    let beta = 0;
    let alpha = 0;
    let maxDrawdown = 0;
    let volatility = 0;

    if (isPremium && dailyReturns.length > 0) {
      // Sharpe Ratio (assuming 0% risk-free rate for simplicity)
      const avgReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / dailyReturns.length;
      volatility = Math.sqrt(variance);
      sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;

      // Beta (correlation with market - simplified)
      // In a real implementation, you'd compare with a CS2 market index
      beta = 1.0; // Placeholder - would need market benchmark data

      // Alpha (excess return vs market)
      const marketReturn = 0.0005; // 0.05% daily market return (placeholder)
      alpha = avgReturn - (marketReturn * beta);

      // Maximum Drawdown
      let peak = history[0].value;
      let drawdown = 0;
      
      for (const entry of history) {
        if (entry.value > peak) {
          peak = entry.value;
        } else {
          const currentDrawdown = (peak - entry.value) / peak;
          if (currentDrawdown > drawdown) {
            drawdown = currentDrawdown;
          }
        }
      }
      maxDrawdown = drawdown * 100;
    }

    return {
      totalInvested,
      currentValue,
      totalReturn,
      totalReturnPercent,
      sharpeRatio,
      beta,
      alpha,
      maxDrawdown,
      volatility: volatility * 100,
      dailyReturnsCount: dailyReturns.length
    };
  }, [portfolio, history, isPremium]);

  if (!metrics) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4">Portfolio Performance</h3>
        <div className="text-center text-gray-400 py-8">
          Not enough data to calculate performance metrics
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number) => `$${value.toFixed(2)}`;
  const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  return (
    <div className="bg-gray-900 rounded-xl p-8 shadow-md">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl font-bold text-white">Portfolio Performance</h3>
        {!isPremium && (
          <div className="text-xs bg-amber-600/20 text-amber-400 px-3 py-1 rounded-full">
            🔒 Premium Feature
          </div>
        )}
      </div>

      {/* Basic Metrics - Simplified Color Scheme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
        <Tooltip content="Total amount invested in your portfolio">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 text-center hover:scale-105 transition-all duration-200 group">
            <div className="text-2xl font-bold text-blue-400 group-hover:text-blue-300">
              {formatCurrency(metrics.totalInvested)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Invested</div>
          </div>
        </Tooltip>
        
        <Tooltip content="Current market value of your portfolio">
          <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-xl p-6 text-center hover:scale-105 transition-all duration-200 group">
            <div className="text-2xl font-bold text-green-400 group-hover:text-green-300">
              {formatCurrency(metrics.currentValue)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Current Value</div>
          </div>
        </Tooltip>
        
        <Tooltip content="Total profit or loss from your investments">
          <div className={`bg-gradient-to-br ${metrics.totalReturn >= 0 ? 'from-green-500/10 to-green-600/10 border-green-500/20' : 'from-red-500/10 to-red-600/10 border-red-500/20'} rounded-xl p-6 text-center hover:scale-105 transition-all duration-200 group`}>
            <div className={`text-2xl font-bold ${metrics.totalReturn >= 0 ? 'text-green-400 group-hover:text-green-300' : 'text-red-400 group-hover:text-red-300'}`}>
              {formatCurrency(metrics.totalReturn)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Return</div>
          </div>
        </Tooltip>
        
        <Tooltip content="Percentage return on your investment">
          <div className={`bg-gradient-to-br ${metrics.totalReturnPercent >= 0 ? 'from-green-500/10 to-green-600/10 border-green-500/20' : 'from-red-500/10 to-red-600/10 border-red-500/20'} rounded-xl p-6 text-center hover:scale-105 transition-all duration-200 group`}>
            <div className={`text-2xl font-bold ${metrics.totalReturnPercent >= 0 ? 'text-green-400 group-hover:text-green-300' : 'text-red-400 group-hover:text-red-300'}`}>
              {formatPercent(metrics.totalReturnPercent)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Return %</div>
          </div>
        </Tooltip>
      </div>

      {/* Advanced Metrics - Premium Only */}
      {isPremium ? (
        <div className="space-y-6">
          <h4 className="text-lg font-medium text-gray-300 mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Advanced Analytics
          </h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Tooltip content="Risk-adjusted return. Higher is better. >1 is good, >2 is excellent.">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 text-center hover:scale-105 transition-all duration-200 group">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                  <span className="text-sm font-medium text-gray-300">Sharpe Ratio</span>
                </div>
                <div className="text-xl font-bold text-blue-400 group-hover:text-blue-300">
                  {metrics.sharpeRatio.toFixed(3)}
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Portfolio volatility vs market. >1 = more volatile, <1 = less volatile.">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 text-center hover:scale-105 transition-all duration-200 group">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-blue-400 group-hover:text-blue-300" />
                  <span className="text-sm font-medium text-gray-300">Beta</span>
                </div>
                <div className="text-xl font-bold text-blue-400 group-hover:text-blue-300">
                  {metrics.beta.toFixed(2)}
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Excess return vs market benchmark. Positive = outperforming market.">
              <div className={`bg-gradient-to-br ${metrics.alpha >= 0 ? 'from-green-500/10 to-green-600/10 border-green-500/20' : 'from-red-500/10 to-red-600/10 border-red-500/20'} rounded-xl p-6 text-center hover:scale-105 transition-all duration-200 group`}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Target className={`w-5 h-5 ${metrics.alpha >= 0 ? 'text-green-400 group-hover:text-green-300' : 'text-red-400 group-hover:text-red-300'}`} />
                  <span className="text-sm font-medium text-gray-300">Alpha</span>
                </div>
                <div className={`text-xl font-bold ${metrics.alpha >= 0 ? 'text-green-400 group-hover:text-green-300' : 'text-red-400 group-hover:text-red-300'}`}>
                  {formatPercent(metrics.alpha * 100)}
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Maximum peak-to-trough decline. Lower is better.">
              <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-xl p-6 text-center hover:scale-105 transition-all duration-200 group">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-red-400 group-hover:text-red-300" />
                  <span className="text-sm font-medium text-gray-300">Max Drawdown</span>
                </div>
                <div className="text-xl font-bold text-red-400 group-hover:text-red-300">
                  {metrics.maxDrawdown.toFixed(1)}%
                </div>
              </div>
            </Tooltip>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Tooltip content="Daily return volatility. Higher = more risk.">
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-6 text-center hover:scale-105 transition-all duration-200 group">
                <div className="text-lg font-bold text-blue-400 group-hover:text-blue-300">
                  {metrics.volatility.toFixed(2)}%
                </div>
                <div className="text-sm text-gray-400 mt-2">Daily Volatility</div>
              </div>
            </Tooltip>

            <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-xl p-6 text-center hover:scale-105 transition-all duration-200 group">
              <div className="text-lg font-bold text-gray-400 group-hover:text-gray-300">
                {metrics.dailyReturnsCount}
              </div>
              <div className="text-sm text-gray-400 mt-2">Data Points</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-2xl mb-4">🔒</div>
            <h4 className="text-lg font-medium mb-2">Unlock Advanced Analytics</h4>
            <p className="text-sm text-gray-400 mb-4">
              Get professional-grade portfolio insights: Sharpe Ratio, Beta, Alpha, Max Drawdown, and more.
            </p>
            <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-700 hover:to-blue-700 transition-all">
              Upgrade to Premium
            </button>
          </div>
        </div>
      )}

      {/* Performance Summary */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {metrics.totalReturnPercent >= 0 ? (
              <div className="flex items-center gap-2 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-sm font-medium text-green-400">
                  Portfolio is profitable
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="text-sm font-medium text-red-400">
                  Portfolio is at a loss
                </span>
              </div>
            )}
          </div>
          
          {isPremium && (
            <div className="text-xs text-gray-500 bg-gray-800/50 px-3 py-2 rounded-lg">
              Last updated: {new Date().toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
