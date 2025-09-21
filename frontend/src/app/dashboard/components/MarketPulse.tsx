// /frontend/src/app/dashboard/components/MarketPulse.tsx — [Frontend]
// {/* Market Pulse - CS2 Market Index with Premium Features */}
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  RefreshCw,
  Lock,
  Crown
} from "lucide-react";
import { formatUSD, safeToFixed } from "@/lib/num";

interface MarketPulseProps {
  lastUpdated?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  isPremium?: boolean;
}

// Mock market data - replace with real API
const getMarketData = () => ({
  index24h: 2.3,
  index7d: 5.7,
  liquidityIndex: 0.85,
  portfolioVsMarket: 1.2,
  lastUpdated: new Date().toLocaleTimeString()
});

export default function MarketPulse({ 
  lastUpdated, 
  onRefresh, 
  isLoading = false,
  isPremium = false 
}: MarketPulseProps) {
  const marketData = getMarketData();

  if (isLoading) {
    return (
      <Card className="card-brand">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="h-5 w-5 text-brand-blue" />
              Market Pulse
            </CardTitle>
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`card-brand ${isPremium ? 'card-premium' : 'card-enhanced'} hover-lift`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-brand-blue" />
              Market Pulse
              {isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
            </CardTitle>
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Updated {lastUpdated}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="h-8 w-8 p-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* CS2 Market Index */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">CS2 Market Index</h3>
            <div className="flex items-center justify-center gap-2">
              {marketData.index24h >= 0 ? (
                <TrendingUp className="h-5 w-5 text-green-400" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-400" />
              )}
              <span className="text-2xl font-bold">
                {marketData.index24h >= 0 ? '+' : ''}{safeToFixed(marketData.index24h, 2)}%
              </span>
              <span className="text-sm text-muted-foreground">24h</span>
            </div>
          </div>

          {/* Free vs Premium Content */}
          {isPremium ? (
            <div className="space-y-3">
              {/* 7d Change */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="text-sm text-muted-foreground">7d Change</span>
                <div className="flex items-center gap-1">
                  {marketData.index7d >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                  <span className="font-semibold">
                    {marketData.index7d >= 0 ? '+' : ''}{safeToFixed(marketData.index7d, 2)}%
                  </span>
                </div>
              </div>

              {/* Liquidity Index */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="text-sm text-muted-foreground">Liquidity Index</span>
                <Badge 
                  variant={marketData.liquidityIndex > 0.8 ? "default" : "destructive"}
                  className={marketData.liquidityIndex > 0.8 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}
                >
                  {safeToFixed(marketData.liquidityIndex, 2)}
                </Badge>
              </div>

              {/* Portfolio vs Market */}
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <span className="text-sm text-muted-foreground">vs Your Portfolio</span>
                <div className="flex items-center gap-1">
                  {marketData.portfolioVsMarket > 1 ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  )}
                  <span className="font-semibold">
                    {safeToFixed(marketData.portfolioVsMarket, 2)}x
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Free User - Limited Data */}
              <div className="p-4 bg-muted/20 rounded-lg text-center space-y-3">
                <div className="space-y-2">
                  <Lock className="h-8 w-8 mx-auto text-muted-foreground/50" />
                  <h4 className="font-medium">Premium Insights</h4>
                  <p className="text-sm text-muted-foreground">
                    Unlock 7d trends, liquidity analysis, and portfolio benchmarking.
                  </p>
                </div>
                <Button 
                  size="sm"
                  className="btn-premium btn-enhanced"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Premium
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
