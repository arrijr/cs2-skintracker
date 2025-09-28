"use client";
import { useState, useMemo } from "react";
import { Activity, Shield, TrendingUp, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react";
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
    wear?: string;
    marketVolume?: number;
    lastPriceUpdate?: string;
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

type HealthCategory = "diversification" | "risk" | "liquidity" | "overall";

interface HealthMetric {
  name: string;
  score: number; // 0-100
  status: "excellent" | "good" | "warning" | "critical";
  description: string;
  recommendation: string;
  weight: number; // importance for overall score
}

interface HealthScore {
  overall: number;
  diversification: number;
  risk: number;
  liquidity: number;
  metrics: HealthMetric[];
  lastUpdated: string;
}

export default function PortfolioHealthScore({ portfolio, history, isPremium = false }: Props) {
  const [activeCategory, setActiveCategory] = useState<HealthCategory>("overall");
  const [showDetails, setShowDetails] = useState(false);

  // Feature flag for portfolio health score
  const PORTFOLIO_HEALTH_ENABLED = isPremium || process.env.NEXT_PUBLIC_PORTFOLIO_HEALTH_SCORE === 'true';

  // Calculate portfolio health metrics
  const healthScore = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return null;

    const totalValue = portfolio.reduce((sum, entry) => {
      const marketValue = entry.skin.marketPrice || entry.avgPrice;
      return sum + (marketValue * entry.amount);
    }, 0);

    const metrics: HealthMetric[] = [];

    // 1. Diversification Metrics
    const weaponTypeDistribution = portfolio.reduce((acc, entry) => {
      const type = entry.skin.weaponType || "Unknown";
      const value = (entry.skin.marketPrice || entry.avgPrice) * entry.amount;
      acc[type] = (acc[type] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    const maxConcentration = Math.max(...Object.values(weaponTypeDistribution));
    const concentrationRatio = maxConcentration / totalValue;
    
    // Diversification score based on concentration
    let weaponTypeScore = 100;
    if (concentrationRatio > 0.5) weaponTypeScore = 20;
    else if (concentrationRatio > 0.4) weaponTypeScore = 40;
    else if (concentrationRatio > 0.3) weaponTypeScore = 60;
    else if (concentrationRatio > 0.2) weaponTypeScore = 80;

    metrics.push({
      name: "Weapon Type Diversification",
      score: weaponTypeScore,
      status: weaponTypeScore >= 80 ? "excellent" : weaponTypeScore >= 60 ? "good" : weaponTypeScore >= 40 ? "warning" : "critical",
      description: `${(concentrationRatio * 100).toFixed(1)}% in single weapon type`,
      recommendation: concentrationRatio > 0.4 ? "Consider diversifying across weapon types" : "Good diversification maintained",
      weight: 0.3
    });

    // Rarity distribution
    const rarityDistribution = portfolio.reduce((acc, entry) => {
      const rarity = entry.skin.rarity || "Unknown";
      const value = (entry.skin.marketPrice || entry.avgPrice) * entry.amount;
      acc[rarity] = (acc[rarity] || 0) + value;
      return acc;
    }, {} as Record<string, number>);

    const rarityCount = Object.keys(rarityDistribution).length;
    const rarityScore = Math.min(100, rarityCount * 20); // 5+ rarities = 100

    metrics.push({
      name: "Rarity Distribution",
      score: rarityScore,
      status: rarityScore >= 80 ? "excellent" : rarityScore >= 60 ? "good" : rarityScore >= 40 ? "warning" : "critical",
      description: `${rarityCount} different rarities represented`,
      recommendation: rarityCount < 3 ? "Consider adding different rarity levels" : "Good rarity spread",
      weight: 0.2
    });

    // 2. Risk Metrics
    // Price volatility
    const avgPrice = portfolio.reduce((sum, entry) => sum + entry.avgPrice, 0) / portfolio.length;
    const priceVolatility = portfolio.reduce((sum, entry) => {
      const marketPrice = entry.skin.marketPrice || entry.avgPrice;
      return sum + Math.abs(marketPrice - avgPrice) / avgPrice;
    }, 0) / portfolio.length;

    const volatilityScore = Math.max(0, 100 - (priceVolatility * 200)); // 0.5 volatility = 0 score

    metrics.push({
      name: "Price Volatility",
      score: Math.round(volatilityScore),
      status: volatilityScore >= 80 ? "excellent" : volatilityScore >= 60 ? "good" : volatilityScore >= 40 ? "warning" : "critical",
      description: `${(priceVolatility * 100).toFixed(1)}% average price deviation`,
      recommendation: priceVolatility > 0.3 ? "High volatility - consider stable assets" : "Stable price performance",
      weight: 0.25
    });

    // Portfolio size risk
    const portfolioSizeScore = portfolio.length >= 10 ? 100 : portfolio.length >= 5 ? 80 : portfolio.length >= 3 ? 60 : 40;

    metrics.push({
      name: "Portfolio Size",
      score: portfolioSizeScore,
      status: portfolioSizeScore >= 80 ? "excellent" : portfolioSizeScore >= 60 ? "good" : portfolioSizeScore >= 40 ? "warning" : "critical",
      description: `${portfolio.length} positions`,
      recommendation: portfolio.length < 5 ? "Consider adding more positions for diversification" : "Good position count",
      weight: 0.15
    });

    // 3. Liquidity Metrics
    // Market volume analysis
    const totalVolume = portfolio.reduce((sum, entry) => {
      return sum + (entry.skin.marketVolume || 0);
    }, 0);
    const avgVolume = totalVolume / portfolio.length;
    
    const liquidityScore = avgVolume > 1000 ? 100 : avgVolume > 500 ? 80 : avgVolume > 100 ? 60 : 40;

    metrics.push({
      name: "Market Liquidity",
      score: liquidityScore,
      status: liquidityScore >= 80 ? "excellent" : liquidityScore >= 60 ? "good" : liquidityScore >= 40 ? "warning" : "critical",
      description: `Avg volume: ${avgVolume.toFixed(0)}`,
      recommendation: avgVolume < 100 ? "Low liquidity - consider more liquid assets" : "Good market liquidity",
      weight: 0.1
    });

    // Calculate weighted scores
    const diversificationScore = metrics
      .filter(m => m.name.includes("Diversification") || m.name.includes("Rarity"))
      .reduce((sum, m) => sum + (m.score * m.weight), 0) / 
      metrics.filter(m => m.name.includes("Diversification") || m.name.includes("Rarity"))
      .reduce((sum, m) => sum + m.weight, 0);

    const riskScore = metrics
      .filter(m => m.name.includes("Volatility") || m.name.includes("Size"))
      .reduce((sum, m) => sum + (m.score * m.weight), 0) / 
      metrics.filter(m => m.name.includes("Volatility") || m.name.includes("Size"))
      .reduce((sum, m) => sum + m.weight, 0);

    const liquidityScoreFinal = metrics
      .filter(m => m.name.includes("Liquidity"))
      .reduce((sum, m) => sum + (m.score * m.weight), 0) / 
      metrics.filter(m => m.name.includes("Liquidity"))
      .reduce((sum, m) => sum + m.weight, 0);

    const overallScore = Math.round(
      diversificationScore * 0.4 + riskScore * 0.4 + liquidityScoreFinal * 0.2
    );

    return {
      overall: overallScore,
      diversification: Math.round(diversificationScore),
      risk: Math.round(riskScore),
      liquidity: Math.round(liquidityScoreFinal),
      metrics,
      lastUpdated: new Date().toISOString()
    };
  }, [portfolio, history]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent": return "text-green-400 bg-green-600/20 border-green-600/40";
      case "good": return "text-blue-400 bg-blue-600/20 border-blue-600/40";
      case "warning": return "text-yellow-400 bg-yellow-600/20 border-yellow-600/40";
      case "critical": return "text-red-400 bg-red-600/20 border-red-600/40";
      default: return "text-gray-400 bg-gray-600/20 border-gray-600/40";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "excellent": return <CheckCircle className="w-4 h-4" />;
      case "good": return <CheckCircle className="w-4 h-4" />;
      case "warning": return <AlertTriangle className="w-4 h-4" />;
      case "critical": return <XCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-400";
    if (score >= 60) return "text-blue-400";
    if (score >= 40) return "text-yellow-400";
    return "text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Very Good";
    if (score >= 70) return "Good";
    if (score >= 60) return "Fair";
    if (score >= 40) return "Poor";
    return "Critical";
  };

  if (!PORTFOLIO_HEALTH_ENABLED) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4">Portfolio Health Score</h3>
        <div className="text-center py-8">
          <div className="text-2xl mb-4">🔒</div>
          <h4 className="text-lg font-medium mb-2">Portfolio Health Score Disabled</h4>
          <p className="text-sm text-gray-400 mb-4">
            Enable portfolio health score with NEXT_PUBLIC_PORTFOLIO_HEALTH_SCORE=true
          </p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <div className="text-center py-8">
          <Activity className="w-16 h-16 mx-auto mb-4 text-amber-400" />
          <h4 className="text-xl font-medium mb-2">Unlock Portfolio Health Score</h4>
          <p className="text-sm text-gray-400 mb-6">
            Get comprehensive portfolio health analysis: Diversification, risk assessment, and liquidity metrics.
          </p>
          <button className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-6 py-2 rounded-lg font-medium hover:from-amber-600 hover:to-yellow-600 transition-all">
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  if (!healthScore) {
    return (
      <div className="bg-gray-900 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4">Portfolio Health Score</h3>
        <div className="text-center py-8 text-gray-400">
          No portfolio data available for health analysis.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Portfolio Health Score</h3>
        <div className="flex items-center gap-2">
          <div className="text-xs bg-amber-600/20 text-amber-400 px-2 py-1 rounded">
            🔒 Premium Feature
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/30 transition-colors"
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </button>
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="text-center mb-8">
        <div className={`text-6xl font-bold mb-2 ${getScoreColor(healthScore.overall)}`}>
          {healthScore.overall}
        </div>
        <div className="text-lg text-gray-300 mb-2">
          {getScoreLabel(healthScore.overall)}
        </div>
        <div className="text-sm text-gray-400">
          Last updated: {new Date(healthScore.lastUpdated).toLocaleString()}
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400 mb-1">
            {healthScore.diversification}
          </div>
          <div className="text-sm text-gray-400">Diversification</div>
        </div>
        
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {healthScore.risk}
          </div>
          <div className="text-sm text-gray-400">Risk Management</div>
        </div>
        
        <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">
            {healthScore.liquidity}
          </div>
          <div className="text-sm text-gray-400">Liquidity</div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveCategory("overall")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeCategory === "overall"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Activity className="inline w-4 h-4 mr-1" />
          Overall
        </button>
        <button
          onClick={() => setActiveCategory("diversification")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeCategory === "diversification"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Shield className="inline w-4 h-4 mr-1" />
          Diversification
        </button>
        <button
          onClick={() => setActiveCategory("risk")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeCategory === "risk"
              ? "bg-red-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <AlertTriangle className="inline w-4 h-4 mr-1" />
          Risk
        </button>
        <button
          onClick={() => setActiveCategory("liquidity")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeCategory === "liquidity"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <TrendingUp className="inline w-4 h-4 mr-1" />
          Liquidity
        </button>
      </div>

      {/* Metrics Display */}
      {showDetails && (
        <div className="space-y-3">
          {healthScore.metrics
            .filter(metric => {
              if (activeCategory === "overall") return true;
              if (activeCategory === "diversification") return metric.name.includes("Diversification") || metric.name.includes("Rarity");
              if (activeCategory === "risk") return metric.name.includes("Volatility") || metric.name.includes("Size");
              if (activeCategory === "liquidity") return metric.name.includes("Liquidity");
              return true;
            })
            .map(metric => (
              <div
                key={metric.name}
                className={`p-4 rounded-lg border ${getStatusColor(metric.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(metric.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{metric.name}</h4>
                        <span className={`text-sm font-bold ${getScoreColor(metric.score)}`}>
                          {metric.score}/100
                        </span>
                      </div>
                      <p className="text-sm opacity-90 mb-2">{metric.description}</p>
                      <p className="text-xs opacity-75">
                        💡 <strong>Recommendation:</strong> {metric.recommendation}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Health Summary */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <h4 className="text-lg font-medium mb-4">Health Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-400 mb-2">Strengths:</div>
            <ul className="space-y-1 text-green-400">
              {healthScore.metrics
                .filter(m => m.status === "excellent" || m.status === "good")
                .slice(0, 3)
                .map(metric => (
                  <li key={metric.name} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3" />
                    {metric.name}
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <div className="text-gray-400 mb-2">Areas for Improvement:</div>
            <ul className="space-y-1 text-yellow-400">
              {healthScore.metrics
                .filter(m => m.status === "warning" || m.status === "critical")
                .slice(0, 3)
                .map(metric => (
                  <li key={metric.name} className="flex items-center gap-2">
                    <AlertTriangle className="w-3 h-3" />
                    {metric.name}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
