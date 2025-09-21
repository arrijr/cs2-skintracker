// /frontend/src/app/dashboard/page.tsx — [Frontend]
// {/* Enhanced Dashboard with Portfolio Overview, Alerts, Watchlist Preview, and Movers */}
"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { PortfolioValueChart } from "@/components/charts/PortfolioValueChart";
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
}

interface MoverItem {
  id: number;
  name: string;
  imageUrl: string;
  priceLatest: number;
  priceChange24h: number;
  priceChange7d: number;
}

export default function Dashboard() {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const router = useRouter();
  const { data, error, isLoading, mutate, portfolio, history, kpis } = usePortfolioData();
  
  // Dashboard state
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [movers, setMovers] = useState<{ gainers: MoverItem[]; losers: MoverItem[] }>({ gainers: [], losers: [] });
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [loadingMovers, setLoadingMovers] = useState(false);

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
      } catch (err) {
        console.error('Failed to load movers:', err);
      } finally {
        setLoadingMovers(false);
      }
    };

    loadMovers();
  }, []);

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

  // Show loading while data is being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white">
        <div className="container-cs2 section-cs2">
          <div className="space-y-6">
            <Skeleton className="h-16 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Skeleton className="h-80 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Skeleton className="h-64 w-full" />
                  <Skeleton className="h-64 w-full" />
                </div>
              </div>
              <div className="space-y-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
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
                <span>Error Loading Dashboard Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-neutral-400 mb-4">
                {error.message || 'Failed to load your dashboard data. Please try again.'}
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

  const totalValue = kpis?.portfolioValue || 0;
  const change7d = kpis?.portfolioChange7d || 0;
  const change24h = kpis?.portfolioChange24h || 0;

  // Filter history data based on selected range
  const filteredHistory = useMemo(() => {
    // Early return if no data
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
  }, [history, chartRange]);

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
                  className={`text-sm px-3 py-1 ${
                    change7d >= 0 
                      ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                      : 'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {change7d >= 0 ? '+' : ''}{safeToFixed(change7d, 1)}% (7d)
                </Badge>
              </div>
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Portfolio Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Portfolio Overview Card */}
            <Card className="card-brand">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-brand-blue" />
                    Portfolio Overview
                  </CardTitle>
                  <ToggleGroup 
                    type="single" 
                    value={chartRange}
                    onValueChange={(value: '7d' | '30d') => value && setChartRange(value)}
                    className="bg-muted/50 p-1 rounded-lg"
                  >
                    <ToggleGroupItem value="7d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      7D
                    </ToggleGroupItem>
                    <ToggleGroupItem value="30d" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                      30D
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardHeader>
              <CardContent>
                {/* Portfolio Value Chart */}
                <div className="h-48 mb-6">
                  {filteredHistory.length > 0 ? (
                    <PortfolioValueChart 
                      data={filteredHistory} 
                      className="w-full h-full"
                    />
                  ) : (
                    <div className="h-full bg-muted/20 rounded-lg flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                        <p>No portfolio history data</p>
                        <p className="text-sm">Add skins to your portfolio to see the chart</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* KPI Row */}
                <div className="grid grid-cols-3 gap-4">
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

            {/* Movers Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Gainers */}
              <Card className="card-brand">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-400">
                    <TrendingUp className="h-5 w-5" />
                    Top Gainers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingMovers ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {movers.gainers.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-green-500/5 rounded-lg border border-green-500/20">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{formatUSD(item.priceLatest)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-green-400">
                              <ArrowUpRight className="h-4 w-4" />
                              <span className="font-semibold">+{safeToFixed(item.priceChange24h, 1)}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">24h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Losers */}
              <Card className="card-brand">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-400">
                    <TrendingDown className="h-5 w-5" />
                    Top Losers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingMovers ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {movers.losers.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg border border-red-500/20">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{formatUSD(item.priceLatest)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-red-400">
                              <ArrowDownRight className="h-4 w-4" />
                              <span className="font-semibold">{safeToFixed(item.priceChange24h, 1)}%</span>
                            </div>
                            <p className="text-xs text-muted-foreground">24h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column - Alerts & Watchlist */}
          <div className="space-y-6">
            {/* Alerts & Watchlist Preview */}
            <Card className="card-brand">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-brand-orange" />
                  Alerts & Watchlist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Active Alerts */}
                <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Active Alerts</span>
                    <Badge variant="outline" className="border-orange-500/30 text-orange-400">
                      {kpis?.activeAlerts || 0} active
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {kpis?.activeAlerts || 0} alerts triggered, {kpis?.watchlistCount || 0} watching
                  </p>
                </div>

                {/* Watchlist Preview */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Watchlist Preview</span>
                    <Button asChild variant="ghost" size="sm">
                      <a href="/watchlist" className="text-xs">
                        Go to Watchlist
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    </Button>
                  </div>
                  
                  {loadingWatchlist ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                      ))}
                    </div>
                  ) : watchlist.length > 0 ? (
                    <div className="space-y-2">
                      {watchlist.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-2 bg-muted/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                              <p className="text-xs font-medium truncate max-w-24">{item.skin.name}</p>
                              <p className="text-xs text-muted-foreground">{formatUSD(item.skin.priceLatest)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xs font-semibold ${
                              item.skin.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {item.skin.priceChange24h >= 0 ? '+' : ''}{safeToFixed(item.skin.priceChange24h, 1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">Δ24h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No watchlist items</p>
                      <Button asChild variant="ghost" size="sm" className="mt-2">
                        <a href="/skins">Browse Skins</a>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-brand">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-brand-blue" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start" variant="outline">
                  <a href="/portfolio">
                    <Package className="h-4 w-4 mr-2" />
                    View Portfolio
                  </a>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <a href="/skins">
                    <Eye className="h-4 w-4 mr-2" />
                    Browse Skins
                  </a>
                </Button>
                <Button asChild className="w-full justify-start" variant="outline">
                  <a href="/watchlist">
                    <Heart className="h-4 w-4 mr-2" />
                    Manage Watchlist
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Empty State */}
        {!isLoading && (!kpis || kpis.portfolioCount === 0) && (
          <Card className="card-brand mt-8">
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