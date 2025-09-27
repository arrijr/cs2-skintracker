"use client";
import { useState, useMemo } from "react";
import { Bell, AlertTriangle, TrendingUp, TrendingDown, Settings, Zap, Shield } from "lucide-react";
import Tooltip from "../components/Tooltip";

type PortfolioEntry = {
  id: number;
  amount: number;
  avgPrice: number;
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

type AlertType = "technical" | "rebalancing" | "risk" | "price";

interface Alert {
  id: string;
  type: AlertType;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  action?: string;
  timestamp: string;
  dismissed?: boolean;
}

export default function SmartAlerts({ portfolio, history, isPremium = false }: Props) {
  const [activeTab, setActiveTab] = useState<AlertType>("technical");
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Feature flag for smart alerts - enable for premium users
  const SMART_ALERTS_ENABLED = isPremium || process.env.NEXT_PUBLIC_PORTFOLIO_SMART_ALERTS === 'true';

  // Calculate technical indicators
  const technicalIndicators = useMemo(() => {
    if (!history || history.length < 14) return null;

    const prices = history.map(entry => entry.value);
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);

    // RSI (Relative Strength Index)
    const rsi = calculateRSI(prices, 14);
    
    // MACD (Moving Average Convergence Divergence)
    const macd = calculateMACD(prices);
    
    // Moving Averages
    const sma20 = calculateSMA(prices, 20);
    const sma50 = calculateSMA(prices, 50);

    return { rsi, macd, sma20, sma50, returns };
  }, [history]);

  // Calculate portfolio health metrics
  const portfolioHealth = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return null;

    const totalValue = portfolio.reduce((sum, entry) => {
      const marketValue = entry.skin.marketPrice || entry.avgPrice;
      return sum + (marketValue * entry.amount);
    }, 0);

    // Diversification analysis
    const weaponTypeDistribution = portfolio.reduce((acc, entry) => {
      const type = entry.skin.weaponType || "Unknown";
      const value = (entry.skin.marketPrice || entry.avgPrice) * entry.amount;
      acc[type] = (acc[type] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    const maxConcentration = Math.max(...Object.values(weaponTypeDistribution));
    const concentrationRatio = maxConcentration / totalValue;

    // Risk assessment
    const avgPrice = portfolio.reduce((sum, entry) => sum + entry.avgPrice, 0) / portfolio.length;
    const priceVolatility = portfolio.reduce((sum, entry) => {
      const marketPrice = entry.skin.marketPrice || entry.avgPrice;
      return sum + Math.abs(marketPrice - avgPrice) / avgPrice;
    }, 0) / portfolio.length;

    return {
      totalValue,
      concentrationRatio,
      priceVolatility,
      weaponTypeDistribution
    };
  }, [portfolio]);

  // Generate alerts based on analysis
  const generatedAlerts = useMemo(() => {
    const newAlerts: Alert[] = [];

    // Technical indicators alerts
    if (technicalIndicators) {
      if (technicalIndicators.rsi > 70) {
        newAlerts.push({
          id: "rsi-overbought",
          type: "technical",
          severity: "medium",
          title: "RSI Overbought",
          description: `Portfolio RSI is ${technicalIndicators.rsi.toFixed(1)}, indicating potential overvaluation`,
          action: "Consider taking profits on overvalued positions",
          timestamp: new Date().toISOString()
        });
      }

      if (technicalIndicators.rsi < 30) {
        newAlerts.push({
          id: "rsi-oversold",
          type: "technical",
          severity: "low",
          title: "RSI Oversold",
          description: `Portfolio RSI is ${technicalIndicators.rsi.toFixed(1)}, indicating potential undervaluation`,
          action: "Consider adding to positions at attractive prices",
          timestamp: new Date().toISOString()
        });
      }

      if (technicalIndicators.sma20 > technicalIndicators.sma50) {
        newAlerts.push({
          id: "golden-cross",
          type: "technical",
          severity: "low",
          title: "Golden Cross Detected",
          description: "20-day moving average crossed above 50-day moving average",
          action: "Bullish signal - portfolio momentum is improving",
          timestamp: new Date().toISOString()
        });
      }
    }

    // Portfolio rebalancing alerts
    if (portfolioHealth) {
      if (portfolioHealth.concentrationRatio > 0.4) {
        newAlerts.push({
          id: "high-concentration",
          type: "rebalancing",
          severity: "high",
          title: "High Concentration Risk",
          description: `${(portfolioHealth.concentrationRatio * 100).toFixed(1)}% of portfolio in single weapon type`,
          action: "Consider diversifying to reduce concentration risk",
          timestamp: new Date().toISOString()
        });
      }

      if (portfolioHealth.priceVolatility > 0.3) {
        newAlerts.push({
          id: "high-volatility",
          type: "risk",
          severity: "medium",
          title: "High Price Volatility",
          description: "Portfolio shows significant price volatility",
          action: "Review risk tolerance and consider hedging strategies",
          timestamp: new Date().toISOString()
        });
      }
    }

    return newAlerts;
  }, [technicalIndicators, portfolioHealth]);

  // Update alerts when generated alerts change
  useState(() => {
    setAlerts(generatedAlerts);
  }, [generatedAlerts]);

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, dismissed: true } : alert
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "text-red-400 bg-red-600/20 border-red-600/40";
      case "medium": return "text-yellow-400 bg-yellow-600/20 border-yellow-600/40";
      case "low": return "text-blue-400 bg-blue-600/20 border-blue-600/40";
      default: return "text-gray-400 bg-gray-600/20 border-gray-600/40";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high": return <AlertTriangle className="w-4 h-4" />;
      case "medium": return <Zap className="w-4 h-4" />;
      case "low": return <Shield className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  if (!SMART_ALERTS_ENABLED) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4">Smart Alerts</h3>
        <div className="text-center py-8">
          <div className="text-2xl mb-4">🔒</div>
          <h4 className="text-lg font-medium mb-2">Smart Alerts Disabled</h4>
          <p className="text-sm text-gray-400 mb-4">
            Enable smart alerts with NEXT_PUBLIC_PORTFOLIO_SMART_ALERTS=true
          </p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <div className="text-center py-8">
          <Bell className="w-16 h-16 mx-auto mb-4 text-amber-400" />
          <h4 className="text-xl font-medium mb-2">Unlock Smart Alerts</h4>
          <p className="text-sm text-gray-400 mb-6">
            Get intelligent portfolio insights: Technical indicators, rebalancing alerts, and risk management.
          </p>
          <button className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-6 py-2 rounded-lg font-medium hover:from-amber-600 hover:to-yellow-600 transition-all">
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  const activeAlerts = alerts.filter(alert => !alert.dismissed);
  const hasAlerts = activeAlerts.length > 0;

  return (
    <div className="bg-gray-900 rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold">Smart Alerts</h3>
        <div className="flex items-center gap-2">
          <div className="text-xs bg-amber-600/20 text-amber-400 px-2 py-1 rounded">
            🔒 Premium Feature
          </div>
          {hasAlerts && (
            <div className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded">
              {activeAlerts.length} Active
            </div>
          )}
        </div>
      </div>

      {/* Alert Type Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("technical")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "technical"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <TrendingUp className="inline w-4 h-4 mr-1" />
          Technical
        </button>
        <button
          onClick={() => setActiveTab("rebalancing")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "rebalancing"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Settings className="inline w-4 h-4 mr-1" />
          Rebalancing
        </button>
        <button
          onClick={() => setActiveTab("risk")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "risk"
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Shield className="inline w-4 h-4 mr-1" />
          Risk
        </button>
        <button
          onClick={() => setActiveTab("price")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "price"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Bell className="inline w-4 h-4 mr-1" />
          Price
        </button>
      </div>

      {/* Alerts Content */}
      {hasAlerts ? (
        <div className="space-y-3">
          {activeAlerts
            .filter(alert => activeTab === "all" || alert.type === activeTab)
            .map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">{alert.title}</h4>
                      <p className="text-sm opacity-90 mb-2">{alert.description}</p>
                      {alert.action && (
                        <p className="text-xs opacity-75">
                          💡 <strong>Action:</strong> {alert.action}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => dismissAlert(alert.id)}
                    className="text-xs opacity-60 hover:opacity-100 transition-opacity"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="text-xs opacity-60 mt-2">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="text-2xl mb-4">✅</div>
          <h4 className="text-lg font-medium mb-2">All Clear!</h4>
          <p className="text-sm text-gray-400">
            No active alerts at the moment. Your portfolio is performing well.
          </p>
        </div>
      )}

      {/* Technical Indicators Summary */}
      {technicalIndicators && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-lg font-medium mb-4">Technical Indicators</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-400">RSI (14)</div>
              <div className={`font-medium ${
                technicalIndicators.rsi > 70 ? 'text-red-400' : 
                technicalIndicators.rsi < 30 ? 'text-blue-400' : 'text-green-400'
              }`}>
                {technicalIndicators.rsi.toFixed(1)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">MACD</div>
              <div className={`font-medium ${
                technicalIndicators.macd > 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {technicalIndicators.macd.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">SMA 20</div>
              <div className="font-medium text-blue-400">
                ${technicalIndicators.sma20.toFixed(2)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-gray-400">SMA 50</div>
              <div className="font-medium text-purple-400">
                ${technicalIndicators.sma50.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Technical indicator calculation functions
function calculateRSI(prices: number[], period: number): number {
  if (prices.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateMACD(prices: number[]): number {
  if (prices.length < 26) return 0;

  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  return ema12 - ema26;
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }

  return ema;
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const sum = prices.slice(-period).reduce((acc, price) => acc + price, 0);
  return sum / period;
}
