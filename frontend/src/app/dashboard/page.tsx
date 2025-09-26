// /frontend/src/app/dashboard/page-ux-optimized.tsx — [Frontend]
// {/* UX-Optimized Dashboard - Clean, Focused, Actionable */}

"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { PortfolioValueChart } from "@/components/charts/PortfolioValueChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
  Eye
} from "lucide-react";
import { formatUSD, safeToFixed } from "@/lib/num";

export default function Dashboard() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const { data, error, isLoading, mutate, portfolio, history, kpis } = usePortfolioData();
  
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('7d');

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
    <div className="dashboard-bg text-white min-h-screen">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header - Clear and Simple */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white">Portfolio</h1>
              <p className="text-slate-400 mt-1">
                {portfolio?.length || 0} skins • {formatUSD(totalValue)} total value
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
          
          {/* Key Metrics - Clean and Scannable */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-white">{formatUSD(totalValue)}</div>
              <div className="text-sm text-slate-400">Total Value</div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <div className={`text-2xl font-bold ${change24h >= 0 ? 'text-brand-celadon-500' : 'text-red-500'}`}>
                {change24h >= 0 ? '+' : ''}{safeToFixed(change24h, 2)}%
              </div>
              <div className="text-sm text-slate-400">24h Change</div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <div className="text-2xl font-bold text-white">{portfolio?.length || 0}</div>
              <div className="text-sm text-slate-400">Skins</div>
            </div>
            <div className="bg-card/50 rounded-lg p-4 border border-border/50">
              <div className={`text-2xl font-bold ${unrealizedPL >= 0 ? 'text-brand-celadon-500' : 'text-red-500'}`}>
                {formatUSD(unrealizedPL)}
              </div>
              <div className="text-sm text-slate-400">P&L</div>
            </div>
          </div>
        </div>

        {/* Main Content - Focused Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Portfolio Chart - Main Focus */}
          <div className="lg:col-span-2">
            <Card className="card-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold text-white">Performance</CardTitle>
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

          {/* Quick Actions - Clear CTAs */}
          <div className="lg:col-span-1">
            <Card className="card-secondary h-full">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/portfolio?tab=watchlist')}
                >
                  <Heart className="h-4 w-4 mr-2" />
                  Watchlist
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => router.push('/portfolio?tab=alerts')}
                >
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Price Alerts
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Portfolio Summary - Only if we have data */}
        {portfolio && portfolio.length > 0 && (
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Recent Skins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolio.slice(0, 6).map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-card/30 rounded-lg border border-border/30">
                    <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Package className="h-6 w-6 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {item.skin?.name || 'Unknown Skin'}
                      </div>
                      <div className="text-sm text-slate-400">
                        {formatUSD(item.skin?.priceLatest || 0)} • {item.amount}x
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-medium ${(item.skin?.priceChange24h || 0) >= 0 ? 'text-brand-celadon-500' : 'text-red-500'}`}>
                        {(item.skin?.priceChange24h || 0) >= 0 ? '+' : ''}{safeToFixed(item.skin?.priceChange24h || 0, 2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {portfolio.length > 6 && (
                <div className="mt-4 text-center">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/portfolio')}
                  >
                    View All {portfolio.length} Skins
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Empty State - Clear Call to Action */}
        {(!portfolio || portfolio.length === 0) && (
          <Card className="card-enhanced">
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
