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
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* Main */}
      <main className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Header KPIs Section */}
        <section className="card">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">Your Portfolio</h1>
          <p className="text-gray-400 text-sm mb-6">
            Overview of your skins, value history & watchlist
          </p>
          
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-yellow-400">
                {kpiData?.portfolioCount || portfolioSkins.length}
              </div>
              <div className="text-xs text-gray-400">Portfolio Skins</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-green-400">
                ${kpiData?.portfolioValue?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-gray-400">Total Value</div>
              <div className="text-xs text-gray-500">
                {kpiData?.portfolioChange24h !== 0 && kpiData && (
                  <span className={kpiData.portfolioChange24h > 0 ? "text-green-400" : "text-red-400"}>
                    {kpiData.portfolioChange24h > 0 ? "+" : ""}{kpiData.portfolioChange24h.toFixed(1)}% 24h
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-blue-400">
                ${kpiData?.totalInvested?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-gray-400">Total Invested</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-purple-400">
                ${kpiData?.unrealizedPL?.toFixed(2) || "0.00"}
              </div>
              <div className="text-xs text-gray-400">Unrealized P/L</div>
              <div className="text-xs text-gray-500">
                {kpiData?.portfolioChange7d !== 0 && kpiData && (
                  <span className={kpiData.portfolioChange7d > 0 ? "text-green-400" : "text-red-400"}>
                    {kpiData.portfolioChange7d > 0 ? "+" : ""}{kpiData.portfolioChange7d.toFixed(1)}% 7d
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-blue-400">
                {kpiData?.watchlistCount || watchlist.length}
              </div>
              <div className="text-xs text-gray-400">Watchlist</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4 text-center">
              <div className="text-lg font-bold text-amber-400">
                {kpiData?.activeAlerts || 0}
              </div>
              <div className="text-xs text-gray-400">Active Alerts</div>
            </div>
          </div>

          {/* Last Updated */}
          <div className="text-center mb-4">
            <LastUpdatedChip onRefresh={() => mutate()} />
          </div>
        </section>

        {/* Portfolio Chart Section */}
        <section className="card">
          <PortfolioChart history={history} />
        </section>

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
