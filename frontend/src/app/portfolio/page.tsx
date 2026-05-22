"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { apiUrl, fetchJson } from "@/lib/api";
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
import { KPICard } from "@/components/ui/kpi-card";
import { tokens } from "@/lib/design-tokens";
import { AppShell } from "@/components/layout/AppShell";
import { PortfolioSummaryStrip } from "./_components/PortfolioSummaryStrip";
import { EmptyState } from "@/components/ui/empty-state";
import { Link2, Plus } from "lucide-react";


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
  const router = useRouter();
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
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
      const token = await getToken({ template: "backend" });
      await fetchJson(apiUrl(`/api/v1/watchlist/${skinId}`), {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      toast.success("Removed from watchlist");
      mutateWatchlist();
    } catch (e: any) {
      console.error("Failed to remove from watchlist:", e);
      toast.error(e?.message || "Failed to remove from watchlist");
    }
  }

  // {/* Update Price Alert */}
  // TODO: standalone alert-edit page does not exist yet; route to /alerts so the
  // user can manage alerts there. Replace with inline edit modal when available.
  async function handleUpdateAlert(_skinId: number, _alertPrice: number) {
    router.push("/alerts");
  }

  // While loading auth state or data, show skeleton.
  if (!isLoaded || isLoading) {
    return (
      <AppShell eyebrow="Portfolio" title="Your Portfolio" description="Loading…">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 rounded-lg bg-slate-800/40 border border-slate-700/50 animate-pulse" />
            ))}
          </div>
          <div className="h-72 rounded-lg bg-slate-800/40 border border-slate-700/50 animate-pulse" />
          <div className="h-96 rounded-lg bg-slate-800/40 border border-slate-700/50 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  // Redirect if not signed in
  if (!isSignedIn) {
    return (
      <AppShell eyebrow="Portfolio" title="Your Portfolio">
        <p className="text-slate-300">Please sign in to view your portfolio.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Portfolio"
      title="Your Portfolio"
      description="Overview of your skins, value history & watchlist"
      maxWidth="7xl"
    >
      {/* Error Banner */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="p-4">
            <div className="text-destructive text-sm">{error}</div>
          </CardContent>
        </Card>
      )}

      {/* Premium Status Banner — compact, dismissible */}
      {isPremium && showPremiumBanner && (
        <div className="flex items-center gap-3 bg-emerald-500/8 border border-emerald-500/25 rounded-2xl px-4 py-3 mb-5">
          <div className="w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
            <Crown className="w-3.5 h-3.5 text-emerald-300" aria-hidden="true" />
          </div>
          <p className="flex-1 text-sm text-slate-300">
            <span className="text-emerald-300 font-semibold">Pro active</span> — advanced charts, smart alerts, and research tools unlocked.
          </p>
          <button
            onClick={() => setShowPremiumBanner(false)}
            className="text-slate-400 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main */}
      <main className="space-y-5 relative z-10">
        {/* Summary strip — adapted from portfolio-hifi.html */}
        <PortfolioSummaryStrip
          cards={[
            {
              label: "Total value",
              value: `€${(kpiData?.portfolioValue ?? 0).toFixed(2)}`,
              sub:
                kpiData?.portfolioChange24h && kpiData.portfolioChange24h !== 0
                  ? `${kpiData.portfolioChange24h >= 0 ? "↗ +" : "↘ "}€${Math.abs((kpiData.portfolioValue ?? 0) * kpiData.portfolioChange24h / 100).toFixed(2)} (${kpiData.portfolioChange24h >= 0 ? "+" : ""}${kpiData.portfolioChange24h.toFixed(2)}%) today`
                  : undefined,
              subTone: (kpiData?.portfolioChange24h ?? 0) >= 0 ? "pos" : "neg",
              big: true,
            },
            {
              label: "Cost basis",
              value: `€${(kpiData?.totalInvested ?? 0).toFixed(2)}`,
              sub: kpiData?.portfolioCount ? `avg over ${kpiData.portfolioCount} lots` : undefined,
            },
            {
              label: "Unrealized P/L",
              value: `€${(kpiData?.unrealizedPL ?? 0).toFixed(2)}`,
              sub:
                kpiData?.unrealizedPL && kpiData.totalInvested
                  ? `${((kpiData.unrealizedPL / kpiData.totalInvested) * 100).toFixed(2)}% all-time`
                  : undefined,
              subTone: (kpiData?.unrealizedPL ?? 0) >= 0 ? "pos" : "neg",
            },
            {
              label: "Watchlist · Alerts",
              value: `${kpiData?.watchlistCount ?? watchlist.length} · ${kpiData?.activeAlerts ?? 0}`,
              sub: kpiData?.lastUpdated ? `last sync ${new Date(kpiData.lastUpdated).toLocaleTimeString("en-GB", { hour12: false, hour: "2-digit", minute: "2-digit" })}` : undefined,
            },
          ]}
        />
        <div className="flex justify-end mb-4">
          <LastUpdatedChip onRefresh={() => mutate()} />
        </div>

      {/* Portfolio Chart Section */}
      <Card className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="font-display text-lg font-semibold text-white">Value history</CardTitle>
          <CardDescription className="text-sm text-slate-400">
            Track your portfolio performance over time
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <PortfolioChart history={history} />
        </CardContent>
      </Card>

        {/* Portfolio and Watchlist Tabs */}
        <Tabs defaultValue="portfolio" className="space-y-5">
          <TabsList className="grid w-full grid-cols-2 bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl p-1 h-auto">
            <TabsTrigger
              value="portfolio"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=inactive]:text-slate-400 hover:text-white transition-all py-2"
            >
              Portfolio
            </TabsTrigger>
            <TabsTrigger
              value="watchlist"
              className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=inactive]:text-slate-400 hover:text-white transition-all py-2"
            >
              Watchlist
            </TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-5 mt-0">
            <Card className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display text-lg font-semibold text-white">Holdings</CardTitle>
                <CardDescription className="text-sm text-slate-400">
                  Your current skin holdings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {portfolioSkins.length === 0 ? (
                  <EmptyState
                    icon={Link2}
                    title="Your portfolio is empty"
                    description="Connect Steam to import your CS2 inventory in seconds, or add skins manually."
                    primaryCta={{ label: 'Connect Steam', href: '/account', icon: Link2 }}
                    secondaryCta={{ label: 'Add manually', href: '/skins' }}
                  />
                ) : (
                  <PortfolioTable
                    skins={portfolioSkins}
                    watchlist={watchlist}
                    onDataChange={() => mutate()}
                    activeFilter={null}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="watchlist" className="space-y-5 mt-0">
            <Card className="bg-slate-900/70 backdrop-blur border border-slate-700/30 rounded-2xl">
              <CardHeader>
                <CardTitle className="font-display text-lg font-semibold text-white">Watchlist</CardTitle>
                <CardDescription className="text-sm text-slate-400">
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
      <div className="space-y-5">
        <div className="flex items-center gap-3 pt-8">
          <div className="flex-1 h-px bg-slate-700/30" />
          <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-purple-300/80">
            Pro features
          </span>
          <div className="flex-1 h-px bg-slate-700/30" />
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
          <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
            <CardHeader className="pb-4">
              <CardTitle className="font-display text-lg font-semibold text-white">Advanced Charts</CardTitle>
              <CardDescription className="text-sm text-slate-400">
                Professional-grade charting and analysis tools
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 pb-8">
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
            <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg font-semibold text-white">Smart Alerts</CardTitle>
                <CardDescription className="text-sm text-slate-400">
                  Intelligent price alerts and notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-8">
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
            <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg font-semibold text-white">Transaction Analytics</CardTitle>
                <CardDescription className="text-sm text-slate-400">
                  Detailed analysis of your trading activity
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-8">
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
            <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg font-semibold text-white">Portfolio Health Score</CardTitle>
                <CardDescription className="text-sm text-slate-400">
                  Assess the health and risk of your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-8">
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
            <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
              <CardHeader className="pb-4">
                <CardTitle className="font-display text-lg font-semibold text-white">Market Intelligence</CardTitle>
                <CardDescription className="text-sm text-slate-400">
                  Market insights and trends analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-8">
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
    </AppShell>
  );
}
