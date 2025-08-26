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
    <div className="bg-gray-900 rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Portfolio Performance</h3>
        {!isPremium && (
          <div className="text-xs bg-amber-600/20 text-amber-400 px-2 py-1 rounded">
            🔒 Premium Feature
          </div>
        )}
      </div>

      {/* Basic Metrics - Always Visible */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-blue-400">
            {formatCurrency(metrics.totalInvested)}
          </div>
          <div className="text-xs text-gray-400">Total Invested</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className="text-lg font-bold text-green-400">
            {formatCurrency(metrics.currentValue)}
          </div>
          <div className="text-xs text-gray-400">Current Value</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className={`text-lg font-bold ${metrics.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(metrics.totalReturn)}
          </div>
          <div className="text-xs text-gray-400">Total Return</div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-4 text-center">
          <div className={`text-lg font-bold ${metrics.totalReturnPercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatPercent(metrics.totalReturnPercent)}
          </div>
          <div className="text-xs text-gray-400">Total Return %</div>
        </div>
      </div>

      {/* Advanced Metrics - Premium Only */}
      {isPremium ? (
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-gray-300 mb-4">Advanced Analytics</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Tooltip content="Risk-adjusted return. Higher is better. >1 is good, >2 is excellent.">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400">Sharpe Ratio</span>
                </div>
                <div className="text-lg font-bold text-purple-400">
                  {metrics.sharpeRatio.toFixed(3)}
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Portfolio volatility vs market. >1 = more volatile, <1 = less volatile.">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-gray-400">Beta</span>
                </div>
                <div className="text-lg font-bold text-orange-400">
                  {metrics.beta.toFixed(2)}
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Excess return vs market benchmark. Positive = outperforming market.">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-gray-400">Alpha</span>
                </div>
                <div className={`text-lg font-bold ${metrics.alpha >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
                  {formatPercent(metrics.alpha * 100)}
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Maximum peak-to-trough decline. Lower is better.">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Shield className="w-4 h-4 text-red-400" />
                  <span className="text-xs text-gray-400">Max Drawdown</span>
                </div>
                <div className="text-lg font-bold text-red-400">
                  {metrics.maxDrawdown.toFixed(1)}%
                </div>
              </div>
            </Tooltip>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Tooltip content="Daily return volatility. Higher = more risk.">
              <div className="bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-sm font-bold text-yellow-400">
                  {metrics.volatility.toFixed(2)}%
                </div>
                <div className="text-xs text-gray-400">Daily Volatility</div>
              </div>
            </Tooltip>

            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-sm font-bold text-gray-400">
                {metrics.dailyReturnsCount}
              </div>
              <div className="text-xs text-gray-400">Data Points</div>
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
      <div className="mt-6 pt-6 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {metrics.totalReturnPercent >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <span className="text-sm text-gray-400">
              Portfolio is {metrics.totalReturnPercent >= 0 ? 'profitable' : 'at a loss'}
            </span>
          </div>
          
          {isPremium && (
            <div className="text-xs text-gray-500">
              Last updated: {new Date().toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
