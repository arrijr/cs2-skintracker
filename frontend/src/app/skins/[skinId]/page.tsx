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
import { Heart, Plus, ExternalLink, ArrowLeft, Share2, Download, TrendingUp, TrendingDown, Info, Check, Loader2, Copy, BarChart3, Users, Clock, DollarSign, Home, RefreshCw, HelpCircle, Eye, Shield, Settings, Star } from "lucide-react";
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

        {/* Hero Section - Enhanced Product Highlight */}
        <div className="flex flex-col xl:flex-row gap-8 xl:gap-16 items-start">
          {/* Skin Image - größer mit Shadow/Glow */}
          <div className="flex-shrink-0 w-full xl:w-auto">
            <div className="relative w-96 h-96 mx-auto xl:mx-0 bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-3xl p-12 shadow-2xl border border-gray-700/30">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-3xl blur-xl"></div>
              
              {skinImageUrl && skinImageUrl !== "/images/placeholder-skin.png" ? (
                <SkinImage
                  src={skinImageUrl}
                  alt={skin.name}
                  fill
                  priority
                  quality={95}
                  className="object-contain p-6 relative z-10"
                />
              ) : (
                <Image
                  src={skinImageUrl}
                  alt={skin.name}
                  fill
                  className="object-contain p-6 relative z-10"
                  priority
                  quality={95}
                />
              )}
            </div>
          </div>
           
          {/* Skin Info - rechts vom Bild */}
          <div className="flex-1 space-y-6 text-center lg:text-left">
                <div>
                  {/* Breadcrumb navigation: Cases > Case > Skin */}
              <Breadcrumb className="mb-6">
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/" className="flex items-center gap-1">
                          <Home className="h-4 w-4" />
                          Home
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/skins">Skins</BreadcrumbLink>
                      </BreadcrumbItem>
                      {caseInfo && (
                        <>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                        <BreadcrumbLink href={`/cases/${encodeURIComponent(caseInfo?.name || '')}`}>
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
                  
              <div className="space-y-6">
                <div className="space-y-2">
                  <h1 className="text-5xl xl:text-6xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    {skin.name}
                  </h1>
                  <p className="text-xl text-muted-foreground font-medium">{skin.marketHashName}</p>
                </div>
                
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
                  
            {/* Action Buttons - Primary/Secondary Design */}
            <div className="flex flex-wrap gap-4">
              {isSignedIn ? (
                <>
                  {isInWatchlist ? (
                    <Button
                      variant="outline"
                      onClick={handleRemoveFromWatchlist}
                      className="flex items-center gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                    >
                      <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                      Remove from Watchlist
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAddToWatchlist}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                        <Heart className="h-4 w-4" />
                      Add to Watchlist
                    </Button>
                  )}

                  {isInPortfolio ? (
                  <Button
                      variant="outline"
                      onClick={handleRemoveFromPortfolio}
                      className="flex items-center gap-2 border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      <Plus className="h-4 w-4" />
                      Remove from Portfolio
                  </Button>
                  ) : (
                    <Button
                      onClick={handleAddToPortfolio}
                      variant="outline"
                      className="flex items-center gap-2 border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400"
                    >
                      <Plus className="h-4 w-4" />
                      Add to Portfolio
                  </Button>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => router.push('/sign-in')}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Heart className="h-4 w-4" />
                  Sign in to track
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.open(`https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName || skin.name)}`, '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View on Steam Market
                  </Button>
                  </div>
                  </div>
                </div>

        {/* Enhanced Market Statistics */}
        <Card className="border border-border/50 bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Market Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Main Stats Grid - Enhanced with Icons & Color Logic */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Latest Price - Primary Green */}
              <div className="text-center p-6 border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 shadow-md hover:shadow-lg rounded-xl transition-all duration-300 min-h-[120px] flex flex-col justify-center">
                <div className="flex items-center justify-center mb-2">
                  <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                  <span className="text-sm font-medium text-green-700">Latest Price</span>
                </div>
                <div className="text-2xl font-bold text-green-800">
                  {skin.priceLatest ? formatUSD(skin.priceLatest) : 'N/A'}
                </div>
              </div>
              
              {/* Median Price - Neutral Blue */}
              <div className="text-center p-6 border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-md hover:shadow-lg rounded-xl transition-all duration-300 min-h-[120px] flex flex-col justify-center">
                <div className="flex items-center justify-center mb-2">
                  <BarChart3 className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-700">Median Price</span>
                </div>
                <div className="text-2xl font-bold text-blue-800">
                  {skin.priceMedian ? formatUSD(skin.priceMedian) : 'N/A'}
                </div>
              </div>
              
              {/* Average Price - Neutral Purple */}
              <div className="text-center p-6 border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50 shadow-md hover:shadow-lg rounded-xl transition-all duration-300 min-h-[120px] flex flex-col justify-center">
                <div className="flex items-center justify-center mb-2">
                  <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                  <span className="text-sm font-medium text-purple-700">Average Price</span>
                </div>
                <div className="text-2xl font-bold text-purple-800">
                  {skin.priceAvg ? formatUSD(skin.priceAvg) : 'N/A'}
                </div>
              </div>
              
              {/* Volume 24h - Activity Orange */}
              <div className="text-center p-6 border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50 shadow-md hover:shadow-lg rounded-xl transition-all duration-300 min-h-[120px] flex flex-col justify-center">
                <div className="flex items-center justify-center mb-2">
                  <Users className="h-5 w-5 text-orange-600 mr-2" />
                  <span className="text-sm font-medium text-orange-700">Volume 24h</span>
                </div>
                <div className="text-2xl font-bold text-orange-800">
                  {marketStats.volume24h ? marketStats.volume24h.toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Price Range & Changes - Enhanced */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Price Range */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Price Range
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 border border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg min-h-[80px] flex flex-col justify-center">
                  <div className="text-lg font-bold text-green-700">
                    {skin.priceMin ? formatUSD(skin.priceMin) : 'N/A'}
                  </div>
                  <div className="text-xs text-green-600 font-medium">Min Price</div>
                </div>
                <div className="text-center p-4 border border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg min-h-[80px] flex flex-col justify-center">
                  <div className="text-lg font-bold text-red-700">
                    {skin.priceMax ? formatUSD(skin.priceMax) : 'N/A'}
                  </div>
                  <div className="text-xs text-red-600 font-medium">Max Price</div>
                </div>
              </div>
            </div>
            
            {/* Price Changes */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Price Changes
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">24h Change</span>
                  <span className={`font-semibold flex items-center gap-1 ${marketStats.priceChangePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {marketStats.priceChangePercent24h >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {marketStats.priceChangePercent24h ? `${marketStats.priceChangePercent24h >= 0 ? '+' : ''}${safeToFixed(marketStats.priceChangePercent24h, 2)}%` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 border border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">7d Change</span>
                  <span className="text-sm font-semibold text-gray-600">
                    {skin.priceMedian7d ? `${((skin.priceLatest - skin.priceMedian7d) / skin.priceMedian7d * 100).toFixed(2)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sales Data - Enhanced */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              Sales Data
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-lg font-bold text-blue-700">
                  {skin.sold24h || 0}
                </div>
                <div className="text-xs text-blue-600 font-medium">Sold 24h</div>
              </div>
              <div className="text-center p-4 border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-lg font-bold text-indigo-700">
                  {skin.sold7d || 0}
                </div>
                <div className="text-xs text-indigo-600 font-medium">Sold 7d</div>
              </div>
              <div className="text-center p-4 border border-violet-200 bg-gradient-to-br from-violet-50 to-violet-100/50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-lg font-bold text-violet-700">
                  {skin.sold30d || 0}
                </div>
                <div className="text-xs text-violet-600 font-medium">Sold 30d</div>
              </div>
              <div className="text-center p-4 border border-cyan-200 bg-gradient-to-br from-cyan-50 to-cyan-100/50 rounded-lg min-h-[80px] flex flex-col justify-center">
                <div className="text-lg font-bold text-cyan-700">
                  {skin.offerVolume || 0}
                </div>
                <div className="text-xs text-cyan-600 font-medium">Active Offers</div>
              </div>
            </div>
          </div>
          </CardContent>
        </Card>

        {/* Price History Chart */}
        <Card className="mb-12 border border-border/50 bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
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
                <div className="mb-4 p-2 bg-green-100 text-green-800 rounded text-sm">
                  ✅ Price History: {history.length} Datenpunkte geladen
                </div>
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

        {/* Quantity History Chart */}
        <Card className="mb-12 border border-border/50 bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Quantity History
            </CardTitle>
          </CardHeader>
          <CardContent>
            
            {skin && skin.id ? (
              <>
                <div className="mb-4 p-2 bg-blue-100 text-blue-800 rounded text-sm">
                  ✅ Quantity Chart: Skin ID {skin.id} - {skin.name}
                </div>
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

        {/* Related Skins - Enhanced */}
        {variants.length > 0 && (
          <Card className="border border-border/50 bg-card shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Related Skins
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {variants.map((variant, index) => {
                  // Determine if this is a popular, rare, or discounted skin
                  const isPopular = variant.marketPrice && variant.marketPrice > 50;
                  const isRare = variant.rarity === 'Covert' || variant.rarity === 'Classified';
                  const isDiscounted = variant.marketPrice && variant.marketPrice < 10;
                  
                  return (
                    <Card
                      key={variant.id}
                      className="group border-2 border-gray-200 hover:border-primary/50 bg-gradient-to-br from-background to-muted/10 hover:shadow-xl hover:scale-[1.03] transition-all duration-300 cursor-pointer overflow-hidden"
                      onClick={() => handleRelatedSkinClick(variant)}
                    >
                      <CardContent className="p-0">
                        {/* Image Container with Hover Effect */}
                        <div className="aspect-square relative mb-4 rounded-t-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                          {variant.imageUrl ? (
                            <Image
                              src={variant.imageUrl}
                              alt={variant.name}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-muted flex items-center justify-center">
                              <Image className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          {/* Optional Labels */}
                          <div className="absolute top-2 left-2 flex flex-col gap-1">
                            {isPopular && (
                              <Badge className="bg-orange-500 text-white text-xs px-2 py-1">
                                Popular
                              </Badge>
                            )}
                            {isRare && (
                              <Badge className="bg-purple-500 text-white text-xs px-2 py-1">
                                Rare
                              </Badge>
                            )}
                            {isDiscounted && (
                              <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                                Discounted
                              </Badge>
                            )}
                          </div>
                          
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                        </div>
                        
                        {/* Content */}
                        <div className="p-6 pt-0">
                          <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors duration-200">
                            {variant.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <p className="text-lg font-bold text-primary">
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
        </div>
      </TooltipProvider>
  );
}
