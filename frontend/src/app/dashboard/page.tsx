// /frontend/src/app/dashboard/page-new.tsx — [Frontend]
// {/* Enhanced Dashboard with New Structure - Portfolio Overview, Alerts, Watchlist Preview, and Movers */}
"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { PortfolioValueChart } from "@/components/charts/PortfolioValueChart";
import PortfolioBreakdown from "./components/PortfolioBreakdown";
import MarketPulse from "./components/MarketPulse";
import MarketEvents from "./components/MarketEvents";
import AlertsBox from "./components/AlertsBox";
import Movers from "./components/Movers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  BarChart3,
  Heart,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Clock
} from "lucide-react";
import { formatUSD, safeToFixed } from "@/lib/num";
import { apiFetch } from "@/lib/http";
import { apiUrl, fetchJson } from "@/lib/api";

interface WatchlistItem {
  id: number;
  skin: {
    id: number;
    name: string;
    imageUrl: string;
    priceLatest: number;
    priceChange24h: number;
  };
  priceAlert?: number;
  isNearAlert?: boolean;
}

interface MoverItem {
  id: number;
  name: string;
  imageUrl: string;
  priceLatest: number;
  priceChange24h: number;
  priceChange7d: number;
  volume24h?: number;
  listings?: number;
}

export default function Dashboard() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const { data, error, isLoading, mutate, portfolio, history, kpis, portfolioLoading, historyLoading, kpisLoading } = usePortfolioData();

  // Debug logging
  console.log('Dashboard Debug:', {
    isLoading,
    error,
    portfolio: portfolio?.length || 0,
    history: history?.length || 0,
    kpis: kpis ? 'loaded' : 'null',
    portfolioLoading,
    historyLoading,
    kpisLoading
  });
  
  // Dashboard state
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('7d');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [movers, setMovers] = useState<{ gainers: MoverItem[]; losers: MoverItem[] }>({ gainers: [], losers: [] });
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [loadingMovers, setLoadingMovers] = useState(false);
  
  // Last updated timestamps
  const [lastUpdated, setLastUpdated] = useState<{
    portfolio: string | null;
    watchlist: string | null;
    movers: string | null;
    breakdown: string | null;
    marketPulse: string | null;
    events: string | null;
  }>({
    portfolio: null,
    watchlist: null,
    movers: null,
    breakdown: null,
    marketPulse: null,
    events: null
  });

  // Premium status (mock for now)
  const [isPremium] = useState(false);

  // Refresh functions
  const refreshPortfolio = async () => {
    try {
      await mutate(); // Refresh portfolio data
      setLastUpdated(prev => ({ ...prev, portfolio: new Date().toLocaleTimeString() }));
    } catch (err) {
      console.error('Failed to refresh portfolio:', err);
    }
  };

  const refreshWatchlist = async () => {
    setLoadingWatchlist(true);
    try {
      const token = await getToken({ template: "backend" });
      const data = await fetchJson(apiUrl('/api/v1/watchlist'), {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setWatchlist(data.slice(0, 3));
      setLastUpdated(prev => ({ ...prev, watchlist: new Date().toLocaleTimeString() }));
    } catch (err) {
      console.error('Failed to refresh watchlist:', err);
    } finally {
      setLoadingWatchlist(false);
    }
  };

  const refreshMovers = async () => {
    setLoadingMovers(true);
    try {
      // Simulate movers data for now
      const mockMovers = {
        gainers: [
          { id: 1, name: "AK-47 | Redline", imageUrl: "/placeholder.jpg", priceLatest: 45.50, priceChange24h: 12.5, priceChange7d: 8.2 },
          { id: 2, name: "AWP | Dragon Lore", imageUrl: "/placeholder.jpg", priceLatest: 1250.00, priceChange24h: 8.3, priceChange7d: 15.3 },
          { id: 3, name: "M4A4 | Howl", imageUrl: "/placeholder.jpg", priceLatest: 890.00, priceChange24h: 5.7, priceChange7d: 7.1 }
        ],
        losers: [
          { id: 4, name: "Glock-18 | Fade", imageUrl: "/placeholder.jpg", priceLatest: 12.30, priceChange24h: -3.2, priceChange7d: -5.1 },
          { id: 5, name: "USP-S | Kill Confirmed", imageUrl: "/placeholder.jpg", priceLatest: 8.90, priceChange24h: -7.1, priceChange7d: -12.3 },
          { id: 6, name: "Desert Eagle | Blaze", imageUrl: "/placeholder.jpg", priceLatest: 15.40, priceChange24h: -2.8, priceChange7d: -4.5 }
        ]
      };
      setMovers(mockMovers);
      setLastUpdated(prev => ({ ...prev, movers: new Date().toLocaleTimeString() }));
    } catch (err) {
      console.error('Failed to refresh movers:', err);
    } finally {
      setLoadingMovers(false);
    }
  };

  // Refresh all data
  const refreshAll = async () => {
    await Promise.all([
      refreshPortfolio(),
      refreshWatchlist(),
      refreshMovers()
    ]);
    // Set timestamps for other components
    const now = new Date().toLocaleTimeString();
    setLastUpdated(prev => ({
      ...prev,
      breakdown: now,
      marketPulse: now,
      events: now
    }));
  };

  // Client-side guard - redirect if not signed in
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isLoaded, isSignedIn, router]);

  // Load watchlist data
  useEffect(() => {
    if (!isSignedIn || !user) return;
    
    const loadWatchlist = async () => {
      setLoadingWatchlist(true);
      try {
        const token = await getToken({ template: "backend" });
        const data = await fetchJson(apiUrl('/api/v1/watchlist'), {
          headers: { "Authorization": `Bearer ${token}` }
        });
        setWatchlist(data.slice(0, 3)); // Top 3 items
        setLastUpdated(prev => ({ ...prev, watchlist: new Date().toLocaleTimeString() }));
      } catch (err) {
        console.error('Failed to load watchlist:', err);
        setWatchlist([]); // Set empty array on error
      } finally {
        setLoadingWatchlist(false);
      }
    };

    loadWatchlist();
  }, [isSignedIn, user, getToken]);

  // Load movers data (mock for now)
  useEffect(() => {
    const loadMovers = async () => {
      setLoadingMovers(true);
      try {
        // Mock data - replace with real API call
        const mockGainers: MoverItem[] = [
          { id: 1, name: "AK-47 | Redline", imageUrl: "/placeholder.jpg", priceLatest: 45.50, priceChange24h: 12.5, priceChange7d: 8.2 },
          { id: 2, name: "AWP | Dragon Lore", imageUrl: "/placeholder.jpg", priceLatest: 1250.00, priceChange24h: 5.8, priceChange7d: 15.3 },
          { id: 3, name: "M4A4 | Howl", imageUrl: "/placeholder.jpg", priceLatest: 890.00, priceChange24h: 3.2, priceChange7d: 7.1 }
        ];
        
        const mockLosers: MoverItem[] = [
          { id: 4, name: "Glock-18 | Fade", imageUrl: "/placeholder.jpg", priceLatest: 125.00, priceChange24h: -8.5, priceChange7d: -12.3 },
          { id: 5, name: "Karambit | Fade", imageUrl: "/placeholder.jpg", priceLatest: 2100.00, priceChange24h: -4.2, priceChange7d: -6.8 },
          { id: 6, name: "AK-47 | Fire Serpent", imageUrl: "/placeholder.jpg", priceLatest: 320.00, priceChange24h: -2.1, priceChange7d: -4.5 }
        ];
        
        setMovers({ gainers: mockGainers, losers: mockLosers });
        setLastUpdated(prev => ({ ...prev, movers: new Date().toLocaleTimeString() }));
      } catch (err) {
        console.error('Failed to load movers:', err);
      } finally {
        setLoadingMovers(false);
      }
    };

    loadMovers();
  }, []);

  // Set portfolio last updated when data changes
  useEffect(() => {
    if (kpis && !isLoading) {
      setLastUpdated(prev => ({ ...prev, portfolio: new Date().toLocaleTimeString() }));
    }
  }, [kpis, isLoading]);

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

  // Debug error state
  if (error) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Dashboard Error</h1>
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-6">
              <p className="text-red-400 mb-2">Failed to load dashboard data:</p>
              <p className="text-muted-foreground text-sm">{error.toString()}</p>
            </div>
            <Button onClick={refreshAll} className="btn-enhanced">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while data is being fetched
  if (isLoading) {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <h1 className="text-4xl font-bold">Dashboard</h1>
                <div className="text-muted-foreground">
                  Loading portfolio data... 
                  {portfolioLoading && <span className="text-blue-400 ml-2">(Portfolio)</span>}
                  {historyLoading && <span className="text-green-400 ml-2">(History)</span>}
                  {kpisLoading && <span className="text-purple-400 ml-2">(KPIs)</span>}
                </div>
              </div>
              <Button disabled className="btn-enhanced">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </Button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-80 w-full skeleton-shimmer" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Skeleton className="h-64 w-full skeleton-shimmer" />
                  <Skeleton className="h-64 w-full skeleton-shimmer" />
                  <Skeleton className="h-64 w-full skeleton-shimmer" />
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-64 w-full skeleton-shimmer" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <Skeleton className="h-64 w-full skeleton-shimmer" />
              <Skeleton className="h-64 w-full skeleton-shimmer" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalValue = kpis?.portfolioValue || 0;
  const change7d = kpis?.portfolioChange7d || 0;
  const change24h = kpis?.portfolioChange24h || 0;

  // Filter history data based on selected range - simple approach without hooks
  const getFilteredHistory = () => {
    if (!history || !Array.isArray(history) || history.length === 0) {
      return [];
    }
    
    try {
      const now = new Date();
      const cutoffDate = new Date();
      
      if (chartRange === '7d') {
        cutoffDate.setDate(now.getDate() - 7);
      } else if (chartRange === '30d') {
        cutoffDate.setDate(now.getDate() - 30);
      } else if (chartRange === '90d') {
        cutoffDate.setDate(now.getDate() - 90);
      } else if (chartRange === '1y') {
        cutoffDate.setFullYear(now.getFullYear() - 1);
      } else if (chartRange === 'all') {
        // Return all data for 'all' timeframe
        return history;
      }
      
      return history.filter(item => {
        if (!item || !item.date) return false;
        try {
          return new Date(item.date) >= cutoffDate;
        } catch (e) {
          return false;
        }
      });
    } catch (error) {
      console.error('Error filtering history:', error);
      return [];
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="container-cs2 section-cs2">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <div className="flex items-center gap-4">
                <div className="text-3xl font-bold text-brand-green">
                  {formatUSD(totalValue)}
                </div>
                <Badge 
                  variant={change7d >= 0 ? "default" : "destructive"}
                  className={`text-sm px-3 py-1 badge-enhanced ${
                    change7d >= 0 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30 badge-glow green' 
                      : 'bg-red-500/20 text-red-400 border-red-500/30 badge-glow red'
                  }`}
                >
                  {change7d >= 0 ? '+' : ''}{safeToFixed(change7d, 1)}% (7d)
                </Badge>
              </div>
            </div>
            <Button 
              onClick={refreshAll} 
              variant="outline" 
              size="sm"
              disabled={isLoading}
              className="btn-enhanced hover-glow"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh All
            </Button>
          </div>
        </div>

        {/* Main Content Grid - New Structure */}
        <div className="space-y-6 animate-fade-in mobile-optimized desktop-optimized">
          {/* Top Row - Portfolio Overview + Alerts & Watchlist */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
            {/* Portfolio Overview - Left Side */}
            <div className="lg:col-span-2 space-y-6">
              {/* Portfolio Overview Card */}
              <Card className="card-brand card-enhanced hover-lift">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="flex items-center gap-2 text-base font-semibold">
                        <BarChart3 className="h-5 w-5 text-brand-blue" />
                        Portfolio Overview
                      </CardTitle>
                      {lastUpdated.portfolio && (
                        <span className="text-xs text-muted-foreground">
                          Updated {lastUpdated.portfolio}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={refreshPortfolio}
                        disabled={isLoading}
                        className="h-8 w-8 p-0"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                      </Button>
                      <ToggleGroup 
                        type="single" 
                        value={chartRange}
                        onValueChange={(value: '7d' | '30d' | '90d' | '1y' | 'all') => value && setChartRange(value)}
                        className="bg-muted/50 p-1 rounded-lg"
                      >
                        <ToggleGroupItem value="7d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
                          7D
                        </ToggleGroupItem>
                        <ToggleGroupItem value="30d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
                          30D
                        </ToggleGroupItem>
                        <ToggleGroupItem value="90d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
                          90D
                        </ToggleGroupItem>
                        <ToggleGroupItem value="1y" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
                          1Y
                        </ToggleGroupItem>
                        <ToggleGroupItem value="all" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground text-xs px-2">
                          ALL
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  {/* Portfolio Value Chart */}
                  <div className="h-40 mb-4">
                    {(() => {
                      const filteredData = getFilteredHistory();
                      return filteredData.length > 0 ? (
                        <PortfolioValueChart 
                          data={filteredData} 
                          className="w-full h-full"
                        />
                      ) : (
                        <div className="h-full bg-muted/20 rounded-lg flex items-center justify-center">
                          <div className="text-center text-muted-foreground space-y-4">
                            <div className="space-y-2">
                              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/50" />
                              <h3 className="text-lg font-medium">No Portfolio Data</h3>
                              <p className="text-sm max-w-sm">
                                Start building your CS2 skin collection to see your portfolio performance over time.
                              </p>
                            </div>
                            <Button 
                              onClick={() => router.push('/skins')}
                              className="bg-brand-blue hover:bg-brand-blue/90"
                            >
                              <Package className="h-4 w-4 mr-2" />
                              Browse Skins
                            </Button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Mini P&L Bar */}
                  <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">P&L Overview</h4>
                    <div className="grid grid-cols-3 gap-4 lg:gap-6">
                      {/* Day P&L */}
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Day P&L</p>
                        <div className="flex items-center justify-center gap-1">
                          <Badge 
                            variant={change24h >= 0 ? "default" : "destructive"}
                            className={change24h >= 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}
                          >
                            {change24h >= 0 ? '+' : ''}{safeToFixed(change24h, 2)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatUSD(totalValue * (change24h / 100))}
                        </p>
                      </div>

                      {/* 7d P&L */}
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">7d P&L</p>
                        <div className="flex items-center justify-center gap-1">
                          <Badge 
                            variant={change7d >= 0 ? "default" : "destructive"}
                            className={change7d >= 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}
                          >
                            {change7d >= 0 ? '+' : ''}{safeToFixed(change7d, 2)}%
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatUSD(totalValue * (change7d / 100))}
                        </p>
                      </div>

                      {/* Total P&L */}
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground mb-1">Total P&L</p>
                        <div className="flex items-center justify-center gap-1">
                          <Badge 
                            variant={(kpis?.unrealizedPL || 0) >= 0 ? "default" : "destructive"}
                            className={(kpis?.unrealizedPL || 0) >= 0 ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-red-500/20 text-red-400 border-red-500/30"}
                          >
                            {formatUSD(kpis?.unrealizedPL || 0)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {kpis?.totalInvested ? `${safeToFixed(((kpis?.unrealizedPL || 0) / kpis.totalInvested) * 100, 1)}%` : '0%'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* KPI Row */}
                  <div className="grid grid-cols-3 gap-4 lg:gap-6 mt-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Avg Value per Skin</p>
                      <p className="text-lg font-semibold">
                        {kpis?.portfolioCount ? formatUSD(totalValue / kpis.portfolioCount) : '$0'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground"># of Skins</p>
                      <p className="text-lg font-semibold">{kpis?.portfolioCount || 0}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Best Performer</p>
                      <p className="text-lg font-semibold text-brand-green">+12.5%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alerts & Watchlist - Right Side */}
            <div className="space-y-6">
              <AlertsBox
                watchlist={watchlist}
                activeAlerts={kpis?.activeAlerts || 0}
                nearAlerts={2} // Mock data
                lastUpdated={lastUpdated.watchlist || undefined}
                onRefresh={refreshWatchlist}
                onAddAlert={() => router.push('/watchlist')}
                onViewAll={() => router.push('/watchlist')}
                isLoading={loadingWatchlist}
              />
            </div>
          </div>

          {/* Middle Row - Breakdown + Market Pulse + Events */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <PortfolioBreakdown
              portfolio={portfolio}
              lastUpdated={lastUpdated.breakdown || undefined}
              onRefresh={refreshPortfolio}
              isLoading={isLoading}
            />
            <MarketPulse
              lastUpdated={lastUpdated.marketPulse || undefined}
              onRefresh={refreshAll}
              isLoading={isLoading}
              isPremium={isPremium}
            />
            <MarketEvents
              lastUpdated={lastUpdated.events || undefined}
              onRefresh={refreshAll}
              isLoading={isLoading}
            />
          </div>

          {/* Bottom Row - Top Movers */}
          <div className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Movers
            gainers={movers.gainers}
            losers={movers.losers}
            lastUpdated={lastUpdated.movers || undefined}
            onRefresh={refreshMovers}
            isLoading={loadingMovers}
            isPremium={isPremium}
            scope="portfolio"
            onScopeChange={(scope) => console.log('Scope changed to:', scope)}
            onItemClick={(item) => console.log('Item clicked:', item)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
