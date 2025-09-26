// /frontend/src/app/dashboard/page-redesigned.tsx — [Frontend]
// {/* Redesigned Dashboard with Visual Hierarchy and Conversion Focus */}
"use client";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { usePortfolioData } from "@/hooks/usePortfolioData";
import { PortfolioValueChart } from "@/components/charts/PortfolioValueChart";
import { PortfolioPieChart } from "./components/PortfolioPieChart";
import MarketPulse from "./components/MarketPulse";
import MarketEvents from "./components/MarketEvents";
import AlertsBox from "./components/AlertsBox";
import { EnhancedMovers } from "./components/EnhancedMovers";
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
  Clock,
  Lock,
  Crown,
  Star,
  Zap,
  Target,
  Activity,
  Globe
} from "lucide-react";
import { formatUSD, safeToFixed } from "@/lib/num";
import { apiFetch } from "@/lib/http";
import { apiUrl, fetchJson } from "@/lib/api";
import InfoTooltip from "@/components/ui/InfoTooltip";

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
  
  // Debug portfolio data
  console.log('Dashboard portfolio data:', portfolio);
  console.log('Portfolio loading:', portfolioLoading);

  // Dashboard state
  const [chartRange, setChartRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('7d');
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [movers, setMovers] = useState<{ gainers: MoverItem[]; losers: MoverItem[] }>({ gainers: [], losers: [] });
  const [loadingWatchlist, setLoadingWatchlist] = useState(false);
  const [loadingMovers, setLoadingMovers] = useState(false);
  const [moverTimeframe, setMoverTimeframe] = useState<'24h' | '7d'>('24h');
  const [showGlobalMovers, setShowGlobalMovers] = useState(false);
  
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
    events: null,
  });

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;
      
      switch (e.key.toLowerCase()) {
        case 'd':
          e.preventDefault();
          handleRefresh();
          break;
        case 'a':
          e.preventDefault();
          // Open add alert modal
          break;
        case 'w':
          e.preventDefault();
          router.push('/portfolio?tab=watchlist');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Load watchlist data
  useEffect(() => {
    if (!isSignedIn) return;
    
    const loadWatchlist = async () => {
      setLoadingWatchlist(true);
      try {
        const token = await getToken();
        const response = await fetchJson<WatchlistItem[]>(apiUrl('/api/v1/watchlist'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        setWatchlist(response);
        setLastUpdated(prev => ({ ...prev, watchlist: new Date().toISOString() }));
      } catch (error) {
        console.error('Failed to load watchlist:', error);
      } finally {
        setLoadingWatchlist(false);
      }
    };

    loadWatchlist();
  }, [isSignedIn, getToken]);

  // Load movers data
  useEffect(() => {
    const loadMovers = async () => {
      setLoadingMovers(true);
      try {
        // Fallback to mock data if API fails
        const mockMovers = {
          gainers: [],
          losers: []
        };
        setMovers(mockMovers);
        setLastUpdated(prev => ({ ...prev, movers: new Date().toISOString() }));
      } catch (error) {
        console.error('Failed to load movers:', error);
        // Set empty data on error
        setMovers({ gainers: [], losers: [] });
      } finally {
        setLoadingMovers(false);
      }
    };

    loadMovers();
  }, []);

  const handleRefresh = async () => {
    await mutate();
    setLastUpdated(prev => ({ ...prev, portfolio: new Date().toISOString() }));
  };

  const getChangeColor = (change: number) => {
    if (Math.abs(change) < 1) return 'text-brand-slate-400';
    if (Math.abs(change) < 3) return change >= 0 ? 'text-brand-celadon-300' : 'text-red-300';
    if (Math.abs(change) < 5) return change >= 0 ? 'text-brand-celadon-400' : 'text-red-400';
    return change >= 0 ? 'text-brand-celadon-500' : 'text-red-500';
  };

  const getChangeBadgeVariant = (change: number) => {
    if (Math.abs(change) < 1) return 'secondary';
    if (Math.abs(change) < 3) return change >= 0 ? 'default' : 'destructive';
    return change >= 0 ? 'default' : 'destructive';
  };

  const getChangeBadgeClass = (change: number) => {
    if (Math.abs(change) < 1) return 'bg-brand-slate-500/20 text-brand-slate-400 border-brand-slate-500/30';
    if (Math.abs(change) < 3) return change >= 0 ? 'bg-brand-celadon-500/20 text-brand-celadon-400 border-brand-celadon-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30';
    return change >= 0 ? 'bg-brand-celadon-600/20 text-brand-celadon-500 border-brand-celadon-600/30' : 'bg-red-600/20 text-red-500 border-red-600/30';
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
  const avgPerSkin = portfolio?.length ? totalValue / portfolio.length : 0;
  const bestPerformer = portfolio?.reduce((best, skin) => {
    const skinPL = (skin.skin.priceLatest || 0) - (skin.avgPrice || 0);
    const bestPL = (best.skin.priceLatest || 0) - (best.avgPrice || 0);
    return skinPL > bestPL ? skin : best;
  }, portfolio[0]);

  return (
    <div className="dashboard-bg text-white">
      <div className="container-cs2 section-cs2 relative z-10">
        {/* Header with Global Refresh */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white animate-slide-in-left">Dashboard</h1>
            <p className="text-slate-300 mt-1 animate-slide-in-left" style={{ animationDelay: '0.1s' }}>
              Track your CS2 skin portfolio performance
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            className="btn-enhanced flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh All
            <span className="text-xs text-slate-400">(D)</span>
          </Button>
        </div>

        {/* Row 1: Portfolio Overview (left large) + Alerts (right narrow) */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          {/* Portfolio Overview - Large Card */}
          <div className="lg:col-span-3">
            <Card className="card-primary h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-white">Portfolio Overview</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs text-slate-400">
                      <Clock className="h-3 w-3 mr-1" />
                      {lastUpdated.portfolio ? new Date(lastUpdated.portfolio).toLocaleTimeString() : 'Never'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Portfolio Value - Very Large Typography */}
                <div className="text-center">
                  <div className="text-6xl font-bold text-white mb-2 animate-slide-in-left">
                    {formatUSD(totalValue)}
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    <Badge 
                      variant={getChangeBadgeVariant(change24h)}
                      className={`text-lg px-4 py-2 ${getChangeBadgeClass(change24h)}`}
                    >
                      {change24h >= 0 ? '+' : ''}{safeToFixed(change24h, 2)}% (24h)
                    </Badge>
                    <Badge 
                      variant={getChangeBadgeVariant(change7d)}
                      className={`text-lg px-4 py-2 ${getChangeBadgeClass(change7d)}`}
                    >
                      {change7d >= 0 ? '+' : ''}{safeToFixed(change7d, 2)}% (7d)
                    </Badge>
                  </div>
                </div>

                {/* Portfolio Chart */}
                <div className="h-64">
                  <PortfolioValueChart 
                    data={history || []} 
                    range={chartRange}
                    showProfitShading={true}
                    showInfoTooltips={true}
                  />
                </div>

                {/* Chart Range Toggle */}
                <div className="flex justify-center">
                  <ToggleGroup type="single" value={chartRange} onValueChange={(value) => setChartRange(value as any)}>
                    <ToggleGroupItem value="7d">7D</ToggleGroupItem>
                    <ToggleGroupItem value="30d">30D</ToggleGroupItem>
                    <ToggleGroupItem value="90d">90D</ToggleGroupItem>
                    <ToggleGroupItem value="1y">1Y</ToggleGroupItem>
                    <ToggleGroupItem value="all">All</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alerts & Watchlist - Narrow Card */}
          <div className="lg:col-span-1">
            <Card className="card-secondary h-full">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-brand-warning" />
                  Alerts & Watchlist
                  <Lock className="h-4 w-4 text-gray-400" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Premium Upsell */}
                <div className="text-center p-4 bg-gradient-to-r from-brand-premium/10 to-brand-warning/10 border border-brand-premium/30 rounded-lg">
                  <Crown className="h-8 w-8 mx-auto mb-2 text-brand-premium" />
                  <h3 className="font-semibold text-white mb-1">Premium Required</h3>
                  <p className="text-sm text-gray-300 mb-3">Unlock alerts and watchlist features</p>
                  <Button className="w-full bg-gradient-to-r from-brand-premium to-brand-warning hover:from-brand-premium/90 hover:to-brand-warning/90 text-white font-semibold">
                    Upgrade to Premium
                  </Button>
                </div>

                {/* Near Threshold Values */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-300">Near Threshold</h4>
                  {watchlist.slice(0, 3).map((item) => (
                    <div 
                      key={item.id} 
                      className="p-2 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white truncate">{item.skin.name}</span>
                        <span className="text-xs text-gray-400">{formatUSD(item.skin.priceLatest)}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full border-brand-premium text-brand-premium hover:bg-brand-premium hover:text-black">
                    <Target className="h-4 w-4 mr-2" />
                    Add Alert
                  </Button>
                  <Button variant="outline" size="sm" className="w-full border-brand-premium text-brand-premium hover:bg-brand-premium hover:text-black">
                    <Heart className="h-4 w-4 mr-2" />
                    Manage Watchlist
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Row 2: P&L KPIs under Portfolio Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <InfoTooltip 
              content="Your total unrealized profit or loss. This is the difference between what you paid for all skins and their current market value."
              position="top"
            >
            <Card className="card-primary">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${unrealizedPL >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                  {formatUSD(unrealizedPL)}
                </div>
                <div className="text-sm text-gray-400">Total P&L</div>
                <div className={`text-xs mt-1 ${unrealizedPL >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                  {plPercentage >= 0 ? '+' : ''}{safeToFixed(plPercentage, 1)}%
                </div>
              </CardContent>
            </Card>
          </InfoTooltip>

            <InfoTooltip 
              content="Average value per skin in your portfolio. Calculated by dividing total portfolio value by number of skins."
              position="top"
            >
            <Card className="card-primary">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{formatUSD(avgPerSkin)}</div>
                <div className="text-sm text-gray-400">Avg per Skin</div>
              </CardContent>
            </Card>
          </InfoTooltip>

            <InfoTooltip 
              content="Total number of different skins in your portfolio. Each unique skin counts as one, regardless of quantity."
              position="top"
            >
            <Card className="card-primary">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{portfolio?.length || 0}</div>
                <div className="text-sm text-gray-400"># Skins</div>
              </CardContent>
            </Card>
          </InfoTooltip>

            <InfoTooltip 
              content="Total amount you originally paid for all skins in your portfolio. This is your cost basis for calculating profits and losses."
              position="top"
            >
            <Card className="card-primary">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-white">{formatUSD(totalInvested)}</div>
                <div className="text-sm text-gray-400">Total Invested</div>
              </CardContent>
            </Card>
          </InfoTooltip>

            <InfoTooltip 
              content="Profit or loss from the last 24 hours. Shows how much your portfolio value changed in the past day."
              position="top"
            >
            <Card className="card-primary">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${change24h >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                  {formatUSD(change24h * totalValue / 100)}
                </div>
                <div className="text-sm text-gray-400">Day P&L</div>
              </CardContent>
            </Card>
          </InfoTooltip>

            <InfoTooltip 
              content="Profit or loss from the last 7 days. Shows how much your portfolio value changed in the past week."
              position="top"
            >
            <Card className="card-primary">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${change7d >= 0 ? 'text-brand-green' : 'text-brand-red'}`}>
                  {formatUSD(change7d * totalValue / 100)}
                </div>
                <div className="text-sm text-gray-400">7d P&L</div>
              </CardContent>
            </Card>
          </InfoTooltip>
        </div>

        {/* Row 3: Breakdown, Market Pulse, Events in a row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="card-enhanced">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white">Portfolio Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <PortfolioPieChart portfolio={portfolio || []} />
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader>
              <InfoTooltip 
                content="Real-time market activity and trends. Shows current market conditions, trading volume, and price movements across all skins."
                position="top"
              >
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2 cursor-help">
                  <Activity className="h-5 w-5 text-emerald-400" />
                  Market Pulse
                  <Lock className="h-4 w-4 text-gray-400" />
                </CardTitle>
              </InfoTooltip>
            </CardHeader>
            <CardContent>
              <MarketPulse />
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader>
              <InfoTooltip 
                content="Important market events and announcements that could affect skin prices. Includes major updates, tournaments, and market news."
                position="top"
              >
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2 cursor-help">
                  <Globe className="h-5 w-5 text-brand-warning" />
                  Market Events
                  <Lock className="h-4 w-4 text-gray-400" />
                </CardTitle>
              </InfoTooltip>
            </CardHeader>
            <CardContent>
              <MarketEvents />
            </CardContent>
          </Card>
        </div>

        {/* Row 4: Movers over full width, Gainers left, Losers right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="card-enhanced">
            <CardHeader>
              <div className="flex items-center justify-between">
                <InfoTooltip 
                  content="Skins with the highest price increases in the selected timeframe. Great for spotting trending items and potential investment opportunities."
                  position="top"
                >
                  <CardTitle className="text-lg font-bold text-white flex items-center gap-2 cursor-help">
                    <TrendingUp className="h-5 w-5 text-brand-green" />
                    Top Gainers
                  </CardTitle>
                </InfoTooltip>
                <div className="flex items-center gap-2">
                  <ToggleGroup type="single" value={moverTimeframe} onValueChange={(value) => setMoverTimeframe(value as any)}>
                    <ToggleGroupItem value="24h">24h</ToggleGroupItem>
                    <ToggleGroupItem value="7d">7d</ToggleGroupItem>
                  </ToggleGroup>
                  {isSignedIn && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowGlobalMovers(!showGlobalMovers)}
                      className="btn-enhanced"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      Global
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <EnhancedMovers 
                type="gainers" 
                data={movers.gainers} 
                timeframe={moverTimeframe}
                showHoverCharts={true}
                showQuickPreview={true}
              />
            </CardContent>
          </Card>

          <Card className="card-enhanced">
            <CardHeader>
              <InfoTooltip 
                content="Skins with the highest price decreases in the selected timeframe. Useful for identifying potential buying opportunities or items to avoid."
                position="top"
              >
                <CardTitle className="text-lg font-bold text-white flex items-center gap-2 cursor-help">
                  <TrendingDown className="h-5 w-5 text-brand-red" />
                  Top Losers
                </CardTitle>
              </InfoTooltip>
            </CardHeader>
            <CardContent>
              <EnhancedMovers 
                type="losers" 
                data={movers.losers} 
                timeframe={moverTimeframe}
                showHoverCharts={true}
                showQuickPreview={true}
              />
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Compact Button Block */}
        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="outline" className="border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white">
            <BarChart3 className="h-4 w-4 mr-2" />
            View Portfolio
          </Button>
          <Button variant="outline" className="border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white">
            <Package className="h-4 w-4 mr-2" />
            Browse Skins
          </Button>
          <Button variant="outline" className="border-brand-premium text-brand-premium hover:bg-brand-premium hover:text-black">
            <Heart className="h-4 w-4 mr-2" />
            Manage Watchlist
          </Button>
          <Button variant="outline" className="border-brand-premium text-brand-premium hover:bg-brand-premium hover:text-black">
            <Target className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </div>
    </div>
  );
}
