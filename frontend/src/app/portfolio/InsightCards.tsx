"use client";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, BarChart3, AlertTriangle } from "lucide-react";

type Props = {
  portfolio: any[];
  token: string | null;
};

type InsightData = {
  volatility?: number;
  volatilityMessage?: string;
  maxDrawdown?: number;
  maxDrawdownMessage?: string;
  contribution?: any;
  hasEnoughData: boolean;
};

export default function InsightCards({ portfolio, token }: Props) {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Feature flag - default OFF for production safety
  const INSIGHTS_ENABLED = process.env.NEXT_PUBLIC_PORTFOLIO_INSIGHTS === 'true';

  useEffect(() => {
    if (!INSIGHTS_ENABLED || !token || !portfolio || portfolio.length === 0) {
      return;
    }

    const loadInsights = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Load risk metrics and contribution data
        const [riskResponse, contributionResponse] = await Promise.all([
          fetch("/api/v1/portfolio/kpis", {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => res.json()),
          fetch("/api/v1/portfolio/contribution?range=week", {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => res.json())
        ]);

        setInsights({
          volatility: riskResponse.volatility,
          volatilityMessage: riskResponse.volatilityMessage,
          maxDrawdown: riskResponse.maxDrawdown,
          maxDrawdownMessage: riskResponse.maxDrawdownMessage,
          contribution: contributionResponse,
          hasEnoughData: riskResponse.hasEnoughRiskData && !contributionResponse.message
        });
      } catch (err: any) {
        setError(err?.message || "Failed to load insights");
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, [INSIGHTS_ENABLED, token, portfolio]);

  if (!INSIGHTS_ENABLED) {
    return null; // Component hidden when feature flag is OFF
  }

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4">Portfolio Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-8 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4">Portfolio Insights</h3>
        <div className="text-center text-red-400 py-8">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Failed to load insights</p>
          <p className="text-sm text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!insights || !insights.hasEnoughData) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4">Portfolio Insights</h3>
        <div className="text-center text-gray-400 py-8">
          <BarChart3 className="w-8 h-8 mx-auto mb-2" />
          <p>Not enough data for insights</p>
          <p className="text-sm">Add more positions and wait for price history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md">
      <h3 className="text-xl font-semibold mb-4">Portfolio Insights</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Volatility Card */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            <span className="text-sm text-gray-400">30-Day Volatility</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">
            {insights.volatility?.toFixed(2) || "—"}%
          </div>
          <div className="text-xs text-gray-500">
            Daily return volatility
          </div>
        </div>

        {/* Max Drawdown Card */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <span className="text-sm text-gray-400">Max Drawdown (90d)</span>
          </div>
          <div className="text-2xl font-bold text-red-400">
            {insights.maxDrawdown?.toFixed(2) || "—"}%
          </div>
          <div className="text-xs text-gray-500">
            Peak to trough decline
          </div>
        </div>

        {/* Contribution Card */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <span className="text-sm text-gray-400">Week Performance</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {insights.contribution?.totalPortfolioChangePercent?.toFixed(2) || "—"}%
          </div>
          <div className="text-xs text-gray-500">
            {insights.contribution?.totalPortfolioChange >= 0 ? "+" : ""}${insights.contribution?.totalPortfolioChange?.toFixed(2) || "—"}
          </div>
        </div>
      </div>

      {/* Top Contributors */}
      {insights.contribution?.contributions && insights.contribution.contributions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-medium mb-3">Top Contributors (7d)</h4>
          <div className="space-y-2">
            {insights.contribution.contributions.slice(0, 3).map((item: any) => (
              <div key={item.skinId} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.skinName}</div>
                  <div className="text-xs text-gray-400">
                    Weight: {item.weight.toFixed(1)}% • Qty: {item.amount}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-semibold ${item.contribution >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {item.contribution >= 0 ? "+" : ""}{item.contribution.toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    {item.positionChangePercent >= 0 ? "+" : ""}{item.positionChangePercent.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
