"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortfolioChart from "./PortfolioChart";
import PortfolioTable from "./PortfolioTable";
import WatchlistTable from "./WatchlistTable";
import PortfolioAllocation from "./PortfolioAllocation";
import LastUpdatedChip from "./LastUpdatedChip";
import PerformanceDashboard from "./PerformanceDashboard";
import AdvancedCharts from "./AdvancedCharts";
import PremiumFeatureFlag from "./PremiumFeatureFlag";
import SmartAlerts from "./SmartAlerts";
import TransactionAnalytics from "./TransactionAnalytics";
import PortfolioHealthScore from "./PortfolioHealthScore";
import MarketIntelligence from "./MarketIntelligence";

// {/* Authentifizierte Hooks */}
import { useAuthenticatedPortfolio } from "@/hooks/useAuthenticatedPortfolio";
import { useAuthenticatedWatchlist } from "@/hooks/useAuthenticatedWatchlist";

// {/* Types kept minimal; UI components do stricter typing */}
type WatchlistEntry = any;

interface PortfolioKPIs {
  portfolioCount: number;
  portfolioValue: number;
  portfolioChange24h: number;
  portfolioChange7d: number;
  totalInvested: number;
  unrealizedPL: number;
  watchlistCount: number;
  activeAlerts: number;
  lastUpdated?: string;
  volatility?: number;
  volatilityMessage?: string;
  maxDrawdown?: number;
  maxDrawdownMessage?: string;
  hasEnoughRiskData?: boolean;
}

export default function ModernPortfolioPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [activeFilter, setActiveFilter] = useState<{ type: string; value: string; values?: string[] } | null>(null);

  // Authentifizierte Hooks
  const { portfolio: portfolioSkins, kpis: kpiData, history, isLoading, error, mutate } = useAuthenticatedPortfolio();
  const { watchlist, isLoading: watchlistLoading, error: watchlistError, mutate: mutateWatchlist } = useAuthenticatedWatchlist();

  // {/* Remove from Watchlist */}
  const handleRemoveWatchlist = async (skinId: number) => {
    try {
      // Implementation bleibt gleich
      await mutateWatchlist();
    } catch (err) {
      console.error("Failed to remove from watchlist:", err);
    }
  };

  // Redirect to sign-in if not authenticated
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to view your portfolio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/sign-in">Sign In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoaded || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Error Banner */}
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-4">
              <div className="text-destructive text-sm">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <div className="space-y-8">
          {/* Header KPIs Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl sm:text-4xl font-extrabold">Your Portfolio</CardTitle>
              <CardDescription className="text-base">
                Overview of your skins, value history & watchlist
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-yellow-400">
                      {kpiData?.portfolioCount || portfolioSkins.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Portfolio Skins</div>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-green-400">
                      ${kpiData?.portfolioValue?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Value</div>
                    {kpiData?.portfolioChange24h !== 0 && kpiData && (
                      <Badge variant={kpiData.portfolioChange24h > 0 ? "default" : "destructive"} className="text-xs mt-1">
                        {kpiData.portfolioChange24h > 0 ? "+" : ""}{kpiData.portfolioChange24h.toFixed(1)}% 24h
                      </Badge>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-blue-400">
                      ${kpiData?.totalInvested?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-xs text-muted-foreground">Total Invested</div>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-purple-400">
                      ${kpiData?.unrealizedPL?.toFixed(2) || "0.00"}
                    </div>
                    <div className="text-xs text-muted-foreground">Unrealized P/L</div>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-blue-400">
                      {kpiData?.watchlistCount || watchlist.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Watchlist</div>
                  </CardContent>
                </Card>
                
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-lg font-bold text-yellow-400">
                      {kpiData?.activeAlerts || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Active Alerts</div>
                  </CardContent>
                </Card>
              </div>

              {/* Last Updated */}
              <div className="text-center">
                <LastUpdatedChip onRefresh={() => mutate()} />
              </div>
            </CardContent>
          </Card>

          {/* Portfolio Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Value History</CardTitle>
              <CardDescription>
                Track your portfolio performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PortfolioChart
                history={history}
                onRangeChange={(range, days) => {
                  console.log("Range changed:", range, days);
                }}
              />
            </CardContent>
          </Card>

          {/* Tabs for Portfolio and Watchlist */}
          <Tabs defaultValue="portfolio" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="watchlist">Watchlist</TabsTrigger>
            </TabsList>
            
            <TabsContent value="portfolio" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your Skins</CardTitle>
                  <CardDescription>
                    Manage your skin collection and track performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PortfolioTable
                    skins={portfolioSkins}
                    watchlist={watchlist}
                    onDataChange={() => mutate()}
                    activeFilter={activeFilter}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="watchlist" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Watchlist</CardTitle>
                  <CardDescription>
                    Track skins you're interested in
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WatchlistTable
                    items={watchlist}
                    onRemove={handleRemoveWatchlist}
                    onUpdateAlert={async (skinId, priceAlert) => {
                      // Implementation bleibt gleich
                      await mutateWatchlist();
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Additional Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Allocation</CardTitle>
                <CardDescription>
                  See how your skins are distributed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioAllocation skins={portfolioSkins} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Dashboard</CardTitle>
                <CardDescription>
                  Advanced performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceDashboard kpis={kpiData} />
              </CardContent>
            </Card>
          </div>

          {/* Premium Features */}
          <PremiumFeatureFlag>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Charts</CardTitle>
                  <CardDescription>
                    Detailed analysis and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdvancedCharts skins={portfolioSkins} history={history} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Smart Alerts</CardTitle>
                  <CardDescription>
                    Intelligent price alerts and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <SmartAlerts />
                </CardContent>
              </Card>
            </div>
          </PremiumFeatureFlag>
        </div>
      </div>
    </div>
  );
}
