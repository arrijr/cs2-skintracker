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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Heart, Plus, ExternalLink, ArrowLeft, Share2, Download, TrendingUp, TrendingDown, Info, Check, Loader2, Copy, BarChart3, Users, Clock, DollarSign, Home, RefreshCw, HelpCircle, Eye, Shield, Settings, Star, AlertCircle } from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col lg:flex-row gap-8">
              <Skeleton className="w-full lg:w-96 h-96 rounded-xl" />
              <div className="flex-1 space-y-6">
                <div className="space-y-4">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
            
            {/* Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
            
            {/* Chart Skeleton */}
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !skin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">Skin Not Found</h1>
              <p className="text-muted-foreground text-lg">{error || 'The skin you\'re looking for doesn\'t exist'}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.back()} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Button onClick={() => router.push('/skins')}>
                <Eye className="h-4 w-4 mr-2" />
                Browse Skins
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Back Button */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to results
            </Button>
          </div>

        {/* Hero Section */}
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 shadow-2xl">
          <div className="flex flex-col lg:flex-row gap-8 p-8">
            {/* Skin Image - größer und im Fokus */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              <div className="relative w-80 h-80 mx-auto lg:mx-0 rounded-2xl overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 shadow-xl group">
                {skinImageUrl && skinImageUrl !== "/images/placeholder-skin.png" ? (
                  <SkinImage
                    src={skinImageUrl}
                    alt={skin.name}
                    fill
                    priority
                    quality={90}
                    className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <Image
                    src={skinImageUrl}
                    alt={skin.name}
                    fill
                    className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                    priority
                    quality={90}
                  />
                )}
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </div>
           
            {/* Skin Info - rechts vom Bild */}
            <div className="flex-1 space-y-6 text-center lg:text-left">
              <div>
                {/* Breadcrumb navigation: Cases > Case > Skin */}
                <Breadcrumb className="mb-6">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/" className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Home className="h-4 w-4" />
                        Home
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/skins" className="hover:text-primary transition-colors">Skins</BreadcrumbLink>
                    </BreadcrumbItem>
                    {caseInfo && (
                      <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbLink href={`/cases/${encodeURIComponent(caseInfo?.name || '')}`} className="hover:text-primary transition-colors">
                            {caseInfo?.name || 'Unknown Case'}
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                      </>
                    )}
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      <BreadcrumbPage className="font-medium">
                        {skin.name}
                      </BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
                  
              <div className="space-y-4">
                <h1 className="text-4xl font-bold leading-tight">{skin.name}</h1>
                <p className="text-lg text-muted-foreground">{skin.marketHashName}</p>
                
                {/* Skin Details */}
                <div className="flex flex-wrap items-center gap-2">
                  {skin.weaponType && (
                    <Badge variant="outline" className="text-xs">
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
                    <Badge variant="outline" className="text-xs text-orange-400 border-orange-400/30 bg-orange-400/10">
                      StatTrak™
                    </Badge>
                  )}
                  {skin.isStar && (
                    <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/30 bg-yellow-400/10">
                      <Star className="h-3 w-3 mr-1" />
                      Special
                    </Badge>
                  )}
                </div>
                
                {/* Price Display */}
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold">
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
           </div>
             </div>
                  
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {isSignedIn ? (
                    <>
                      {isInWatchlist ? (
                        <Button
                          variant="outline"
                          onClick={handleRemoveFromWatchlist}
                          className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
                        >
                          <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                          Remove from Watchlist
                        </Button>
                      ) : (
                        <Button
                          onClick={handleAddToWatchlist}
                          className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <Heart className="h-4 w-4" />
                          Add to Watchlist
                        </Button>
                      )}

                      {isInPortfolio ? (
                        <Button
                          variant="outline"
                          onClick={handleRemoveFromPortfolio}
                          className="flex items-center gap-2 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-all duration-200"
                        >
                          <Plus className="h-4 w-4" />
                          Remove from Portfolio
                        </Button>
                      ) : (
                        <Button
                          onClick={handleAddToPortfolio}
                          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <Plus className="h-4 w-4" />
                          Add to Portfolio
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={() => router.push('/sign-in')}
                      className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <Heart className="h-4 w-4" />
                      Sign in to track
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 hover:bg-muted/50 transition-all duration-200"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => window.open(`https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName || skin.name)}`, '_blank')}
                    className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Steam Market
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Enhanced Market Statistics */}
        <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BarChart3 className="h-6 w-6 text-primary" />
              Market Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="prices">Price Analysis</TabsTrigger>
                <TabsTrigger value="sales">Sales Data</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 border border-border bg-card shadow-sm hover:shadow-lg rounded-lg">
                <div className="text-xl font-bold text-primary">
                  {skin.priceLatest ? formatUSD(skin.priceLatest) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Latest Price</div>
              </div>
              
              <div className="text-center p-4 border border-border bg-card shadow-sm hover:shadow-lg rounded-lg">
                <div className="text-xl font-bold text-primary">
                  {skin.priceMedian ? formatUSD(skin.priceMedian) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Median Price</div>
              </div>
              
              <div className="text-center p-4 border border-border bg-card shadow-sm hover:shadow-lg rounded-lg">
                <div className="text-xl font-bold text-primary">
                  {skin.priceAvg ? formatUSD(skin.priceAvg) : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Average Price</div>
              </div>
              
              <div className="text-center p-4 border border-border bg-card shadow-sm hover:shadow-lg rounded-lg">
                <div className="text-xl font-bold text-primary">
                  {marketStats.volume24h ? marketStats.volume24h.toLocaleString() : 'N/A'}
                </div>
                <div className="text-sm text-muted-foreground">Volume 24h</div>
              </div>
            </div>

            {/* Price Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Price Range</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 border border-border bg-card rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {skin.priceMin ? formatUSD(skin.priceMin) : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Min Price</div>
                  </div>
                  <div className="text-center p-3 border border-border bg-card rounded-lg">
                    <div className="text-lg font-bold text-red-600">
                      {skin.priceMax ? formatUSD(skin.priceMax) : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">Max Price</div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground">Price Changes</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 border border-border bg-card rounded">
                    <span className="text-sm">24h Change</span>
                    <span className={`font-semibold ${marketStats.priceChangePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {marketStats.priceChangePercent24h ? `${marketStats.priceChangePercent24h >= 0 ? '+' : ''}${safeToFixed(marketStats.priceChangePercent24h, 2)}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 border border-border bg-card rounded">
                    <span className="text-sm">7d Change</span>
                    <span className="text-sm text-muted-foreground">
                      {skin.priceMedian7d ? `${((skin.priceLatest - skin.priceMedian7d) / skin.priceMedian7d * 100).toFixed(2)}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

              </TabsContent>
              
              <TabsContent value="prices" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Price Range</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">Minimum Price</span>
                        <span className="text-lg font-bold text-green-600">
                          {skin.priceMin ? formatUSD(skin.priceMin) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">Maximum Price</span>
                        <span className="text-lg font-bold text-red-600">
                          {skin.priceMax ? formatUSD(skin.priceMax) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">Average Price</span>
                        <span className="text-lg font-bold text-primary">
                          {skin.priceAvg ? formatUSD(skin.priceAvg) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Price Trends</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">24h Change</span>
                        <span className={`font-semibold ${marketStats.priceChangePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {marketStats.priceChangePercent24h ? `${marketStats.priceChangePercent24h >= 0 ? '+' : ''}${safeToFixed(marketStats.priceChangePercent24h, 2)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">7d Change</span>
                        <span className="text-sm text-muted-foreground">
                          {skin.priceMedian7d ? `${((skin.priceLatest - skin.priceMedian7d) / skin.priceMedian7d * 100).toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">30d Change</span>
                        <span className="text-sm text-muted-foreground">
                          {skin.priceMedian30d ? `${((skin.priceLatest - skin.priceMedian30d) / skin.priceMedian30d * 100).toFixed(2)}%` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="sales" className="space-y-6 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Sales Volume</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">Sold 24h</span>
                        <span className="text-lg font-bold text-primary">
                          {skin.sold24h || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">Sold 7d</span>
                        <span className="text-lg font-bold text-primary">
                          {skin.sold7d || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">Sold 30d</span>
                        <span className="text-lg font-bold text-primary">
                          {skin.sold30d || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Market Activity</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">Active Offers</span>
                        <span className="text-lg font-bold text-primary">
                          {skin.offerVolume || 0}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">Volume 24h</span>
                        <span className="text-lg font-bold text-primary">
                          {marketStats.volume24h ? marketStats.volume24h.toLocaleString() : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-4 border border-border bg-card rounded-lg">
                        <span className="text-sm font-medium">Last Updated</span>
                        <span className="text-sm text-muted-foreground">
                          {skin.priceUpdatedAt ? new Date(skin.priceUpdatedAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Price History Chart */}
        <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <TrendingUp className="h-6 w-6 text-primary" />
              Price History
            </CardTitle>
            <div className="flex items-center gap-2 mt-4">
              <ToggleGroup type="single" value={timeRange} onValueChange={(value) => value && setTimeRange(value as any)} className="bg-muted/50 p-1 rounded-lg">
                <ToggleGroupItem value="7d" size="sm" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">7D</ToggleGroupItem>
                <ToggleGroupItem value="30d" size="sm" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">30D</ToggleGroupItem>
                <ToggleGroupItem value="90d" size="sm" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">90D</ToggleGroupItem>
                <ToggleGroupItem value="1y" size="sm" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">1Y</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>
            
            {history && history.length > 0 ? (
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Price history loaded: {history.length} data points available
                  </AlertDescription>
                </Alert>
                <div className="h-96 rounded-lg border border-border/50 bg-card/50 p-4">
                  <SimplePriceChart 
                    data={history} 
                    range={timeRange}
                    scale="linear"
                    movingAverage="7"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Price History Available</h3>
                <p className="text-muted-foreground">Price data for this skin is not available at the moment.</p>
              </div>
            )}
                            </CardContent>
                          </Card>

        {/* Quantity History Chart */}
        <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <BarChart3 className="h-6 w-6 text-primary" />
              Quantity History
            </CardTitle>
            <div className="flex items-center gap-2 mt-4">
              <ToggleGroup type="single" value={timeRange} onValueChange={(value) => value && setTimeRange(value as any)} className="bg-muted/50 p-1 rounded-lg">
                <ToggleGroupItem value="7d" size="sm" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">7D</ToggleGroupItem>
                <ToggleGroupItem value="30d" size="sm" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">30D</ToggleGroupItem>
                <ToggleGroupItem value="90d" size="sm" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">90D</ToggleGroupItem>
                <ToggleGroupItem value="1y" size="sm" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">1Y</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </CardHeader>
          <CardContent>
            
            {skin && skin.id ? (
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    Quantity data loaded for {skin.name}
                  </AlertDescription>
                </Alert>
                <div className="h-96 rounded-lg border border-border/50 bg-card/50 p-4">
                  <QuantityBarChart 
                    skinId={skin.id} 
                    skinName={skin.name}
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Quantity Data Available</h3>
                <p className="text-muted-foreground">Quantity data for this skin is not available at the moment.</p>
              </div>
            )}
                              </CardContent>
                            </Card>

        {/* Related Skins */}
        {variants.length > 0 && (
          <Card className="border-0 bg-gradient-to-br from-card to-card/50 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Eye className="h-6 w-6 text-primary" />
                Related Skins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {variants.map((variant) => (
                  <Card
                    key={variant.id}
                    className="group border-2 hover:border-primary/30 bg-gradient-to-br from-background to-muted/20 hover:scale-[1.02] transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl"
                    onClick={() => handleRelatedSkinClick(variant)}
                  >
                    <CardContent className="p-6">
                      <div className="aspect-square relative mb-4 rounded-xl overflow-hidden bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 group-hover:border-primary/20 transition-colors">
                        {variant.imageUrl ? (
                          <Image
                            src={variant.imageUrl}
                            alt={variant.name}
                            fill
                            className="object-contain p-3 group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Eye className="h-8 w-8" />
                          </div>
                        )}
                        {/* Glow effect */}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </div>
                      <div className="space-y-3">
                        <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">
                          {variant.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-bold text-primary">
                            {variant.marketPrice ? formatUSD(variant.marketPrice) : 'N/A'}
                          </p>
                          <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                  </div>
                </CardContent>
              </Card>
            )}

        {/* Case Information */}
        {caseInfo && (
          <CaseSection caseName={caseInfo.name} />
        )}
        </div>
      </div>
    </TooltipProvider>
  );
}
