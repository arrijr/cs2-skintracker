"use client";
import { useState, useMemo } from "react";
import { Brain, TrendingUp, TrendingDown, Newspaper, Calendar, Target, BarChart3, Zap } from "lucide-react";
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

type IntelligenceTab = "predictions" | "cycles" | "news" | "calendar";

interface PricePrediction {
  skinId: number;
  skinName: string;
  currentPrice: number;
  predictedPrice: number;
  confidence: number;
  timeframe: "1W" | "1M" | "3M";
  factors: string[];
  trend: "bullish" | "bearish" | "neutral";
}

interface MarketCycle {
  phase: "accumulation" | "markup" | "distribution" | "markdown";
  confidence: number;
  description: string;
  indicators: string[];
  recommendation: string;
  estimatedDuration: string;
}

interface MarketNews {
  id: string;
  title: string;
  summary: string;
  sentiment: "positive" | "negative" | "neutral";
  impact: "high" | "medium" | "low";
  publishedAt: string;
  source: string;
}

interface MarketEvent {
  id: string;
  title: string;
  date: string;
  impact: "high" | "medium" | "low";
  category: "game_update" | "tournament" | "economic" | "regulatory";
  description: string;
}

export default function MarketIntelligence({ portfolio, history, isPremium = false }: Props) {
  const [activeTab, setActiveTab] = useState<IntelligenceTab>("predictions");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"1W" | "1M" | "3M">("1M");

  // Feature flag for market intelligence
  const MARKET_INTELLIGENCE_ENABLED = isPremium || process.env.NEXT_PUBLIC_PORTFOLIO_MARKET_INTELLIGENCE === 'true';

  // Simulate price predictions using technical analysis
  const pricePredictions = useMemo(() => {
    if (!portfolio || portfolio.length === 0) return [];

    const predictions: PricePrediction[] = portfolio.map(entry => {
      const currentPrice = entry.skin.marketPrice || entry.avgPrice;
      
      // Simple prediction model based on price momentum and volatility
      const priceChange = (currentPrice - entry.avgPrice) / entry.avgPrice;
      const volatility = Math.abs(priceChange);
      
      // Predict based on trend and volatility
      let predictedPrice = currentPrice;
      let confidence = 0.5;
      let trend: "bullish" | "bearish" | "neutral" = "neutral";
      
      if (priceChange > 0.1) {
        // Strong uptrend
        predictedPrice = currentPrice * (1 + (priceChange * 0.3));
        confidence = Math.min(0.9, 0.5 + (priceChange * 2));
        trend = "bullish";
      } else if (priceChange < -0.1) {
        // Strong downtrend
        predictedPrice = currentPrice * (1 + (priceChange * 0.2));
        confidence = Math.min(0.8, 0.5 + Math.abs(priceChange) * 1.5);
        trend = "bearish";
      } else {
        // Sideways
        predictedPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.1);
        confidence = 0.4;
        trend = "neutral";
      }

      // Adjust for timeframe
      if (selectedTimeframe === "1W") {
        predictedPrice = currentPrice + (predictedPrice - currentPrice) * 0.25;
        confidence *= 0.8;
      } else if (selectedTimeframe === "3M") {
        predictedPrice = currentPrice + (predictedPrice - currentPrice) * 2;
        confidence *= 0.6;
      }

      const factors = [];
      if (volatility > 0.2) factors.push("High volatility");
      if (Math.abs(priceChange) > 0.15) factors.push("Strong momentum");
      if (entry.skin.marketVolume && entry.skin.marketVolume > 500) factors.push("High volume");
      if (factors.length === 0) factors.push("Stable performance");

      return {
        skinId: entry.skin.id,
        skinName: entry.skin.name,
        currentPrice,
        predictedPrice: Math.max(0.01, predictedPrice),
        confidence: Math.round(confidence * 100),
        timeframe: selectedTimeframe,
        factors,
        trend
      };
    });

    return predictions.sort((a, b) => b.confidence - a.confidence);
  }, [portfolio, selectedTimeframe]);

  // Analyze market cycle based on portfolio performance
  const marketCycle = useMemo(() => {
    if (!history || history.length < 10) return null;

    const prices = history.map(entry => entry.value);
    const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = Math.sqrt(returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length);
    
    let phase: MarketCycle["phase"] = "accumulation";
    let confidence = 0.5;
    let description = "";
    let indicators: string[] = [];
    let recommendation = "";
    let estimatedDuration = "";

    if (avgReturn > 0.02 && volatility < 0.05) {
      // Strong uptrend with low volatility
      phase = "markup";
      confidence = 0.8;
      description = "Strong bullish momentum with controlled volatility";
      indicators = ["Positive returns", "Low volatility", "Consistent growth"];
      recommendation = "Consider taking partial profits on extended positions";
      estimatedDuration = "2-4 months";
    } else if (avgReturn > 0.01 && volatility > 0.08) {
      // Volatile uptrend
      phase = "markup";
      confidence = 0.6;
      description = "Bullish but volatile market conditions";
      indicators = ["Positive returns", "High volatility", "Momentum"];
      recommendation = "Use stop-losses and consider volatility strategies";
      estimatedDuration = "1-3 months";
    } else if (avgReturn < -0.01 && volatility > 0.1) {
      // Strong downtrend
      phase = "markdown";
      confidence = 0.7;
      description = "Bearish market with high volatility";
      indicators = ["Negative returns", "High volatility", "Downward momentum"];
      recommendation = "Consider defensive positions and wait for stabilization";
      estimatedDuration = "2-6 months";
    } else if (Math.abs(avgReturn) < 0.005 && volatility < 0.03) {
      // Sideways with low volatility
      phase = "accumulation";
      confidence = 0.6;
      description = "Sideways market with low volatility";
      indicators = ["Low returns", "Low volatility", "Range-bound"];
      recommendation = "Good time to accumulate quality assets";
      estimatedDuration = "1-2 months";
    } else {
      // Distribution phase
      phase = "distribution";
      confidence = 0.5;
      description = "Mixed market signals with moderate volatility";
      indicators = ["Mixed returns", "Moderate volatility", "Uncertainty"];
      recommendation = "Monitor closely and reduce position sizes";
      estimatedDuration = "1-3 months";
    }

    return {
      phase,
      confidence: Math.round(confidence * 100),
      description,
      indicators,
      recommendation,
      estimatedDuration
    };
  }, [history]);

  // Simulate market news
  const marketNews = useMemo(() => {
    const news: MarketNews[] = [
      {
        id: "1",
        title: "CS2 Major Tournament Announced",
        summary: "New major tournament with $2M prize pool expected to boost skin demand",
        sentiment: "positive",
        impact: "high",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: "CS2 Official"
      },
      {
        id: "2",
        title: "Steam Market Update",
        summary: "New trading features and improved market liquidity",
        sentiment: "positive",
        impact: "medium",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: "Steam Community"
      },
      {
        id: "3",
        title: "Economic Uncertainty",
        summary: "Global economic factors affecting digital asset valuations",
        sentiment: "negative",
        impact: "medium",
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        source: "Market Analysis"
      }
    ];

    return news;
  }, []);

  // Simulate market events
  const marketEvents = useMemo(() => {
    const events: MarketEvent[] = [
      {
        id: "1",
        title: "CS2 Major Championship",
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        impact: "high",
        category: "tournament",
        description: "Major tournament expected to increase skin demand"
      },
      {
        id: "2",
        title: "Steam Summer Sale",
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        impact: "medium",
        category: "economic",
        description: "Annual sale may affect skin pricing patterns"
      },
      {
        id: "3",
        title: "Game Update Release",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        impact: "low",
        category: "game_update",
        description: "Minor update with bug fixes"
      }
    ];

    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, []);

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "bullish": return "text-green-400";
      case "bearish": return "text-red-400";
      case "neutral": return "text-purple-400";
      default: return "text-slate-400";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "bullish": return <TrendingUp className="w-4 h-4" />;
      case "bearish": return <TrendingDown className="w-4 h-4" />;
      case "neutral": return <BarChart3 className="w-4 h-4" />;
      default: return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive": return "text-green-400 bg-green-500/10 border-green-500/30";
      case "negative": return "text-red-400 bg-red-500/10 border-red-500/30";
      case "neutral": return "text-purple-400 bg-purple-500/10 border-purple-500/30";
      default: return "text-slate-400 bg-slate-800/60 border-slate-700/50";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-500/10 text-red-400 border border-red-500/30";
      case "medium": return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30";
      case "low": return "bg-purple-500/10 text-purple-400 border border-purple-500/30";
      default: return "bg-slate-800/60 text-slate-400 border border-slate-700/50";
    }
  };

  if (!MARKET_INTELLIGENCE_ENABLED) {
    return (
      <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-md">
        <h3 className="text-xl font-semibold mb-4 text-white">Market Intelligence</h3>
        <div className="text-center py-8">
          <div className="text-2xl mb-4">🔒</div>
          <h4 className="text-lg font-medium mb-2 text-white">Market Intelligence Disabled</h4>
          <p className="text-sm text-slate-400 mb-4">
            Enable market intelligence with NEXT_PUBLIC_PORTFOLIO_MARKET_INTELLIGENCE=true
          </p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-md">
        <div className="text-center py-8">
          <Brain className="w-16 h-16 mx-auto mb-4 text-purple-400" />
          <h4 className="text-xl font-medium mb-2 text-white">Unlock Market Intelligence</h4>
          <p className="text-sm text-slate-400 mb-6">
            Get AI-powered market insights: Price predictions, cycle analysis, and market news.
          </p>
          <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
            Upgrade to Premium
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 backdrop-blur border border-slate-700/50 rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Market Intelligence</h3>
        <div className="flex items-center gap-2">
          <div className="text-xs bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/30 px-2 py-1 rounded">
            🔒 Premium Feature
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("predictions")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "predictions"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <Target className="inline w-4 h-4 mr-1" />
          Price Predictions
        </button>
        <button
          onClick={() => setActiveTab("cycles")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "cycles"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <BarChart3 className="inline w-4 h-4 mr-1" />
          Market Cycles
        </button>
        <button
          onClick={() => setActiveTab("news")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "news"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <Newspaper className="inline w-4 h-4 mr-1" />
          Market News
        </button>
        <button
          onClick={() => setActiveTab("calendar")}
          className={`px-3 py-1 rounded text-sm transition-colors ${
            activeTab === "calendar"
              ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
              : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
          }`}
        >
          <Calendar className="inline w-4 h-4 mr-1" />
          Events
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "predictions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium">AI Price Predictions</h4>
            <div className="flex gap-2">
              {(["1W", "1M", "3M"] as const).map(timeframe => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedTimeframe === timeframe
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                      : "bg-slate-800/60 text-slate-300 hover:border-slate-600 border border-slate-700/50"
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>

          {pricePredictions.length > 0 ? (
            <div className="space-y-3">
              {pricePredictions.slice(0, 8).map(prediction => (
                <div key={prediction.skinId} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{prediction.skinName}</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm ${getTrendColor(prediction.trend)}`}>
                        {getTrendIcon(prediction.trend)}
                      </span>
                      <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-1 rounded">
                        {prediction.confidence}% confidence
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400">Current Price</div>
                      <div className="font-medium">${prediction.currentPrice.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Predicted Price</div>
                      <div className={`font-medium ${getTrendColor(prediction.trend)}`}>
                        ${prediction.predictedPrice.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Expected Change</div>
                      <div className={`font-medium ${getTrendColor(prediction.trend)}`}>
                        {((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">Timeframe</div>
                      <div className="font-medium">{prediction.timeframe}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-slate-400 mb-1">Key Factors:</div>
                    <div className="flex flex-wrap gap-1">
                      {prediction.factors.map((factor, index) => (
                        <span key={index} className="text-xs bg-slate-800/60 border border-slate-700/50 px-2 py-1 rounded">
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              No price predictions available.
            </div>
          )}
        </div>
      )}

      {activeTab === "cycles" && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium mb-4">Market Cycle Analysis</h4>
          
          {marketCycle ? (
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-purple-400 mb-2">
                  {marketCycle.phase.charAt(0).toUpperCase() + marketCycle.phase.slice(1)}
                </div>
                <div className="text-lg text-slate-300 mb-2">{marketCycle.description}</div>
                <div className="text-sm text-slate-400 mb-4">
                  Confidence: {marketCycle.confidence}% | Duration: {marketCycle.estimatedDuration}
                </div>
                <div className="text-sm text-slate-300">{marketCycle.recommendation}</div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
                <h5 className="font-medium mb-3">Key Indicators:</h5>
                <div className="flex flex-wrap gap-2">
                  {marketCycle.indicators.map((indicator, index) => (
                    <span key={index} className="text-sm bg-purple-500/10 text-purple-400 border border-purple-500/30 px-3 py-1 rounded">
                      {indicator}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              Insufficient data for market cycle analysis.
            </div>
          )}
        </div>
      )}

      {activeTab === "news" && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium mb-4">Market News & Sentiment</h4>
          
          {marketNews.length > 0 ? (
            <div className="space-y-3">
              {marketNews.map(news => (
                <div
                  key={news.id}
                  className={`p-4 rounded-lg border ${getSentimentColor(news.sentiment)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium">{news.title}</h5>
                    <span className={`text-xs px-2 py-1 rounded ${getImpactColor(news.impact)}`}>
                      {news.impact.toUpperCase()} Impact
                    </span>
                  </div>
                  <p className="text-sm opacity-90 mb-2">{news.summary}</p>
                  <div className="flex items-center justify-between text-xs opacity-75">
                    <span>{news.source}</span>
                    <span>{new Date(news.publishedAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              No market news available.
            </div>
          )}
        </div>
      )}

      {activeTab === "calendar" && (
        <div className="space-y-4">
          <h4 className="text-lg font-medium mb-4">Market Events Calendar</h4>
          
          {marketEvents.length > 0 ? (
            <div className="space-y-3">
              {marketEvents.map(event => (
                <div key={event.id} className="bg-slate-800/60 border border-slate-700/50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium">{event.title}</h5>
                    <span className={`text-xs px-2 py-1 rounded ${getImpactColor(event.impact)}`}>
                      {event.impact.toUpperCase()} Impact
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 mb-2">{event.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{event.category.replace('_', ' ')}</span>
                    <span className="text-purple-400">
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              No upcoming events.
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 pt-6 border-t border-slate-700/50">
        <div className="text-xs text-slate-500 text-center">
          <Zap className="inline w-3 h-3 mr-1" />
          AI-powered insights are for informational purposes only. 
          Always conduct your own research before making investment decisions.
        </div>
      </div>
    </div>
  );
}
