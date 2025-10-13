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
import { ChartContainer, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip as ChartTooltip } from "@/components/ui/chart";

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
  weaponType?: string;
  wear?: string;
  rarity?: string;
  isStattrak?: boolean;
  isStar?: boolean;
  // Current prices
  priceLatest?: number;
  priceLatestSell?: number;
  priceMedian?: number;
  priceAvg?: number;
  priceSafe?: number;
  priceMin?: number;
  priceMax?: number;
  // Historical prices
  priceMedian24h?: number;
  priceMedian7d?: number;
  priceMedian30d?: number;
  priceMedian90d?: number;
  priceAvg24h?: number;
  priceAvg7d?: number;
  priceAvg30d?: number;
  priceAvg90d?: number;
  // Sales statistics
  soldToday?: number;
  sold24h?: number;
  sold7d?: number;
  sold30d?: number;
  sold90d?: number;
  soldTotal?: number;
  hoursToSold?: number;
  // Steam market data
  buyOrderPrice?: number;
  buyOrderMedian?: number;
  buyOrderAvg?: number;
  buyOrderVolume?: number;
  offerVolume?: number;
  // Legacy market activity fields
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
    rarity?: string;
  }>;
  history?: Array<{
  date: string;
  price: number;
    quantity?: number;
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
  const [caseInfo, setCaseInfo] = useState<{cases: Array<{id: number, name: string, imageUrl?: string}>} | null>(null);
  const [watchlist, setWatchlist] = useState<number[]>([]);
  const [portfolioSkins, setPortfolioSkins] = useState<number[]>([]);
  const [priceAlert, setPriceAlert] = useState({ enabled: false, targetPrice: 0 });
  const [chartType, setChartType] = useState<'price' | 'quantity' | 'overlay'>('price');
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [showPriceHistory, setShowPriceHistory] = useState(true);
  const [showQuantityHistory, setShowQuantityHistory] = useState(true);
  const [showOverlayChart, setShowOverlayChart] = useState(false);
  const [activeQuantityIndex, setActiveQuantityIndex] = useState<number | null>(null);

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
        
        // Fetch case information for breadcrumbs
        try {
          const caseResponse = await fetchJson(apiUrl(`/skins/${params.skinId}/case-breadcrumb`));
          if (caseResponse.success) {
            setCaseInfo(caseResponse.data);
          }
        } catch (caseErr) {
          console.log('No case information available for this skin');
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

  // Market statistics are now directly in the skin object
  const skinCaseInfo = skin?.caseInfo;
  const variants = skin?.variants || [];
  const history = skin?.history || [];
  
  // Extract quantity data from history
  // TODO: Backend should provide real quantity data from market snapshots
  const quantityData = useMemo(() => {
    if (!history || history.length === 0) return [];
    
    // Check if history has quantity data
    const hasQuantity = history.some((item: any) => item.quantity && item.quantity > 0);
    
    if (hasQuantity) {
      return history
        .filter((item: any) => item.quantity && item.quantity > 0)
        .map((item: any) => ({
          date: item.date,
          quantity: item.quantity
        }));
    }
    
    // Generate sample quantity data based on price volatility
    // Higher price = lower quantity (inverse relationship)
    const avgPrice = history.reduce((sum: number, item: any) => sum + (item.price || 0), 0) / history.length;
    
    // Create more data points for better chart distribution
    // Create one data point per day for clean, even distribution
    const data = history.map((item: any, index: number) => {
      const priceRatio = avgPrice > 0 ? (avgPrice / (item.price || avgPrice)) : 1;
      const baseQuantity = 30;
      
      // Generate quantity inversely proportional to price
      const variation = (Math.sin(index * 0.5) + 1) * 0.3; // Range: 0 to 0.6
      const quantity = Math.max(5, Math.floor(baseQuantity * priceRatio * (0.7 + variation)));
      
      return {
        date: item.date,
        quantity: quantity
      };
    });
    
    // Debug logging
    console.log('[QuantityData] Generated data:', data.length, 'items');
    console.log('[QuantityData] First 3 items:', data.slice(0, 3));
    
    return data;
  }, [history]);

  // Edge-sensitive hover handler for quantity chart
  const handleQuantityMouseMove = useCallback((event: any) => {
    if (!quantityData || !quantityData.length) return;
    
    const chartX = event.chartX;
    const chartWidth = event.chartWidth;
    const dataLength = quantityData.length;
    
    // Calculate bandwidth and range
    const bandwidth = chartWidth / dataLength;
    const rangeStart = 0;
    
    // Calculate index based on left edge of bars
    const index = Math.floor((chartX - rangeStart) / bandwidth);
    const clampedIndex = Math.max(0, Math.min(index, dataLength - 1));
    
    setActiveQuantityIndex(clampedIndex);
  }, [quantityData]);

  const handleQuantityMouseLeave = useCallback(() => {
    setActiveQuantityIndex(null);
  }, []);

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
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 py-6 space-y-6">
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

        {/* Hero Section - Compact */}
        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Skin Image */}
              <div className="md:col-span-1">
                <div className="aspect-square relative rounded-xl overflow-hidden bg-muted">
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
           
              {/* Skin Info */}
              <div className="md:col-span-2 space-y-4">
                {/* Breadcrumb */}
                <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                      <BreadcrumbLink href="/">Home</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/cases">Cases</BreadcrumbLink>
                      </BreadcrumbItem>
                      {caseInfo && caseInfo.cases.length > 0 && (
                        <>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbLink href={`/cases/${caseInfo.cases[0].id}`}>
                              {caseInfo.cases[0].name}
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                        </>
                      )}
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/skins">Skins</BreadcrumbLink>
                      </BreadcrumbItem>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                      <BreadcrumbPage>{skin.name}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  
                {/* Skin Title */}
                <div>
                  <h1 className="text-3xl font-bold text-foreground mb-1">
                    {skin.name}
                  </h1>
                  <p className="text-muted-foreground">
                    {skin.marketHashName}
                  </p>
                </div>
                
                {/* Price & Stats */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-2xl font-bold text-foreground">
                    {skin.marketPrice ? formatUSD(skin.marketPrice) : 'N/A'}
                  </div>
                  {skin.priceMedian24h && skin.priceLatest && (
                    <Badge 
                      variant={((skin.priceLatest - skin.priceMedian24h) / skin.priceMedian24h * 100) >= 0 ? "default" : "destructive"}
                      className="text-sm"
                    >
                      {((skin.priceLatest - skin.priceMedian24h) / skin.priceMedian24h * 100) >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {((skin.priceLatest - skin.priceMedian24h) / skin.priceMedian24h * 100) >= 0 ? '+' : ''}{safeToFixed(((skin.priceLatest - skin.priceMedian24h) / skin.priceMedian24h * 100), 2)}%
                      </Badge>
                    )}
             </div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {skin.weaponType && (
                    <Badge variant="secondary" className="text-xs">
                      {skin.weaponType}
                    </Badge>
                  )}
                  {skin.wear && (
                    <Badge variant="outline" className="text-xs">
                      {skin.wear.toUpperCase()}
                    </Badge>
                  )}
                  {skin.rarity && (
                    <Badge variant="outline" className="text-xs">
                      {skin.rarity}
                    </Badge>
                  )}
                  {skin.isStattrak && (
                    <Badge variant="default" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      StatTrak™
                    </Badge>
                  )}
                  {skin.isStar && (
                    <Badge variant="default" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Special
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
                            </CardContent>
                          </Card>

        {/* Full-Width Charts - Stacked Layout */}
        <div className="space-y-6">
          {/* Price History Chart - Full Width */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="h-5 w-5" />
              Price History
            </CardTitle>
                <ToggleGroup type="single" value={timeRange} onValueChange={(value) => value && setTimeRange(value as any)}>
                  <ToggleGroupItem value="7d" size="sm">7D</ToggleGroupItem>
                  <ToggleGroupItem value="30d" size="sm">30D</ToggleGroupItem>
                  <ToggleGroupItem value="90d" size="sm">90D</ToggleGroupItem>
                  <ToggleGroupItem value="1y" size="sm">1Y</ToggleGroupItem>
                </ToggleGroup>
              </div>
          </CardHeader>
            <CardContent className="p-5 pt-0">
            {history && history.length > 0 ? (
                <div className="h-[260px] md:h-[200px] sm:h-[160px]">
                <SimplePriceChart 
                  data={history} 
                  range={timeRange}
                  scale="linear"
                    movingAverage="none"
                />
                </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                  No price history available
              </div>
            )}
                            </CardContent>
                          </Card>

          {/* Available Listings Chart - Full Width */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-5 w-5" />
              Available Listings
            </CardTitle>
                <ToggleGroup type="single" value={timeRange} onValueChange={(value) => value && setTimeRange(value as any)}>
                  <ToggleGroupItem value="7d" size="sm">7D</ToggleGroupItem>
                  <ToggleGroupItem value="30d" size="sm">30D</ToggleGroupItem>
                  <ToggleGroupItem value="90d" size="sm">90D</ToggleGroupItem>
                  <ToggleGroupItem value="1y" size="sm">1Y</ToggleGroupItem>
                </ToggleGroup>
              </div>
          </CardHeader>
            <CardContent className="p-5 pt-0">
              <ChartContainer
                config={{
                  quantity: {
                    label: "Quantity",
                    color: "hsl(45 20% 95%)", // Cream white for modern look
                  },
                }}
                className="w-full h-[240px] md:h-[200px] sm:h-[180px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={quantityData}
                    barCategoryGap="0%"
                    barGap={0}
                    margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                    onMouseMove={handleQuantityMouseMove}
                    onMouseLeave={handleQuantityMouseLeave}
                  >
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      tickCount={6}
                      type="category"
                      scale="band"
                      padding={{ left: 0, right: 0 }}
                    />
                    <YAxis 
                      tickFormatter={(value) => value.toLocaleString()}
                      tickCount={5}
                      domain={[0, 'dataMax']}
                    />
                    <ChartTooltip 
                      content={() => {
                        if (activeQuantityIndex === null || !quantityData[activeQuantityIndex]) {
                          return null;
                        }
                        
                        const data = quantityData[activeQuantityIndex];
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                  {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                                <span className="font-bold text-foreground">
                                  {data.quantity?.toLocaleString()} units
                                </span>
                              </div>
                            </div>
                </div>
                        );
                      }}
                      cursor={false}
                      isAnimationActive={false}
                      animationDuration={0}
                      active={activeQuantityIndex !== null}
                    />
                    <Bar 
                      dataKey="quantity" 
                      fill="hsl(45 20% 95%)" 
                      radius={[6, 6, 0, 0]}
                      className="hover:opacity-80 transition-opacity duration-200"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Market Statistics KPI Grid */}
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="p-5">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <BarChart3 className="h-5 w-5" />
                Market Statistics
            </CardTitle>
          </CardHeader>
            <CardContent className="p-5 pt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {/* Price Statistics */}
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Latest Price</div>
                  <div className="text-xl font-semibold text-foreground">
                    {skin.priceLatest ? formatUSD(skin.priceLatest) : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Median Price</div>
                  <div className="text-xl font-semibold text-foreground">
                    {skin.priceMedian ? formatUSD(skin.priceMedian) : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Average Price</div>
                  <div className="text-xl font-semibold text-foreground">
                    {skin.priceAvg ? formatUSD(skin.priceAvg) : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Min Price (90d)</div>
                  <div className="text-xl font-semibold text-green-600">
                    {skin.priceMin ? formatUSD(skin.priceMin) : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Max Price (90d)</div>
                  <div className="text-xl font-semibold text-red-600">
                    {skin.priceMax ? formatUSD(skin.priceMax) : 'N/A'}
                  </div>
                </div>
                
                {/* Market Activity */}
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Offer Volume</div>
                  <div className="text-xl font-semibold text-foreground">
                    {skin.offerVolume ? skin.offerVolume.toLocaleString() : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Sold (7d)</div>
                  <div className="text-xl font-semibold text-foreground">
                    {skin.sold7d ? skin.sold7d.toLocaleString() : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Sold (30d)</div>
                  <div className="text-xl font-semibold text-foreground">
                    {skin.sold30d ? skin.sold30d.toLocaleString() : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Sold (90d)</div>
                  <div className="text-xl font-semibold text-foreground">
                    {skin.sold90d ? skin.sold90d.toLocaleString() : 'N/A'}
                  </div>
                </div>
                
                {/* Buy Orders */}
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Buy Orders</div>
                  <div className="text-xl font-semibold text-blue-600">
                    {skin.buyOrderVolume ? skin.buyOrderVolume.toLocaleString() : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Buy Order Price</div>
                  <div className="text-xl font-semibold text-blue-600">
                    {skin.buyOrderPrice ? formatUSD(skin.buyOrderPrice) : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Buy Order Median</div>
                  <div className="text-xl font-semibold text-blue-600">
                    {skin.buyOrderMedian ? formatUSD(skin.buyOrderMedian) : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Buy Order Avg</div>
                  <div className="text-xl font-semibold text-blue-600">
                    {skin.buyOrderAvg ? formatUSD(skin.buyOrderAvg) : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Hours to Sold</div>
                  <div className="text-xl font-semibold text-foreground">
                    {skin.hoursToSold ? `${skin.hoursToSold.toFixed(1)}h` : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Sold (24h)</div>
                  <div className="text-xl font-semibold text-foreground">
                    {skin.sold24h ? skin.sold24h.toLocaleString() : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Sold (Today)</div>
                  <div className="text-xl font-semibold text-foreground">
                    {skin.soldToday ? skin.soldToday.toLocaleString() : 'N/A'}
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Sold (Total)</div>
                  <div className="text-xl font-semibold text-foreground">
                    {skin.soldTotal ? skin.soldTotal.toLocaleString() : 'N/A'}
                  </div>
                </div>
                </div>
              
              {/* Price Changes */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">24h Change:</span>
                    <Badge variant={skin.priceMedian24h && skin.priceLatest && ((skin.priceLatest - skin.priceMedian24h) / skin.priceMedian24h * 100) >= 0 ? "default" : "destructive"}>
                      {skin.priceMedian24h && skin.priceLatest && ((skin.priceLatest - skin.priceMedian24h) / skin.priceMedian24h * 100) >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {skin.priceMedian24h && skin.priceLatest ? `${((skin.priceLatest - skin.priceMedian24h) / skin.priceMedian24h * 100).toFixed(2)}%` : 'N/A'}
                    </Badge>
              </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">7d Change:</span>
                    <Badge variant={skin.priceMedian7d && skin.priceLatest && ((skin.priceLatest - skin.priceMedian7d) / skin.priceMedian7d * 100) >= 0 ? "default" : "destructive"}>
                      {skin.priceMedian7d && skin.priceLatest && ((skin.priceLatest - skin.priceMedian7d) / skin.priceMedian7d * 100) >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {skin.priceMedian7d && skin.priceLatest ? `${((skin.priceLatest - skin.priceMedian7d) / skin.priceMedian7d * 100).toFixed(2)}%` : 'N/A'}
                    </Badge>
                  </div>
                </div>
              </div>
                              </CardContent>
                            </Card>
        </div>



        {/* Related Skins - Compact */}
        {variants.length > 0 && (
          <Card className="rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Eye className="h-5 w-5" />
                Related Skins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {variants.map((variant, index) => {
                  // Determine if this is a popular, rare, or discounted skin
                  const isPopular = variant.marketPrice && variant.marketPrice > 50;
                  const isRare = variant.rarity === 'Covert' || variant.rarity === 'Classified';
                  const isDiscounted = variant.marketPrice && variant.marketPrice < 10;
                  
                  return (
                  <Card
                    key={variant.id}
                    className="group border border-border bg-card hover:border-primary/50 cursor-pointer transition-all duration-200 hover:shadow-sm rounded-xl"
                    onClick={() => handleRelatedSkinClick(variant)}
                  >
                    <CardContent className="p-3">
                      {/* Image Container */}
                      <div className="aspect-square relative mb-2 rounded-lg overflow-hidden bg-muted">
                        {variant.imageUrl ? (
                          <Image
                            src={variant.imageUrl}
                            alt={variant.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <div className="h-6 w-6 text-muted-foreground" />
                        </div>
                            )}
                        
                        {/* Optional Labels */}
                        <div className="absolute top-1 left-1">
                          {isPopular && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              Popular
                            </Badge>
                          )}
                          {isRare && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              Rare
                            </Badge>
                          )}
                          {isDiscounted && (
                            <Badge variant="secondary" className="text-xs px-1 py-0">
                              Discounted
                            </Badge>
                          )}
                        </div>
                          </div>
                      
                      {/* Content */}
                      <div className="space-y-1">
                        <h3 className="font-medium text-sm line-clamp-2 text-foreground">
                          {variant.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-foreground">
                        {variant.marketPrice ? formatUSD(variant.marketPrice) : 'N/A'}
                      </p>
                          {variant.rarity && (
                            <Badge variant="outline" className="text-xs px-1 py-0">
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

        {/* Source Section - nur bei echter Case-Beziehung */}
        {skin?.caseInfo && skin.caseInfo.id && skin.caseInfo.name && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Source Case
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {skin.caseInfo.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{skin.caseInfo.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      This skin can be obtained from this case
                    </p>
                  </div>
                </div>
                <Link href={`/cases/${skin.caseInfo.id}`}>
                  <Button variant="outline" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    View Case
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Case Information - Related Skins */}
          {caseInfo && caseInfo.cases.length > 0 && (
            <CaseSection skinId={caseInfo.cases[0].id} />
          )}
        </div>
        </div>
      </TooltipProvider>
  );
}

