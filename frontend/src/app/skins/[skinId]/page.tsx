// frontend/src/app/skins/[skinId]/page.tsx — [Frontend]
// {/* Enhanced Skin Detail Page with P1, P2, P3 Features */}
"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SkinImage from "@/components/SkinImage";
import { SimplePriceChart } from "@/components/charts/simple-price-chart";
import { useUser, useAuth } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Heart, Plus, ExternalLink, ArrowLeft, Share2, Download, TrendingUp, TrendingDown, Info, Check, Loader2, Copy, BarChart3, Users, Clock, DollarSign, Home, RefreshCw, HelpCircle, Eye, Shield, Settings, Star, Wallet } from "lucide-react";
// {/* Central API helpers */}
import {
  getPortfolio,
  getWatchlist,
  apiUrl,
  fetchJson,
} from "@/lib/api";
import { formatUSD, safeToFixed, numberOrNull } from "@/lib/num";
import { useAnalytics } from "@/lib/analytics";
import { CaseSection } from "@/components/CaseSection";
import QuantityBarChart from "@/components/QuantityBarChart";
import OverlayPriceQuantityChart from "@/components/OverlayPriceQuantityChart";

// Chart components are now handled by Shadcn UI Charts

type Skin = {
  id: number;
  name: string;
  marketHashName?: string;
  marketPrice?: number;
  itemimage?: string;
  itemImage?: string;
  image_url?: string;
  imageUrl?: string;
  marketStats?: {
    medianPrice?: number;
    volume24h?: number;
    priceChange24h?: number;
    priceChangePercent24h?: number;
  };
  caseInfo?: {
    name: string;
    id: number;
  };
  variants?: Array<{
    id: number;
    name: string;
    marketPrice?: number;
    imageUrl?: string;
  }>;
  history?: Array<{
  date: string;
  price: number;
    quantity: number;
  }>;
};

export default function SkinDetailPage({ params }: { params: { skinId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const { isSignedIn, getToken } = useAuth();
  const analytics = useAnalytics();

  const [skin, setSkin] = useState<Skin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [portfolioSkins, setPortfolioSkins] = useState<number[]>([]);
  const [priceAlert, setPriceAlert] = useState({ enabled: false, targetPrice: 0 });
  const [chartType, setChartType] = useState<'price' | 'quantity' | 'overlay'>('price');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showPriceHistory, setShowPriceHistory] = useState(true);
  const [showQuantityHistory, setShowQuantityHistory] = useState(true);
  const [showOverlayChart, setShowOverlayChart] = useState(false);

  // Load skin data
  useEffect(() => {
    const loadSkin = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchJson(apiUrl(`/skins/${params.skinId}`));
        
        if (response.success) {
          setSkin(response.data);
        } else if (response.id) {
          // Fallback for old API format
          setSkin(response);
        } else {
          setError(response.error || 'Skin not found');
        }
      } catch (err: any) {
        console.error('Error loading skin:', err);
        if (err.message?.includes('404')) {
          setError('Skin not found. Please check the URL or try a different skin.');
        } else {
          setError('Failed to load skin data');
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.skinId) {
      loadSkin();
    }
  }, [params.skinId]);

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!isSignedIn) return;

      try {
        const token = await getToken({ template: "backend" });
        const [watchlistData, portfolioData] = await Promise.all([
          getWatchlist(token),
          getPortfolio(token)
        ]);

        if (watchlistData.success) {
          setWatchlist(watchlistData.data.map((item: any) => item.skinId));
        }

        if (portfolioData.success) {
          setPortfolioSkins(portfolioData.data.map((item: any) => item.skinId));
        }
      } catch (err) {
        console.error('Error loading user data:', err);
      }
    };

    loadUserData();
  }, [isSignedIn]);

  // Analytics tracking
  useEffect(() => {
    if (skin && analytics) {
      try {
        analytics.trackPageView('skin-detail', {
          skinId: skin.id,
          skinName: skin.name,
          marketPrice: skin.marketPrice
        });
      } catch (err) {
        console.error('Analytics error:', err);
      }
    }
  }, [skin, analytics]);

  // Computed values
  const skinImageUrl = useMemo(() => {
    if (!skin) return '/images/placeholder-skin.png';
    return skin.imageUrl || skin.image_url || skin.itemImage || skin.itemimage || '/images/placeholder-skin.png';
  }, [skin]);

  const isInWatchlist = useMemo(() => {
    return skin ? watchlist.includes(skin.id) : false;
  }, [skin, watchlist]);

  const isInPortfolio = useMemo(() => {
    return skin ? portfolioSkins.includes(skin.id) : false;
  }, [skin, portfolioSkins]);

  const marketStats = skin?.marketStats || {};
  const caseInfo = skin?.caseInfo;
  const variants = skin?.variants || [];
  const history = skin?.history || [];

  // Event handlers
  const handleAddToWatchlist = useCallback(async () => {
    if (!skin || !isSignedIn) return;

    try {
      const response = await fetchJson('/api/watchlist', {
        method: 'POST',
        body: JSON.stringify({ skinId: skin.id })
      });

      if (response.success) {
        setWatchlist(prev => [...prev, skin.id]);
        toast.success('Added to watchlist');
        
        if (analytics) {
          try {
            analytics.trackWatchlistAdd(skin.id, skin.name);
          } catch (err) {
            console.error('Analytics error:', err);
          }
        }
      } else {
        toast.error(response.error || 'Failed to add to watchlist');
      }
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      toast.error('Failed to add to watchlist');
    }
  }, [skin, isSignedIn, analytics]);

  const handleRemoveFromWatchlist = useCallback(async () => {
    if (!skin || !isSignedIn) return;

    try {
      const response = await fetchJson(apiUrl(`/watchlist/${skin.id}`), {
        method: 'DELETE'
      });

      if (response.success) {
        setWatchlist(prev => prev.filter(id => id !== skin.id));
        toast.success('Removed from watchlist');
      } else {
        toast.error(response.error || 'Failed to remove from watchlist');
      }
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      toast.error('Failed to remove from watchlist');
    }
  }, [skin, isSignedIn]);

  const handleAddToPortfolio = useCallback(async () => {
    if (!skin || !isSignedIn) return;

    try {
      const response = await fetchJson('/api/portfolio', {
        method: 'POST',
        body: JSON.stringify({ skinId: skin.id })
      });

      if (response.success) {
        setPortfolioSkins(prev => [...prev, skin.id]);
        toast.success('Added to portfolio');
        
        if (analytics) {
          try {
            analytics.trackPortfolioAdd(skin.id, skin.name);
          } catch (err) {
            console.error('Analytics error:', err);
          }
        }
      } else {
        toast.error(response.error || 'Failed to add to portfolio');
      }
    } catch (err) {
      console.error('Error adding to portfolio:', err);
      toast.error('Failed to add to portfolio');
    }
  }, [skin, isSignedIn, analytics]);

  const handleRemoveFromPortfolio = useCallback(async () => {
    if (!skin || !isSignedIn) return;

    try {
      const response = await fetchJson(apiUrl(`/portfolio/${skin.id}`), {
        method: 'DELETE'
      });

      if (response.success) {
        setPortfolioSkins(prev => prev.filter(id => id !== skin.id));
        toast.success('Removed from portfolio');
      } else {
        toast.error(response.error || 'Failed to remove from portfolio');
      }
    } catch (err) {
      console.error('Error removing from portfolio:', err);
      toast.error('Failed to remove from portfolio');
    }
  }, [skin, isSignedIn]);

  const handleCreatePriceAlert = useCallback(async () => {
    if (!skin || !isSignedIn || !priceAlert.enabled) return;

    try {
      const response = await fetchJson('/api/alerts', {
        method: 'POST',
        body: JSON.stringify({
          skinId: skin.id,
          targetPrice: priceAlert.targetPrice,
          type: 'price_alert'
        })
      });

      if (response.success) {
        toast.success('Price alert created');
        
        if (analytics) {
          try {
            analytics.trackAlertCreate(skin.id, skin.name, priceAlert.targetPrice);
          } catch (err) {
            console.error('Analytics error:', err);
          }
        }
    } else {
        toast.error(response.error || 'Failed to create price alert');
      }
    } catch (err) {
      console.error('Error creating price alert:', err);
      toast.error('Failed to create price alert');
    }
  }, [skin, isSignedIn, priceAlert, analytics]);

  const handleCopyLink = useCallback(() => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
      
      if (analytics) {
        try {
          analytics.trackCopyLink(skin?.id, skin?.name);
        } catch (err) {
          console.error('Analytics error:', err);
        }
      }
    }
  }, [skin, analytics]);

  const handleRelatedSkinClick = useCallback((relatedSkin: any) => {
    if (analytics) {
      try {
        analytics.trackRelatedClick(relatedSkin.id, relatedSkin.name);
      } catch (err) {
        console.error('Analytics error:', err);
      }
    }
    router.push(`/skins/${relatedSkin.id}`);
  }, [router, analytics]);

  if (loading) {
  return (
      <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row gap-8">
              <Skeleton className="w-64 h-64 mx-auto md:mx-0" />
              <div className="flex-1 space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-6 w-1/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
      </div>
    );
  }

  if (error || !skin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Skin not found</h1>
          <p className="text-muted-foreground mb-4">{error || 'The requested skin could not be found.'}</p>
          <Button onClick={() => router.push('/skins')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Skins
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to results
          </Button>
        </div>

        {/* Hero Section - Modern Design */}
        <div className="relative">
          {/* Breadcrumb */}
              <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                          <Home className="h-4 w-4" />
                          Home
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="text-muted-foreground" />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/skins" className="text-muted-foreground hover:text-foreground transition-colors">
                          Skins
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      {caseInfo && (
                        <>
                          <BreadcrumbSeparator className="text-muted-foreground" />
                          <BreadcrumbItem>
                        <BreadcrumbLink href={`/cases/${encodeURIComponent(caseInfo?.name || '')}`} className="text-muted-foreground hover:text-foreground transition-colors">
                          {caseInfo?.name || 'Unknown Case'}
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        </>
                      )}
                      <BreadcrumbSeparator className="text-muted-foreground" />
                      <BreadcrumbItem>
                        <BreadcrumbPage className="font-semibold text-foreground">
                          {skin.name}
                        </BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  
          {/* Main Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Skin Image - Left Column */}
            <div className="lg:col-span-1">
              <div className="relative w-full max-w-md mx-auto lg:mx-0">
                <div className="aspect-square bg-card border border-border rounded-2xl p-8 shadow-sm">
                  {skinImageUrl && skinImageUrl !== "/images/placeholder-skin.png" ? (
                    <SkinImage
                      src={skinImageUrl}
                      alt={skin.name}
                      fill
                      priority
                      quality={95}
                      className="object-contain"
                    />
                  ) : (
                    <Image
                      src={skinImageUrl}
                      alt={skin.name}
                      fill
                      className="object-contain"
                      priority
                      quality={95}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Skin Info - Right Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title & Subtitle */}
              <div className="space-y-3">
                <h1 className="text-4xl lg:text-5xl font-bold text-foreground">
                  {skin.name}
                </h1>
                <p className="text-xl text-muted-foreground">
                  {skin.marketHashName}
                </p>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {skin.weaponType && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {skin.weaponType}
                  </Badge>
                )}
                {skin.wear && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {skin.wear.toUpperCase()}
                  </Badge>
                )}
                {skin.rarity && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {skin.rarity}
                  </Badge>
                )}
                {skin.isStattrak && (
                  <Badge variant="outline" className="text-sm px-3 py-1 text-orange-500 border-orange-500/30">
                    StatTrak™
                  </Badge>
                )}
                {skin.isStar && (
                  <Badge variant="outline" className="text-sm px-3 py-1 text-yellow-500 border-yellow-500/30">
                    <Star className="h-3 w-3 mr-1" />
                    Special
                  </Badge>
                )}
              </div>

              {/* Price & Change */}
              <div className="flex items-baseline gap-4">
                <span className="text-4xl font-bold text-primary">
                    {skin.marketPrice ? formatUSD(skin.marketPrice) : 'N/A'}
                  </span>
                  {marketStats.priceChangePercent24h && (
                    <Badge 
                      variant={marketStats.priceChangePercent24h >= 0 ? "default" : "destructive"}
                      className="text-sm"
                    >
                      {marketStats.priceChangePercent24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {safeToFixed(marketStats.priceChangePercent24h, 2)}%
                      </Badge>
                    )}
             </div>
                  
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {isSignedIn ? (
                <>
                  {isInWatchlist ? (
                    <Button
                        variant="destructive"
                      onClick={handleRemoveFromWatchlist}
                      className="flex items-center gap-2"
                    >
                        <Heart className="h-4 w-4 fill-white" />
                      Remove from Watchlist
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAddToWatchlist}
                      className="flex items-center gap-2"
                    >
                        <Heart className="h-4 w-4" />
                      Add to Watchlist
                    </Button>
                  )}
                  {isInPortfolio ? (
                  <Button
                      variant="outline"
                      onClick={handleRemoveFromPortfolio}
                      className="flex items-center gap-2"
                    >
                        <Wallet className="h-4 w-4" />
                      Remove from Portfolio
                  </Button>
                  ) : (
                    <Button
                        variant="outline"
                      onClick={handleAddToPortfolio}
                      className="flex items-center gap-2"
                    >
                        <Wallet className="h-4 w-4" />
                      Add to Portfolio
                  </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => router.push('/sign-in')}
                  className="flex items-center gap-2"
                >
                  <Heart className="h-4 w-4" />
                    Sign in to Track
                </Button>
              )}
              <Button
                  variant="secondary"
                onClick={() => window.open(`https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName || skin.name)}`, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                  Buy on Steam Market
                  </Button>
              </div>
                  </div>
                  </div>
                </div>

        {/* Price History Chart - Directly under Hero */}
        <Card className="mt-8 border border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Price History
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <ToggleGroup type="single" value={timeRange} onValueChange={(value) => value && setTimeRange(value as any)}>
                <ToggleGroupItem value="7d" size="sm">7D</ToggleGroupItem>
                <ToggleGroupItem value="30d" size="sm">30D</ToggleGroupItem>
                <ToggleGroupItem value="90d" size="sm">90D</ToggleGroupItem>
                <ToggleGroupItem value="1y" size="sm">1Y</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>
            {history && history.length > 0 ? (
              <SimplePriceChart 
                data={history} 
                range={timeRange}
                scale="linear"
                movingAverage="7"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No price history available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Market Statistics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Market Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Market Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {/* Latest Price */}
                  <div className="text-center p-4 border border-border bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">Latest</span>
                    </div>
                    <div className="text-xl font-bold">
                      {skin.priceLatest ? formatUSD(skin.priceLatest) : 'N/A'}
                    </div>
                  </div>
                  
                  {/* Median Price */}
                  <div className="text-center p-4 border border-border bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <BarChart3 className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">Median</span>
                    </div>
                    <div className="text-xl font-bold">
                      {skin.priceMedian ? formatUSD(skin.priceMedian) : 'N/A'}
                    </div>
                  </div>
                  
                  {/* Average Price */}
                  <div className="text-center p-4 border border-border bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">Average</span>
                    </div>
                    <div className="text-xl font-bold">
                      {skin.priceAvg ? formatUSD(skin.priceAvg) : 'N/A'}
                    </div>
                  </div>
                  
                  {/* Volume 24h */}
                  <div className="text-center p-4 border border-border bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <Users className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="text-sm text-muted-foreground">Volume</span>
                    </div>
                    <div className="text-xl font-bold">
                      {marketStats.volume24h ? marketStats.volume24h.toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Price Range & Changes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Price Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price Range */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Price Range</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 border border-border bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                          {skin.priceMin ? formatUSD(skin.priceMin) : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Min</div>
                      </div>
                      <div className="text-center p-3 border border-border bg-muted/50 rounded-lg">
                        <div className="text-lg font-bold text-red-600">
                          {skin.priceMax ? formatUSD(skin.priceMax) : 'N/A'}
                        </div>
                        <div className="text-xs text-muted-foreground">Max</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Price Changes */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-muted-foreground">Price Changes</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-3 border border-border bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">24h Change</span>
                        <Badge variant={marketStats.priceChangePercent24h >= 0 ? "default" : "destructive"} className="text-xs">
                          {marketStats.priceChangePercent24h >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {marketStats.priceChangePercent24h ? `${marketStats.priceChangePercent24h >= 0 ? '+' : ''}${safeToFixed(marketStats.priceChangePercent24h, 2)}%` : 'N/A'}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center p-3 border border-border bg-muted/50 rounded-lg">
                        <span className="text-sm text-muted-foreground">7d Change</span>
                        <Badge variant={skin.priceMedian7d && ((skin.priceLatest - skin.priceMedian7d) / skin.priceMedian7d * 100) >= 0 ? "default" : "destructive"} className="text-xs">
                          {skin.priceMedian7d && ((skin.priceLatest - skin.priceMedian7d) / skin.priceMedian7d * 100) >= 0 ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {skin.priceMedian7d ? `${((skin.priceLatest - skin.priceMedian7d) / skin.priceMedian7d * 100).toFixed(2)}%` : 'N/A'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

            {/* Sales Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Sales Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 border border-border bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {skin.sold24h || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">24h</div>
                  </div>
                  <div className="text-center p-3 border border-border bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {skin.sold7d || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">7d</div>
                  </div>
                  <div className="text-center p-3 border border-border bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {skin.sold30d || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">30d</div>
                  </div>
                  <div className="text-center p-3 border border-border bg-muted/50 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {skin.offerVolume || 0}
                    </div>
                    <div className="text-xs text-muted-foreground">Offers</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Charts */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quantity History Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quantity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quantityData && quantityData.length > 0 ? (
                  <QuantityBarChart data={quantityData} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No quantity data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Price History Chart - Full Width */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Price History
            </CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <ToggleGroup type="single" value={timeRange} onValueChange={(value) => value && setTimeRange(value as any)}>
                <ToggleGroupItem value="7d" size="sm">7D</ToggleGroupItem>
                <ToggleGroupItem value="30d" size="sm">30D</ToggleGroupItem>
                <ToggleGroupItem value="90d" size="sm">90D</ToggleGroupItem>
                <ToggleGroupItem value="1y" size="sm">1Y</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>
            
            {history && history.length > 0 ? (
              <>
                <SimplePriceChart 
                  data={history} 
                  range={timeRange}
                  scale="linear"
                  movingAverage="7"
                />
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                ❌ No price history available. History: {JSON.stringify(history?.slice(0, 2))}
              </div>
            )}
                            </CardContent>
                          </Card>

        {/* Quantity History Chart - Clean Dashboard Style */}
        <Card className="mb-12 border border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quantity History
            </CardTitle>
          </CardHeader>
          <CardContent>
            
            {skin && skin.id ? (
              <>
                <QuantityBarChart 
                  skinId={skin.id} 
                  skinName={skin.name}
                />
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                ❌ No skin data available. Skin: {JSON.stringify(skin)}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Related Skins */}
        {variants.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Related Skins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {variants.map((variant, index) => {
                  // Determine if this is a popular, rare, or discounted skin
                  const isPopular = variant.marketPrice && variant.marketPrice > 50;
                  const isRare = variant.rarity === 'Covert' || variant.rarity === 'Classified';
                  const isDiscounted = variant.marketPrice && variant.marketPrice < 10;
                  
                  return (
                  <Card
                    key={variant.id}
                    className="group border border-border bg-card hover:border-primary/50 cursor-pointer transition-all duration-200 hover:shadow-md"
                    onClick={() => handleRelatedSkinClick(variant)}
                  >
                    <CardContent className="p-3">
                      {/* Image Container */}
                      <div className="aspect-square relative mb-3 rounded-lg overflow-hidden bg-muted">
                        {variant.imageUrl ? (
                          <Image
                            src={variant.imageUrl}
                            alt={variant.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Image className="h-8 w-8 text-muted-foreground" />
                          </div>
                          )}
                          
                          {/* Optional Labels - Clean Design */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {isPopular && (
                              <Badge variant="secondary" className="text-xs">
                                Popular
                              </Badge>
                            )}
                            {isRare && (
                              <Badge variant="secondary" className="text-xs">
                                Rare
                              </Badge>
                            )}
                            {isDiscounted && (
                              <Badge variant="secondary" className="text-xs">
                                Discounted
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Content - Clean Design */}
                        <div className="p-3">
                          <h3 className="font-semibold mb-2 line-clamp-2 text-sm">
                            {variant.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <p className="text-base font-bold text-primary">
                              {variant.marketPrice ? formatUSD(variant.marketPrice) : 'N/A'}
                            </p>
                            {variant.rarity && (
                              <Badge variant="outline" className="text-xs">
                                {variant.rarity}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                  </div>
                </CardContent>
              </Card>
            )}

        {/* Case Information */}
        {caseInfo && (
          <CaseSection caseName={caseInfo.name} />
        )}
      </TooltipProvider>
  );
}
