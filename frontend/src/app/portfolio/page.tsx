"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
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
import { EnhancedPortfolioGrid } from "./_components/EnhancedPortfolioGrid";


// {/* Authentifizierte Hooks */}
import { useAuthenticatedPortfolio } from "@/hooks/useAuthenticatedPortfolio";
import { useAuthenticatedWatchlist } from "@/hooks/useAuthenticatedWatchlist";
import { useUserRole } from "@/hooks/useUserRole";

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
  const [showPremiumBanner, setShowPremiumBanner] = useState(true);

  // Authentifizierte Hooks
  const { portfolio: portfolioSkins, kpis: kpiData, history, isLoading, error, mutate } = useAuthenticatedPortfolio();
  const { watchlist, isLoading: watchlistLoading, error: watchlistError, mutate: mutateWatchlist } = useAuthenticatedWatchlist();
  const { isPremium } = useUserRole();

  // Auto-hide premium banner after 10 seconds
  useEffect(() => {
    if (isPremium && showPremiumBanner) {
      const timer = setTimeout(() => {
        setShowPremiumBanner(false);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [isPremium, showPremiumBanner]);

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

  // {/* Update Price Alert */}
  async function handleUpdateAlert(skinId: number, alertPrice: number) {
    try {
      // TODO: Implement updateAlert with auth
      console.log("Update alert for skin:", skinId, "price:", alertPrice);
      mutateWatchlist();
    } catch (e: any) {
      console.error("Failed to update alert:", e);
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
    <div className="dashboard-bg text-white p-2 sm:p-4">
      {/* Error Banner */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4">
            <div className="text-destructive text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Premium Status Banner - Temporary with X button */}
      {isPremium && showPremiumBanner && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4 mb-6 relative animate-slide-in-down">
          <button
            onClick={() => setShowPremiumBanner(false)}
            className="absolute top-2 right-2 text-green-300 hover:text-white transition-colors"
            aria-label="Close banner"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 pr-6">
            <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
              <Crown className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Premium Active</h3>
              <p className="text-sm text-green-300">You have access to all premium features including advanced charts, smart alerts, and market intelligence.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="max-w-6xl mx-auto section-container relative z-10">
        {/* Header KPIs Section */}
        <Card className="card-standard">
          <CardHeader className="pb-8">
            <CardTitle className="text-h1 animate-slide-in-left mb-4">Your Portfolio</CardTitle>
            <CardDescription className="text-body animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              Overview of your skins, value history & watchlist
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
          
          {/* Hero KPIs - Only the most important metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-gray-800/30 rounded-xl">
              <div className="text-4xl font-bold text-green-400 mb-2">
                ${kpiData?.portfolioValue?.toFixed(2) || "0.00"}
              </div>
              <div className="text-lg text-gray-300 mb-1">Total Value</div>
              <div className="text-sm text-gray-500">Current portfolio worth</div>
              {kpiData?.portfolioChange24h !== 0 && kpiData && (
                <div className={`text-sm mt-2 px-2 py-1 rounded-full inline-block ${
                  kpiData.portfolioChange24h > 0 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {kpiData.portfolioChange24h > 0 ? "+" : ""}{kpiData.portfolioChange24h.toFixed(1)}% 24h
                </div>
              )}
            </div>
            
            <div className="text-center p-6 bg-gray-800/30 rounded-xl">
              <div className={`text-4xl font-bold mb-2 ${
                (kpiData?.unrealizedPL || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                ${kpiData?.unrealizedPL?.toFixed(2) || "0.00"}
              </div>
              <div className="text-lg text-gray-300 mb-1">Unrealized P/L</div>
              <div className="text-sm text-gray-500">Current profit/loss</div>
              {kpiData?.portfolioChange7d !== 0 && kpiData && (
                <div className={`text-sm mt-2 px-2 py-1 rounded-full inline-block ${
                  kpiData.portfolioChange7d > 0 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {kpiData.portfolioChange7d > 0 ? "+" : ""}{kpiData.portfolioChange7d.toFixed(1)}% 7d
                </div>
              )}
            </div>
            
            <div className="text-center p-6 bg-gray-800/30 rounded-xl">
              <div className="text-4xl font-bold text-blue-400 mb-2">
                {kpiData?.portfolioCount || portfolioSkins.length}
              </div>
              <div className="text-lg text-gray-300 mb-1">Portfolio Skins</div>
              <div className="text-sm text-gray-500">Total items owned</div>
            </div>
          </div>

          {/* Secondary Info - Less prominent */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-800/20 rounded-lg">
              <div className="text-2xl font-bold text-gray-300">
                ${kpiData?.totalInvested?.toFixed(2) || "0.00"}
              </div>
              <div className="text-sm text-gray-500">Total Invested</div>
            </div>
            
            <div className="text-center p-4 bg-gray-800/20 rounded-lg">
              <div className="text-2xl font-bold text-gray-300">
                {kpiData?.watchlistCount || watchlist.length}
              </div>
              <div className="text-sm text-gray-500">Watchlist</div>
            </div>
            
            <div className="text-center p-4 bg-gray-800/20 rounded-lg">
              <div className="text-2xl font-bold text-gray-300">
                {kpiData?.activeAlerts || 0}
              </div>
              <div className="text-sm text-gray-500">Active Alerts</div>
            </div>
            
            <div className="text-center p-4 bg-gray-800/20 rounded-lg">
              <div className="text-2xl font-bold text-gray-300">
                {kpiData?.portfolioChange24h?.toFixed(1) || "0.0"}%
              </div>
              <div className="text-sm text-gray-500">24h Change</div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center mb-4">
            <LastUpdatedChip onRefresh={() => mutate()} />
          </div>
          </CardContent>
        </Card>

      {/* Portfolio Chart Section */}
      <Card className="card-standard">
        <CardHeader className="pb-8">
          <CardTitle className="text-3xl font-bold text-white mb-3">Portfolio Value History</CardTitle>
          <CardDescription className="text-lg text-gray-400">
            Track your portfolio performance over time
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <PortfolioChart history={history} />
        </CardContent>
      </Card>

        {/* Portfolio and Watchlist Tabs - Moved directly under chart */}
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800/50 border-slate-700/50">
            <TabsTrigger 
              value="portfolio" 
              className="data-[state=active]:bg-brand-blue data-[state=active]:text-white data-[state=inactive]:text-slate-400 hover:text-white transition-all duration-200"
            >
              Portfolio
            </TabsTrigger>
            <TabsTrigger 
              value="watchlist"
              className="data-[state=active]:bg-brand-blue data-[state=active]:text-white data-[state=inactive]:text-slate-400 hover:text-white transition-all duration-200"
            >
              Watchlist
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="portfolio" className="space-y-6">
            <EnhancedPortfolioGrid
              entries={portfolioSkins}
              onDataChange={() => mutate()}
              enableFilters={true}
              enableSorting={true}
              enableSearch={true}
              showStats={false}
              showSkeleton={isLoading}
              skeletonCount={8}
            />
          </TabsContent>
          
          <TabsContent value="watchlist" className="space-y-6">
            <Card className="card-enhanced">
              <CardHeader>
                <CardTitle className="text-white animate-slide-in-left">Watchlist</CardTitle>
                <CardDescription className="text-slate-300 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                  Track skins you're interested in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WatchlistTable
                  watchlist={watchlist}
                  onRemove={handleRemoveWatchlist}
                  onUpdateAlert={handleUpdateAlert}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      {/* Premium Features Section */}
      <div className="space-y-16">
        {/* Section Divider */}
        <div className="relative my-16">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700/30"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-900 px-8 py-2 text-lg font-semibold text-slate-300 border border-slate-700/50 rounded-full">
              Premium Features
            </span>
          </div>
        </div>

          {/* Performance Dashboard */}
          <PremiumFeatureFlag feature="performance-dashboard">
            <PerformanceDashboard 
              portfolio={portfolioSkins} 
              history={history}
              isPremium={true}
            />
          </PremiumFeatureFlag>

        {/* Advanced Charts */}
        <PremiumFeatureFlag feature="advanced-charts">
          <Card className="card-standard">
            <CardHeader className="pb-8">
              <CardTitle className="text-2xl font-bold text-white mb-3">Advanced Charts</CardTitle>
              <CardDescription className="text-lg text-gray-400">
                Professional-grade charting and analysis tools
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <AdvancedCharts
                portfolio={portfolioSkins}
                history={history}
                isPremium={true}
              />
            </CardContent>
          </Card>
        </PremiumFeatureFlag>

          {/* Smart Alerts */}
          <PremiumFeatureFlag feature="smart-alerts">
            <Card className="card-standard">
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-bold text-white mb-3">Smart Alerts</CardTitle>
                <CardDescription className="text-lg text-gray-400">
                  Intelligent price alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <SmartAlerts 
                  portfolio={portfolioSkins} 
                  history={history}
                  isPremium={true}
                />
              </CardContent>
            </Card>
          </PremiumFeatureFlag>

          {/* Transaction Analytics */}
          <PremiumFeatureFlag feature="transaction-analytics">
            <Card className="card-standard">
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-bold text-white mb-3">Transaction Analytics</CardTitle>
                <CardDescription className="text-lg text-gray-400">
                  Detailed analysis of your trading activity
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <TransactionAnalytics 
                  portfolio={portfolioSkins} 
                  history={history}
                  isPremium={true}
                />
              </CardContent>
            </Card>
          </PremiumFeatureFlag>

          {/* Portfolio Health Score */}
          <PremiumFeatureFlag feature="portfolio-health-score">
            <Card className="card-standard">
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-bold text-white mb-3">Portfolio Health Score</CardTitle>
                <CardDescription className="text-lg text-gray-400">
                  Assess the health and risk of your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <PortfolioHealthScore 
                  portfolio={portfolioSkins} 
                  history={history}
                  isPremium={true}
                />
              </CardContent>
            </Card>
          </PremiumFeatureFlag>

          {/* Market Intelligence */}
          <PremiumFeatureFlag feature="market-intelligence">
            <Card className="card-standard">
              <CardHeader className="pb-8">
                <CardTitle className="text-2xl font-bold text-white mb-3">Market Intelligence</CardTitle>
                <CardDescription className="text-lg text-gray-400">
                  Market insights and trends analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <MarketIntelligence 
                  portfolio={portfolioSkins} 
                  history={history}
                  isPremium={true}
                />
              </CardContent>
            </Card>
          </PremiumFeatureFlag>
        </div>

      </main>
    </div>
  );
}
