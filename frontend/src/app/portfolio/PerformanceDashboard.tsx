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
    <div className="card-standard">
      <div className="flex items-center justify-between mb-12">
        <h3 className="text-2xl font-bold text-white">Portfolio Performance</h3>
        {!isPremium && (
          <div className="text-xs bg-amber-600/20 text-amber-400 px-3 py-1 rounded-full">
            🔒 Premium Feature
          </div>
        )}
      </div>

      {/* Hero KPIs - Only the most important metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
        <div className="text-center">
          <div className="text-5xl font-bold text-white mb-2">
            {formatCurrency(metrics.currentValue)}
          </div>
          <div className="text-lg text-gray-400 mb-1">Current Value</div>
          <div className="text-sm text-gray-500">Total portfolio value</div>
        </div>
        
        <div className="text-center">
          <div className={`text-5xl font-bold mb-2 ${metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(metrics.totalReturn)}
          </div>
          <div className="text-lg text-gray-400 mb-1">Total Return</div>
          <div className="text-sm text-gray-500">Profit/Loss</div>
        </div>
        
        <div className="text-center">
          <div className={`text-5xl font-bold mb-2 ${metrics.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(metrics.totalReturnPercent)}
          </div>
          <div className="text-lg text-gray-400 mb-1">Return %</div>
          <div className="text-sm text-gray-500">Performance</div>
        </div>
      </div>

      {/* Advanced Analytics - Collapsible Section */}
      {isPremium ? (
        <details className="group">
          <summary className="cursor-pointer flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-blue-400" />
              <span className="text-lg font-medium text-white">Advanced Analytics</span>
              <span className="text-sm text-gray-400">(Optional)</span>
            </div>
            <div className="text-gray-400 group-open:rotate-180 transition-transform duration-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </summary>
          
          <div className="mt-6 space-y-6">
          
          <div className="card-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Tooltip content="Risk-adjusted return. Higher is better. >1 is good, >2 is excellent.">
              <div className="card-metric bg-gray-800/50 border-gray-700/50">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Activity className="w-5 h-5 text-blue-400" />
                  <span className="text-caption">Sharpe Ratio</span>
                  <span className="text-xs text-gray-400 cursor-help">ℹ️</span>
                </div>
                <div className="text-xl font-bold text-blue-400">
                  {metrics.sharpeRatio.toFixed(3)}
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Portfolio volatility vs market. >1 = more volatile, <1 = less volatile.">
              <div className="card-metric bg-gray-800/50 border-gray-700/50">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                  <span className="text-caption">Beta</span>
                  <span className="text-xs text-gray-400 cursor-help">ℹ️</span>
                </div>
                <div className="text-xl font-bold text-blue-400">
                  {metrics.beta.toFixed(2)}
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Excess return vs market benchmark. Positive = outperforming market.">
              <div className={`card-metric ${metrics.alpha >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Target className={`w-5 h-5 ${metrics.alpha >= 0 ? 'text-green-400' : 'text-red-400'}`} />
                  <span className="text-caption">Alpha</span>
                  <span className="text-xs text-gray-400 cursor-help">ℹ️</span>
                </div>
                <div className={`text-xl font-bold ${metrics.alpha >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(metrics.alpha * 100)}
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Maximum peak-to-trough decline. Lower is better.">
              <div className="card-metric bg-red-500/10 border-red-500/20">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-red-400" />
                  <span className="text-caption">Max Drawdown</span>
                  <span className="text-xs text-gray-400 cursor-help">ℹ️</span>
                </div>
                <div className="text-xl font-bold text-red-400">
                  {metrics.maxDrawdown.toFixed(1)}%
                </div>
              </div>
            </Tooltip>
          </div>

          <div className="card-grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <Tooltip content="Daily return volatility. Higher = more risk.">
              <div className="card-metric bg-gray-800/50 border-gray-700/50">
                <div className="text-lg font-bold text-blue-400">
                  {metrics.volatility.toFixed(2)}%
                </div>
                <div className="text-caption">Daily Volatility</div>
              </div>
            </Tooltip>

            <div className="card-metric bg-gray-800/50 border-gray-700/50">
              <div className="text-lg font-bold text-blue-400">
                {metrics.dailyReturnsCount}
              </div>
              <div className="text-caption">Data Points</div>
            </div>
          </div>
          </div>
        </details>
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
