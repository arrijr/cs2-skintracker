// /frontend/src/app/dashboard/page.tsx (Frontend)
"use client";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import PortfolioValueChart from "@/components/charts/PortfolioValueChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertCircle, 
  RefreshCw,
  ExternalLink
} from "lucide-react";

export default function Dashboard() {
  const { isSignedIn, user, isLoaded } = useUser();
  const router = useRouter();
  const { data, error, isLoading, mutate, portfolio, history, kpis } = usePortfolioData();

  // Client-side guard - redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while auth state is being determined
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not signed in (will redirect)
  if (!isSignedIn) {
    return null;
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="container-cs2 section-cs2">
          <Card className="card-brand">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span>Error Loading Portfolio Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 mb-4">
                {error.message || 'Failed to load your portfolio data. Please try again.'}
              </p>
              <Button onClick={() => mutate()} className="btn-brand-green">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container-cs2 section-cs2">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
              <p className="text-neutral-400">Welcome back, {user?.fullName || user?.emailAddresses?.[0]?.emailAddress}</p>
            </div>
            <Button 
              onClick={() => mutate()} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <Card className="card-brand">
              <CardContent className="p-6">
                <div className="flex items-center justify-center h-80">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue mx-auto mb-4"></div>
                    <p className="text-neutral-400">Loading portfolio data...</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Portfolio Chart */}
        {!isLoading && history.length > 0 && (
          <div className="mb-8">
            <PortfolioValueChart data={history} />
          </div>
        )}

        {/* KPI Cards */}
        {!isLoading && kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-brand">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-400">Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-green">
                  ${kpis.portfolioValue?.toLocaleString() || '0'}
                </div>
                <div className="flex items-center text-xs text-neutral-400 mt-1">
                  {kpis.portfolioChange24h >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1 text-brand-green" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1 text-red-400" />
                  )}
                  {kpis.portfolioChange24h >= 0 ? '+' : ''}{kpis.portfolioChange24h?.toFixed(1) || '0'}% 24h
                </div>
              </CardContent>
            </Card>

            <Card className="card-brand">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-400">Total Invested</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-blue">
                  ${kpis.totalInvested?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {kpis.portfolioCount || 0} skins
                </div>
              </CardContent>
            </Card>

            <Card className="card-brand">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-400">Unrealized P/L</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${(kpis.unrealizedPL || 0) >= 0 ? 'text-brand-green' : 'text-red-400'}`}>
                  ${kpis.unrealizedPL?.toLocaleString() || '0'}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {kpis.portfolioChange7d >= 0 ? '+' : ''}{kpis.portfolioChange7d?.toFixed(1) || '0'}% 7d
                </div>
              </CardContent>
            </Card>

            <Card className="card-brand">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-neutral-400">Watchlist</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand-orange">
                  {kpis.watchlistCount || 0}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                  {kpis.activeAlerts || 0} active alerts
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="card-brand hover:border-brand-blue/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-brand-blue">
                <Package className="h-5 w-5" />
                <span>Portfolio</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 text-sm mb-4">
                View and manage your skin collection
              </p>
              <Button asChild className="btn-brand-blue">
                <a href="/portfolio">
                  Go to Portfolio
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-brand hover:border-brand-green/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-brand-green">
                <AlertCircle className="h-5 w-5" />
                <span>Watchlist</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 text-sm mb-4">
                Track skins you're interested in
              </p>
              <Button asChild className="btn-brand-green">
                <a href="/watchlist">
                  Go to Watchlist
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="card-brand hover:border-brand-orange/50 transition-colors">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-brand-orange">
                <DollarSign className="h-5 w-5" />
                <span>Browse Skins</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 text-sm mb-4">
                Discover new skins and check prices
              </p>
              <Button asChild className="btn-brand-orange">
                <a href="/skins">
                  Browse Skins
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        {!isLoading && (!kpis || kpis.portfolioCount === 0) && (
          <Card className="card-brand">
            <CardContent className="text-center py-12">
              <Package className="h-12 w-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Portfolio Yet</h3>
              <p className="text-neutral-400 mb-6">
                Start building your CS2 skin portfolio by adding your first skin.
              </p>
              <Button asChild className="btn-brand-green">
                <a href="/portfolio">
                  Add Your First Skin
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
