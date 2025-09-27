"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown } from "lucide-react";
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

  // Authentifizierte Hooks
  const { portfolio: portfolioSkins, kpis: kpiData, history, isLoading, error, mutate } = useAuthenticatedPortfolio();
  const { watchlist, isLoading: watchlistLoading, error: watchlistError, mutate: mutateWatchlist } = useAuthenticatedWatchlist();
  const { isPremium } = useUserRole();

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

      {/* Premium Status Banner */}
      {isPremium && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
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
      <main className="max-w-6xl mx-auto flex flex-col gap-8 relative z-10">
        {/* Header KPIs Section */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="text-3xl sm:text-4xl font-extrabold text-white animate-slide-in-left">Your Portfolio</CardTitle>
            <CardDescription className="text-base text-slate-300 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              Overview of your skins, value history & watchlist
            </CardDescription>
          </CardHeader>
          <CardContent>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <Card className="card-enhanced text-center group hover:scale-105 transition-all duration-300">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-brand-yellow animate-slide-in-left">
                  {kpiData?.portfolioCount || portfolioSkins.length}
                </div>
                <div className="text-sm text-slate-300">Portfolio Skins</div>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced text-center group hover:scale-105 transition-all duration-300">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-brand-green animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                  ${kpiData?.portfolioValue?.toFixed(2) || "0.00"}
                </div>
                <div className="text-sm text-slate-300">Total Value</div>
                {kpiData?.portfolioChange24h !== 0 && kpiData && (
                  <Badge 
                    variant={kpiData.portfolioChange24h > 0 ? "default" : "destructive"} 
                    className={`text-xs mt-2 badge-enhanced ${
                      kpiData.portfolioChange24h > 0 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30 badge-glow green' 
                        : 'bg-red-500/20 text-red-400 border-red-500/30 badge-glow red'
                    }`}
                  >
                    {kpiData.portfolioChange24h > 0 ? "+" : ""}{kpiData.portfolioChange24h.toFixed(1)}% 24h
                  </Badge>
                )}
              </CardContent>
            </Card>
            
            <Card className="card-enhanced text-center group hover:scale-105 transition-all duration-300">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-brand-blue animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                  ${kpiData?.totalInvested?.toFixed(2) || "0.00"}
                </div>
                <div className="text-sm text-slate-300">Total Invested</div>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced text-center group hover:scale-105 transition-all duration-300">
              <CardContent className="p-4">
                <div className={`text-2xl font-bold animate-slide-in-left ${
                  (kpiData?.unrealizedPL || 0) >= 0 ? 'text-brand-green' : 'text-red-400'
                }`} style={{ animationDelay: '0.3s' }}>
                  ${kpiData?.unrealizedPL?.toFixed(2) || "0.00"}
                </div>
                <div className="text-sm text-slate-300">Unrealized P/L</div>
                {kpiData?.portfolioChange7d !== 0 && kpiData && (
                  <Badge 
                    variant={kpiData.portfolioChange7d > 0 ? "default" : "destructive"} 
                    className={`text-xs mt-2 badge-enhanced ${
                      kpiData.portfolioChange7d > 0 
                        ? 'bg-green-500/20 text-green-400 border-green-500/30 badge-glow green' 
                        : 'bg-red-500/20 text-red-400 border-red-500/30 badge-glow red'
                    }`}
                  >
                    {kpiData.portfolioChange7d > 0 ? "+" : ""}{kpiData.portfolioChange7d.toFixed(1)}% 7d
                  </Badge>
                )}
              </CardContent>
            </Card>
            
            <Card className="card-enhanced text-center group hover:scale-105 transition-all duration-300">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-brand-blue animate-slide-in-left" style={{ animationDelay: '0.4s' }}>
                  {kpiData?.watchlistCount || watchlist.length}
                </div>
                <div className="text-sm text-slate-300">Watchlist</div>
              </CardContent>
            </Card>
            
            <Card className="card-enhanced text-center group hover:scale-105 transition-all duration-300">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-brand-orange animate-slide-in-left" style={{ animationDelay: '0.5s' }}>
                  {kpiData?.activeAlerts || 0}
                </div>
                <div className="text-sm text-slate-300">Active Alerts</div>
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
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="text-white animate-slide-in-left">Portfolio Value History</CardTitle>
            <CardDescription className="text-slate-300 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              Track your portfolio performance over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioChart history={history} />
          </CardContent>
        </Card>

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
          <AdvancedCharts 
            portfolio={portfolioSkins} 
            history={history}
            isPremium={true}
          />
        </PremiumFeatureFlag>

        {/* Smart Alerts */}
        <PremiumFeatureFlag feature="smart-alerts">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-white animate-slide-in-left">Smart Alerts</CardTitle>
              <CardDescription className="text-slate-300 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                Intelligent price alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
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
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-white animate-slide-in-left">Transaction Analytics</CardTitle>
              <CardDescription className="text-slate-300 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                Detailed analysis of your trading activity
              </CardDescription>
            </CardHeader>
            <CardContent>
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
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-white animate-slide-in-left">Portfolio Health Score</CardTitle>
              <CardDescription className="text-slate-300 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                Assess the health and risk of your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
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
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-white animate-slide-in-left">Market Intelligence</CardTitle>
              <CardDescription className="text-slate-300 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
                Market insights and trends analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MarketIntelligence 
                portfolio={portfolioSkins} 
                history={history}
                isPremium={true}
              />
            </CardContent>
          </Card>
        </PremiumFeatureFlag>

        {/* Portfolio Allocation */}
        <Card className="card-enhanced">
          <CardHeader>
            <CardTitle className="text-white animate-slide-in-left">Portfolio Allocation</CardTitle>
            <CardDescription className="text-slate-300 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              See how your skins are distributed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PortfolioAllocation 
              portfolio={portfolioSkins} 
              onFilterChange={setActiveFilter}
              activeFilter={activeFilter}
            />
          </CardContent>
        </Card>



        {/* Portfolio and Watchlist Tabs */}
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
      </main>
    </div>
  );
}
