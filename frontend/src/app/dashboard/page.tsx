// /frontend/src/app/dashboard/page-ux-optimized.tsx — [Frontend]
// {/* UX-Optimized Dashboard - Clean, Focused, Actionable */}

"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { useUserRole } from "@/hooks/useUserRole";
import { PortfolioValueChart } from "@/components/charts/PortfolioValueChart";
import { PortfolioPieChart } from "./components/PortfolioPieChart";
import MarketPulse from "./components/MarketPulse";
import MarketEvents from "./components/MarketEvents";
import { EnhancedMovers } from "./components/EnhancedMovers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { KPICard } from "@/components/ui/kpi-card";
import { tokens } from "@/lib/design-tokens";
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertCircle, 
  RefreshCw,
  BarChart3,
  Heart,
  Plus,
  ArrowRight,
  Eye,
  Activity,
  Globe,
  Crown,
  Lock
} from "lucide-react";
import { formatUSD, safeToFixed } from "@/lib/num";

export default function Dashboard() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const { data, error, isLoading, mutate, portfolio, history, kpis } = usePortfolioData();
  const { isPremium } = useUserRole();

  const [chartRange, setChartRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('7d');
  const [movers, setMovers] = useState<{ gainers: any[]; losers: any[] }>({ gainers: [], losers: [] });
  const [moverTimeframe, setMoverTimeframe] = useState<'24h' | '7d'>('24h');

  const handleRefresh = async () => {
    await mutate();
  };

  if (!isLoaded) {
    return <div className="text-white p-6">Loading...</div>;
  }

  if (!isSignedIn) {
    return <div className="text-white p-6">Please sign in to view your dashboard.</div>;
  }

  const totalValue = kpis?.portfolioValue || 0;
  const change24h = kpis?.portfolioChange24h || 0;
  const change7d = kpis?.portfolioChange7d || 0;
  const totalInvested = kpis?.totalInvested || 0;
  const unrealizedPL = totalValue - totalInvested;
  const plPercentage = totalInvested > 0 ? (unrealizedPL / totalInvested) * 100 : 0;

  return (
    <div className={`${tokens.bg.base} text-white min-h-screen`}>
      <div className="container mx-auto px-4 py-8">
        
        {/* Header - Clear and Simple */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="text-slate-400 mt-1">
                Track your CS2 skin portfolio performance
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
          
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <KPICard
              label="Total Value"
              value={formatUSD(totalValue)}
              delta={change24h !== 0 ? change24h : undefined}
              deltaLabel="24h"
            />
            <KPICard
              label="Avg. price / skin"
              value={formatUSD(totalValue / Math.max(portfolio?.length || 1, 1))}
            />
            <KPICard
              label="# Skins"
              value={String(portfolio?.length || 0)}
            />
            <KPICard
              label="Total invested"
              value={formatUSD(totalInvested)}
            />
            <KPICard
              label="Daily P/L"
              value={formatUSD(change24h * totalValue / 100)}
              delta={change24h !== 0 ? change24h : undefined}
            />
            <KPICard
              label="7d P/L"
              value={formatUSD(change7d * totalValue / 100)}
              delta={change7d !== 0 ? change7d : undefined}
              deltaLabel="7d"
            />
          </div>
        </div>

        {/* Main Content - Focused Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Portfolio Chart - Main Focus */}
          <div className="lg:col-span-3">
            <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-white">Portfolio Overview</CardTitle>
                  <ToggleGroup type="single" value={chartRange} onValueChange={(value) => setChartRange(value as any)}>
                    <ToggleGroupItem value="7d" className="text-xs">7D</ToggleGroupItem>
                    <ToggleGroupItem value="30d" className="text-xs">30D</ToggleGroupItem>
                    <ToggleGroupItem value="90d" className="text-xs">90D</ToggleGroupItem>
                    <ToggleGroupItem value="1y" className="text-xs">1Y</ToggleGroupItem>
                    <ToggleGroupItem value="all" className="text-xs">All</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <PortfolioValueChart 
                    data={history || []} 
                    range={chartRange}
                    onRangeChange={setChartRange}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts & Watchlist - Like Screenshot */}
          <div className="lg:col-span-1">
            <Card className={`${tokens.bg.surface} ${tokens.border.default} h-full`}>
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-purple-400" />
                  Alerts & Watchlist
                  <Lock className="h-4 w-4 text-slate-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Premium Status */}
                {isPremium ? (
                  <div className="text-center p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-lg">
                    <Crown className="h-8 w-8 mx-auto mb-2 text-green-400" />
                    <h3 className="font-semibold text-white mb-1">Premium Active</h3>
                    <p className="text-sm text-slate-300 mb-3">You have access to all premium features</p>
                    <div className="text-xs text-green-400">✓ Enhanced alerts ✓ Unlimited watchlist</div>
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
                    <Crown className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                    <h3 className="font-semibold text-white mb-1">Premium Required</h3>
                    <p className="text-sm text-slate-300 mb-3">Unlock enhanced alerts and unlimited watchlist items</p>
                    <Button
                      onClick={() => router.push('/pricing')}
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      View Plans
                    </Button>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push('/portfolio')}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    View Portfolio
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                  <Button 
                    className="w-full justify-start" 
                    variant="outline"
                    onClick={() => router.push('/skins')}
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Browse Skins
                    <ArrowRight className="h-4 w-4 ml-auto" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>


         {/* Portfolio Breakdown, Market Pulse, Events */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
           <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
             <CardHeader>
               <CardTitle className="text-lg font-bold text-white">Portfolio Breakdown</CardTitle>
             </CardHeader>
             <CardContent>
               <PortfolioPieChart portfolio={portfolio || []} />
             </CardContent>
           </Card>

           <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
             <CardHeader>
               <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                 <Activity className="h-5 w-5 text-green-400" />
                 Market Pulse
                 <Lock className="h-4 w-4 text-slate-400" />
               </CardTitle>
             </CardHeader>
             <CardContent>
               <MarketPulse 
                 lastUpdated={null} 
                 onRefresh={() => {}} 
                 isLoading={false}
                 isPremium={isPremium}
               />
             </CardContent>
           </Card>

           <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
             <CardHeader>
               <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                 <Globe className="h-5 w-5 text-purple-400" />
                 Market Events
                 <Lock className="h-4 w-4 text-slate-400" />
               </CardTitle>
             </CardHeader>
             <CardContent>
               <MarketEvents />
             </CardContent>
           </Card>
         </div>

         {/* Top Movers */}
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
           <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
             <CardHeader>
               <div className="flex items-center justify-between">
                 <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                   <TrendingUp className="h-5 w-5 text-green-400" />
                   Top Gainers
                 </CardTitle>
                 <ToggleGroup type="single" value={moverTimeframe} onValueChange={(value) => setMoverTimeframe(value as any)}>
                   <ToggleGroupItem value="24h" className="text-xs">24h</ToggleGroupItem>
                   <ToggleGroupItem value="7d" className="text-xs">7d</ToggleGroupItem>
                 </ToggleGroup>
               </div>
             </CardHeader>
             <CardContent>
               <EnhancedMovers 
                 type="gainers" 
                 data={movers.gainers} 
                 timeframe={moverTimeframe}
               />
             </CardContent>
           </Card>

           <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
             <CardHeader>
               <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                 <TrendingDown className="h-5 w-5 text-red-400" />
                 Top Losers
               </CardTitle>
             </CardHeader>
             <CardContent>
               <EnhancedMovers 
                 type="losers" 
                 data={movers.losers} 
                 timeframe={moverTimeframe}
               />
             </CardContent>
           </Card>
         </div>

        {/* Empty State - Clear Call to Action */}
        {(!portfolio || portfolio.length === 0) && (
          <Card className={`${tokens.bg.surface} ${tokens.border.default}`}>
            <CardContent className="text-center py-12">
              <Package className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Skins in Portfolio</h3>
              <p className="text-slate-400 mb-6">
                Start building your CS2 skin portfolio by adding skins you own or want to track.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={() => router.push('/skins')}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Skins
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/skins')}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Browse Market
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
