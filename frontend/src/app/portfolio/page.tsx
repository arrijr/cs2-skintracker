"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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

export default function PortfolioPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [activeFilter, setActiveFilter] = useState<{ type: string; value: string; values?: string[] } | null>(null);

  // Authentifizierte Hooks
  const { portfolio: portfolioSkins, kpis: kpiData, history, isLoading, error, mutate } = useAuthenticatedPortfolio();
  const { watchlist, isLoading: watchlistLoading, error: watchlistError, mutate: mutateWatchlist } = useAuthenticatedWatchlist();

  // {/* Remove from Watchlist */}
  async function handleRemoveWatchlist(skinId: number) {
    try {
      // TODO: Implement removeFromWatchlist with auth
      console.log("Remove from watchlist:", skinId);
      mutateWatchlist();
    } catch (e: any) {
      console.error("Failed to remove from watchlist:", e);
    }
  }

  // While loading auth state or data, show a loading message.
  if (!isLoaded || isLoading) {
    return <div className="text-white p-6">Loading portfolio…</div>;
  }

  // Redirect if not signed in
  if (!isSignedIn) {
    return <div className="text-white p-6">Please sign in to view your portfolio.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-2 sm:p-4">
      {/* Error Banner */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4">
            <div className="text-destructive text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Main */}
      <main className="max-w-6xl mx-auto flex flex-col gap-8">
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
                {kpiData?.portfolioChange7d !== 0 && kpiData && (
                  <Badge variant={kpiData.portfolioChange7d > 0 ? "default" : "destructive"} className="text-xs mt-1">
                    {kpiData.portfolioChange7d > 0 ? "+" : ""}{kpiData.portfolioChange7d.toFixed(1)}% 7d
                  </Badge>
                )}
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
                <div className="text-lg font-bold text-amber-400">
                  {kpiData?.activeAlerts || 0}
                </div>
                <div className="text-xs text-muted-foreground">Active Alerts</div>
              </CardContent>
            </Card>
          </div>

          {/* Last Updated */}
          <div className="text-center mb-4">
            <LastUpdatedChip onRefresh={() => mutate()} />
          </div>
          </CardContent>
        </Card>

        {/* Portfolio Chart Section */}
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Value History</CardTitle>
            <CardDescription>
              Track your portfolio performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioChart history={history} />
          </CardContent>
        </Card>

        {/* Performance Dashboard - Temporarily Disabled */}
        {/* <PremiumFeatureFlag feature="performance-dashboard">
          <PerformanceDashboard 
            portfolio={portfolioSkins} 
            history={history}
            isPremium={true}
          />
        </PremiumFeatureFlag> */}

        {/* Advanced Charts - Temporarily Disabled */}
        {/* <PremiumFeatureFlag feature="advanced-charts">
          <AdvancedCharts 
            portfolio={portfolioSkins} 
            history={history}
            isPremium={true}
          />
        </PremiumFeatureFlag> */}

        {/* Smart Alerts */}
        <PremiumFeatureFlag feature="smart-alerts">
          <SmartAlerts 
            portfolio={portfolioSkins} 
            history={history}
            isPremium={true}
          />
        </PremiumFeatureFlag>

        {/* Transaction Analytics */}
        <PremiumFeatureFlag feature="transaction-analytics">
          <TransactionAnalytics 
            portfolio={portfolioSkins} 
            history={history}
            isPremium={true}
          />
        </PremiumFeatureFlag>

        {/* Portfolio Health Score */}
        <PremiumFeatureFlag feature="portfolio-health-score">
          <PortfolioHealthScore 
            portfolio={portfolioSkins} 
            history={history}
            isPremium={true}
          />
        </PremiumFeatureFlag>

        {/* Market Intelligence */}
        <PremiumFeatureFlag feature="market-intelligence">
          <MarketIntelligence 
            portfolio={portfolioSkins} 
            history={history}
            isPremium={true}
          />
        </PremiumFeatureFlag>

        {/* Portfolio Allocation */}
        <PortfolioAllocation 
          portfolio={portfolioSkins} 
          onFilterChange={setActiveFilter}
          activeFilter={activeFilter}
        />



        {/* Portfolio Table Section */}
        <section className="card">
          <PortfolioTable
            skins={portfolioSkins}
            watchlist={watchlist}
            onDataChange={() => mutate()}
            activeFilter={activeFilter}
          />
        </section>

        {/* Watchlist Table Section */}
        <section className="card">
          <WatchlistTable
            watchlist={watchlist}
            onRemove={handleRemoveWatchlist}
          />
        </section>
      </main>
    </div>
  );
}
